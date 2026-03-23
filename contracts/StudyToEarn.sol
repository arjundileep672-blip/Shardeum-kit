// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─────────────────────────────────────────────────────────────
//  StudyToken (STDY) — ERC-20 token for the Study-to-Earn platform
// ─────────────────────────────────────────────────────────────
contract StudyToken is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner)
        ERC20("StudyToken", "STDY")
        Ownable(initialOwner)
    {
        // Mint 1,000,000 STDY to the deployer for initial distribution
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    /// @notice Owner can mint additional tokens (e.g. for rewards / faucet)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// ─────────────────────────────────────────────────────────────
//  StudyToEarn — Core platform contract
// ─────────────────────────────────────────────────────────────
contract StudyToEarn is ReentrancyGuard, Ownable {

    // ── Token reference ──────────────────────────────────────
    StudyToken public immutable studyToken;

    // ── Session status enum ──────────────────────────────────
    enum SessionStatus { Open, Completed, Disputed }

    // ── Session struct ───────────────────────────────────────
    struct StudySession {
        uint256 id;
        address student;
        address tutor;
        uint256 bounty;        // STDY tokens locked into the contract
        SessionStatus status;
        uint256 timestamp;
    }

    // ── State ─────────────────────────────────────────────────
    uint256 private _sessionCounter;
    mapping(uint256 => StudySession) public sessions;

    /// @notice Tutor reputation scores (incremented +5 per completed session)
    mapping(address => uint256) public reputationScore;

    // ── Events ────────────────────────────────────────────────
    /// @dev Emitted when a student creates and funds a new session
    event SessionCreated(
        uint256 indexed sessionId,
        address indexed student,
        address indexed tutor,
        uint256 bounty,
        uint256 timestamp
    );

    /// @dev Emitted when a session is marked Completed or Disputed
    event SessionResolved(
        uint256 indexed sessionId,
        address indexed student,
        address indexed tutor,
        SessionStatus status,
        uint256 bounty,
        uint256 timestamp
    );

    // ── Errors ────────────────────────────────────────────────
    error ZeroBounty();
    error InvalidTutor();
    error SessionNotOpen(uint256 sessionId);
    error NotSessionStudent(uint256 sessionId, address caller);
    error NotSessionTutorOrOwner(uint256 sessionId, address caller);
    error TokenTransferFailed();

    // ── Constructor ───────────────────────────────────────────
    constructor(address _studyToken) Ownable(msg.sender) {
        require(_studyToken != address(0), "Invalid token address");
        studyToken = StudyToken(_studyToken);
    }

    // ─────────────────────────────────────────────────────────
    //  PUBLIC FUNCTIONS
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Create a new study session and lock STDY tokens into this contract.
     * @param _tutor  Address of the tutor who will receive the bounty on completion.
     * @param _amount Amount of STDY tokens to lock as the session bounty.
     * @return sessionId Unique ID of the newly created session.
     *
     * Requirements:
     *  - `_tutor` must be a non-zero address and not the student themselves.
     *  - `_amount` must be greater than zero.
     *  - The student must have approved this contract to spend at least `_amount` STDY.
     */
    function createSession(address _tutor, uint256 _amount)
        external
        nonReentrant
        returns (uint256 sessionId)
    {
        if (_amount == 0) revert ZeroBounty();
        if (_tutor == address(0) || _tutor == msg.sender) revert InvalidTutor();

        // Pull tokens from the student into escrow (this contract)
        bool success = studyToken.transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TokenTransferFailed();

        sessionId = ++_sessionCounter;

        sessions[sessionId] = StudySession({
            id:        sessionId,
            student:   msg.sender,
            tutor:     _tutor,
            bounty:    _amount,
            status:    SessionStatus.Open,
            timestamp: block.timestamp
        });

        emit SessionCreated(sessionId, msg.sender, _tutor, _amount, block.timestamp);
    }

    /**
     * @notice Student confirms the session is complete; bounty is released to the tutor.
     * @param _sessionId ID of the session to mark as completed.
     *
     * Requirements:
     *  - Session must be in `Open` status.
     *  - Only the session's student may call this function.
     */
    function completeSession(uint256 _sessionId)
        external
        nonReentrant
    {
        StudySession storage session = sessions[_sessionId];

        if (session.status != SessionStatus.Open)
            revert SessionNotOpen(_sessionId);

        if (session.student != msg.sender)
            revert NotSessionStudent(_sessionId, msg.sender);

        // Update state before external call (checks-effects-interactions)
        session.status = SessionStatus.Completed;

        // Increment tutor reputation by 5 points
        reputationScore[session.tutor] += 5;

        // Transfer bounty to the tutor
        bool success = studyToken.transfer(session.tutor, session.bounty);
        if (!success) revert TokenTransferFailed();

        emit SessionResolved(
            _sessionId,
            session.student,
            session.tutor,
            SessionStatus.Completed,
            session.bounty,
            block.timestamp
        );
    }

    /**
     * @notice Raise a dispute on an open session (student or platform owner).
     *         Tokens are refunded to the student during a dispute.
     * @param _sessionId ID of the session to dispute.
     */
    function disputeSession(uint256 _sessionId)
        external
        nonReentrant
    {
        StudySession storage session = sessions[_sessionId];

        if (session.status != SessionStatus.Open)
            revert SessionNotOpen(_sessionId);

        // Only the student or the contract owner can raise a dispute
        if (msg.sender != session.student && msg.sender != owner())
            revert NotSessionTutorOrOwner(_sessionId, msg.sender);

        session.status = SessionStatus.Disputed;

        // Refund tokens to the student upon dispute
        bool success = studyToken.transfer(session.student, session.bounty);
        if (!success) revert TokenTransferFailed();

        emit SessionResolved(
            _sessionId,
            session.student,
            session.tutor,
            SessionStatus.Disputed,
            session.bounty,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────────────────

    /// @notice Returns the full details of a session by ID.
    function getSession(uint256 _sessionId)
        external
        view
        returns (StudySession memory)
    {
        return sessions[_sessionId];
    }

    /// @notice Returns the reputation score of a given tutor.
    function getTutorReputation(address _tutor)
        external
        view
        returns (uint256)
    {
        return reputationScore[_tutor];
    }

    /// @notice Returns the total number of sessions ever created.
    function totalSessions() external view returns (uint256) {
        return _sessionCounter;
    }
}
