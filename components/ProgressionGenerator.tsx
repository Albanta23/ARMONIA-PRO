
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { generateProgressionAnalysis, analyzeChordProgression } from '../services/geminiService';
import { playChord, playProgression } from '../services/audioService';
import { GeneratedAnalysis, Chord } from '../types';
import { KEYS, MODES, HARMONY_STYLES, COMPLEXITY_LEVELS, METERS } from '../constants';

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

const getTempoName = (bpm: number): string => {
    if (bpm <= 60) return 'Largo';
    if (bpm <= 66) return 'Larghetto';
    if (bpm <= 76) return 'Adagio';
    if (bpm <= 108) return 'Andante';
    if (bpm <= 120) return 'Moderato';
    if (bpm <= 168) return 'Allegro';
    if (bpm <= 200) return 'Presto';
    return 'Prestissimo';
};

const progressionExamples = [
  {
    name: 'Pop Clásico (I-V-vi-IV)',
    progression: 'Cmaj7 | G7 | Am7 | Fmaj7',
    context: {
      key: 'C',
      mode: 'Mayor',
      style: 'Pop/Rock (Armonía Funcional)',
      complexity: '4º Grado Profesional',
      meter: '4/4',
      tempo: 120,
    }
  },
  {
    name: 'Jazz Básico (ii-V-I)',
    progression: 'Dm7 | G7 | Cmaj7',
    context: {
      key: 'C',
      mode: 'Mayor',
      style: 'Jazz (Bebop/Cool Jazz)',
      complexity: '5º Grado Profesional',
      meter: '4/4',
      tempo: 140,
    }
  },
  {
    name: 'Cromatismo Romántico',
    progression: 'Am | E7/G# | G13 | C#7(b9) | F#m7 | B7(b9) | Emaj7',
    context: {
      key: 'A',
      mode: 'Menor melódica',
      style: 'Romanticismo (Cromatismo Extendido)',
      complexity: 'Nivel Superior (Análisis)',
      meter: '3/4',
      tempo: 70,
    }
  },
  {
    name: 'Turnaround de Jazz (Coltrane)',
    progression: 'Cmaj7 Eb7 | Abmaj7 B7 | Emaj7 G7 | Cmaj7',
    context: {
      key: 'C',
      mode: 'Mayor',
      style: 'Jazz (Bebop/Cool Jazz)',
      complexity: 'Nivel Superior (Análisis)',
      meter: '4/4',
      tempo: 180,
    }
  }
];

export const ProgressionGenerator: React.FC = () => {
  const [key, setKey] = useState('C');
  const [mode, setMode] = useState('Menor armónica');
  const [style, setStyle] = useState('Romanticismo (Cromatismo Extendido)');
  const [complexity, setComplexity] = useState('5º Grado Profesional');
  const [numChords, setNumChords] = useState(8);
  const [meter, setMeter] = useState('4/4');
  const [tempo, setTempo] = useState(120);
  const [result, setResult] = useState<GeneratedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [key, mode, style, complexity, numChords, meter, tempo]);


  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await generateProgressionAnalysis(key, mode, style, complexity, numChords, meter, tempo);
      setResult(analysisResult);
    } catch (err) {
      setError('Ha ocurrido un error al generar el análisis. Por favor, inténtelo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [key, mode, style, complexity, numChords, meter, tempo]);

  const handleExampleClick = useCallback(async (example: typeof progressionExamples[0]) => {
      setKey(example.context.key);
      setMode(example.context.mode);
      setStyle(example.context.style);
      setComplexity(example.context.complexity);
      setMeter(example.context.meter);
      setTempo(example.context.tempo);
      setNumChords(example.progression.split('|').length);

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const analysisResult = await analyzeChordProgression(
          example.progression,
          example.context.key,
          example.context.mode,
          example.context.style,
          example.context.meter,
          example.context.tempo
        );
        setResult(analysisResult);
      } catch (err) {
        setError('Ha ocurrido un error al analizar la progresión. Por favor, inténtelo de nuevo.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
  }, []);

  const handlePlayProgression = useCallback(() => {
    if (!result || isPlaying) return;
    setIsPlaying(true);
    playProgression(result.progression, tempo, () => {
        setIsPlaying(false);
    });
  }, [result, tempo, isPlaying]);

  const handlePlayExampleProgression = useCallback(() => {
    if (!result?.musicalExample?.simplifiedProgression || isPlaying) return;

    const chords = result.musicalExample.simplifiedProgression
        .split('|')
        .map(name => name.trim())
        .filter(name => name)
        .map(name => ({ name }));

    if (chords.length === 0) return;

    setIsPlaying(true);
    playProgression(chords, 90, () => {
        setIsPlaying(false);
    });
  }, [result, isPlaying]);

  return (
    <div className="space-y-8">
      <Card title="Configuración de la Progresión">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="flex gap-4">
                <SelectInput label="Tonalidad" value={key} onChange={e => setKey(e.target.value)} options={KEYS} />
                <SelectInput label="Modo" value={mode} onChange={e => setMode(e.target.value)} options={Object.keys(MODES)} />
            </div>
             <SelectInput label="Estilo Armónico" value={style} onChange={e => setStyle(e.target.value)} options={HARMONY_STYLES} />
            <SelectInput label="Nivel de Complejidad" value={complexity} onChange={e => setComplexity(e.target.value)} options={COMPLEXITY_LEVELS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <SelectInput label="Métrica" value={meter} onChange={e => setMeter(e.target.value)} options={METERS} />
            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Tempo: {tempo} BPM ({getTempoName(tempo)})</label>
                <input
                  type="range"
                  min="40"
                  max="220"
                  step="1"
                  value={tempo}
                  onChange={e => setTempo(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div>
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
            disabled={isLoading || isPlaying}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? 'Generando...' : 'Generar Análisis Armónico'}
          </button>
        </div>
      </Card>

      <Card title="Ejemplos de Progresiones">
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            Seleccione un ejemplo para pre-configurar los parámetros y generar un análisis instantáneo.
        </p>
        <div className="flex flex-wrap gap-3">
            {progressionExamples.map((example) => (
                <button
                    key={example.name}
                    onClick={() => handleExampleClick(example)}
                    disabled={isLoading || isPlaying}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
                >
                    {example.name}
                </button>
            ))}
        </div>
      </Card>

      {isLoading && <div className="flex justify-center p-10"><Spinner /></div>}
      {error && <Card><p className="text-red-500 text-center">{error}</p></Card>}
      
      {result && (
        <div className="space-y-8">
            <Card 
              title="Progresión Armónica Generada"
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
            </div>
        </div>
      )}
    </div>
  );
};