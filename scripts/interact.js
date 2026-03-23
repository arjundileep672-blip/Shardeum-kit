const { ethers } = require("hardhat");

// ── Fill these in after deploying ──────────────────────────────
const STUDY_TOKEN_ADDRESS = process.env.STUDY_TOKEN_ADDRESS || "";
const STUDY_PLATFORM_ADDRESS = process.env.STUDY_PLATFORM_ADDRESS || "";
// ──────────────────────────────────────────────────────────────

async function main() {
  if (!STUDY_TOKEN_ADDRESS || !STUDY_PLATFORM_ADDRESS) {
    throw new Error(
      "Set STUDY_TOKEN_ADDRESS and STUDY_PLATFORM_ADDRESS in your .env file!"
    );
  }

  const [student, tutor] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Study-to-Earn — Interaction Demo");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Student : ${student.address}`);
  console.log(`  Tutor   : ${tutor.address}\n`);

  // ── Attach to deployed contracts ──────────────────────────
  const studyToken = await ethers.getContractAt("StudyToken", STUDY_TOKEN_ADDRESS);
  const platform = await ethers.getContractAt("StudyToEarn", STUDY_PLATFORM_ADDRESS);

  // ── Transfer some STDY to the student (deployer owns all supply) ──
  const bountyAmount = ethers.parseEther("100"); // 100 STDY
  console.log("💸 Transferring 100 STDY to student...");
  const txTransfer = await studyToken.transfer(student.address, bountyAmount);
  await txTransfer.wait();
  const studentBal = await studyToken.balanceOf(student.address);
  console.log(`   Student balance: ${ethers.formatEther(studentBal)} STDY`);

  // ── Step 1: Student approves platform to spend tokens ────
  console.log("\n🔑 Student approving platform to spend 100 STDY...");
  const txApprove = await studyToken.connect(student).approve(
    STUDY_PLATFORM_ADDRESS,
    bountyAmount
  );
  await txApprove.wait();
  console.log("   ✅ Approved!");

  // ── Step 2: Create a study session ───────────────────────
  console.log("\n📚 Creating study session (bounty: 100 STDY)...");
  const txCreate = await platform.connect(student).createSession(
    tutor.address,
    bountyAmount
  );
  const receipt = await txCreate.wait();

  // Parse the SessionCreated event
  const createEvent = receipt.logs
    .map((log) => { try { return platform.interface.parseLog(log); } catch { return null; } })
    .find((e) => e && e.name === "SessionCreated");

  const sessionId = createEvent ? createEvent.args.sessionId : 1n;
  console.log(`   ✅ Session created! ID: ${sessionId}`);

  // ── Step 3: Inspect the session ──────────────────────────
  console.log("\n🔍 Session details:");
  const session = await platform.getSession(sessionId);
  console.log(`   ID        : ${session.id}`);
  console.log(`   Student   : ${session.student}`);
  console.log(`   Tutor     : ${session.tutor}`);
  console.log(`   Bounty    : ${ethers.formatEther(session.bounty)} STDY`);
  console.log(`   Status    : ${["Open", "Completed", "Disputed"][Number(session.status)]}`);
  console.log(`   Timestamp : ${new Date(Number(session.timestamp) * 1000).toISOString()}`);

  // ── Step 4: Complete the session ─────────────────────────
  console.log("\n✅ Student completing the session...");
  const txComplete = await platform.connect(student).completeSession(sessionId);
  await txComplete.wait();
  console.log("   ✅ Session completed!");

  // ── Step 5: Check results ─────────────────────────────────
  const tutorBal = await studyToken.balanceOf(tutor.address);
  const reputation = await platform.getTutorReputation(tutor.address);
  const total = await platform.totalSessions();

  console.log("\n📊 Post-completion results:");
  console.log(`   Tutor STDY balance : ${ethers.formatEther(tutorBal)} STDY`);
  console.log(`   Tutor reputation   : ${reputation} pts`);
  console.log(`   Total sessions     : ${total}`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🎉 Demo complete — Study-to-Earn is working!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
