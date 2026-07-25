import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Lock, Cpu, Activity } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

const features = [
    { icon: Shield, title: "24/7 Threat Monitoring", description: "Continuous AI-driven surveillance detecting and neutralizing threats before they impact your infrastructure." },
    { icon: Zap, title: "Zero-Latency Response", description: "Sub-millisecond automated countermeasures deployed the instant an anomaly is flagged by our neural engine." },
    { icon: Cpu, title: "AI Pattern Recognition", description: "Deep learning models trained on 2B+ attack signatures that continuously evolve to detect novel threat vectors." },
    { icon: Lock, title: "Military-Grade Encryption", description: "AES-256 end-to-end encryption across all data streams with quantum-resistant key exchange protocols." },
    { icon: Globe, title: "Global Threat Intelligence", description: "Connected to 10,000+ security nodes across 48 countries providing real-time global cyberattack trend analysis." },
    { icon: Activity, title: "Live Security Dashboard", description: "Visualize your entire security posture with real-time metrics, attack heatmaps, and actionable insights." },
];

export const FeaturesGrid = () => {
    return (
        <section id="features" className="py-24 relative z-10">
            <div className="w-full mx-auto px-6 md:px-12 lg:px-24">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Elevate security with</span><br />
                        <span className="text-primary">seamless intelligence</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Deploy enterprise-grade protection without the complexity. Our autonomous systems handle the heavy lifting.
                    </p>
                </motion.div>

                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {features.map((feature, index) => (
                        <motion.li key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1, duration: 0.5 }} className="min-h-[14rem] list-none">
                            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
                                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                                <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] border-border bg-background p-6 shadow-sm">
                                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                            <feature.icon size={24} />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-foreground">{feature.title}</h3>
                                            <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            </div>
        </section>
    );
};