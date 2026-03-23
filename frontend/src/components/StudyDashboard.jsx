import React, { useState, useCallback } from "react";
import { GraduationCap, RefreshCw, ChevronDown, Wallet } from "lucide-react";
import StatsHeader from "./StatsHeader";
import BookingForm from "./BookingForm";
import ActiveSessionsList from "./ActiveSessionsList";
import { useMockBlockchain, STUDENT_ADDR, TUTOR_ADDR } from "../context/MockBlockchainContext";

// ── User switcher (demo-only — replaces wagmi useAccount in production) ────────
function UserSwitcher({ currentUser, onSwitch }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                className="flex items-center gap-2 text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors shadow-sm font-medium text-slate-700"
                onClick={() => setOpen((o) => !o)}
            >
                <div className="w-7 h-7 rounded-full bg-academic-100 flex items-center justify-center">
                    <Wallet size={14} className="text-academic-700" />
                </div>
                <span className="font-mono text-xs">
                    {currentUser.slice(0, 6)}…{currentUser.slice(-4)}
                </span>
                <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden animate-fade-in">
                    <div className="px-4 py-2 text-xs text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                        Demo: Switch Account
                    </div>
                    {[
                        { label: "Student view", addr: STUDENT_ADDR },
                        { label: "Tutor view", addr: TUTOR_ADDR },
                    ].map(({ label, addr }) => (
                        <button
                            key={addr}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-academic-50 transition-colors
                ${addr === currentUser ? "bg-academic-50 text-academic-700 font-semibold" : "text-slate-700"}`}
                            onClick={() => { onSwitch(addr); setOpen(false); }}
                        >
                            <div className="font-semibold">{label}</div>
                            <div className="font-mono text-xs text-slate-400">{addr.slice(0, 12)}…{addr.slice(-6)}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function StudyDashboard() {
    const { currentUser, setCurrentUser } = useMockBlockchain();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAction = useCallback(() => {
        setRefreshKey((k) => k + 1);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ── Top navbar ───────────────────────────────────────────────────── */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-academic-700 flex items-center justify-center shadow-sm">
                            <GraduationCap size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 text-base leading-none">Study<span className="text-academic-700">to</span>Earn</span>
                            <p className="text-xs text-slate-400 leading-none mt-0.5">Shardeum Network</p>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3">
                        <button
                            className="btn-ghost !py-1.5 !px-2.5"
                            onClick={handleAction}
                            title="Refresh"
                        >
                            <RefreshCw size={15} />
                        </button>
                        <UserSwitcher currentUser={currentUser} onSwitch={setCurrentUser} />
                    </div>
                </div>
            </nav>

            {/* ── Page body ────────────────────────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

                {/* Hero heading */}
                <div className="animate-fade-in">
                    <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                        Your Learning Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-sm max-w-lg">
                        Lock&nbsp;<span className="font-semibold text-academic-700">STDY</span> tokens into escrow when you book a session.
                        Tutors are paid automatically when you confirm completion.
                    </p>

                    {/* Demo notice */}
                    <div className="inline-flex items-center gap-2 mt-3 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                        Demo mode — switch accounts via the top-right wallet button to see Student vs Tutor views
                    </div>
                </div>

                {/* Stats row */}
                <StatsHeader key={`stats-${refreshKey}`} />

                {/* Two-column layout: Booking form + sessions */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Booking form — narrower column */}
                    <div className="lg:col-span-2">
                        <BookingForm onSessionCreated={handleAction} />
                    </div>

                    {/* Sessions list — wider column */}
                    <div className="lg:col-span-3">
                        <ActiveSessionsList key={`sessions-${refreshKey}`} onAction={handleAction} />
                    </div>
                </div>
            </main>

            {/* ── Footer ───────────────────────────────────────────────────────── */}
            <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
                StudyToEarn · Powered by{" "}
                <a href="https://shardeum.org" className="text-academic-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Shardeum
                </a>{" "}
                · Smart Contract built with OpenZeppelin
            </footer>
        </div>
    );
}
