import React from "react";
import { Coins, Star, BookOpen, TrendingUp } from "lucide-react";
import { useScaffoldContractRead } from "../hooks/useScaffoldContractRead";
import { useMockBlockchain } from "../context/MockBlockchainContext";

function StatCard({ icon: Icon, label, value, sub, color, isLoading }) {
    return (
        <div className="card flex items-start gap-4 animate-slide-up">
            {/* Icon bubble */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                {isLoading ? (
                    <div className="skeleton h-7 w-28 mb-1" />
                ) : (
                    <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
                )}
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function StatsHeader() {
    const { currentUser, fromWei } = useMockBlockchain();

    const { data: balance, isLoading: balLoading } = useScaffoldContractRead({
        contractName: "StudyToken",
        functionName: "balanceOf",
        args: [currentUser],
        watch: true,
    });

    const { data: reputation, isLoading: repLoading } = useScaffoldContractRead({
        contractName: "StudyToEarn",
        functionName: "getTutorReputation",
        args: [currentUser],
        watch: true,
    });

    const { data: totalSessions, isLoading: sessLoading } = useScaffoldContractRead({
        contractName: "StudyToEarn",
        functionName: "totalSessions",
        watch: true,
    });

    const stdy = balance != null ? fromWei(balance).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
    const rep = reputation != null ? reputation.toString() : "—";
    const sess = totalSessions != null ? totalSessions.toString() : "—";

    return (
        <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={Coins}
                    label="STDY Balance"
                    value={`${stdy} STDY`}
                    sub="Available to spend"
                    color="bg-academic-50 text-academic-700"
                    isLoading={balLoading}
                />
                <StatCard
                    icon={Star}
                    label="Tutor Reputation"
                    value={`${rep} pts`}
                    sub="+5 pts per completed session"
                    color="bg-amber-50 text-amber-600"
                    isLoading={repLoading}
                />
                <StatCard
                    icon={BookOpen}
                    label="Platform Sessions"
                    value={sess}
                    sub="Total sessions on-chain"
                    color="bg-emerald-50 text-emerald-600"
                    isLoading={sessLoading}
                />
            </div>
        </section>
    );
}
