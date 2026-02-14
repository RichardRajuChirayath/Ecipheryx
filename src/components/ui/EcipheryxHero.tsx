"use client";

import { motion } from "framer-motion";
import { Shield, Fingerprint, Lock, Zap } from "lucide-react";
import Link from "next/link";

export default function EcipheryxHero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="relative pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden">
            {/* HUD Decoration */}
            <div className="absolute top-20 left-10 w-40 h-40 border-l border-t border-white/10 pointer-events-none opacity-20" />
            <div className="absolute top-20 right-10 w-40 h-40 border-r border-t border-white/10 pointer-events-none opacity-20" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 text-center px-4 max-w-6xl w-full"
            >
                <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px w-12 bg-cyan-500/50" />
                        <span className="text-[10px] text-cyan-500 font-mono tracking-[0.5em] uppercase">Identity Protocol v4.0</span>
                        <div className="h-px w-12 bg-cyan-500/50" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="relative inline-block mb-8">
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white uppercase italic glitch-cyan leading-none">
                        ECIPHERYX
                    </h1>
                    <div className="absolute -right-12 top-0 text-[10px] font-mono text-zinc-700 vertical-text tracking-widest opacity-50 hidden md:block">
                        AUTHENTICITY_OR_DEATH
                    </div>
                </motion.div>


                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl mx-auto mb-16 leading-relaxed italic"
                >
                    Proof of Life in a synthetic world. Verify your digital soul via
                    <span className="text-white"> Multi-Factor Neural Rituals</span> and secure your high-value assets.
                </motion.p>

                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
                >
                    <FeatureCard
                        icon={<Fingerprint className="w-6 h-6 text-cyan-400" />}
                        title="Biometric Liveness"
                        description="On-device landmark analysis ensures you are flesh and bone, not a synthetic render."
                        tag="LEVEL 1"
                    />
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-fuchsia-400" />}
                        title="Neural Forensic"
                        description="MoE reasoning models hunt for frame-splicing and biometric drift in real-time."
                        tag="LEVEL 2"
                    />
                    <FeatureCard
                        icon={<Shield className="w-6 h-6 text-emerald-400" />}
                        title="Proof of Soul"
                        description="Mint a temporary cryptographic key to access guarded digital asset protocols."
                        tag="LEVEL 3"
                    />
                </motion.div>
            </motion.div>
        </div >
    );
}

function FeatureCard({ icon, title, description, tag }: { icon: any; title: string; description: string; tag: string }) {
    return (
        <div className="p-8 glass-card border border-white/5 hover:border-cyan-500/30 transition-all duration-500 group relative hud-corner hud-corner-tl hud-corner-br">
            <div className="absolute top-4 right-6 text-[8px] font-mono text-zinc-700 tracking-widest group-hover:text-cyan-500/50 transition-colors uppercase">
                {tag}
            </div>
            <div className="mb-6 p-3 bg-white/[0.03] rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500 border border-white/5">
                {icon}
            </div>
            <h3 className="text-xl font-black text-white mb-3 group-hover:text-cyan-400 transition-colors italic uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium italic group-hover:text-zinc-400 transition-colors">
                {description}
            </p>
        </div>
    );
}
