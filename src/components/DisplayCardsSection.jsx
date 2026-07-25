import { motion } from 'framer-motion';
import DisplayCards from '@/components/ui/display-cards';
import { ShieldCheck, AlertTriangle, Zap, Cpu, Lock, Globe } from 'lucide-react';

const cyberCards = [
    {
        icon: <ShieldCheck className="size-4 text-orange-300" />,
        title: "Active Defense",
        description: "24/7 autonomous threat neutralization",
        date: "Live Now",
        titleClassName: "text-primary",
        className: "[grid-area:stack] hover:-translate-y-6 sm:hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        icon: <AlertTriangle className="size-4 text-orange-300" />,
        title: "Threat Intel",
        description: "Real-time global cyberattack feeds",
        date: "2.4B+ analyzed",
        titleClassName: "text-primary",
        className: "[grid-area:stack] translate-x-8 translate-y-8 sm:translate-x-12 sm:translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        icon: <Zap className="size-4 text-orange-300" />,
        title: "Zero-Day Response",
        description: "Sub-millisecond countermeasures",
        date: "<0.01s avg",
        titleClassName: "text-primary",
        className: "[grid-area:stack] translate-x-16 translate-y-16 sm:translate-x-24 sm:translate-y-20 hover:translate-y-8 sm:hover:translate-y-10",
    },
];

export const DisplayCardsSection = () => {
    return (
        <section className="py-24 relative z-10">
            <div className="w-full mx-auto px-6 md:px-12 lg:px-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            <span className="text-white">Stay ahead of</span><br />
                            <span className="text-primary">every threat vector</span>
                        </h2>
                        <p className="text-gray-400 max-w-lg leading-relaxed mb-8">
                            Our multi-layered defense system processes billions of signals daily,
                            combining AI-driven pattern recognition with global threat intelligence
                            to keep your infrastructure bulletproof.
                        </p>
                        <div className="flex gap-6">
                            {[
                                { icon: Cpu, label: 'AI Engine v4.2' },
                                { icon: Lock, label: 'AES-256' },
                                { icon: Globe, label: '48 Regions' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <item.icon size={16} className="text-primary" />
                                    <span className="text-xs text-muted-foreground font-mono uppercase">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex items-center justify-center min-h-[320px] sm:min-h-[400px]">
                        <DisplayCards cards={cyberCards} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};