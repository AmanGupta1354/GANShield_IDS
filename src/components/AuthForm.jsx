import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

const Field = ({ id, label, type, placeholder, icon, value, onChange, required, autoComplete, minLength }) => {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    {icon}
                </div>
                <input
                    id={id}
                    type={isPassword && show ? 'text' : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoComplete={autoComplete}
                    minLength={minLength}
                    className="w-full bg-muted/40 border border-border rounded-lg px-10 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:bg-muted/60 transition-all"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                    >
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(c => ({ ...c, [id]: value }));
    };

    const handleModeChange = (next) => {
        setIsLogin(next);
        setStatus({ type: '', message: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });
        try {
            if (isLogin) {
                await loginUser(formData.email, formData.password);
            } else {
                await registerUser(formData.name, formData.email, formData.password);
            }
            navigate('/dashboard');
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-card/60 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
                {/* Top accent */}
                <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                <div className="p-8">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <ShieldCheck size={18} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold font-mono tracking-widest text-primary leading-none">GANSHIELD</p>
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">Intrusion Detection System</p>
                        </div>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex bg-muted/50 rounded-xl p-1 mb-6 relative">
                        <motion.div
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-lg border border-border/50 shadow-sm"
                            animate={{ left: isLogin ? '4px' : 'calc(50%)' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                        {[['Login', true], ['Sign Up', false]].map(([label, val]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => handleModeChange(val)}
                                className={`flex-1 py-2 text-xs font-semibold z-10 relative transition-colors rounded-lg ${
                                    isLogin === val ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <AnimatePresence mode="wait">
                        <motion.form
                            key={isLogin ? 'login' : 'signup'}
                            initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isLogin ? 12 : -12 }}
                            transition={{ duration: 0.18 }}
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            {!isLogin && (
                                <Field id="name" label="Full Name" type="text" placeholder="John Doe"
                                    icon={<User size={15} />} value={formData.name} onChange={handleChange}
                                    required autoComplete="name" minLength={2} />
                            )}
                            <Field id="email" label="Email" type="email" placeholder="you@example.com"
                                icon={<Mail size={15} />} value={formData.email} onChange={handleChange}
                                required autoComplete="email" />
                            <Field id="password" label="Password" type="password" placeholder="••••••••"
                                icon={<Lock size={15} />} value={formData.password} onChange={handleChange}
                                required autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={6} />

                            {status.message && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-xs px-3 py-2 rounded-lg border ${
                                        status.type === 'error'
                                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    }`}
                                >
                                    {status.message}
                                </motion.p>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-2 w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full block"
                                        />
                                        Authenticating...
                                    </span>
                                ) : (
                                    <>
                                        {isLogin ? 'Access Dashboard' : 'Create Account'}
                                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    </AnimatePresence>

                    <p className="text-center text-[11px] text-muted-foreground/60 font-mono mt-6">
                        🔒 Secured · JWT Authentication
                    </p>
                </div>
            </div>
        </motion.div>
    );
};