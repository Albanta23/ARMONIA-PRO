import { useAuth0 } from '@auth0/auth0-react';
import React, { useState } from 'react';


export function AuthButton() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user } = useAuth0();
  const [showGoodbye, setShowGoodbye] = useState(false);

  if (isLoading) return <button disabled>Cargando...</button>;

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => loginWithRedirect()}
        className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg border-b-4 border-indigo-900 active:translate-y-1 active:shadow-none transition-all duration-150 text-lg font-bold relative overflow-hidden"
        style={{
          boxShadow: '0 6px 20px 0 #6366f1aa, 0 1.5px 0 #312e81',
          textShadow: '0 2px 8px #312e81',
        }}
      >
        <span style={{ position: 'relative', zIndex: 2 }}>Iniciar sesión</span>
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, #818cf8 0%, #6366f1 100%)',
            opacity: 0.15,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }}
        />
      </button>
    );
  }

  if (showGoodbye) {
    // Pantalla de despedida con animación de notas
    setTimeout(() => {
      window.location.reload(); // Redirige al login inicial
    }, 2500);
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-4 w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-wide text-indigo-800 text-center">¡Gracias por tu visita!</h2>
        <div className="w-full" style={{ maxWidth: 340, height: 180, position: 'relative' }}>
          <svg width="100%" height="auto" viewBox="0 0 340 180" style={{ position: 'absolute', left: 0, top: 0, maxWidth: '340px', height: 'auto' }} preserveAspectRatio="xMidYMid meet">
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
          </svg>
          {/* Notas musicales animadas */}
          {[0, 1, 2, 3, 4].map(i => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: 60 + i * 40,
                top: 80 - i * 10,
                fontSize: 28 + i * 6,
                color: '#6366f1',
                opacity: 0.8 - i * 0.15,
                animation: `note-float 1.5s ${i * 0.3}s linear forwards`,
                fontFamily: 'serif',
                maxWidth: '100%',
                wordBreak: 'break-word',
              }}
            >
              {i % 2 === 0 ? '𝅘𝅥' : '𝅘𝅥𝅮'}
            </span>
          ))}
          <style>{`
            @keyframes note-float {
              0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
              80% { opacity: 0.7; }
              100% { transform: translateY(-80px) scale(1.2) rotate(-20deg); opacity: 0; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span className="truncate max-w-[120px] md:max-w-[200px]">Hola, {user?.name || user?.email || ''}</span>
      <button
        onClick={() => {
          setShowGoodbye(true);
          setTimeout(() => {
            logout({ logoutParams: { returnTo: window.location.origin } });
          }, 1200);
        }}
        className="bg-gradient-to-br from-gray-200 to-indigo-200 text-indigo-900 px-6 py-2 rounded-xl shadow border-b-2 border-indigo-400 active:translate-y-1 active:shadow-none transition-all duration-150 font-bold"
        style={{
          boxShadow: '0 2px 8px 0 #6366f1aa',
          marginLeft: '112px', // 8cm ≈ 112px
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
