import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import LandingPage from './pages/LandingPage';
import './App.css';

// FIXED: ProtectedRoute now properly checks ganshield_token (matches what services/api.js stores)
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('ganshield_token');
    return token ? children : <Navigate to="/auth" replace />;
}

const AuthPage = lazy(() =>
    import('./pages/AuthPage').then((module) => ({ default: module.AuthPage }))
);
const Dashboard = lazy(() => import('./pages/Dashboard'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function ScrollToHash() {
    const location = useLocation();

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const elementId = location.hash.replace('#', '');
        let attempts = 0;
        const maxAttempts = 30;

        const scrollToElement = () => {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            attempts += 1;
            if (attempts < maxAttempts) {
                window.setTimeout(scrollToElement, 80);
            }
        };

        scrollToElement();
    }, [location.pathname, location.hash]);

    return null;
}

// FIXED: AuthRedirect - if already logged in, skip auth page
function AuthRedirect({ children }) {
    const token = localStorage.getItem('ganshield_token');
    return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
    return (
        <BrowserRouter>
            <div className="overflow-x-hidden w-full">
                <ScrollToHash />
                <Navbar />
                <Suspense
                    fallback={
                        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground font-mono">
                            Loading secure workspace...
                        </div>
                    }
                >
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/how-it-works" element={<HowItWorksPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        {/* FIXED: Redirect to dashboard if already authed */}
                        <Route
                            path="/auth"
                            element={
                                <AuthRedirect>
                                    <AuthPage />
                                </AuthRedirect>
                            }
                        />
                        {/* FIXED: Dashboard was unprotected — now wrapped with ProtectedRoute */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </div>
        </BrowserRouter>
    );
}

export default App;