import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isDashboard = location.pathname === '/dashboard';

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('ganshield_token');
            setIsLoggedIn(!!token);
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [location.pathname]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('ganshield_token');
        setIsLoggedIn(false);
        navigate('/');
        setIsMenuOpen(false);
    };

    const publicLinks = [
        { name: 'Features', path: '/#features' },
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'About', path: '/about' },
    ];

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled || isDashboard
                    ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-lg shadow-black/20'
                    : 'bg-transparent'
            }`}
        >
            <div className="w-full px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link
                    to={isLoggedIn ? '/dashboard' : '/'}
                    className="flex items-center gap-2.5 group"
                >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ShieldCheck className="text-primary w-4.5 h-4.5" size={18} />
                    </div>
                    <span className="text-base font-bold font-mono tracking-widest text-primary">
                        GANSHIELD
                    </span>
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-primary/10 text-primary border border-primary/20">
                        IDS
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {isLoggedIn ? (
                        /* Authenticated nav */
                        <>
                            <Link
                                to="/dashboard"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isDashboard
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                                }`}
                            >
                                <LayoutDashboard size={15} />
                                Dashboard
                            </Link>
                            <div className="w-px h-5 bg-border mx-2" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            >
                                <LogOut size={15} />
                                Sign Out
                            </button>
                        </>
                    ) : (
                        /* Public nav */
                        <>
                            {publicLinks.map(link => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-card/50"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="w-px h-5 bg-border mx-2" />
                            <Link to="/auth">
                                <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-card/50">
                                    Sign In
                                </button>
                            </Link>
                            <Link to="/auth">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="ml-1 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                >
                                    Get Started
                                </motion.button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="px-4 py-4 flex flex-col gap-1">
                            {isLoggedIn ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-card transition-colors"
                                    >
                                        <LayoutDashboard size={16} className="text-primary" />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    {publicLinks.map(link => (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-border my-2" />
                                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                                        <button className="w-full px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors text-left">
                                            Sign In
                                        </button>
                                    </Link>
                                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                                        <button className="w-full mt-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                                            Get Started Free
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};