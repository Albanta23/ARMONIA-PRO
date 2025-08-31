
import React, { useState } from 'react';
import { Topic } from '../types';

interface SidebarProps {
  activeTopic: Topic;
  setActiveTopic: (topic: Topic) => void;
}

const NavItem: React.FC<{
  icon: JSX.Element;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    className={`
      flex items-center p-3 my-2 cursor-pointer rounded-lg transition-all duration-200
      ${isActive
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }
    `}
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="ml-4 font-semibold text-lg">{label}</span>
  </li>
);


export const Sidebar: React.FC<SidebarProps> = ({ activeTopic, setActiveTopic }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón menú móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-indigo-600 text-white rounded-full p-2 shadow-lg focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-label="Abrir menú"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-40 transition-opacity duration-200 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Drawer móvil y sidebar desktop */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:shadow-none md:block flex flex-col`}
        style={{ maxWidth: 320 }}
        aria-label="Sidebar"
      >
        <div className="flex-1">
          <nav aria-label="Main navigation">
            <ul>
              <NavItem
                label="Progresiones"
                isActive={activeTopic === Topic.PROGRESSIONS}
                onClick={() => { setActiveTopic(Topic.PROGRESSIONS); setOpen(false); }}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13V7m0 13a2 2 0 002-2V9a2 2 0 00-2-2m0 13h.01M15 20l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 13V7m0 13a2 2 0 01-2-2V9a2 2 0 012-2m0 13h-.01" />
                  </svg>
                }
              />
              <NavItem
                label="Guía Teórica"
                isActive={activeTopic === Topic.THEORY_GUIDE}
                onClick={() => { setActiveTopic(Topic.THEORY_GUIDE); setOpen(false); }}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
              <NavItem
                label="Análisis"
                isActive={activeTopic === Topic.REPERTOIRE_ANALYSIS}
                onClick={() => { setActiveTopic(Topic.REPERTOIRE_ANALYSIS); setOpen(false); }}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                }
              />
              <NavItem
                label="Ejercicios"
                isActive={activeTopic === Topic.INTERACTIVE_EXERCISES}
                onClick={() => { setActiveTopic(Topic.INTERACTIVE_EXERCISES); setOpen(false); }}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                }
              />
            </ul>
          </nav>
        </div>
        <div className="mt-auto p-2 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Armonia Pro</p>
          <p>Estudio de Armonía de Nivel Superior</p>
          <div className="flex justify-center mt-1">
            <svg width="120" height="16" viewBox="0 0 120 16" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="marca-texture-sidebar" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
                <filter id="marca-3d-sidebar" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.35" />
                  <feDropShadow dx="-2" dy="0" stdDeviation="1.5" floodColor="#818cf8" floodOpacity="0.25" />
                  <feDropShadow dx="2" dy="0" stdDeviation="1.5" floodColor="#312e81" floodOpacity="0.25" />
                  <feDropShadow dx="0" dy="0" stdDeviation="0.7" floodColor="#fff" floodOpacity="0.6" />
                </filter>
              </defs>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="bold"
                fill="url(#marca-texture-sidebar)"
                filter="url(#marca-3d-sidebar)"
                style={{
                  letterSpacing: 0.5,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  opacity: 0.8,
                  userSelect: 'none',
                }}
              >
                JCF2025DV
              </text>
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
};
