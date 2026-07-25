import { ShieldCheck, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="relative z-10 border-t border-border bg-card/50 backdrop-blur-md">
            <div className="w-full px-6 md:px-12 lg:px-24 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="text-primary w-7 h-7" />
                            <span className="text-xl font-bold font-mono tracking-wider text-primary">GANSHIELD</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                            Next-generation cybersecurity powered by advanced AI and global threat intelligence.
                            Protecting enterprises across 48 countries with zero-latency defense systems.
                        </p>
                        <div className="flex gap-3 mt-6">
                            {[Github, Twitter, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><Link to="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link to="/auth" className="hover:text-primary transition-colors">Get Demo</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><span className="hover:text-primary transition-colors cursor-default">About</span></li>
                            <li><span className="hover:text-primary transition-colors cursor-default">Careers</span></li>
                            <li><span className="hover:text-primary transition-colors cursor-default">Contact</span></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-muted-foreground font-mono">(c) 2026 GANSHIELD. All rights reserved.</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ALL SYSTEMS OPERATIONAL
                    </div>
                </div>
            </div>
        </footer>
    );
};