import React, { useRef, useEffect, useState } from 'react';
import ABCJS from 'abcjs';
import { playProgression, playChord } from '../services/audioService';

interface MusicalExampleProps {
  abcContent: string;
  exampleId: string;
}

export const MusicalExample: React.FC<MusicalExampleProps> = ({ abcContent, exampleId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const renderTargetRef = useRef<HTMLDivElement>(null);
  const abcRenderRef = useRef<any>(null);

  // Limpiar y renderizar ABC cuando se hace visible
  useEffect(() => {
    if (isVisible && renderTargetRef.current && abcContent) {
      try {
        // Limpiar renderizado anterior
        if (renderTargetRef.current) {
          renderTargetRef.current.innerHTML = '';
        }

        // Renderizar con ABCJS
        abcRenderRef.current = ABCJS.renderAbc(renderTargetRef.current, abcContent.trim(), {
          responsive: 'resize',
          paddingleft: 10,
          paddingright: 10,
          paddingtop: 10,
          paddingbottom: 10,
          staffwidth: 350,
          add_classes: true,
          scale: 0.8
        });
      } catch (error) {
        console.error('Error rendering ABC:', error);
        if (renderTargetRef.current) {
          renderTargetRef.current.innerHTML = '<div class="text-red-500 p-4">Error al renderizar la notación musical</div>';
        }
      }
    }
  }, [isVisible, abcContent]);

  const handleToggleExample = () => {
    setIsVisible(!isVisible);
  };

  const handlePlay = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      // Convertir ABC a acordes y reproducir usando audioService
      const lines = abcContent.split('\n');
      
      // Buscar la línea que contiene los acordes (suele ser la última o contiene acordes entre comillas)
      const chordLine = lines.find(line => 
        line.includes('"') || (line.includes('[') && line.includes(']'))
      );
      
      if (chordLine) {
        console.log('Found chord line:', chordLine); // Debug
        
        // Extraer acordes entre comillas: "Cm", "F", "G7", etc.
        const quotedChords = chordLine.match(/"([^"]+)"/g);
        
        if (quotedChords && quotedChords.length > 0) {
          // Convertir acordes entre comillas a objetos
          const chords = quotedChords.map(quoted => {
            const chordName = quoted.replace(/"/g, ''); // Remover comillas
            return { name: chordName };
          });

          console.log('Playing quoted chords:', chords); // Debug

          // Reproducir progresión usando el audioService
          await playProgression(chords, tempo, () => {
            setIsPlaying(false);
          });
          
          // Fallback timeout
          setTimeout(() => {
            if (isPlaying) {
              setIsPlaying(false);
            }
          }, (chords.length * (60 / tempo) * 2 + 1) * 1000);
          
        } else {
          // Buscar acordes en formato [notas] sin comillas
          const bracketChords = chordLine.match(/\[[A-G][#b]?[A-G#b,\s]*\]/g);
          
          if (bracketChords) {
            // Extraer la primera nota de cada acorde como base
            const chords = bracketChords.map(bracket => {
              const content = bracket.slice(1, -1); // Remover corchetes
              const firstNote = content.split(/[\s,]/)[0]; // Primera nota
              const cleanNote = firstNote.replace(/[,_']/g, ''); // Limpiar marcadores
              return { name: cleanNote };
            });

            console.log('Playing bracket chords:', chords); // Debug
            
            await playProgression(chords, tempo, () => {
              setIsPlaying(false);
            });
            
          } else {
            // Fallback: reproducir acorde basado en tonalidad
            const keyLine = lines.find(line => line.startsWith('K:'));
            const key = keyLine ? keyLine.split(':')[1].trim().split(' ')[0] : 'C';
            console.log('Playing fallback key chord:', key); // Debug
            
            await playProgression([{ name: key }], tempo, () => {
              setIsPlaying(false);
            });
          }
        }
      } else {
        // Sin acordes detectados, usar tonalidad
        const keyLine = lines.find(line => line.startsWith('K:'));
        const key = keyLine ? keyLine.split(':')[1].trim().split(' ')[0] : 'C';
        console.log('No chords found, playing key:', key); // Debug
        
        await playProgression([{ name: key }], tempo, () => {
          setIsPlaying(false);
        });
      }
    } catch (error) {
      console.error('Error playing example:', error);
      alert('Error al reproducir el ejemplo musical. Asegúrate de que el navegador permita la reproducción de audio.');
      setIsPlaying(false);
    }
  };

  return (
    <div className="musical-example my-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-indigo-200 dark:border-gray-600">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button 
          onClick={handleToggleExample}
          className="toggle-example-btn flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
          {isVisible ? 'Ocultar Ejemplo' : 'Ver Ejemplo Musical'}
        </button>
        
        {isVisible && (
          <div className="audio-controls-container flex items-center gap-3">
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-500"></div>
            <button 
              onClick={handlePlay}
              disabled={isPlaying}
              className="integrated-play-btn flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors text-sm disabled:opacity-50"
            >
              <svg className="play-icon w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
              <span className="button-text">{isPlaying ? 'Reproduciendo...' : 'Reproducir'}</span>
            </button>
            <button 
              onClick={() => playChord('C', 2)}
              className="test-audio-btn flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Test C
            </button>
            <div className="tempo-control flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Tempo:</label>
              <select 
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                className="tempo-select text-xs p-1 rounded border dark:bg-gray-800 dark:border-gray-600 bg-white"
              >
                <option value="60">Lento (60)</option>
                <option value="80">Moderato (80)</option>
                <option value="100">Allegro (100)</option>
                <option value="120">Vivace (120)</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {isVisible && (
        <div className="abc-example-content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notación ABC:</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto text-xs">
                <code className="language-abc">{abcContent.trim()}</code>
              </pre>
            </div>
            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Partitura:</h4>
              <div 
                ref={renderTargetRef}
                className="abc-render-target bg-white dark:bg-gray-800 p-4 rounded-md shadow-inner border border-gray-200 dark:border-gray-600 min-h-[150px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
