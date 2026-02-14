import LivenessScanner from "@/components/scanner/LivenessScanner";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    return (
        <div className="min-h-screen bg-zinc-950 ecipheryx-grid flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Shield className="w-3 h-3" />
                    Secure Verification Protocol
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                    Proof of <span className="text-cyan-500 text-glow">Life</span>
                </h1>
                <p className="text-zinc-500 max-w-xl mx-auto">
                    Position your face within the frame and follow the visual challenges.
                    Our AI analyzes micro-expressions to ensure you are a living human.
                </p>
            </div>

            <LivenessScanner />

            <div className="mt-12 text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em]">
                Encrypted | On-Device Processing | Logic-Verified
            </div>

            <Link href="/" className="mt-8 text-zinc-500 hover:text-white transition-colors text-sm uppercase font-black">
                ← Abort Mission
            </Link>
        </div>
    );
}
