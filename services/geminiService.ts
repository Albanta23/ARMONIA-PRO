import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GeneratedAnalysis, RepertoireAnalysisResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        progression: {
            type: Type.ARRAY,
            description: "La progresión de acordes generada o analizada.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "El cifrado americano completo del acorde (ej. G7(b9), F#m7(b5))."
                    },
                    function: {
                        type: Type.STRING,
                        description: "La función tonal del acorde (ej. 'Tónica', 'Dominante Secundaria (V/V)', 'Subdominante Menor')."
                    }
                }
            }
        },
        analysis: {
            type: Type.STRING,
            description: "Análisis armónico detallado de la progresión, explicando la función de cada acorde, las tensiones, resoluciones y el contexto estilístico. Escrito en español, como un profesor de conservatorio superior."
        },
        concepts: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "Lista de 3 a 5 conceptos armónicos clave presentes en la progresión (ej. 'Intercambio Modal', 'Dominante Secundaria', 'Acorde Napolitano', 'Modulación')."
        },
        musicalExample: {
            type: Type.OBJECT,
            description: "Un ejemplo de una pieza musical real donde se puede escuchar un concepto armónico similar.",
            properties: {
                piece: {
                    type: Type.STRING,
                    description: "El nombre de la pieza y compositor (ej. 'Sonata Patética de Beethoven, Op. 13')."
                },
                description: {
                    type: Type.STRING,
                    description: "Una breve descripción de dónde y cómo aparece el concepto en la pieza."
                },
                simplifiedProgression: {
                    type: Type.STRING,
                    description: "Una progresión de acordes corta y audible (2-4 acordes) que demuestre el concepto armónico del ejemplo. Ej: 'C | G7 | C'. Será opcional y solo si aplica."
                }
            }
        }
    }
};

export const generateProgressionAnalysis = async (
  key: string,
  mode: string,
  style: string,
  complexity: string,
  numChords: number,
  meter: string,
  tempo: number
): Promise<GeneratedAnalysis> => {
  try {
    const prompt = `
      Eres un catedrático de armonía del Conservatorio Superior de Música más prestigioso del mundo.
      Tu tarea es generar una progresión de acordes y un análisis detallado para un estudiante de música de nivel avanzado.

      Parámetros:
      - Tonalidad: ${key} ${mode}
      - Estilo Armónico: ${style}
      - Complejidad: ${complexity}
      - Número de acordes: ${numChords}
      - Métrica: ${meter}
      - Tempo (BPM aproximado): ${tempo}

      Instrucciones:
      1. Crea una progresión de acordes interesante y educativa que se ajuste a los parámetros. Debe ser idiomática y reflejar las convenciones del estilo, pero también incluir elementos que provoquen el pensamiento crítico.
      2. Considera la métrica y el tempo para sugerir un ritmo armónico y un carácter general para la progresión (ej. un cambio de acorde por compás en un 4/4 rápido, o varios acordes por compás en una balada lenta). Refleja esto en tu análisis.
      3. Proporciona el cifrado americano completo para cada acorde y su función tonal específica.
      4. Realiza un análisis armónico exhaustivo, explicando funciones, cadencias, tensiones, resoluciones y técnicas avanzadas (dominantes secundarias, sustitutos, intercambios modales, etc.).
      5. Relaciona el análisis con el estilo musical, la métrica y el tempo solicitados.
      6. Identifica los 3-5 conceptos teóricos más importantes.
      7. Proporciona un ejemplo claro de una pieza del repertorio estándar. Adicionalmente, si es posible y relevante, proporciona en el campo 'simplifiedProgression' una secuencia corta (2-4 acordes, ej: 'Am | E7 | Am') que demuestre audiblemente el concepto.

      Devuelve tu respuesta en el formato JSON especificado.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.85,
      }
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as GeneratedAnalysis;

  } catch (error) {
    console.error("Error generating progression analysis:", error);
    throw new Error("Failed to get analysis from Gemini API.");
  }
};

export const analyzeChordProgression = async (
  progression: string,
  key: string,
  mode: string,
  style: string,
  meter: string,
  tempo: number
): Promise<GeneratedAnalysis> => {
  try {
    const prompt = `
      Eres un catedrático de armonía del Conservatorio Superior de Música más prestigioso del mundo.
      Tu tarea es analizar una progresión de acordes que te proporciono y ofrecer una explicación detallada para un estudiante de música de nivel avanzado.

      Progresión a analizar: ${progression}

      Contexto para el análisis:
      - Tonalidad de referencia: ${key} ${mode}
      - Estilo Armónico: ${style}
      - Métrica: ${meter}
      - Tempo (BPM aproximado): ${tempo}

      Instrucciones:
      1. Analiza la progresión de acordes proporcionada. Determina la función tonal de cada acorde dentro de la tonalidad de referencia.
      2. Formatea la progresión en el JSON de salida, incluyendo el cifrado americano completo que se proporcionó y la función tonal que has determinado para cada acorde.
      3. Realiza un análisis armónico exhaustivo, explicando funciones, cadencias, tensiones, resoluciones y técnicas avanzadas presentes en la progresión.
      4. Relaciona tu análisis con el estilo musical, la métrica y el tempo de contexto.
      5. Identifica los 3-5 conceptos teóricos más importantes demostrados en la progresión.
      6. Proporciona un ejemplo claro de una pieza del repertorio estándar. Adicionalmente, si es posible y relevante, proporciona en el campo 'simplifiedProgression' una secuencia corta (2-4 acordes, ej: 'Fm | Bbm | C7 | Fm') que demuestre audiblemente el concepto.

      Devuelve tu respuesta en el formato JSON especificado.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.7,
      }
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse as GeneratedAnalysis;

  } catch (error) {
    console.error("Error analyzing progression:", error);
    throw new Error("Failed to get analysis from Gemini API.");
  }
};


export const getTheoryExplanation = async (topic: string): Promise<string> => {
    try {
        const prompt = `
            Eres un catedrático de armonía del Conservatorio Superior de Música más prestigioso del mundo.
            Explica el siguiente concepto armónico de forma clara, profunda y con ejemplos musicales.
            El público son estudiantes de 4º y 5º de grado profesional, por lo que puedes usar terminología técnica, pero asegúrate de que sea comprensible y pedagógica.

            Concepto a explicar: "${topic}"

            Instrucciones MUY IMPORTANTES:
            1.  Para TODOS los ejemplos musicales, debes proporcionar la notación en formato ABC notation, envuelta entre etiquetas [abc]...[/abc].
            2.  La notación ABC debe ser simple, clara y legible. Usa una clave apropiada (ej. K:C para Do Mayor, K:Am para La menor), una métrica (ej. M:4/4) y no más de 2-4 compases por ejemplo.
            3.  Ejemplo de cómo formatear un ejemplo:
                "Un ejemplo en Do Mayor sería el siguiente:"
                [abc]
                X: 1
                K: C
                M: 4/4
                L: 1/4
                "G7" [G,B,df]4 | "C" [CEG]4 |
                [/abc]
                "Como se observa, la sensible (B) resuelve a la tónica (C)..."
            
            Estructura tu explicación usando Markdown para un formato claro:
            - **Definición Concisa**: Un párrafo introductorio.
            - **Contexto Histórico y Estilístico**: ¿Dónde y cuándo se usa más?
            - **Funcionamiento Teórico**: Intervalos, resolución de tensiones, etc.
            - **Ejemplos Prácticos**: En diferentes tonalidades (con su notación ABC).
            - **Errores Comunes a Evitar**: Consejos prácticos.
            - **Repertorio Clave**: Sugerencia de una pieza donde se pueda escuchar este concepto claramente.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.6
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating theory explanation:", error);
        throw new Error("Failed to get theory explanation from Gemini API.");
    }
};

const repertoireSchema = {
    type: Type.OBJECT,
    properties: {
        pieceTitle: { type: Type.STRING, description: "El título correcto y completo de la pieza." },
        composer: { type: Type.STRING, description: "El compositor de la pieza." },
        analysis: { type: Type.STRING, description: "Un análisis armónico detallado de la pieza, sección por sección. Usa Markdown para formatear (títulos, listas). Escrito en español." },
        keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Una lista de los conceptos armónicos más importantes encontrados en la pieza."
        }
    }
};

export const getRepertoireAnalysis = async (piece: string): Promise<RepertoireAnalysisResult> => {
    try {
        const prompt = `
            Eres un catedrático de análisis musical del conservatorio más prestigioso del mundo.
            Tu tarea es analizar la siguiente pieza musical para un estudiante avanzado.

            Pieza a analizar: "${piece}"

            Instrucciones:
            1.  Identifica el compositor y el título completo de la obra.
            2.  Realiza un análisis armónico profundo. Divídelo por secciones si es aplicable (Exposición, Desarrollo, etc., o A, B, A').
            3.  Describe la estructura formal, las modulaciones, el uso de cadencias, y las técnicas armónicas notables (cromatismo, intercambio modal, etc.).
            4.  Usa un lenguaje académico pero pedagógico.
            5.  Identifica los conceptos armónicos clave que un estudiante debería aprender de esta pieza.
            
            Devuelve la respuesta exclusivamente en el formato JSON especificado.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: repertoireSchema,
                temperature: 0.7
            }
        });

        const parsedResponse = JSON.parse(response.text);
        return parsedResponse as RepertoireAnalysisResult;

    } catch (error) {
        console.error("Error generating repertoire analysis:", error);
        throw new Error("Failed to get repertoire analysis from Gemini API.");
    }
};