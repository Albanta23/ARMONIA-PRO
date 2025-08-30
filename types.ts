

export enum Topic {
  PROGRESSIONS = 'Generador de Progresiones',
  THEORY_GUIDE = 'Guía Teórica Avanzada',
  REPERTOIRE_ANALYSIS = 'Análisis de Repertorio',
}

export interface Scale {
  name: string;
  intervals: number[];
}

export interface Chord {
  name: string;
  function: string;
}

export interface GenerationParams {
  key: string;
  mode: string;
  style: string;
  complexity: string;
  meter: string;
  tempo: number;
  numChords?: number;
  sourceProgression?: string;
}


export interface GeneratedAnalysis {
  id?: string;
  params: GenerationParams;
  progression: Chord[];
  analysis: string;
  concepts: string[];
  musicalExample: {
      piece: string;
      description: string;
      simplifiedProgression?: string;
  };
}

export interface RepertoireAnalysisResult {
    pieceTitle: string;
    composer: string;
    analysis: string;
    keyConcepts: string[];
}