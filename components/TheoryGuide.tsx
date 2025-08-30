
import React, { useState, useCallback } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { getTheoryExplanation } from '../services/geminiService';
import { marked } from 'marked';


const COMMON_TOPICS = [
  'Acordes de Sexta Aumentada (Italiana, Alemana, Francesa)',
  'El Acorde Napolitano',
  'Intercambio Modal y Modos Mixtos',
  'Dominantes Secundarias y Cadena de Dominantes',
  'Modulación a tonalidades lejanas',
  'Armonía de Jazz: Acordes de 9, 11 y 13',
  'Sustitución Tritonal',
  'Armonía del Impresionismo (Escalas de tonos enteros, pentatónicas)',
  'Cromatismo y Armonía no funcional'
];

export const TheoryGuide: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchExplanation = useCallback(async (selectedTopic: string) => {
    if (!selectedTopic) return;
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const result = await getTheoryExplanation(selectedTopic);
      // Since the prompt now asks for markdown, we can parse it.
      const html = await marked.parse(result);
      setExplanation(html);
    } catch (err) {
      setError('Ha ocurrido un error al obtener la explicación. Por favor, inténtelo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTopicClick = (selectedTopic: string) => {
      setTopic(selectedTopic);
      handleFetchExplanation(selectedTopic);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleFetchExplanation(topic);
  }

  return (
    <div className="space-y-8">
      <Card title="Guía Teórica Avanzada">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Seleccione un tema de la lista o escriba su propia consulta para recibir una explicación detallada de nivel conservatorio superior.
        </p>
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: 'Armonía Cuartal' o 'Polimodalidad'"
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !topic}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? 'Buscando...' : 'Explicar Concepto'}
          </button>
        </form>
        <div className="flex flex-wrap gap-3">
          {COMMON_TOPICS.map(item => (
            <button
              key={item}
              onClick={() => handleTopicClick(item)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors text-sm"
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {isLoading && <div className="flex justify-center p-10"><Spinner /></div>}
      {error && <Card><p className="text-red-500 text-center">{error}</p></Card>}
      
      {explanation && (
        <Card title={`Explicación de: ${topic}`}>
            <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: explanation }} />
        </Card>
      )}
    </div>
  );
};
