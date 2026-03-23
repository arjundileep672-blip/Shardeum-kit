import React, { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Loader2, UserCheck, GraduationCap } from "lucide-react";
import { useScaffoldContractRead } from "../hooks/useScaffoldContractRead";
import { useScaffoldContractWrite } from "../hooks/useScaffoldContractWrite";
import { useMockBlockchain } from "../context/MockBlockchainContext";

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (status === 0) return (
        <span className="badge-open"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Open</span>
    );
    if (status === 1) return (
        <span className="badge-completed"><CheckCircle2 size={11} /> Completed</span>
    );
    return (
        <span className="badge-disputed"><AlertTriangle size={11} /> Disputed</span>
    );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
    return role === "student" ? (
        <span className="inline-flex items-center gap-1 bg-academic-50 text-academic-700 border border-academic-200 px-2 py-0.5 rounded-full text-xs font-semibold">
            <GraduationCap size={10} /> Student
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-semibold">
            <UserCheck size={10} /> Tutor
        </span>
    );
}

function truncate(addr) {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Single session row ─────────────────────────────────────────────────────────
export default function SessionRow({ sessionId, currentUser, onAction }) {
    const { fromWei } = useMockBlockchain();
    const [toast, setToast] = useState(null);

    const { data: session, isLoading } = useScaffoldContractRead({
        contractName: "StudyToEarn",
        functionName: "getSession",
        args: [sessionId],
        watch: true,
    });

    const { writeAsync: complete, isLoading: completing, isMining: completeMining } =
        useScaffoldContractWrite({
            contractName: "StudyToEarn",
            functionName: "completeSession",
            onBlockConfirmation: () => {
                setToast({ type: "success", msg: "Payment confirmed! Tutor received the bounty." });
                setTimeout(() => setToast(null), 3500);
                if (onAction) onAction();
            },
        });

    const { writeAsync: dispute, isLoading: disputing, isMining: disputeMining } =
        useScaffoldContractWrite({
            contractName: "StudyToEarn",
            functionName: "disputeSession",
            onBlockConfirmation: () => {
                setToast({ type: "warn", msg: "Dispute raised. Tokens refunded." });
                setTimeout(() => setToast(null), 3500);
                if (onAction) onAction();
            },
        });

    if (isLoading) {
        return (
            <tr>
                <td colSpan={6} className="px-4 py-3">
                    <div className="skeleton h-5 w-full max-w-md rounded" />
                </td>
            </tr>
        );
    }

    if (!session) return null;

    // Don't render sessions not involving current user
    const isStudent = session.student?.toLowerCase() === currentUser?.toLowerCase();
    const isTutor = session.tutor?.toLowerCase() === currentUser?.toLowerCase();
    if (!isStudent && !isTutor) return null;

    const role = isStudent ? "student" : "tutor";
    const bounty = fromWei(session.bounty ?? 0n);
    const date = session.timestamp
        ? new Date(Number(session.timestamp) * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    const busyComplete = completing || completeMining;
    const busyDispute = disputing || disputeMining;
    const isOpen = Number(session.status) === 0;

    return (
        <>
            <tr className="hover:bg-slate-50 transition-colors group">
                {/* ID */}
                <td className="px-4 py-3.5 text-sm font-mono text-slate-500">
                    #{session.id?.toString()}
                </td>

                {/* Role */}
                <td className="px-4 py-3.5">
                    <RoleBadge role={role} />
                </td>

                {/* Counterparty */}
                <td className="px-4 py-3.5 text-sm text-slate-700 font-mono">
                    {isStudent ? truncate(session.tutor) : truncate(session.student)}
                    <span className="ml-1 text-xs text-slate-400">{isStudent ? "(tutor)" : "(student)"}</span>
                </td>

                {/* Bounty */}
                <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">
                    {bounty.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-slate-400 font-normal text-xs">STDY</span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                    <StatusBadge status={Number(session.status)} />
                </td>

                {/* Date */}
                <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{date}</td>

                {/* Action */}
                <td className="px-4 py-3.5 text-right">
                    {isStudent && isOpen && (
                        <div className="flex items-center justify-end gap-2">
                            <button
                                id={`btn-complete-${session.id}`}
                                className="btn-primary !py-1.5 !px-3 text-xs"
                                onClick={() => complete({ args: [session.id] })}
                                disabled={busyComplete || busyDispute}
                            >
                                {busyComplete
                                    ? <><Loader2 size={12} className="animate-spin" /> {completeMining ? "Confirming…" : "Processing…"}</>
                                    : <><CheckCircle2 size={12} /> Confirm & Pay Tutor</>}
                            </button>
                            <button
                                id={`btn-dispute-${session.id}`}
                                className="btn-secondary !py-1.5 !px-3 text-xs"
                                onClick={() => dispute({ args: [session.id] })}
                                disabled={busyComplete || busyDispute}
                                title="Raise a dispute and get refunded"
                            >
                                {busyDispute ? <Loader2 size={12} className="animate-spin" /> : "Dispute"}
                            </button>
                        </div>
                    )}

                    {isTutor && isOpen && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                            <Clock size={12} className="animate-pulse" />
                            Pending Student Approval
                        </span>
                    )}

                    {!isOpen && (
                        <span className="text-xs text-slate-400 italic">Resolved</span>
                    )}
                </td>
            </tr>

            {/* Toast row */}
            {toast && (
                <tr>
                    <td colSpan={7} className="px-4 pb-2">
                        <div className={`text-xs font-medium rounded-lg px-3 py-2 animate-fade-in
              ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {toast.msg}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
