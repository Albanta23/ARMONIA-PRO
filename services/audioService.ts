/**
 * audioService.ts
 * 
 * Este servicio encapsula toda la lógica para la síntesis de audio en el navegador
 * utilizando la Web Audio API. Permite reproducir acordes individuales o progresiones
 * completas a partir de su cifrado americano.
 */

// Se usa una única instancia de AudioContext para mejorar el rendimiento.
let audioContext: AudioContext;
const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
      throw e;
    }
  }
  return audioContext;
};


const NOTE_TO_MIDI: { [key: string]: number } = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

// Convierte un número de nota MIDI a frecuencia en Hz.
const midiToFrequency = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * Analiza un cifrado de acorde y devuelve un array de números de nota MIDI.
 * Es una versión simplificada que cubre los acordes más comunes.
 * @param chordName - El cifrado del acorde (ej. "Am7", "G7", "Cmaj7").
 * @returns Un array de números MIDI para las notas del acorde.
 */
const parseChordToMidi = (chordName: string): number[] => {
  // Ignora información de bajo/inversiones por simplicidad (ej. "E7/G#")
  const cleanChordName = chordName.split('/')[0];

  const rootMatch = cleanChordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];

  const rootName = rootMatch[1];
  const baseMidiNote = NOTE_TO_MIDI[rootName] + 60; // Octava central (C4)
  
  let remaining = cleanChordName.substring(rootName.length);
  // Elimina paréntesis y su contenido (b9, #11, etc.) por simplicidad
  remaining = remaining.replace(/\(.*\)/, '');

  let intervals: number[];

  // Se evalúan las calidades más complejas primero
  if (remaining.startsWith('maj7') || remaining.startsWith('M7')) {
    intervals = [0, 4, 7, 11]; // M, 3M, 5J, 7M
  } else if (remaining.startsWith('m7') || remaining.startsWith('-7')) {
    intervals = [0, 3, 7, 10]; // m, 3m, 5J, 7m
  } else if (remaining.startsWith('7')) {
    intervals = [0, 4, 7, 10]; // M, 3M, 5J, 7m (Dominante)
  } else if (remaining.startsWith('m')) {
    intervals = [0, 3, 7]; // m, 3m, 5J
  } else {
    // Por defecto, es un acorde mayor
    intervals = [0, 4, 7]; // M, 3M, 5J
  }

  return intervals.map(interval => baseMidiNote + interval);
};

const playNotes = (notes: number[], duration: number, startTime: number) => {
    const context = getAudioContext();
    notes.forEach(midiNote => {
        const fundamentalFrequency = midiToFrequency(midiNote);

        // --- IMPLEMENTACIÓN MEJORADA: SONIDO DE PIANO MÁS RICO ---
        // Configuración de armónicos para un timbre de piano más natural usando síntesis aditiva.
        const harmonics = [
            { multiple: 1, gain: 1.0 },  // Fundamental
            { multiple: 2, gain: 0.5 },  // 1ª Octava
            { multiple: 3, gain: 0.35 }, // Octava + Quinta
            { multiple: 4, gain: 0.25 }, // 2ª Octava
            { multiple: 5, gain: 0.15 }, // 2ª Octava + Tercera
            { multiple: 6, gain: 0.1 },  // 2ª Octava + Quinta
            { multiple: 7, gain: 0.05 }, // Séptima armónica (añade 'brillo')
            { multiple: 8, gain: 0.08 }, // 3ra Octava
        ];

        // Nodo de ganancia principal para controlar la envolvente de volumen (ADSR)
        const masterGain = context.createGain();
        masterGain.connect(context.destination);
        
        // Envolvente ADSR (Attack, Decay, Sustain, Release) más realista para simular
        // el martillo y la resonancia de un piano.
        const now = startTime;
        const attackDuration = 0.01; // Ataque muy rápido y percusivo
        const decayDuration = 0.2;   // Caída inicial
        const sustainLevel = 0.4;    // Nivel al que cae tras el ataque inicial
        const releaseDuration = duration - (attackDuration + decayDuration);

        masterGain.gain.setValueAtTime(0, now);
        // Attack: Sube al volumen máximo casi instantáneamente.
        masterGain.gain.linearRampToValueAtTime(1.0, now + attackDuration);
        // Decay: Cae rápidamente al nivel de sustain.
        masterGain.gain.exponentialRampToValueAtTime(sustainLevel, now + attackDuration + decayDuration);
        // Sustain/Release: Decae lentamente durante el resto de la duración de la nota.
        if (releaseDuration > 0) {
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        }

        // Crear y conectar un oscilador para cada armónico
        harmonics.forEach(harmonic => {
            const osc = context.createOscillator();
            const gainNode = context.createGain();

            osc.connect(gainNode);
            gainNode.connect(masterGain);

            osc.type = 'sine';
            osc.frequency.value = fundamentalFrequency * harmonic.multiple;
            gainNode.gain.value = harmonic.gain;

            osc.start(now);
            osc.stop(now + duration + 0.2); // Dejar una pequeña cola para el release
        });
    });
}

/**
 * Reproduce un único acorde.
 * @param chordName - El cifrado del acorde a reproducir.
 * @param duration - La duración en segundos.
 */
export const playChord = async (chordName: string, duration: number = 1.5) => {
  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }
  
  const notes = parseChordToMidi(chordName);
  if (notes.length === 0) return;

  const now = context.currentTime;
  playNotes(notes, duration, now);
};

/**
 * Reproduce una secuencia de acordes.
 * @param chords - Un array de objetos con el nombre del acorde.
 * @param tempo - El tempo en BPM para determinar la duración de cada acorde.
 * @param onEnd - Callback que se ejecuta al finalizar la reproducción.
 */
export const playProgression = async (
    chords: { name: string }[],
    tempo: number,
    onEnd: () => void
) => {
  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }
  
  // Asumimos 2 tiempos por acorde. Duración = (60 / BPM) * 2
  const chordDuration = (60 / tempo) * 2;
  let scheduledTime = context.currentTime;

  chords.forEach(chord => {
    const notes = parseChordToMidi(chord.name);
    if (notes.length > 0) {
        playNotes(notes, chordDuration, scheduledTime);
    }
    scheduledTime += chordDuration;
  });

  // Notificar que la reproducción ha terminado
  const totalDuration = scheduledTime - context.currentTime;
  setTimeout(onEnd, totalDuration * 1000);
};