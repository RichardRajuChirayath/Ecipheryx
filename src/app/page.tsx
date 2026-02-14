import EcipheryxHero from "@/components/ui/EcipheryxHero";
import Link from "next/link";
import { ChevronRight, Search, ShieldCheck, EyeOff } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 font-sans relative pixel-grid overflow-hidden">
      {/* Background Overlay */}
      <div className="fixed inset-0 pointer-events-none noise-bg" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
      </div>

      <EcipheryxHero />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-8 mb-32 px-4">
        <Link href="/verify" className="group relative w-full sm:w-auto px-16 py-7 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl transition-all shadow-[0_0_60px_rgba(6,182,212,0.2)] hover:shadow-[0_0_80px_rgba(6,182,212,0.4)] hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-4 italic overflow-hidden">
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-[-20deg]" />
          <span className="relative z-10 flex items-center gap-3">
            Initiate Ritual <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link href="/forensics" className="group relative w-full sm:w-auto px-16 py-7 bg-white/[0.02] hover:bg-white/5 text-white border border-white/10 font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl transition-all hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-4 italic hud-corner hud-corner-tl hud-corner-br">
          <span className="flex items-center gap-3">
            Forensic Lab <Search className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          </span>
        </Link>

        <Link href="/prism" className="group relative w-full sm:w-auto px-16 py-7 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-500/40 font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl transition-all hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-4 italic shadow-[0_0_40px_rgba(139,92,246,0.1)] hover:shadow-[0_0_60px_rgba(139,92,246,0.2)]">
          <span className="flex items-center gap-3">
            Project Prism <EyeOff className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
          </span>
        </Link>

        <Link href="/vault" className="group relative w-full sm:w-auto px-16 py-7 bg-black/40 border border-white/5 text-zinc-600 hover:text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl transition-all hover:bg-white/5 active:scale-95 flex items-center justify-center gap-4 italic">
          <span className="flex items-center gap-3">
            Access Ecipheryx <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </span>
        </Link>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Ecipheryx | Anti-Deepfake Digital Identity",
  description: "Secure your digital assets with advanced Multi-Factor Proof of Life verification.",
};
