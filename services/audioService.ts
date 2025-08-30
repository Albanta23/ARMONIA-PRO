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
 * Cubre acordes comunes, extensiones (9, 11, 13), alteraciones (b9, #11),
 * acordes suspendidos (sus4, sus2) y disminuidos.
 * @param chordName - El cifrado del acorde (ej. "Am7", "G7(b9)", "C#m7b5").
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
  
  // Almacenamos los intervalos relativos a la tónica en semitonos
  const intervals = new Set<number>([0]); // La tónica siempre está presente

  // --- 1. Extraer Alteraciones entre paréntesis ---
  const alterations = new Set<string>();
  remaining = remaining.replace(/\((.*?)\)/g, (_, group) => {
      // Busca alteraciones como b9, #11, +5, etc.
      group.match(/[#b]?\d+/g)?.forEach((alt: string) => alterations.add(alt));
      return ''; // Elimina el paréntesis del string principal para el análisis de cualidad
  });
  
  // --- 2. Determinar la cualidad del Acorde (tríada y séptima) ---
  // El orden de chequeo es importante, de más específico a más general para evitar falsos positivos.
  
  // Acordes de 13ava
  if (remaining.startsWith('maj13') || remaining.startsWith('M13')) {
    intervals.add(4).add(7).add(11).add(14).add(21);
  } else if (remaining.startsWith('m13')) {
    intervals.add(3).add(7).add(10).add(14).add(21);
  } else if (remaining.startsWith('13')) {
    intervals.add(4).add(7).add(10).add(14).add(21);
  }
  // Acordes de 11ava
  else if (remaining.startsWith('m11')) {
    intervals.add(3).add(7).add(10).add(17);
  }
  // Acordes de 9na
  else if (remaining.startsWith('maj9') || remaining.startsWith('M9')) {
    intervals.add(4).add(7).add(11).add(14);
  } else if (remaining.startsWith('m9')) {
    intervals.add(3).add(7).add(10).add(14);
  } else if (remaining.startsWith('9')) {
    intervals.add(4).add(7).add(10).add(14);
  }
  // Acordes de 7ma
  else if (remaining.startsWith('m7b5') || remaining.startsWith('ø')) { // Semidisminuido
      intervals.add(3).add(6).add(10);
  } else if (remaining.startsWith('maj7') || remaining.startsWith('M7') || remaining.startsWith('Δ')) {
      intervals.add(4).add(7).add(11);
  } else if (remaining.startsWith('m7')) {
      intervals.add(3).add(7).add(10);
  } else if (remaining.startsWith('7sus4')) {
      intervals.add(5).add(7).add(10);
  } else if (remaining.startsWith('dim7') || remaining.startsWith('°7')) { // Disminuido
      intervals.add(3).add(6).add(9);
  } else if (remaining.startsWith('7')) { // Dominante
      intervals.add(4).add(7).add(10);
  }
  // Tríadas
  else if (remaining.startsWith('dim') || remaining.startsWith('°')) {
      intervals.add(3).add(6);
  } else if (remaining.startsWith('m')) { // Menor
      intervals.add(3).add(7);
  } else if (remaining.startsWith('sus4')) {
      intervals.add(5).add(7);
  } else if (remaining.startsWith('sus2')) {
      intervals.add(2).add(7);
  } else { // Mayor por defecto
      intervals.add(4).add(7);
  }
  
  // --- 3. Aplicar Alteraciones ---
  // Esto permite anular o añadir notas a la cualidad base.
  alterations.forEach(alt => {
      if (alt === 'b5') { intervals.delete(7); intervals.add(6); }
      if (alt === '#5' || alt === '+5') { intervals.delete(7); intervals.add(8); }
      if (alt === 'b9') { intervals.delete(14); intervals.add(13); }
      if (alt === '#9') { intervals.delete(14); intervals.add(15); }
      if (alt === '#11') { intervals.delete(17); intervals.add(18); }
      if (alt === 'b13') { intervals.delete(21); intervals.add(20); }
  });

  const sortedIntervals = Array.from(intervals).sort((a, b) => a - b);
  return sortedIntervals.map(interval => baseMidiNote + interval);
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
