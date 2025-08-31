import React from 'react';
import { AuthButton } from './AuthButton';

interface HeaderProps {
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onGoHome}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-3"
          aria-label="Volver al inicio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wider mr-4">
          Armonia Pro
        </h1>
        <div className="ml-8">
          <AuthButton />
        </div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 font-light">
        Asistente de Armonía Avanzada
      </div>
    </header>
  );
};
