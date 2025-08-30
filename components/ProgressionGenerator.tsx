
import React, { useState, useCallback } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { generateProgressionAnalysis } from '../services/geminiService';
import { GeneratedAnalysis, Chord } from '../types';
import { KEYS, MODES, HARMONY_STYLES, COMPLEXITY_LEVELS } from '../constants';

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
}> = ({ label, value, onChange, options }) => (
  <div className="flex-1 min-w-[150px]">
    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
    >
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

const ChordCard: React.FC<{ chord: Chord }> = ({ chord }) => (
    <div className="flex-1 min-w-[100px] bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center shadow-sm border border-gray-200 dark:border-gray-600">
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">{chord.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{chord.function}</p>
    </div>
);

export const ProgressionGenerator: React.FC = () => {
  const [key, setKey] = useState('C');
  const [mode, setMode] = useState('Menor armónica');
  const [style, setStyle] = useState('Romanticismo (Cromatismo Extendido)');
  const [complexity, setComplexity] = useState('5º Grado Profesional');
  const [numChords, setNumChords] = useState(8);
  const [result, setResult] = useState<GeneratedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await generateProgressionAnalysis(key, mode, style, complexity, numChords);
      setResult(analysisResult);
    } catch (err) {
      setError('Ha ocurrido un error al generar el análisis. Por favor, inténtelo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [key, mode, style, complexity, numChords]);

  return (
    <div className="space-y-8">
      <Card title="Configuración de la Progresión">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <SelectInput label="Tonalidad" value={key} onChange={e => setKey(e.target.value)} options={KEYS} />
            <SelectInput label="Modo" value={mode} onChange={e => setMode(e.target.value)} options={Object.keys(MODES)} />
          </div>
          <SelectInput label="Estilo Armónico" value={style} onChange={e => setStyle(e.target.value)} options={HARMONY_STYLES} />
          <SelectInput label="Nivel de Complejidad" value={complexity} onChange={e => setComplexity(e.target.value)} options={COMPLEXITY_LEVELS} />
          <div className="md:col-span-2 lg:col-span-3">
             <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Número de Acordes: {numChords}</label>
            <input
              type="range"
              min="4"
              max="16"
              value={numChords}
              onChange={e => setNumChords(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? 'Generando...' : 'Generar Análisis Armónico'}
          </button>
        </div>
      </Card>

      {isLoading && <div className="flex justify-center p-10"><Spinner /></div>}
      {error && <Card><p className="text-red-500 text-center">{error}</p></Card>}
      
      {result && (
        <div className="space-y-8">
            <Card title="Progresión Armónica Generada">
                <div className="flex flex-wrap gap-4">
                    {result.progression.map((chord, index) => <ChordCard key={index} chord={chord} />)}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card title="Análisis Detallado">
                        <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
                            <p>{result.analysis}</p>
                        </div>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card title="Conceptos Clave">
                        <div className="flex flex-wrap gap-2">
                            {result.concepts.map((concept, index) => (
                                <span key={index} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-sm font-medium px-3 py-1 rounded-full">{concept}</span>
                            ))}
                        </div>
                    </Card>
                    <Card title="Ejemplo del Repertorio">
                        <div className="flex items-start gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{result.musicalExample.piece}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{result.musicalExample.description}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
