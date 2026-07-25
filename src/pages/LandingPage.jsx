import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { HeroSection } from '../components/HeroSection';

const Background = lazy(() =>
    import('../components/Background').then((module) => ({ default: module.Background }))
);
const FeaturesGrid = lazy(() =>
    import('../components/FeaturesGrid').then((module) => ({ default: module.FeaturesGrid }))
);
const DisplayCardsSection = lazy(() =>
    import('../components/DisplayCardsSection').then((module) => ({ default: module.DisplayCardsSection }))
);
const SocialProof = lazy(() =>
    import('../components/SocialProof').then((module) => ({ default: module.SocialProof }))
);
const Footer = lazy(() =>
    import('../components/Footer').then((module) => ({ default: module.Footer }))
);

const DeferredSection = ({ children, fallbackHeight = '320px' }) => {
    const hostRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = hostRef.current;
        if (!node) return;

        if (!('IntersectionObserver' in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '220px 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={hostRef}>
            {isVisible ? (
                <Suspense fallback={<div style={{ minHeight: fallbackHeight }} />}>{children}</Suspense>
            ) : (
                <div style={{ minHeight: fallbackHeight }} />
            )}
        </div>
    );
};

const LandingPage = () => {
    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
            <div className="fixed inset-0 z-0 opacity-40">
                <Suspense fallback={null}>
                    <Background />
                </Suspense>
            </div>

            <div className="relative z-10 flex flex-col">
                <HeroSection />
                <DeferredSection fallbackHeight="700px">
                    <FeaturesGrid />
                </DeferredSection>
                <DeferredSection fallbackHeight="680px">
                    <DisplayCardsSection />
                </DeferredSection>
                <DeferredSection fallbackHeight="760px">
                    <SocialProof />
                </DeferredSection>
                <DeferredSection fallbackHeight="420px">
                    <Footer />
                </DeferredSection>

                <div className="absolute top-0 right-0 w-[500px] h-[800px] bg-gradient-to-b from-orange-500/5 via-amber-500/3 to-transparent -skew-x-[20deg] blur-[80px] pointer-events-none" />
                <div className="absolute top-[40%] left-0 w-[400px] h-[600px] bg-gradient-to-b from-amber-500/5 to-transparent skew-x-[15deg] blur-[80px] pointer-events-none" />
            </div>
        </div>
    );
};

export default LandingPage;