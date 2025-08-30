
import React from 'react';
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
  return (
    <aside className="w-80 bg-white dark:bg-gray-800 shadow-2xl flex flex-col p-4">
      <div className="flex-1">
        <nav aria-label="Main navigation">
          <ul>
            <NavItem
              label="Progresiones"
              isActive={activeTopic === Topic.PROGRESSIONS}
              onClick={() => setActiveTopic(Topic.PROGRESSIONS)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13V7m0 13a2 2 0 002-2V9a2 2 0 00-2-2m0 13h.01M15 20l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 13V7m0 13a2 2 0 01-2-2V9a2 2 0 012-2m0 13h-.01" />
                </svg>
              }
            />
            <NavItem
              label="Guía Teórica"
              isActive={activeTopic === Topic.THEORY_GUIDE}
              onClick={() => setActiveTopic(Topic.THEORY_GUIDE)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
             <NavItem
              label="Análisis"
              isActive={activeTopic === Topic.REPERTOIRE_ANALYSIS}
              onClick={() => setActiveTopic(Topic.REPERTOIRE_ANALYSIS)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              }
            />
          </ul>
        </nav>
      </div>
      <div className="mt-auto p-2 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} Harmonia Pro</p>
        <p>Estudio de Armonía de Nivel Superior</p>
      </div>
    </aside>
  );
};
