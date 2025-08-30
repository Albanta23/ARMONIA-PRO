import { Scale } from './types';

export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const METERS = ['4/4', '3/4', '6/8', '2/4', '12/8', '5/4', '7/8'];

export const MODES: { [key: string]: Scale } = {
  'Mayor': { name: 'Mayor (Jónico)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  'Menor natural': { name: 'Menor (Eólico)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  'Menor armónica': { name: 'Menor armónica', intervals: [0, 2, 3, 5, 7, 8, 11] },
  'Menor melódica': { name: 'Menor melódica', intervals: [0, 2, 3, 5, 7, 9, 11] },
  'Dórico': { name: 'Dórico', intervals: [0, 2, 3, 5, 7, 9, 10] },
  'Frigio': { name: 'Frigio', intervals: [0, 1, 3, 5, 7, 8, 10] },
  'Lidio': { name: 'Lidio', intervals: [0, 2, 4, 6, 7, 9, 11] },
  'Mixolidio': { name: 'Mixolidio', intervals: [0, 2, 4, 5, 7, 9, 10] },
  'Locrio': { name: 'Locrio', intervals: [0, 1, 3, 5, 6, 8, 10] },
};

export const HARMONY_STYLES = [
  'Barroco (Coral a 4 voces)',
  'Clasicismo (Estilo Sonata)',
  'Romanticismo (Cromatismo Extendido)',
  'Impresionismo (Modos y Acordes Extendidos)',
  'Jazz (Bebop/Cool Jazz)',
  'Jazz Modal',
  'Fusión Contemporánea',
  'Pop/Rock (Armonía Funcional)'
];

export const COMPLEXITY_LEVELS = [
  '4º Grado Profesional',
  '5º Grado Profesional',
  'Nivel Superior (Análisis)',
];