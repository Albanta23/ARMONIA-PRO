
import React, { useState, useEffect, useRef } from 'react';
import { Topic } from '../types';

interface IntroPanelProps {
    onStart: (topic: Topic) => void;
}

const FeatureCard: React.FC<{
    title: string;
    description: string;
    icon: JSX.Element;
    onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 cursor-pointer border border-white/20"
    >
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
);

export const IntroPanel: React.FC<IntroPanelProps> = ({ onStart }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { clientX, clientY, currentTarget } = e;
            const { clientWidth, clientHeight } = currentTarget as HTMLElement;

            const xRotation = 20 * ((clientY - clientHeight / 2) / clientHeight);
            const yRotation = -20 * ((clientX - clientWidth / 2) / clientWidth);
            
            containerRef.current.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1, 1, 1)`;
        };
        
        const mainElement = document.getElementById('root');
        mainElement?.addEventListener('mousemove', handleMouseMove);

        return () => {
             mainElement?.removeEventListener('mousemove', handleMouseMove);
        }
    }, []);

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <div 
                ref={containerRef}
                className="w-[90vw] max-w-4xl p-10 bg-gray-200/50 dark:bg-gray-800/50 rounded-3xl shadow-2xl transition-transform duration-200 ease-out"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div style={{ transform: 'translateZ(40px)' }}>
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-2 tracking-wide">Bienvenido a Harmonia Pro</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">Su asistente personal para el estudio de la armonía avanzada.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            title="Progresiones"
                            description="Genere progresiones armónicas personalizadas en cualquier estilo y nivel de complejidad."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13V7m0 13a2 2 0 002-2V9a2 2 0 00-2-2m0 13h.01M15 20l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 13V7m0 13a2 2 0 01-2-2V9a2 2 0 012-2m0 13h-.01" /></svg>}
                            onClick={() => onStart(Topic.PROGRESSIONS)}
                        />
                        <FeatureCard 
                            title="Guía Teórica"
                            description="Consulte explicaciones detalladas sobre conceptos armónicos complejos, desde sextas aumentadas hasta armonía modal."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                            onClick={() => onStart(Topic.THEORY_GUIDE)}
                        />
                        <FeatureCard 
                            title="Análisis"
                            description="Obtenga análisis armónicos profundos de obras maestras del repertorio musical, como si fuera una clase magistral."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>}
                            onClick={() => onStart(Topic.REPERTOIRE_ANALYSIS)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
