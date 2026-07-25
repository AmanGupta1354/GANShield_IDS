import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GridFloor } from './GridFloor';
import { TextScramble } from '@/components/ui/text-scramble';

const SpinningShield = lazy(() =>
    import('./SpinningShield').then((m) => ({ default: m.SpinningShield }))
);

const Stat = ({ value, label, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex flex-col"
    >
        <span className="text-xl font-bold text-primary tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
    </motion.div>
);

export const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            <GridFloor />

            {/* Glow blobs */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[140px] opacity-[0.07] bg-primary pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full blur-[120px] opacity-[0.05] bg-amber-400 pointer-events-none" />

            <div className="relative z-10 w-full px-6 md:px-12 lg:px-24 pt-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left — Text content */}
                    <div className="flex flex-col gap-6 items-center text-center lg:items-start lg:text-left order-2 lg:order-1">

                        {/* Trust badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold tracking-wide"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            AI-Powered · Real-Time Detection · CICIDS2018
                        </motion.div>

                        {/* Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                        >
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                                <TextScramble
                                    as="span"
                                    className="block text-white"
                                    duration={1.0}
                                    speed={0.03}
                                    characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                >
                                    Detect Threats
                                </TextScramble>
                                <TextScramble
                                    as="span"
                                    className="block text-primary"
                                    duration={1.3}
                                    speed={0.03}
                                    characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                >
                                    Before They Strike
                                </TextScramble>
                            </h1>
                        </motion.div>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35, duration: 0.7 }}
                            className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed"
                        >
                            GANShield IDS uses XGBoost ML to classify 12 attack types in real time.
                            Live packet capture → CICFlowMeter → instant predictions on your dashboard.
                        </motion.p>

                        {/* Compliance badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-2"
                        >
                            {['SOC 2 Type II', '24/7 Monitoring', 'ISO 27001'].map(badge => (
                                <span
                                    key={badge}
                                    className="px-3 py-1 rounded-full border border-border bg-card/60 text-[11px] uppercase tracking-wide text-muted-foreground"
                                >
                                    {badge}
                                </span>
                            ))}
                        </motion.div>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
                        >
                            <Link to="/auth">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full sm:w-auto bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 group shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
                                >
                                    Start Monitoring
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </motion.button>
                            </Link>
                            <Link to="/dashboard">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full sm:w-auto bg-card border border-border hover:border-primary/40 text-foreground px-7 py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Play size={14} className="text-primary" />
                                    Live Demo
                                </motion.button>
                            </Link>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="w-full pt-6 border-t border-border/40 grid grid-cols-4 gap-4"
                        >
                            <Stat value="99.9%" label="Uptime" delay={1.0} />
                            <Stat value="<2ms" label="Latency" delay={1.1} />
                            <Stat value="12" label="Attack Types" delay={1.2} />
                            <Stat value="500k+" label="Blocked" delay={1.3} />
                        </motion.div>
                    </div>

                    {/* Right — Shield */}
                    <div className="relative flex items-center justify-center min-h-[440px] order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 1.0, type: 'spring', stiffness: 80 }}
                        >
                            <Suspense fallback={
                                <div className="w-[320px] h-[320px] rounded-full border border-border/50 bg-card/20 animate-pulse" />
                            }>
                                <SpinningShield />
                            </Suspense>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};