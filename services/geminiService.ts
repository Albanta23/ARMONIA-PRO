import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedAnalysis, GenerationParams, RepertoireAnalysisResult } from '../types';

// FIX: Usar import.meta.env.VITE_API_KEY para compatibilidad con Vite/React.
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  // FIX: Updated error message to reflect the new environment variable.
  console.error("API_KEY environment variable is not set. Please set it in your deployment environment variables.");
  throw new Error("API key configuration error. Check the console for details.");
}

const ai = new GoogleGenAI({ apiKey });

const progressionSchema = {
  type: Type.OBJECT,
  properties: {
    progression: {
      type: Type.ARRAY,
      description: "La secuencia de acordes generada, en cifrado americano. Incluye acordes de séptima y posibles tensiones.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "El cifrado del acorde (ej. 'Am7', 'G7(b9)', 'C#m7b5')."
          },
          function: {
            type: Type.STRING,
            description: "La función armónica del acorde en la tonalidad (ej. 'Tónica (i)', 'Dominante Secundaria (V7/IV)', 'Subdominante menor (iv7)')."
          }
        },
        required: ["name", "function"]
      }
    },
    analysis: {
      type: Type.STRING,
      description: "Análisis armónico detallado de la progresión, explicando las relaciones entre acordes, la conducción de voces, las cadencias y el interés armónico. Escrito como un profesor de conservatorio."
    },
    concepts: {
      type: Type.ARRAY,
      description: "Una lista de 3 a 5 conceptos armónicos clave presentes en la progresión (ej. 'Cadencia Rota', 'Intercambio Modal', 'Dominantes Secundarias').",
      items: { type: Type.STRING }
    },
    musicalExample: {
      type: Type.OBJECT,
      description: "Un ejemplo de una pieza musical conocida del repertorio que utilice una progresión o concepto armónico similar.",
      properties: {
        piece: {
          type: Type.STRING,
          description: "Título de la pieza y compositor (ej. 'Preludio en Mi menor, Op. 28 n.º 4 de Chopin')."
        },
        description: {
          type: Type.STRING,
          description: "Breve descripción de cómo se utiliza el concepto armónico en esa pieza."
        },
        simplifiedProgression: {
            type: Type.STRING,
            description: "Una versión simplificada de la progresión del ejemplo, separada por '|' (ej. 'C | G | Am | F'), para poder reproducirla."
        }
      },
      required: ["piece", "description"]
    }
  },
  required: ["progression", "analysis", "concepts", "musicalExample"]
};

export const generateProgressionAnalysis = async (params: GenerationParams): Promise<GeneratedAnalysis> => {
  const { key, mode, style, complexity, numChords } = params;
  
  const prompt = `
    Eres un catedrático de armonía del Real Conservatorio Superior de Música.
    Tu tarea es generar una progresión de acordes y su análisis correspondiente basado en los siguientes parámetros.
    La respuesta DEBE estar en español.

    Parámetros:
    - Tonalidad: ${key} ${mode}
    - Estilo Armónico: ${style}
    - Nivel de Complejidad: ${complexity}
    - Número de acordes: ${numChords || 'entre 4 y 8 acordes'}

    Instrucciones:
    1.  Crea una progresión de acordes que sea idiomática para el estilo y nivel de complejidad solicitados.
    2.  Para cada acorde, proporciona su cifrado americano (ej. 'Cmaj7', 'G7(b9)') y su función armónica precise.
    3.  Escribe un análisis profundo y académico de la progresión. Explica las decisiones armónicas, las cadencias, el uso de cromatismo, las dominantes secundarias, el intercambio modal, o cualquier otro concepto relevante. La explicación debe ser clara, concisa y de alto nivel.
    4.  Identifica los conceptos teóricos más importantes demostrados en la progresión.
    5.  Proporciona un ejemplo relevante de una pieza del repertorio (clásico, jazz, etc.) que utilice un concepto o progresión similar.
  `;
  
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: progressionSchema,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    // Combine the static params with the generated result
    return { params, ...result };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("No se pudo generar el análisis. Inténtelo de nuevo.");
  }
};


export const getTheoryExplanation = async (topic: string): Promise<string> => {
    const prompt = `
    Eres un catedrático de teoría musical y armonía del Real Conservatorio Superior de Música.
    Explica el siguiente concepto de forma clara, profunda y académica, como lo harías en una clase magistral.
    La respuesta DEBE estar en español y formateada en Markdown.

    Concepto: "${topic}"

    Estructura de la explicación:
    1.  **Definición Concisa:** Una explicación directa del concepto.
    2.  **Contexto Histórico y Estilístico:** ¿En qué períodos o estilos es más común?
    3.  **Funcionamiento Teórico:** Detalla cómo funciona, las reglas que sigue y por qué es efectivo.
    4.  **Ejemplos Prácticos:** 
        - OBLIGATORIO: SIEMPRE debes incluir AL MENOS 2-3 ejemplos musicales.
        - OBLIGATORIO: CADA ejemplo musical DEBE estar encapsulado en notación ABCJS dentro de un bloque \`[abc]...[/abc]\`.
        - OBLIGATORIO: NO incluyas NINGÚN ejemplo musical sin este formato.
        - OBLIGATORIO: Cada ejemplo debe tener acordes con cifrado americano (entre comillas).
        - Formato requerido: \`[abc]X: 1\\nK: C\\nM: 4/4\\nL: 1/1\\n"Acorde1" [notas] | "Acorde2" [notas] | "Acorde3" [notas] | "Acorde4" [notas] |[/abc]\`
        - Ejemplo válido: \`[abc]X: 1\\nK: C\\nM: 4/4\\nL: 1/1\\n"Am" [ACE] | "F" [FAC] | "G7" [GBDf] | "C" [CEG] |[/abc]\`
    5.  **Repertorio Clave:** Menciona una o dos piezas famosas donde este concepto sea prominente.
    
    IMPORTANTE: Si no incluyes ejemplos en formato [abc]...[/abc], la respuesta será considerada incompleta e incorrecta.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for theory explanation:", error);
        throw new Error("No se pudo obtener la explicación. Inténtelo de nuevo.");
    }
};

const repertoireSchema = {
    type: Type.OBJECT,
    properties: {
        pieceTitle: { type: Type.STRING, description: "El título completo y correcto de la obra, incluyendo opus si es relevante." },
        composer: { type: Type.STRING, description: "El nombre completo del compositor." },
        analysis: { type: Type.STRING, description: "Un análisis armónico detallado de la obra en formato Markdown. Debe cubrir la estructura, tonalidades, modulaciones, y el uso de conceptos armónicos clave." },
        keyConcepts: { 
            type: Type.ARRAY, 
            description: "Una lista de 4-5 conceptos armónicos fundamentales para entender la pieza.",
            items: { type: Type.STRING }
        }
    },
    required: ["pieceTitle", "composer", "analysis", "keyConcepts"]
};

export const checkExerciseAnswer = async (
    exerciseTitle: string,
    instructions: string,
    level: string,
    targetKey: string,
    studentAnswer: string[],
    abcNotation: string
): Promise<{ feedback: string; score: number; isCorrect: boolean }> => {
    const notesList = studentAnswer.join(', ');
    
    const prompt = `
    Eres un catedrático de armonía del Real Conservatorio Superior de Música evaluando un ejercicio de un estudiante.
    
    **DATOS DEL EJERCICIO:**
    - Título: "${exerciseTitle}"
    - Instrucciones: "${instructions}"
    - Nivel: ${level}
    - Tonalidad objetivo: ${targetKey}
    
    **RESPUESTA DEL ESTUDIANTE:**
    - Notas colocadas: ${notesList}
    - Notación ABC generada: ${abcNotation}
    
    **TAREA DE EVALUACIÓN:**
    Analiza la respuesta del estudiante y proporciona una evaluación pedagógica completa.
    
    **FORMATO DE RESPUESTA REQUERIDO:**
    
    **CORRECCIÓN:** [SÍ/NO]
    
    **PUNTUACIÓN:** [1-10]
    
    **ANÁLISIS TÉCNICO:**
    [Análisis detallado de la respuesta desde el punto de vista armónico]
    
    **ASPECTOS POSITIVOS:**
    - [Lista de elementos correctos]
    
    **ASPECTOS A MEJORAR:**
    - [Lista de errores o mejoras necesarias]
    
    **SUGERENCIAS PEDAGÓGICAS:**
    [Consejos específicos para el estudiante basados en su nivel]
    
    **EJERCICIOS COMPLEMENTARIOS:**
    [Sugerencias de práctica adicional si es necesario]
    
    Responde en español con un tono pedagógico constructivo y profesional.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        const feedbackText = response.text;
        
        // Extraer puntuación
        const scoreMatch = feedbackText.match(/\*\*PUNTUACIÓN:\*\*\s*(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        
        // Determinar si es correcta
        const correctMatch = feedbackText.match(/\*\*CORRECCIÓN:\*\*\s*(SÍ|SI|YES|NO)/i);
        const isCorrect = correctMatch ? ['SÍ', 'SI', 'YES'].includes(correctMatch[1].toUpperCase()) : false;
        
        return {
            feedback: feedbackText,
            score,
            isCorrect
        };
    } catch (error) {
        console.error("Error calling Gemini API for exercise check:", error);
        throw new Error("No se pudo verificar la respuesta. Inténtelo de nuevo.");
    }
};