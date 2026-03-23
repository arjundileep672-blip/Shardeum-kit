import React, { useState } from "react";
import { Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useScaffoldContractWrite } from "../hooks/useScaffoldContractWrite";
import { useMockBlockchain, PLATFORM_ADDR } from "../context/MockBlockchainContext";
import { ethers } from "ethers";

// ── Step indicator ─────────────────────────────────────────────────────────────
function Step({ number, label, active, done }) {
    return (
        <div className="flex items-center gap-2">
            <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
          ${done ? "bg-emerald-500 text-white" :
                        active ? "bg-academic-700 text-white" :
                            "bg-slate-200 text-slate-500"}`}
            >
                {done ? <CheckCircle size={14} /> : number}
            </div>
            <span className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
        </div>
    );
}

export default function BookingForm({ onSessionCreated }) {
    const { currentUser, toWei } = useMockBlockchain();

    const [tutorAddr, setTutorAddr] = useState("");
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState(1); // 1 = Approve, 2 = Create
    const [toast, setToast] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Step 1: Approve StudyToken spend ────────────────────────────────────────
    const { writeAsync: approve, isLoading: approving, isMining: approveMining } =
        useScaffoldContractWrite({
            contractName: "StudyToken",
            functionName: "approve",
            onBlockConfirmation: () => {
                showToast("success", "Approval confirmed ✓ Now create your session.");
                setStep(2);
            },
        });

    // ── Step 2: Create session ───────────────────────────────────────────────────
    const { writeAsync: createSession, isLoading: creating, isMining: createMining } =
        useScaffoldContractWrite({
            contractName: "StudyToEarn",
            functionName: "createSession",
            onBlockConfirmation: (receipt) => {
                showToast("success", `Session created! Tx: ${receipt.hash.slice(0, 14)}…`);
                setTutorAddr("");
                setAmount("");
                setStep(1);
                if (onSessionCreated) onSessionCreated();
            },
        });

    const isValidAddress = tutorAddr.trim().startsWith("0x") && tutorAddr.trim().length === 42;
    const isValidAmount = parseFloat(amount) > 0;
    const canProceed = isValidAddress && isValidAmount;

    const handleApprove = async () => {
        if (!canProceed) return;
        try {
            const wei = toWei(parseFloat(amount));
            await approve({ args: [PLATFORM_ADDR, wei] });
        } catch (e) {
            showToast("error", e.message ?? "Approval failed");
        }
    };

    const handleCreate = async () => {
        try {
            const wei = toWei(parseFloat(amount));
            await createSession({ args: [tutorAddr.trim(), wei] });
        } catch (e) {
            showToast("error", e.message ?? "Session creation failed");
        }
    };

    const busyApprove = approving || approveMining;
    const busyCreate = creating || createMining;

    return (
        <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Book a Session</h2>
            <div className="card animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Start a Study Session</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Lock STDY tokens into escrow. Released to tutor on completion.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        <Step number={1} label="Approve" active={step === 1} done={step > 1} />
                        <div className="w-8 h-px bg-slate-300" />
                        <Step number={2} label="Create" active={step === 2} done={false} />
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium mb-5 animate-fade-in
            ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {toast.type === "success"
                            ? <CheckCircle size={16} />
                            : <AlertCircle size={16} />}
                        {toast.msg}
                    </div>
                )}

                {/* Form fields */}
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="field-label" htmlFor="tutorAddr">Tutor Wallet Address</label>
                        <input
                            id="tutorAddr"
                            className="field-input"
                            placeholder="0x..."
                            value={tutorAddr}
                            onChange={(e) => setTutorAddr(e.target.value)}
                            disabled={step === 2 || busyApprove}
                        />
                        {tutorAddr && !isValidAddress && (
                            <p className="text-xs text-rose-500 mt-1">Must be a valid 0x… address (42 chars)</p>
                        )}
                    </div>

                    <div>
                        <label className="field-label" htmlFor="stdy-amount">Bounty Amount (STDY)</label>
                        <div className="relative">
                            <input
                                id="stdy-amount"
                                type="number"
                                min="1"
                                step="1"
                                className="field-input pr-14"
                                placeholder="e.g. 100"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={step === 2 || busyApprove}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">STDY</span>
                        </div>
                    </div>
                </div>

                {/* Action button */}
                <div className="flex items-center gap-3">
                    {step === 1 ? (
                        <button
                            id="btn-approve"
                            className="btn-primary"
                            onClick={handleApprove}
                            disabled={!canProceed || busyApprove}
                        >
                            {busyApprove
                                ? <><Loader2 size={15} className="animate-spin" /> {approveMining ? "Confirming…" : "Approving…"}</>
                                : <><CheckCircle size={15} /> Approve STDY</>}
                        </button>
                    ) : (
                        <button
                            id="btn-create-session"
                            className="btn-primary"
                            onClick={handleCreate}
                            disabled={busyCreate}
                        >
                            {busyCreate
                                ? <><Loader2 size={15} className="animate-spin" /> {createMining ? "Confirming…" : "Creating…"}</>
                                : <><Send size={15} /> Create Session</>}
                        </button>
                    )}

                    {step === 2 && (
                        <button className="btn-secondary" onClick={() => setStep(1)} disabled={busyCreate}>
                            ← Back
                        </button>
                    )}
                </div>

                {/* Info banner */}
                <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-4">
                    🔒 Token approval lets the platform contract transfer STDY on your behalf for this session only.
                </p>
            </div>
        </section>
    );
}
