import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { getTheoryExplanation } from '../services/geminiService';
import { playProgression } from '../services/audioService';
import { marked } from 'marked';
import ABCJS from 'abcjs';

const COMMON_TOPICS = [
  'Acordes de Sexta Aumentada (Italiana, Alemana, Francesa)',
  'El Acorde Napolitano',
  'Intercambio Modal y Modos Mixtos',
  'Dominantes Secundarias y Cadena de Dominantes',
  'Sustitución Tritonal',
];

export const TheoryGuide: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const explanationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (explanation && explanationRef.current) {
        const explanationContainer = explanationRef.current;
        const toggleButtons = explanationContainer.querySelectorAll<HTMLButtonElement>('.toggle-example-btn');
        
        toggleButtons.forEach(button => {
            if ((button as any).hasListener) return;

            const targetId = button.dataset.targetId;
            if (!targetId) return;

            const clickHandler = () => {
                const contentTarget = explanationContainer.querySelector(`#${targetId}`) as HTMLElement | null;
                if (!contentTarget) return;

                const isVisible = contentTarget.style.display !== 'none';
                
                if (isVisible) {
                    contentTarget.style.display = 'none';
                    button.textContent = 'Ver Ejemplo Musical';
                } else {
                    contentTarget.style.display = 'block';
                    button.textContent = 'Ocultar Ejemplo Musical';

                    const renderId = button.dataset.abcRenderId;
                    const renderTarget = contentTarget.querySelector(`#${renderId}`) as HTMLElement | null;
                    
                    if (renderTarget && renderTarget.innerHTML.trim() === '') {
                         const encodedCode = button.dataset.abcCode;
                         if (encodedCode) {
                            try {
                                const abcCode = atob(encodedCode);
                                ABCJS.renderAbc(renderId, abcCode, {
                                    responsive: "resize",
                                    paddingleft: 0,
                                    paddingright: 0,
                                    paddingtop: 0,
                                    paddingbottom: 0,
                                });
                            } catch (e) {
                                console.error("Failed to decode or render ABCJS", e);
                                renderTarget.textContent = "Error al renderizar el pentagrama.";
                            }
                         }
                    }
                }
            };
            button.addEventListener('click', clickHandler);
            (button as any).hasListener = true;
        });
        
        const playButtons = explanationContainer.querySelectorAll<HTMLButtonElement>('.play-example-btn');
        playButtons.forEach(button => {
            button.disabled = isAudioPlaying;

            if ((button as any).hasPlayListener) return;
            
            const playHandler = () => {
                if (isAudioPlaying) return;
                
                const encodedCode = button.dataset.abcCode;
                if (!encodedCode) return;

                try {
                    const abcCode = atob(encodedCode);
                    const chordMatches = abcCode.match(/"([^"]+)"/g);
                    
                    if (!chordMatches) {
                        console.warn("No chords found in ABC notation to play.");
                        return;
                    }

                    const chords = chordMatches.map(match => ({
                        name: match.replace(/"/g, '').trim()
                    }));

                    if (chords.length > 0) {
                        setIsAudioPlaying(true);
                        playProgression(chords, 100, () => {
                            setIsAudioPlaying(false);
                        });
                    }
                } catch (e) {
                    console.error("Failed to decode or play ABCJS progression", e);
                }
            };
            
            button.addEventListener('click', playHandler);
            (button as any).hasPlayListener = true;
        });

    }
  }, [explanation, isAudioPlaying]);

  const handleFetchExplanation = useCallback(async (selectedTopic: string) => {
    if (!selectedTopic) return;
    setIsLoading(true);
    setError(null);
    setExplanation(null);
    setCurrentTopic(selectedTopic);
    try {
      const result = await getTheoryExplanation(selectedTopic);
      
      const processedForAbc = result.replace(/\[abc\]([\s\S]*?)\[\/abc\]/g, (match, abcContent) => {
          const exampleId = `abc-example-${Math.random().toString(36).substring(2, 9)}`;
          const renderId = `abc-render-${Math.random().toString(36).substring(2, 9)}`;
          const encodedAbcContent = btoa(abcContent.trim());
          
          return `\n\n<div class="musical-example my-4">
                      <button 
                          data-target-id="${exampleId}"
                          data-abc-render-id="${renderId}"
                          data-abc-code="${encodedAbcContent}"
                          class="toggle-example-btn px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors text-sm">
                          Ver Ejemplo Musical
                      </button>
                      <div id="${exampleId}" class="abc-example-content mt-2 border-l-4 border-indigo-500 pl-4" style="display: none;">
                          <div class="flex items-start gap-2">
                            <pre class="flex-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto"><code class="language-abc">${abcContent.trim()}</code></pre>
                            <button
                                data-abc-code="${encodedAbcContent}"
                                class="play-example-btn p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                </svg>
                            </button>
                          </div>
                          <div id="${renderId}" class="abc-render-target bg-white dark:bg-gray-800 p-2 rounded-md shadow-inner mt-2"></div>
                      </div>
                  </div>\n\n`;
      });

      const html = await marked.parse(processedForAbc);
      setExplanation(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error desconocido.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Single entry point for fetching data to ensure consistency
  const startFetch = (fetchTopic: string) => {
    if (!fetchTopic || isLoading || isAudioPlaying) return;
    setTopic(fetchTopic); // Update the input field
    handleFetchExplanation(fetchTopic); // Start the API call
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
              disabled={isLoading || isAudioPlaying}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Sugerencias:</span>
            {COMMON_TOPICS.map(item => (
              <button
                type="button"
                key={item}
                onClick={() => startFetch(item)}
                disabled={isLoading || isAudioPlaying}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors text-sm disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading || isAudioPlaying || !topic}
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
            <div 
                ref={explanationRef}
                className="prose prose-lg dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: explanation }} 
            />
        </Card>
      )}
    </div>
  );
};