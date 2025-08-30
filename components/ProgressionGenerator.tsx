import React, { useState, useCallback, useEffect } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { HistoryPanel } from './HistoryPanel';
import { generateProgressionAnalysis } from '../services/geminiService';
import { playChord, playProgression } from '../services/audioService';
import { GeneratedAnalysis, GenerationParams, Chord } from '../types';
import { KEYS, MODES, HARMONY_STYLES, COMPLEXITY_LEVELS, METERS } from '../constants';

const ChordCard: React.FC<{ chord: Chord; onPlay: () => void; disabled: boolean; }> = ({ chord, onPlay, disabled }) => (
    <button 
        onClick={onPlay}
        disabled={disabled}
        className="flex-1 min-w-[120px] bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md hover:scale-105 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">{chord.name}</p>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{chord.function}</p>
    </button>
);

const MAX_HISTORY_ITEMS = 15;

export const ProgressionGenerator: React.FC = () => {
  const [params, setParams] = useState<GenerationParams>({
    key: 'C',
    mode: 'Mayor',
    style: 'Clasicismo (Estilo Sonata)',
    complexity: '4º Grado Profesional',
    meter: '4/4',
    tempo: 120,
    numChords: 4
  });
  const [result, setResult] = useState<GeneratedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedAnalysis[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('progressionHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  const saveToHistory = (newAnalysis: GeneratedAnalysis) => {
    setHistory(prevHistory => {
      const newHistory = [newAnalysis, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem('progressionHistory', JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save history to localStorage", e);
      }
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('progressionHistory');
    } catch(e) {
      console.error("Failed to clear history from localStorage", e);
    }
  };
  
  const loadFromHistory = (item: GeneratedAnalysis) => {
    setParams(item.params);
    setResult(item);
    setError(null);
    setTimeout(() => {
        const resultElement = document.getElementById('config-section');
        resultElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };


  const handleParamChange = (field: keyof GenerationParams, value: string | number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const analysisResult = await generateProgressionAnalysis(params);
        const resultWithId = { ...analysisResult, id: new Date().toISOString() };
        setResult(resultWithId);
        saveToHistory(resultWithId);

        setTimeout(() => {
            const resultElement = document.getElementById('analysis-result-section');
            if (resultElement) {
                resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ha ocurrido un error desconocido.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
  }, [params]);

  const handlePlayProgression = useCallback(() => {
    if (!result || isPlaying) return;
    setIsPlaying(true);
    playProgression(result.progression, result.params.tempo, () => {
        setIsPlaying(false);
    });
  }, [result, isPlaying]);

    const handlePlayExampleProgression = useCallback(() => {
    if (!result?.musicalExample?.simplifiedProgression || isPlaying) return;

    const chords = result.musicalExample.simplifiedProgression
        .split('|')
        .map(name => name.trim())
        .filter(name => name)
        .map(name => ({ name, function: '' }));

    if (chords.length === 0) return;

    setIsPlaying(true);
    playProgression(chords, 90, () => {
        setIsPlaying(false);
    });
  }, [result, isPlaying]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
          <Card title="Configuración" id="config-section">
            <div className="space-y-4">
                {/* Key and Mode */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tonalidad</label>
                        <select value={params.key} onChange={e => handleParamChange('key', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modo</label>
                        <select value={params.mode} onChange={e => handleParamChange('mode', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                            {Object.keys(MODES).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                 {/* Style */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estilo Armónico</label>
                    <select value={params.style} onChange={e => handleParamChange('style', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        {HARMONY_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 {/* Complexity */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nivel de Complejidad</label>
                    <select value={params.complexity} onChange={e => handleParamChange('complexity', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        {COMPLEXITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                {/* Chords and Meter */}
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº Acordes</label>
                        <input type="number" value={params.numChords} min="2" max="16" onChange={e => handleParamChange('numChords', parseInt(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compás</label>
                         <select value={params.meter} onChange={e => handleParamChange('meter', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                            {METERS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                 {/* Tempo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tempo (BPM): {params.tempo}</label>
                    <input type="range" min="40" max="240" step="1" value={params.tempo} onChange={e => handleParamChange('tempo', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || isPlaying}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? <Spinner /> : 'Generar Análisis'}
                </button>
            </div>
          </Card>
          <HistoryPanel 
            history={history}
            onLoad={loadFromHistory}
            onClear={clearHistory}
            disabled={isLoading || isPlaying}
          />
      </div>

      <div className="lg:col-span-2 space-y-8">
        {!result && !isLoading && !error && (
            <Card>
                <div className="text-center p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Listo para crear</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure los parámetros a la izquierda y genere su primer análisis armónico.</p>
                </div>
            </Card>
        )}
        {isLoading && <div className="flex justify-center p-10"><Spinner /></div>}
        {error && <Card><p className="text-red-500 text-center p-4">{error}</p></Card>}
        
        {result && (
            <div id="analysis-result-section" className="space-y-8">
                <Card 
                  title="Progresión Armónica"
                  actions={
                    <button 
                      onClick={handlePlayProgression} 
                      disabled={isPlaying || isLoading}
                      className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Reproducir progresión completa"
                    >
                      {isPlaying ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M9 14h6" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  }
                >
                    <div className="flex flex-wrap gap-4">
                        {result.progression.map((chord, index) => 
                          <ChordCard 
                            key={index} 
                            chord={chord} 
                            onPlay={() => playChord(chord.name, 2)}
                            disabled={isPlaying || isLoading}
                          />)}
                    </div>
                </Card>

                <Card title="Análisis Detallado">
                    <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
                        <p>{result.analysis}</p>
                    </div>
                </Card>
               
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
                            {result.musicalExample.simplifiedProgression && (
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Demostración Audible</p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-1 rounded-md">{result.musicalExample.simplifiedProgression}</span>
                                        <button 
                                            onClick={handlePlayExampleProgression}
                                            disabled={isPlaying || isLoading}
                                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                            aria-label="Reproducir ejemplo"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        )}
      </div>
    </div>
  );
};