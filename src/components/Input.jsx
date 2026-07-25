import { motion } from 'framer-motion';

export const Input = ({ label, id, icon, ...props }) => {
    return (
        <div className="flex flex-col gap-1 mb-4">
            <label htmlFor={id} className="text-sm font-mono text-gray-400 tracking-wider uppercase ml-1">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[var(--color-neon-blue)] transition-colors duration-300">
                        {icon}
                    </div>
                )}
                <motion.input
                    id={id}
                    className={`w-full bg-gray-900/50 border border-gray-700 rounded p-3 ${icon ? 'pl-10' : ''} text-white focus:outline-none focus:border-[var(--color-neon-blue)] transition-colors duration-300 font-sans backdrop-blur-sm placeholder-gray-600`}
                    whileFocus={{ boxShadow: "0 0 10px rgba(0, 240, 255, 0.3)" }}
                    {...props}
                />
                <div className="absolute inset-0 rounded pointer-events-none border border-transparent group-hover:border-gray-600 transition-colors duration-300" />
            </div>
        </div>
    );
};