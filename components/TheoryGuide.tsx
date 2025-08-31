import React, { useState, useCallback } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { TheoryContent } from './TheoryContent';
import { getTheoryExplanation } from '../services/geminiService';

const COMMON_TOPICS = [
  'Acordes de Sexta Aumentada (Italiana, Alemana, Francesa)',
  'El Acorde Napolitano',
  'Intercambio Modal y Modos Mixtos',
  'Dominantes Secundarias y Cadena de Dominantes',
  'Sustitución Tritonal',
] as const;

export const TheoryGuide: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState('');

  const handleFetchExplanation = useCallback(async (topicToFetch: string) => {
    if (!topicToFetch.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    setCurrentTopic(topicToFetch);
    
    try {
      const result = await getTheoryExplanation(topicToFetch);
      setExplanation(result);
    } catch (err) {
      setError('Error al obtener la explicación. Por favor, intenta de nuevo.');
      console.error('Error fetching theory explanation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startFetch = (fetchTopic: string) => {
    setTopic(fetchTopic);
    handleFetchExplanation(fetchTopic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startFetch(topic);
  };
  
  return (
    <div className="space-y-8">
      <Card title="Guía Teórica Avanzada">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="theory-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Concepto Armónico
            </label>
            <input
              id="theory-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Sustitución Tritonal, Acordes de Sexta Aumentada..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Sugerencias:</span>
            {COMMON_TOPICS.map(item => (
              <button
                type="button"
                key={item}
                onClick={() => startFetch(item)}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors text-sm disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading || !topic}
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {isLoading ? 'Consultando...' : 'Obtener Explicación'}
          </button>
        </form>
      </Card>

      {isLoading && <div className="flex justify-center p-10"><Spinner /></div>}
      {error && <Card><p className="text-red-500 text-center">{error}</p></Card>}
      
      {explanation && (
        <Card title={`Explicación de: ${currentTopic}`}>
          <TheoryContent content={explanation} />
        </Card>
      )}
    </div>
  );
};
