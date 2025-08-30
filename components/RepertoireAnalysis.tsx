import React, { useState, useCallback } from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';
import { getRepertoireAnalysis } from '../services/geminiService';
import { RepertoireAnalysisResult } from '../types';
import { marked } from 'marked';

const SUGGESTED_PIECES = [
    "Preludio en Mi menor, Op. 28 n.º 4 de Chopin",
    "Claro de Luna (1er mov.) de Beethoven",
    "Preludio a la siesta de un fauno de Debussy",
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
            // Parse the analysis content from Markdown to HTML
            const parsedAnalysis = await marked.parse(analysisResult.analysis);
            setResult({ ...analysisResult, analysis: parsedAnalysis });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ha ocurrido un error desconocido.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // Single entry point for fetching data to ensure consistency
    const startFetch = (fetchPiece: string) => {
        if (!fetchPiece || isLoading) return;
        setPiece(fetchPiece); // Update the input field
        handleFetchAnalysis(fetchPiece); // Start the API call
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startFetch(piece);
    };

    return (
        <div className="space-y-8">
            <Card title="Analizador de Repertorio Musical">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="repertoire-piece" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Obra Musical
                        </label>
                        <input
                            id="repertoire-piece"
                            type="text"
                            value={piece}
                            onChange={(e) => setPiece(e.target.value)}
                            placeholder="Ej: Sonata Patética de Beethoven, 1er mov."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            disabled={isLoading}
                        />
                    </div>
                     <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Sugerencias:</span>
                        {SUGGESTED_PIECES.map(item => (
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
                        disabled={isLoading || !piece}
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                    >
                        {isLoading ? 'Analizando...' : 'Analizar Obra'}
                    </button>
                </form>
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