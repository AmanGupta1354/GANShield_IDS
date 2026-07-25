import { motion } from 'framer-motion';
import { Lock, Wifi, Eye, Fingerprint, ShieldCheck, Scan, AlertTriangle, Globe, Cpu, Activity } from 'lucide-react';

const orbitIcons = [
    { icon: Lock, delay: 0 },
    { icon: Wifi, delay: 1 },
    { icon: Eye, delay: 2 },
    { icon: Fingerprint, delay: 3 },
    { icon: Scan, delay: 4 },
    { icon: ShieldCheck, delay: 5 },
];

const liveStats = [
    { label: 'THREATS BLOCKED', value: '12,847', color: '#ef4444', icon: AlertTriangle },
    { label: 'UPTIME', value: '99.99%', color: '#10b981', icon: Activity },
    { label: 'GLOBAL NODES', value: '10,024', color: '#e78a53', icon: Globe },
    { label: 'AI MODEL', value: 'v4.2.1', color: '#d4a060', icon: Cpu },
];

export const SpinningShield = () => {
    return (
        <div className="relative w-[460px] h-[460px] flex items-center justify-center">
            <div className="absolute w-[320px] h-[320px] rounded-full blur-[130px] opacity-[0.10] animate-pulse" style={{ backgroundColor: '#e78a53' }} />
            <div className="absolute w-[200px] h-[200px] rounded-full blur-[100px] opacity-[0.07]" style={{ backgroundColor: '#d4a060' }} />

            <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute w-[400px] h-[400px] rounded-full" style={{ border: '1.5px dashed rgba(231, 138, 83, 0.2)' }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute w-[350px] h-[350px] rounded-full" style={{ border: '1px solid rgba(212, 160, 96, 0.15)' }} />

            {orbitIcons.map((item, index) => {
                const angle = (index / orbitIcons.length) * 360;
                const radius = 185;
                return (
                    <motion.div key={index} animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: item.delay * 0.3 }} className="absolute" style={{ width: '370px', height: '370px' }}>
                        <motion.div
                            className="absolute flex items-center justify-center w-10 h-10 rounded-xl backdrop-blur-md border shadow-lg"
                            style={{
                                backgroundColor: 'rgba(231, 138, 83, 0.08)',
                                borderColor: 'rgba(231, 138, 83, 0.22)',
                                boxShadow: '0 0 18px rgba(231, 138, 83, 0.1)',
                                top: '50%', left: '50%',
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`,
                            }}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear', delay: item.delay * 0.3 }}
                        >
                            <item.icon size={17} style={{ color: '#e78a53' }} />
                        </motion.div>
                    </motion.div>
                );
            })}

            <div className="relative z-10 w-[160px] h-[160px] flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute w-[190px] h-[190px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(231, 138, 83, 0.25), rgba(212, 160, 96, 0.1), transparent)', filter: 'blur(20px)' }} />
                <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="relative w-[140px] h-[140px] flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                        <defs>
                            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e78a53" stopOpacity="0.85" />
                                <stop offset="100%" stopColor="#d4a060" stopOpacity="0.65" />
                            </linearGradient>
                            <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e78a53" />
                                <stop offset="100%" stopColor="#d4a060" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        <path d="M50 5 L90 25 L90 55 Q90 80 50 95 Q10 80 10 55 L10 25 Z" fill="url(#shieldGrad)" stroke="url(#shieldStroke)" strokeWidth="1.5" filter="url(#glow)" />
                        <path d="M35 52 L45 62 L65 38" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
                    </svg>
                </motion.div>
            </div>

            {liveStats.map((stat, i) => {
                const positions = [
                    { x: -185, y: -110 },
                    { x: 120, y: -110 },
                    { x: -185, y: 80 },
                    { x: 120, y: 80 },
                ];
                const pos = positions[i];
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                        transition={{
                            opacity: { delay: 1 + i * 0.25, duration: 0.5 },
                            scale: { delay: 1 + i * 0.25, duration: 0.5 },
                            y: { delay: 1.5 + i * 0.25, duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        className="absolute px-3 py-2 rounded-xl backdrop-blur-md border text-left shadow-lg min-w-[110px]"
                        style={{
                            left: `calc(50% + ${pos.x}px)`,
                            top: `calc(50% + ${pos.y}px)`,
                            backgroundColor: 'rgba(18, 17, 19, 0.75)',
                            borderColor: `${stat.color}30`,
                            boxShadow: `0 0 16px ${stat.color}12`,
                        }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <stat.icon size={10} style={{ color: stat.color }} />
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono leading-none">{stat.label}</span>
                        </div>
                        <div className="text-sm font-bold font-mono leading-none" style={{ color: stat.color }}>{stat.value}</div>
                    </motion.div>
                );
            })}
        </div>
    );
};