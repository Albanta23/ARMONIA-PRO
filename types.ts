
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

export interface GeneratedAnalysis {
  progression: Chord[];
  analysis: string;
  concepts: string[];
  musicalExample: {
      piece: string;
      description: string;
  };
}

export interface RepertoireAnalysisResult {
    pieceTitle: string;
    composer: string;
    analysis: string;
    keyConcepts: string[];
}
