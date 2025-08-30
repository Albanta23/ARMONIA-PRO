
import React, { useState, useCallback } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { getRepertoireAnalysis } from '../services/geminiService';
import { RepertoireAnalysisResult } from '../types';
import { marked } from 'marked';


const SUGGESTED_PIECES = [
    "Preludio en Mi menor, Op. 28 n.º 4 de Chopin",
    "Claro de Luna (1er mov.) de Beethoven",
    "Gymnopédie n.º 1 de Satie",
    "El Cisne de Saint-Saëns",
];

export const RepertoireAnalysis: React.FC = () => {
    const [piece, setPiece] = useState('');
    const [result, setResult] = useState<RepertoireAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchAnalysis = useCallback(async (selectedPiece: string) => {
        if (!selectedPiece) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysisResult = await getRepertoireAnalysis(selectedPiece);
            const parsedAnalysis = await marked.parse(analysisResult.analysis);
            setResult({ ...analysisResult, analysis: parsedAnalysis });
        } catch (err) {
            setError('Ha ocurrido un error al obtener el análisis. Por favor, inténtelo de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFetchAnalysis(piece);
    };

    const handleSuggestionClick = (selectedPiece: string) => {
        setPiece(selectedPiece);
        handleFetchAnalysis(selectedPiece);
    };

    return (
        <div className="space-y-8">
            <Card title="Analizador de Repertorio Musical">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Introduce el nombre de una obra musical (ej: "Sonata para piano n.º 14 de Beethoven") para recibir un análisis armónico detallado.
                </p>
                <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        value={piece}
                        onChange={(e) => setPiece(e.target.value)}
                        placeholder="Introduce una pieza o compositor..."
                        className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        aria-label="Nombre de la pieza musical"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !piece}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isLoading ? 'Analizando...' : 'Analizar Obra'}
                    </button>
                </form>
                 <div className="flex flex-wrap gap-3">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 self-center">Sugerencias:</span>
                    {SUGGESTED_PIECES.map(item => (
                        <button
                        key={item}
                        onClick={() => handleSuggestionClick(item)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-colors text-sm"
                        >
                        {item}
                        </button>
                    ))}
                </div>
            </Card>

            {isLoading && <div className="flex justify-center p-10"><Spinner /></div>}
            {error && <Card><p className="text-red-500 text-center">{error}</p></Card>}

            {result && (
                <Card title={`Análisis de: ${result.pieceTitle}`}>
                    <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Compositor: {result.composer}</h3>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {result.keyConcepts.map((concept, index) => (
                                <span key={index} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-sm font-medium px-3 py-1 rounded-full">{concept}</span>
                            ))}
                        </div>
                    </div>
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: result.analysis }}
                    />
                </Card>
            )}
        </div>
    );
};
