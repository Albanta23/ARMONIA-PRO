import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Auth0ProviderWithConfig } from './components/Auth0ProviderWithConfig';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthButton } from './components/AuthButton';
import { Footer } from './components/Footer';
import { IntroPanel } from './components/IntroPanel';
import { Spinner } from './components/Spinner';
import { Topic } from './types';

// Lazy loading de componentes pesados
const ProgressionGenerator = lazy(() => import('./components/ProgressionGenerator').then(module => ({ default: module.ProgressionGenerator })));
const TheoryGuide = lazy(() => import('./components/TheoryGuide').then(module => ({ default: module.TheoryGuide })));
const RepertoireAnalysis = lazy(() => import('./components/RepertoireAnalysis').then(module => ({ default: module.RepertoireAnalysis })));

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-6 bg-gradient-to-br from-indigo-100 to-indigo-300 px-2 sm:px-0">
        <div className="mb-2 w-full max-w-xs sm:max-w-md md:max-w-lg" style={{ perspective: 600 }}>
          <svg width="100%" height="auto" viewBox="0 0 340 220" style={{ display: 'block', margin: '0 auto', maxWidth: '340px', height: 'auto' }} preserveAspectRatio="xMidYMid meet">
            {/* Pentagrama */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="20" x2="320"
                y1={50 + i * 22}
                y2={50 + i * 22}
                stroke="#444"
                strokeWidth="3"
                opacity="0.7"
              />
            ))}
            {/* Letra alpha con textura de gradiente */}
            <defs>
              <linearGradient id="alpha-texture" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e0e7ff" />
                <stop offset="40%" stopColor="#a5b4fc" />
                <stop offset="70%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
              <filter id="alpha-3d" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#6366f1" floodOpacity="0.4" />
                <feDropShadow dx="-6" dy="0" stdDeviation="4" floodColor="#818cf8" floodOpacity="0.3" />
                <feDropShadow dx="6" dy="0" stdDeviation="4" floodColor="#312e81" floodOpacity="0.3" />
                <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#fff" floodOpacity="0.7" />
              </filter>
            </defs>
            <g style={{ transformOrigin: '170px 90px' }}>
              <text
                x="170"
                y="125"
                textAnchor="middle"
                fontSize="100"
                fontWeight="bold"
                fill="url(#alpha-texture)"
                filter="url(#alpha-3d)"
                style={{
                  transform: 'rotateY(0deg)',
                  animation: 'spin3d 2.5s linear infinite',
                  fontFamily: 'Bravura, serif',
                }}
                className="alpha-3d"
              >
                𝄞
              </text>
              {/* Marca de agua 3D */}
              <text
                x="170"
                y="200"
                textAnchor="middle"
                fontSize="28"
                fontWeight="bold"
                fill="url(#alpha-texture)"
                filter="url(#alpha-3d)"
                style={{
                  letterSpacing: 2,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  userSelect: 'none',
                }}
              >
                JCF2025DV
              </text>
            </g>
          </svg>
        </div>
  <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-wide text-center">Armonia Pro</h2>
  <p className="mb-4 text-base sm:text-lg text-gray-700 text-center">Inicia sesión para acceder</p>
        <AuthButton />
        <style>{`
          @keyframes spin3d {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
          .alpha-3d {
            transform-origin: 110px 60px;
            display: inline-block;
            animation: spin3d 2.5s linear infinite;
          }
        `}</style>
      </div>
    );
  }
  return <>{children}</>;
}

const App: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>(Topic.HOME);
  const goHome = () => {
    setActiveTopic(Topic.HOME);
  };

  const renderContent = useCallback(() => {
    switch (activeTopic) {
      case Topic.HOME:
        return <IntroPanel onStart={setActiveTopic} />;
      case Topic.PROGRESSIONS:
        return (
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
            <ProgressionGenerator />
          </Suspense>
        );
      case Topic.THEORY_GUIDE:
        return (
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
            <TheoryGuide />
          </Suspense>
        );
      case Topic.REPERTOIRE_ANALYSIS:
        return (
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
            <RepertoireAnalysis />
          </Suspense>
        );
      default:
        return <IntroPanel onStart={setActiveTopic} />;
    }
  }, [activeTopic]);
  
  return (
    <Auth0ProviderWithConfig>
      <AuthGate>
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          <div className="flex flex-1 w-full">
            {activeTopic !== Topic.HOME && (
              <aside className="hidden md:block md:w-64 lg:w-72 xl:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <Sidebar activeTopic={activeTopic} setActiveTopic={setActiveTopic} />
              </aside>
            )}
            <div className="flex flex-col flex-1 w-full">
              {activeTopic !== Topic.HOME && <Header onGoHome={goHome} />}
              <main className={`${activeTopic !== Topic.HOME ? 'p-2 sm:p-4 md:p-6 lg:p-8' : ''} flex-1 w-full max-w-full mx-auto`}>
                {renderContent()}
              </main>
              {activeTopic !== Topic.HOME && <Footer />}
            </div>
          </div>
        </div>
      </AuthGate>
    </Auth0ProviderWithConfig>
  );
};

export default App;