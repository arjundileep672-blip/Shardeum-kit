import React from "react";
import { Inbox } from "lucide-react";
import { useScaffoldContractRead } from "../hooks/useScaffoldContractRead";
import { useMockBlockchain } from "../context/MockBlockchainContext";
import SessionRow from "./SessionRow";

export default function ActiveSessionsList({ onAction }) {
    const { currentUser } = useMockBlockchain();

    const { data: totalSessions, isLoading } = useScaffoldContractRead({
        contractName: "StudyToEarn",
        functionName: "totalSessions",
        watch: true,
    });

    const total = totalSessions != null ? Number(totalSessions) : 0;

    // Build array of session IDs (1-indexed, matches contract)
    const sessionIds = Array.from({ length: total }, (_, i) => BigInt(i + 1));

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Sessions</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
                    {total} total on-chain
                </span>
            </div>

            <div className="card !p-0 overflow-hidden animate-slide-up">
                {/* Loading skeleton */}
                {isLoading && (
                    <div className="p-6 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton h-10 w-full rounded-lg" />
                        ))}
                    </div>
                )}

                {/* Table */}
                {!isLoading && total > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["#", "Your Role", "Counterparty", "Bounty", "Status", "Date", "Action"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessionIds.map((id) => (
                                    <SessionRow
                                        key={id.toString()}
                                        sessionId={id}
                                        currentUser={currentUser}
                                        onAction={onAction}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && total === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Inbox size={26} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No sessions yet</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Book your first study session using the form above to get started.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
