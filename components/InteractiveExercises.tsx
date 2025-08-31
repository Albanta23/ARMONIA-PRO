import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { checkExerciseAnswer } from '../services/geminiService';
import { ABCJSRenderer, ABCJSRendererHandle } from './ABCJSRenderer';
import { InteractiveStaff } from './InteractiveStaff';
import ABCJS from 'abcjs';

// Tipos para los ejercicios
interface Note {
  id: string;
  pitch: string;
  octave: number;
  accidental?: 'sharp' | 'flat' | 'natural';
  duration?: number;
  position: { x: number; y: number };
  staffPosition: number; // Posición en el pentagrama (0 = línea superior, etc.)
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  level: 'basico' | 'intermedio' | 'avanzado';
  course: 'armonia' | 'contrapunto' | 'analisis';
  targetKey: string;
  instructions: string;
  expectedSolution?: Note[];
}

interface ExerciseTemplate {
  staffLines: number;
  timeSignature: string;
  keySignature: string;
  measures: number;
}

// Plantillas de ejercicios por nivel
const EXERCISE_TEMPLATES: Record<string, Exercise[]> = {
  'basico-armonia': [
    {
      id: 'basic-triads',
      title: 'Construcción de Tríadas',
      description: 'Construye las tríadas solicitadas en posición fundamental',
      level: 'basico',
      course: 'armonia',
      targetKey: 'C',
      instructions: 'Arrastra las notas para formar una tríada mayor de Do'
    },
    {
      id: 'basic-cadences',
      title: 'Cadencias Básicas',
      description: 'Completa la cadencia V-I en Do mayor',
      level: 'basico',
      course: 'armonia',
      targetKey: 'C',
      instructions: 'Completa la progresión armónica básica'
    }
  ],
  'intermedio-armonia': [
    {
      id: 'seventh-chords',
      title: 'Acordes de Séptima',
      description: 'Construye acordes de séptima con inversiones',
      level: 'intermedio',
      course: 'armonia',
      targetKey: 'C',
      instructions: 'Forma un acorde de séptima de dominante en primera inversión'
    },
    {
      id: 'modulations',
      title: 'Modulaciones',
      description: 'Realiza una modulación al tono de la dominante',
      level: 'intermedio',
      course: 'armonia',
      targetKey: 'G',
      instructions: 'Modula de Do mayor a Sol mayor usando un acorde pivote'
    }
  ],
  'avanzado-armonia': [
    {
      id: 'neapolitan-sixth',
      title: 'Sexta Napolitana',
      description: 'Utiliza el acorde de sexta napolitana en una progresión',
      level: 'avanzado',
      course: 'armonia',
      targetKey: 'C',
      instructions: 'Incorpora la sexta napolitana en una cadencia frigia'
    }
  ]
};

// Notas disponibles para arrastrar
const AVAILABLE_NOTES = [
  { pitch: 'C', name: 'Do' },
  { pitch: 'D', name: 'Re' },
  { pitch: 'E', name: 'Mi' },
  { pitch: 'F', name: 'Fa' },
  { pitch: 'G', name: 'Sol' },
  { pitch: 'A', name: 'La' },
  { pitch: 'B', name: 'Si' }
];

const ACCIDENTALS = [
  { type: 'natural', symbol: '♮', name: 'Natural' },
  { type: 'sharp', symbol: '♯', name: 'Sostenido' },
  { type: 'flat', symbol: '♭', name: 'Bemol' }
];

const OCTAVES = [3, 4, 5, 6];

export const InteractiveExercises: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<'basico' | 'intermedio' | 'avanzado'>('basico');
  const [selectedCourse, setSelectedCourse] = useState<'armonia' | 'contrapunto' | 'analisis'>('armonia');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [placedNotes, setPlacedNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<string>('C');
  const [selectedAccidental, setSelectedAccidental] = useState<string>('natural');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [abcNotation, setAbcNotation] = useState<string>('');
  
  const abcRendererRef = useRef<ABCJSRendererHandle>(null);

  // Generar ABC notation cuando cambien las notas
  useEffect(() => {
    const newAbcNotation = generateABCFromNotes(placedNotes);
    setAbcNotation(newAbcNotation);
  }, [placedNotes, currentExercise]);

  // Generar ABC notation a partir de las notas colocadas
  const generateABCFromNotes = useCallback((notes: Note[]): string => {
    if (notes.length === 0) {
      return `X: 1\nK: ${currentExercise?.targetKey || 'C'}\nM: 4/4\nL: 1/1\n| z |`;
    }

    const abcNotes = notes.map(note => {
      let abcNote = note.pitch;
      
      // Añadir alteraciones
      if (note.accidental === 'sharp') abcNote = '^' + abcNote;
      if (note.accidental === 'flat') abcNote = '_' + abcNote;
      if (note.accidental === 'natural') abcNote = '=' + abcNote;
      
      // Añadir octava
      if (note.octave >= 5) {
        abcNote += "'".repeat(note.octave - 4);
      } else if (note.octave <= 3) {
        abcNote = abcNote.toLowerCase();
        if (note.octave === 3) abcNote += ',';
      }
      
      return abcNote;
    }).join(' ');

    return `X: 1\nK: ${currentExercise?.targetKey || 'C'}\nM: 4/4\nL: 1/1\n| [${abcNotes}] |`;
  }, [currentExercise]);

  // Obtener ejercicios para el nivel y curso seleccionados
  const getAvailableExercises = (): Exercise[] => {
    const key = `${selectedLevel}-${selectedCourse}`;
    return EXERCISE_TEMPLATES[key] || [];
  };

  // Limpiar pentagrama
  const clearStaff = () => {
    setPlacedNotes([]);
    setFeedback(null);
  };

  // Verificar respuesta con Gemini
  const checkAnswer = async () => {
    if (!currentExercise || placedNotes.length === 0) return;
    
    setIsCheckingAnswer(true);
    setFeedback(null);

    try {
      const abcNotation = generateABCFromNotes(placedNotes);
      const studentAnswer = placedNotes.map(n => 
        `${n.pitch}${n.accidental !== 'natural' ? n.accidental : ''}${n.octave}`
      );

      const result = await checkExerciseAnswer(
        currentExercise.title,
        currentExercise.instructions,
        currentExercise.level,
        currentExercise.targetKey,
        studentAnswer,
        abcNotation
      );

      setFeedback(result.feedback);
      setScore(result.score);
      
    } catch (error) {
      console.error('Error checking answer:', error);
      setFeedback('Error al verificar la respuesta. Por favor, inténtelo de nuevo.');
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Ejercicios Interactivos de Armonía">
        
        {/* Selectores de Nivel y Curso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Curso
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value as any)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="armonia">Armonía</option>
              <option value="contrapunto">Contrapunto</option>
              <option value="analisis">Análisis Musical</option>
            </select>
          </div>
        </div>

        {/* Lista de Ejercicios Disponibles */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Ejercicios Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAvailableExercises().map(exercise => (
              <button
                key={exercise.id}
                onClick={() => setCurrentExercise(exercise)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  currentExercise?.id === exercise.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{exercise.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {exercise.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ejercicio Actual */}
        {currentExercise && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{currentExercise.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{currentExercise.description}</p>
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md">
                <strong>Instrucciones:</strong> {currentExercise.instructions}
              </div>
            </div>

            {/* Paleta de Notas para Selección */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              
              {/* Selector de Nota */}
              <div>
                <label className="block text-sm font-medium mb-2">Nota</label>
                <select
                  value={selectedNote}
                  onChange={(e) => setSelectedNote(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700"
                >
                  {AVAILABLE_NOTES.map(note => (
                    <option key={note.pitch} value={note.pitch}>
                      {note.name} ({note.pitch})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Alteración */}
              <div>
                <label className="block text-sm font-medium mb-2">Alteración</label>
                <select
                  value={selectedAccidental}
                  onChange={(e) => setSelectedAccidental(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700"
                >
                  {ACCIDENTALS.map(acc => (
                    <option key={acc.type} value={acc.type}>
                      {acc.symbol} {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Octava */}
              <div>
                <label className="block text-sm font-medium mb-2">Octava</label>
                <select
                  value={selectedOctave}
                  onChange={(e) => setSelectedOctave(parseInt(e.target.value))}
                  className="w-full p-2 border rounded-md dark:bg-gray-700"
                >
                  {OCTAVES.map(octave => (
                    <option key={octave} value={octave}>
                      Octava {octave}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pentagrama Interactivo */}
            <div className="mb-6">
              <InteractiveStaff
                notes={placedNotes}
                onNotesChange={setPlacedNotes}
                selectedNote={selectedNote}
                selectedAccidental={selectedAccidental as 'sharp' | 'flat' | 'natural'}
                selectedOctave={selectedOctave}
                keySignature={currentExercise.targetKey}
                className="shadow-sm"
              />
            </div>

            {/* Controles */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={clearStaff}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Limpiar Pentagrama
              </button>
              <button
                onClick={checkAnswer}
                disabled={placedNotes.length === 0 || isCheckingAnswer}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCheckingAnswer ? (
                  <>
                    <Spinner />
                    Verificando...
                  </>
                ) : (
                  'Verificar Respuesta'
                )}
              </button>
              {placedNotes.length > 0 && (
                <div className="ml-auto flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>📝 {placedNotes.length} nota{placedNotes.length !== 1 ? 's' : ''} colocada{placedNotes.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Feedback de Gemini */}
            {feedback && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  Evaluación del Profesor IA
                  {score > 0 && (
                    <span className="px-2 py-1 bg-blue-200 dark:bg-blue-700 rounded text-sm">
                      {score}/10
                    </span>
                  )}
                </h5>
                <div className="whitespace-pre-line text-sm">
                  {feedback}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
