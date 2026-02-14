import LivenessScanner from "@/components/scanner/LivenessScanner";
import { Shield, ChevronLeft, Terminal, Activity, Globe } from "lucide-react";
import Link from "next/link";
import NeuralBackground from "@/components/ui/NeuralBackground";

export default function VerifyPage() {
    return (
        <main className="min-h-screen bg-[#050a14] text-zinc-300 font-sans p-6 md:p-12 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none noise-bg z-0" />
            <NeuralBackground />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 backdrop-blur-2xl hover:bg-blue-600/30 transition-all shadow-lg">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white text-outlined-purple leading-none mb-1" style={{ letterSpacing: '-0.1em' }}>ECIPHERYX<span className="logo-dot">.</span></span>
                            <span className="text-[10px] text-cyan-500/60 font-mono tracking-[0.4em] uppercase font-bold">Liveness_Audit_Terminal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full flex items-center gap-6 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ritual: Online</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">NODE_L4</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col items-center">
                    <LivenessScanner />
                </div>

                <footer className="mt-24 border-t border-white/5 pt-12 opacity-30 select-none">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.8em] text-center italic">
                            Biometric_Integrity_Audit // Neural_Coherence_Sync // L4_Kernel
                        </p>
                        <div className="h-px w-32 bg-white/10" />
                    </div>
                </footer>
            </div>
        </main>
    );
}

export const metadata = {
    title: "Ecipheryx | Biometric Audit Terminal",
    description: "Verify your digital integrity via multi-factor neural rituals.",
};
