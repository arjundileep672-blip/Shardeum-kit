/**
 * generateCertificate.js
 *
 * Study-to-Earn — Verifiable Skill NFT Certificate Generator
 *
 * Usage:
 *   node scripts/generateCertificate.js
 *
 * Edit the STUDENT_INPUT object below with real data, then run the script.
 * The output is mint-ready OpenSea-compatible NFT metadata JSON.
 */

// ── FILL THIS IN ─────────────────────────────────────────────────────────────
const STUDENT_INPUT = {
    name: "Alice Web3",
    wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    skill: "Solidity Smart Contract Development",
    description: "Designed and deployed a full Study-to-Earn escrow platform on Shardeum, including an ERC-20 token, ReentrancyGuard protections, and an automated tutor reputation system.",
    proof: "https://explorer.shardeum.org/tx/0xabc123... | GitHub: https://github.com/example/repo",
    impact: {
        students_taught: 30,
        projects_built: 2,
        sessions_completed: 45,
        custom_note: "Platform went live on Shardeum Testnet with 30 active users in week 1",
    },
    peer_reviews: [
        "Excellent understanding of on-chain security patterns — tutor_0xDeFi",
        "Helped me understand Solidity re-entrancy attacks clearly — student_0xAjay",
    ],
    timestamp: new Date().toISOString(),
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a numeric impact score from the impact object.
 * Weights: sessions_completed counts most, then students_taught.
 */
function computeImpactCount(impact) {
    return (
        (impact.students_taught || 0) +
        (impact.sessions_completed || 0) +
        (impact.projects_built || 0) * 3   // each project counts as 3
    );
}

/**
 * Determine rarity from total impact count.
 *   Common    → < 5
 *   Rare      → 5–20
 *   Epic      → 20–50
 *   Legendary → 50+
 */
function assignRarity(impactCount) {
    if (impactCount >= 50) return "Legendary";
    if (impactCount >= 20) return "Epic";
    if (impactCount >= 5) return "Rare";
    return "Common";
}

/**
 * Determine skill level label from impact count.
 */
function assignSkillLevel(impactCount) {
    if (impactCount >= 50) return "Expert";
    if (impactCount >= 20) return "Advanced";
    if (impactCount >= 5) return "Intermediate";
    return "Beginner";
}

/**
 * Score proof quality (0–30 points).
 * Awards points for on-chain TX links, GitHub, deployed URLs.
 */
function scoreProof(proof) {
    let score = 0;
    if (/explorer\.|etherscan\.|shardeumexplorer/i.test(proof)) score += 15; // on-chain tx
    if (/github\.com/i.test(proof)) score += 10; // code repo
    if (/https?:\/\//i.test(proof)) score += 5;  // any URL
    return Math.min(score, 30);
}

/**
 * Score peer reviews (0–20 points).
 * +5 per review up to 4 reviews.
 */
function scorePeerReviews(reviews) {
    return Math.min((reviews?.length || 0) * 5, 20);
}

/**
 * Score impact (0–50 points).
 * Scaled linearly from 0–100 impact count → 0–50 points.
 */
function scoreImpact(impactCount) {
    return Math.min(Math.round(impactCount / 2), 50);
}

/**
 * Map verification score to authenticity label.
 */
function authLabel(score) {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
}

/**
 * Build impact summary string for the NFT evidence_summary field.
 */
function buildEvidenceSummary(input, impactCount) {
    const parts = [];
    if (input.impact.students_taught)
        parts.push(`${input.impact.students_taught} students taught`);
    if (input.impact.sessions_completed)
        parts.push(`${input.impact.sessions_completed} sessions completed`);
    if (input.impact.projects_built)
        parts.push(`${input.impact.projects_built} project(s) built`);
    if (input.impact.custom_note)
        parts.push(input.impact.custom_note);
    if (input.peer_reviews?.length)
        parts.push(`${input.peer_reviews.length} peer review(s) received`);
    return parts.join(". ") + ".";
}

/**
 * Main certificate generation function.
 * Implements all scoring logic and returns mint-ready NFT metadata.
 */
function generateCertificate(input) {
    const impactCount = computeImpactCount(input.impact);
    const rarity = assignRarity(impactCount);
    const skillLevel = assignSkillLevel(impactCount);
    const proofScore = scoreProof(input.proof);
    const peerScore = scorePeerReviews(input.peer_reviews);
    const impactScore = scoreImpact(impactCount);
    const totalScore = Math.min(proofScore + peerScore + impactScore, 100);
    const authenticity = authLabel(totalScore);
    const evidenceSummary = buildEvidenceSummary(input, impactCount);

    const imagePrompt = [
        `A futuristic NFT skill certificate for "${input.skill}",`,
        "minimal dark holographic UI, glowing teal-blue neon borders,",
        "floating digital seal with wallet address, geometric blockchain node graph in background,",
        "subtle academic crest watermark, ultra-detailed, Unreal Engine 5 render, 4K.",
    ].join(" ");

    const justification = [
        `On-chain/repository proof scored ${proofScore}/30.`,
        `Impact metrics (${impactCount} total impact units) scored ${impactScore}/50.`,
        `Peer validation from ${input.peer_reviews?.length || 0} review(s) scored ${peerScore}/20.`,
        `Total verification score: ${totalScore}/100 → authenticity: ${authenticity}.`,
    ].join(" ");

    return {
        nft: {
            title: `Skill Certificate: ${input.skill}`,
            student_name: input.name,
            wallet_address: input.wallet,
            skill: input.skill,
            description: input.description,
            evidence_summary: evidenceSummary,
            image_prompt: imagePrompt,
            timestamp: input.timestamp,
            attributes: [
                { trait_type: "Skill Level", value: skillLevel },
                { trait_type: "Impact", value: `${impactCount} impact units` },
                { trait_type: "Verification Score", value: totalScore },
                { trait_type: "Rarity", value: rarity },
            ],
        },
        verification: {
            score: totalScore,
            authenticity,
            justification,
        },
        rarity,
    };
}

// ── Run and print ─────────────────────────────────────────────────────────────
const certificate = generateCertificate(STUDENT_INPUT);
console.log(JSON.stringify(certificate, null, 2));
