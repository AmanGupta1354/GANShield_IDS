import { AuthForm } from '../components/AuthForm';
import ClickSpark from '../components/ClickSpark';
import FlowFieldBackground from '@/components/ui/flow-field-background';

export const AuthPage = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <ClickSpark sparkColor="#e78a53" sparkSize={8} sparkRadius={18} sparkCount={6} duration={350} className="absolute inset-0">
                    <FlowFieldBackground color="#d4a060" trailOpacity={0.07} speed={0.5} particleCount={350} />
                </ClickSpark>
            </div>

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[200px] opacity-[0.06] bg-primary pointer-events-none z-0" />

            {/* Form */}
            <div className="relative z-10 w-full max-w-sm px-4 pt-20 pb-8">
                <AuthForm />
            </div>
        </div>
    );
};