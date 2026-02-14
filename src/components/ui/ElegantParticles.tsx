"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

export default function ElegantParticles({ count = 40 }) {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        const p = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 20 + 20,
            delay: Math.random() * -20,
        }));
        setParticles(p);
    }, [count]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-white/20"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 0.4, 0],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
}
