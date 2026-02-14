"use client";

import Link from "next/link";
import { Shield, Database, Scan, ChevronRight, Activity, Terminal, Lock, Cpu, Globe } from "lucide-react";
import EcipheryxHero from "@/components/ui/EcipheryxHero";
import NeuralBackground from "@/components/ui/NeuralBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050a14] font-sans relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none noise-bg z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a192f]/50 via-transparent to-[#050a14] z-0" />

      <NeuralBackground />

      {/* Precision Header HUD */}
      <nav className="fixed top-0 left-0 w-full z-50 p-8 flex justify-between items-center px-12 pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto group cursor-default">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-2xl group-hover:bg-cyan-500/10 transition-all shadow-lg overflow-hidden p-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white text-outlined-purple mb-0.5">ECIPHERYX<span className="logo-dot">.</span></span>
            <span className="text-[9px] font-mono tracking-[0.2em] text-purple-500/80 uppercase font-black">Biometric_System_v4</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full flex items-center gap-6 pointer-events-auto shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Network: Live</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">0.02ms</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20">
        <EcipheryxHero />

        {/* Global Access Protocols Area */}
        <section className="relative z-20 px-6 max-w-7xl mx-auto mb-40">
          <div className="flex items-center gap-4 mb-10 px-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h2 className="text-[11px] font-black tracking-[0.6em] text-purple-500 uppercase">Core_System_Protocols</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <ProtocolCard
              href="/verify"
              icon={<Scan className="w-6 h-6 text-cyan-400" />}
              label="Liveness Scanner"
              sub="Biometric Integrity"
              desc="Real-time biometric assessment."
            />
            <ProtocolCard
              href="/forensics"
              icon={<Activity className="w-6 h-6 text-blue-400" />}
              label="Forensic Lab"
              sub="Neural Audit"
              desc="Deepfake signature analysis."
            />
            <ProtocolCard
              href="/vault"
              icon={<Database className="w-6 h-6 text-emerald-400" />}
              label="Identity Vault"
              sub="Secure Repository"
              desc="Private on-chain attestations."
            />
            <ProtocolCard
              href="/prism"
              icon={<Terminal className="w-6 h-6 text-purple-400" />}
              label="Project Prism"
              sub="ZKP Protocol"
              desc="Zero-knowledge proof verification."
            />
          </div>
        </section>
      </div>

      {/* Footer Branded Section */}
      <footer className="relative z-20 border-t border-white/5 bg-[#050a14]/80 backdrop-blur-3xl py-12 px-12 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-zinc-600" />
              <h4 className="text-sm font-bold tracking-tight text-white opacity-40">ECIPHERYX Engineering</h4>
            </div>
            <p className="text-[9px] text-zinc-700 font-mono tracking-widest uppercase">Encryption Architecture v4.2.0 // Node_L4</p>
          </div>
          <div className="flex gap-10 items-center">
            <FooterLink label="Documentation" />
            <FooterLink label="API_Gateway" />
            <FooterLink label="Security_Board" />
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProtocolCard({ href, icon, label, sub, desc }: { href: string; icon: any; label: string; sub: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group relative h-64 flex flex-col justify-end p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-2 shadow-2xl overflow-hidden glass-panel"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>

      <div className="relative z-10">
        <div className="p-3.5 bg-white/5 rounded-xl w-fit mb-6 border border-white/5 group-hover:border-purple-500/30 transition-colors">
          {icon}
        </div>
        <p className="text-[10px] font-bold text-purple-500/60 uppercase tracking-widest mb-1.5">{sub}</p>
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{label}</h3>
        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{desc}</p>
      </div>

      <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
        <ChevronRight className="w-4 h-4 text-white" />
      </div>

      <div className="absolute inset-0 border-beam-purple opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-bold tracking-widest text-zinc-600 hover:text-white transition-all cursor-pointer uppercase">
      {label}
    </span>
  );
}
