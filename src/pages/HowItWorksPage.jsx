import { motion } from 'framer-motion';
import { Shield, Activity, Database, Crosshair, Network, Cpu } from 'lucide-react';
import { Footer } from '../components/Footer';

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-mono pt-24 selection:bg-primary selection:text-primary-foreground">
            <main className="flex-1 max-w-5xl mx-auto px-4 md:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary mb-4">
                        HOW GANSHIELD WORKS
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
                        The architecture behind our AI-driven network anomaly detection system. We use advanced machine learning to distinguish between benign traffic and sophisticated attacks in real-time.
                    </p>
                </motion.div>

                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 md:before:left-1/2 md:before:-translate-x-1/2 md:before:ml-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {/* Step 1 (Card on Left) */}
                    <div className="relative flex items-center w-full">
                        <div className="hidden md:block md:w-[calc(50%-2.5rem)]">
                            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-right">
                                <div className="flex items-center justify-end gap-2 mb-2">
                                    <h3 className="font-bold text-lg">Packet Interception</h3>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">Phase 01</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    GANShield passively monitors network interfaces in promiscuous mode. It captures raw packets without interrupting normal traffic flow, creating a real-time data stream of all incoming and outgoing connections.
                                </p>
                            </div>
                        </div>
                        <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border border-primary/50 bg-background shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] text-primary z-10">
                            <Network size={18} />
                        </div>
                        <div className="w-full pl-14 md:hidden">
                            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">Phase 01</span>
                                    <h3 className="font-bold text-lg">Packet Interception</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    GANShield passively monitors network interfaces in promiscuous mode. It captures raw packets without interrupting normal traffic flow, creating a real-time data stream of all incoming and outgoing connections.
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:block md:w-[calc(50%-2.5rem)] ml-auto" />
                    </div>

                    {/* Step 2 (Card on Right) */}
                    <div className="relative flex items-center w-full">
                        <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
                        <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border border-cyan-500/50 bg-background shadow-[0_0_15px_rgba(6,182,212,0.2)] text-cyan-400 z-10">
                            <Activity size={18} />
                        </div>
                        <div className="w-full pl-14 md:pl-0 md:w-[calc(50%-2.5rem)] ml-auto">
                            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-cyan-500/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded">Phase 02</span>
                                    <h3 className="font-bold text-lg">Flow Feature Extraction</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Raw packets are aggregated into bidirectional flows. Statistical features like packet size variance, inter-arrival times, and flag frequencies are calculated on the fly using CICFlowMeter logic, generating a rich feature vector for ML analysis.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 (Card on Left) */}
                    <div className="relative flex items-center w-full">
                        <div className="hidden md:block md:w-[calc(50%-2.5rem)]">
                            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-violet-500/30 transition-all text-right">
                                <div className="flex items-center justify-end gap-2 mb-2">
                                    <h3 className="font-bold text-lg">AI Inference Engine</h3>
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded">Phase 03</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    The flow features are fed into our Generative Adversarial Network (GAN) trained on diverse threat datasets. The discriminator evaluates the flow instantly, assigning a confidence score and identifying the specific vector (e.g., DDoS, Bruteforce, SQLi).
                                </p>
                            </div>
                        </div>
                        <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border border-violet-500/50 bg-background shadow-[0_0_15px_rgba(139,92,246,0.2)] text-violet-400 z-10">
                            <Cpu size={18} />
                        </div>
                        <div className="w-full pl-14 md:hidden">
                            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-violet-500/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded">Phase 03</span>
                                    <h3 className="font-bold text-lg">AI Inference Engine</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    The flow features are fed into our Generative Adversarial Network (GAN) trained on diverse threat datasets. The discriminator evaluates the flow instantly, assigning a confidence score and identifying the specific vector (e.g., DDoS, Bruteforce, SQLi).
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:block md:w-[calc(50%-2.5rem)] ml-auto" />
                    </div>

                    {/* Step 4 (Card on Right) */}
                    <div className="relative flex items-center w-full">
                        <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
                        <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border border-rose-500/50 bg-background shadow-[0_0_15px_rgba(244,63,94,0.2)] text-rose-500 z-10">
                            <Crosshair size={18} />
                        </div>
                        <div className="w-full pl-14 md:pl-0 md:w-[calc(50%-2.5rem)] ml-auto">
                            <div className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-rose-500/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded">Phase 04</span>
                                    <h3 className="font-bold text-lg">Real-Time Alerting</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    If an attack is detected, the event is immediately pushed to the GANShield Dashboard via WebSocket. Geolocation data is appended, allowing security analysts to visualize the threat origin and vector instantaneously.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
