import React, { createContext, useContext, useState, useCallback } from "react";

// ── Demo addresses (stand-ins for wagmi's useAccount) ────────────────────────
export const STUDENT_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const TUTOR_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const PLATFORM_ADDR = "0xStudyToEarn_Contract_Address";

const DECIMALS = 18n;
const toWei = (n) => BigInt(Math.round(n)) * 10n ** DECIMALS;
const fromWei = (n) => Number(n) / Number(10n ** DECIMALS);

// ── Initial mock blockchain state ─────────────────────────────────────────────
const INITIAL_SESSIONS = [
    {
        id: 1n,
        student: STUDENT_ADDR,
        tutor: TUTOR_ADDR,
        bounty: toWei(100),
        status: 0, // Open
        timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600),
    },
    {
        id: 2n,
        student: STUDENT_ADDR,
        tutor: TUTOR_ADDR,
        bounty: toWei(250),
        status: 1, // Completed
        timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
    },
    {
        id: 3n,
        student: "0xOtherStudent000000000000000000000000000",
        tutor: STUDENT_ADDR, // current user is tutor in this one
        bounty: toWei(75),
        status: 0, // Open
        timestamp: BigInt(Math.floor(Date.now() / 1000) - 7200),
    },
];

const INITIAL_BALANCES = {
    [STUDENT_ADDR]: toWei(820),
    [TUTOR_ADDR]: toWei(1200),
};

const INITIAL_REPUTATIONS = {
    [TUTOR_ADDR]: 25n,
    [STUDENT_ADDR]: 10n,
};

// ── Context ───────────────────────────────────────────────────────────────────
const MockBlockchainContext = createContext(null);

export function MockBlockchainProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(STUDENT_ADDR);
    const [sessions, setSessions] = useState(INITIAL_SESSIONS);
    const [balances, setBalances] = useState(INITIAL_BALANCES);
    const [reputations, setReputations] = useState(INITIAL_REPUTATIONS);
    const [allowances, setAllowances] = useState({});

    // ── Contract read simulator ─────────────────────────────────────────────────
    const contractRead = useCallback((contractName, functionName, args = []) => {
        if (contractName === "StudyToken") {
            if (functionName === "balanceOf")
                return balances[args[0]] ?? 0n;
            if (functionName === "allowance")
                return allowances[`${args[0]}_${args[1]}`] ?? 0n;
        }

        if (contractName === "StudyToEarn") {
            if (functionName === "getTutorReputation")
                return reputations[args[0]] ?? 0n;
            if (functionName === "totalSessions")
                return BigInt(sessions.length);
            if (functionName === "getSession") {
                const id = Number(args[0]);
                return sessions.find((s) => Number(s.id) === id) ?? null;
            }
        }
        return undefined;
    }, [balances, allowances, reputations, sessions]);

    // ── Contract write simulator ────────────────────────────────────────────────
    const contractWrite = useCallback((contractName, functionName, args = []) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (contractName === "StudyToken" && functionName === "approve") {
                        const [spender, amount] = args;
                        const key = `${currentUser}_${spender}`;
                        setAllowances((prev) => ({ ...prev, [key]: BigInt(amount) }));
                        return resolve({ hash: "0xapprove_mock_tx" });
                    }

                    if (contractName === "StudyToEarn" && functionName === "createSession") {
                        const [tutor, amount] = args;
                        const bigAmount = BigInt(amount);
                        setSessions((prev) => {
                            const newId = BigInt(prev.length + 1);
                            return [
                                ...prev,
                                {
                                    id: newId,
                                    student: currentUser,
                                    tutor,
                                    bounty: bigAmount,
                                    status: 0,
                                    timestamp: BigInt(Math.floor(Date.now() / 1000)),
                                },
                            ];
                        });
                        setBalances((prev) => ({
                            ...prev,
                            [currentUser]: (prev[currentUser] ?? 0n) - bigAmount,
                        }));
                        return resolve({ hash: "0xcreate_mock_tx" });
                    }

                    if (contractName === "StudyToEarn" && functionName === "completeSession") {
                        const [sessionId] = args;
                        setSessions((prev) =>
                            prev.map((s) => {
                                if (Number(s.id) !== Number(sessionId)) return s;
                                // Pay tutor
                                setBalances((bal) => ({
                                    ...bal,
                                    [s.tutor]: (bal[s.tutor] ?? 0n) + s.bounty,
                                }));
                                // +5 rep
                                setReputations((rep) => ({
                                    ...rep,
                                    [s.tutor]: (rep[s.tutor] ?? 0n) + 5n,
                                }));
                                return { ...s, status: 1 };
                            })
                        );
                        return resolve({ hash: "0xcomplete_mock_tx" });
                    }

                    if (contractName === "StudyToEarn" && functionName === "disputeSession") {
                        const [sessionId] = args;
                        setSessions((prev) =>
                            prev.map((s) => {
                                if (Number(s.id) !== Number(sessionId)) return s;
                                setBalances((bal) => ({
                                    ...bal,
                                    [s.student]: (bal[s.student] ?? 0n) + s.bounty,
                                }));
                                return { ...s, status: 2 };
                            })
                        );
                        return resolve({ hash: "0xdispute_mock_tx" });
                    }

                    reject(new Error(`Unknown: ${contractName}.${functionName}`));
                } catch (err) {
                    reject(err);
                }
            }, 1200); // simulate network delay
        });
    }, [currentUser]);

    return (
        <MockBlockchainContext.Provider
            value={{ currentUser, setCurrentUser, sessions, balances, reputations, contractRead, contractWrite, fromWei, toWei }}
        >
            {children}
        </MockBlockchainContext.Provider>
    );
}

export function useMockBlockchain() {
    const ctx = useContext(MockBlockchainContext);
    if (!ctx) throw new Error("useMockBlockchain must be used inside MockBlockchainProvider");
    return ctx;
}
