/**
 * audioService.ts
 * 
 * Este servicio encapsula toda la lógica para la síntesis de audio en el navegador
 * utilizando la Web Audio API. Permite reproducir acordes individuales o progresiones
 * completas a partir de su cifrado americano, emulando un piano de cola de alta calidad.
 */

// Se usan instancias únicas de AudioContext y efectos para mejorar el rendimiento.
let audioContext: AudioContext;
let reverbNode: AudioNode;

/**
 * Crea una reverberación por convolución utilizando una respuesta de impulso generada
 * sintéticamente. Esto evita la necesidad de cargar archivos de audio externos y proporciona
 * una acústica de sala realista.
 * @param context El AudioContext de la Web Audio API.
 * @returns Un AudioNode (ConvolverNode) que aplica el efecto de reverberación.
 */
const createReverb = (context: AudioContext): AudioNode => {
    const convolver = context.createConvolver();
    
    // Generar una respuesta de impulso sintética (ruido blanco con decaimiento exponencial).
    const sampleRate = context.sampleRate;
    const duration = 1.5;
    const decay = 2.5;
    const impulseLength = sampleRate * duration;
    const impulse = context.createBuffer(2, impulseLength, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < impulseLength; i++) {
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, decay);
    }

    convolver.buffer = impulse;
    return convolver;
};

const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear y conectar el bus de reverberación global.
      reverbNode = createReverb(audioContext);
      const reverbGain = audioContext.createGain();
      reverbGain.gain.value = 0.4; // Nivel de "humedad" de la reverberación.
      reverbNode.connect(reverbGain);
      reverbGain.connect(audioContext.destination);

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

const midiToFrequency = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

const parseChordToMidi = (chordName: string): number[] => {
  const cleanChordName = chordName.split('/')[0];
  const rootMatch = cleanChordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];

  const rootName = rootMatch[1];
  const baseMidiNote = NOTE_TO_MIDI[rootName] + 60;
  let remaining = cleanChordName.substring(rootName.length);
  
  const intervals = new Set<number>([0]);

  const alterations = new Set<string>();
  remaining = remaining.replace(/\((.*?)\)/g, (_, group) => {
      group.match(/[#b]?\d+/g)?.forEach((alt: string) => alterations.add(alt));
      return '';
  });
  
  if (remaining.startsWith('maj13') || remaining.startsWith('M13')) {
    intervals.add(4).add(7).add(11).add(14).add(21);
  } else if (remaining.startsWith('m13')) {
    intervals.add(3).add(7).add(10).add(14).add(21);
  } else if (remaining.startsWith('13')) {
    intervals.add(4).add(7).add(10).add(14).add(21);
  } else if (remaining.startsWith('m11')) {
    intervals.add(3).add(7).add(10).add(17);
  } else if (remaining.startsWith('maj9') || remaining.startsWith('M9')) {
    intervals.add(4).add(7).add(11).add(14);
  } else if (remaining.startsWith('m9')) {
    intervals.add(3).add(7).add(10).add(14);
  } else if (remaining.startsWith('9')) {
    intervals.add(4).add(7).add(10).add(14);
  } else if (remaining.startsWith('m7b5') || remaining.startsWith('ø')) {
      intervals.add(3).add(6).add(10);
  } else if (remaining.startsWith('maj7') || remaining.startsWith('M7') || remaining.startsWith('Δ')) {
      intervals.add(4).add(7).add(11);
  } else if (remaining.startsWith('m7')) {
      intervals.add(3).add(7).add(10);
  } else if (remaining.startsWith('7sus4')) {
      intervals.add(5).add(7).add(10);
  } else if (remaining.startsWith('dim7') || remaining.startsWith('°7')) {
      intervals.add(3).add(6).add(9);
  } else if (remaining.startsWith('7')) {
      intervals.add(4).add(7).add(10);
  } else if (remaining.startsWith('dim') || remaining.startsWith('°')) {
      intervals.add(3).add(6);
  } else if (remaining.startsWith('m')) {
      intervals.add(3).add(7);
  } else if (remaining.startsWith('sus4')) {
      intervals.add(5).add(7);
  } else if (remaining.startsWith('sus2')) {
      intervals.add(2).add(7);
  } else {
      intervals.add(4).add(7);
  }
  
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

/**
 * Crea y reproduce una nota con un timbre de piano de cola de alta calidad.
 * @param context El AudioContext de la Web Audio API.
 * @param midiNote El número de nota MIDI a reproducir.
 * @param startTime El tiempo (del AudioContext) en el que debe empezar la nota.
 * @param duration La duración total de la nota en segundos.
 * @param destination El AudioNode de destino para la señal "seca" (sin reverberación).
 */
const createGrandPianoNote = (context: AudioContext, midiNote: number, startTime: number, duration: number, destination: AudioNode) => {
    const fundamentalFrequency = midiToFrequency(midiNote);

    const harmonics = [
        { wave: 'sine',     mul: 1, gain: 1.0 },
        { wave: 'triangle', mul: 2, gain: 0.6 },
        { wave: 'sine',     mul: 3, gain: 0.3 },
        { wave: 'sine',     mul: 4, gain: 0.25 },
        { wave: 'triangle', mul: 5, gain: 0.1 },
        { wave: 'sine',     mul: 6, gain: 0.08 },
        { wave: 'sine',     mul: 8, gain: 0.04 },
    ];
    
    const noteADSR = context.createGain();
    noteADSR.connect(destination);
    noteADSR.connect(reverbNode);

    const now = startTime;
    const attackTime = 0.01;
    const decayTime = duration * 0.2;
    const sustainLevel = 0.3;
    const releaseTime = duration * 0.79;
    const totalDuration = attackTime + decayTime + releaseTime;
    
    noteADSR.gain.setValueAtTime(0, now);
    noteADSR.gain.linearRampToValueAtTime(1.0, now + attackTime);
    noteADSR.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    noteADSR.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    [-0.5, 0.5].forEach((panValue, index) => {
        const panner = context.createStereoPanner();
        panner.pan.value = panValue;
        panner.connect(noteADSR);

        const detuneValue = (index === 0) ? -3 : 3;

        // Ataque percusivo con onda de sierra para simular el martillo.
        const attackOsc = context.createOscillator();
        const attackGain = context.createGain();
        attackOsc.type = 'sawtooth';
        attackOsc.frequency.value = fundamentalFrequency;
        attackOsc.detune.value = detuneValue;
        attackOsc.connect(attackGain);
        attackGain.connect(panner);
        attackGain.gain.setValueAtTime(0.3, now);
        attackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        attackOsc.start(now);
        attackOsc.stop(now + 0.15);

        // Cuerpo sostenido de la nota con la serie armónica.
        harmonics.forEach(harmonic => {
            const osc = context.createOscillator();
            const gainNode = context.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(panner);

            osc.type = harmonic.wave as OscillatorType;
            osc.frequency.value = fundamentalFrequency * harmonic.mul;
            osc.detune.value = detuneValue;
            gainNode.gain.value = harmonic.gain;

            osc.start(now);
            osc.stop(now + totalDuration + 0.1);
        });
    });
};

/**
 * Orquesta la reproducción de un conjunto de notas (un acorde).
 * @param notes Array de números de nota MIDI para el acorde.
 * @param duration Duración del acorde en segundos.
 * @param startTime Tiempo de inicio (del AudioContext).
 */
const playNotes = (notes: number[], duration: number, startTime: number) => {
    const context = getAudioContext();

    const chordDryGain = context.createGain();
    chordDryGain.connect(context.destination);
    
    // Atenúa el volumen basado en la densidad del acorde para prevenir distorsión.
    chordDryGain.gain.value = 0.8 / Math.pow(notes.length, 0.6);

    notes.forEach(midiNote => {
        createGrandPianoNote(context, midiNote, startTime, duration, chordDryGain);
    });
};

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

export const playProgression = async (
    chords: { name: string }[],
    tempo: number,
    onEnd: () => void
) => {
  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }
  
  const chordDuration = (60 / tempo) * 2;
  let scheduledTime = context.currentTime;

  chords.forEach(chord => {
    const notes = parseChordToMidi(chord.name);
    if (notes.length > 0) {
        playNotes(notes, chordDuration, scheduledTime);
    }
    scheduledTime += chordDuration;
  });

  const totalDuration = scheduledTime - context.currentTime;
  setTimeout(onEnd, totalDuration * 1000);
};
