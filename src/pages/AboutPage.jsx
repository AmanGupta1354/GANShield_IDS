import { motion } from 'framer-motion';
import { ShieldCheck, Users, Github, Lock, Database } from 'lucide-react';
import { Footer } from '../components/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-mono pt-24 selection:bg-primary selection:text-primary-foreground">
            <main className="flex-1 max-w-4xl mx-auto px-4 md:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <ShieldCheck className="text-primary w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary mb-4">
                        ABOUT GANSHIELD
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
                        Next-generation intrusion detection powered by Generative Adversarial Networks. Designed for security professionals, researchers, and enterprises.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="p-6 rounded-xl border border-border bg-card shadow-lg hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="text-primary w-5 h-5" />
                            <h2 className="text-lg font-bold">Our Mission</h2>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To provide an open, advanced, and highly accurate intrusion detection system that adapts to zero-day threats. Traditional signature-based systems are obsolete; GANShield leverages AI to recognize the behavioral patterns of malicious actors before they strike.
                        </p>
                    </div>

                    <div className="p-6 rounded-xl border border-border bg-card shadow-lg hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="text-primary w-5 h-5" />
                            <h2 className="text-lg font-bold">The Technology</h2>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Built with a robust FastAPI backend and a dynamic React (Vite) frontend, GANShield ensures high performance and real-time visualization. The core ML engine utilizes PyTorch-based Generative Adversarial Networks to continuously learn and identify network anomalies.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-xl border border-border bg-primary/5 mb-16 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-3">Open Source & Community Driven</h2>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed mb-6">
                        GANShield is built with transparency in mind. We believe that security tools should be accessible and verifiable by the community to ensure trust and continuous improvement.
                    </p>
                    <a href="https://github.com/AmanGupta1354/GANShield-IDS" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                        <Github size={18} />
                        View Source on GitHub
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    );
}
