import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Note {
  id: string;
  pitch: string;
  octave: number;
  accidental?: 'sharp' | 'flat' | 'natural';
  position: { x: number; y: number };
  staffPosition: number; // Posición en el pentagrama (0 = línea superior, etc.)
}

interface InteractiveStaffProps {
  width?: number;
  height?: number;
  keySignature?: string;
  timeSignature?: string;
  clef?: 'treble' | 'bass';
  notes: Note[];
  onNotesChange: (notes: Note[]) => void;
  selectedNote: string;
  selectedAccidental: 'sharp' | 'flat' | 'natural';
  selectedOctave: number;
  className?: string;
}

// Mapeo de posiciones del pentagrama a notas (clave de sol)
const TREBLE_CLEF_POSITIONS: Record<string, { pitch: string; octave: number }> = {
  // Líneas del pentagrama (de arriba a abajo)
  '0': { pitch: 'F', octave: 5 }, // Línea superior
  '1': { pitch: 'D', octave: 5 }, // Línea 2
  '2': { pitch: 'B', octave: 4 }, // Línea 3 (central)
  '3': { pitch: 'G', octave: 4 }, // Línea 4
  '4': { pitch: 'E', octave: 4 }, // Línea inferior
  
  // Espacios (de arriba a abajo)
  '0.5': { pitch: 'E', octave: 5 }, // Espacio superior
  '1.5': { pitch: 'C', octave: 5 }, // Espacio 2
  '2.5': { pitch: 'A', octave: 4 }, // Espacio central
  '3.5': { pitch: 'F', octave: 4 }, // Espacio 4
  
  // Líneas adicionales arriba
  '-1': { pitch: 'A', octave: 5 },
  '-2': { pitch: 'C', octave: 6 },
  '-1.5': { pitch: 'B', octave: 5 },
  '-2.5': { pitch: 'D', octave: 6 },
  
  // Líneas adicionales abajo
  '5': { pitch: 'C', octave: 4 },
  '6': { pitch: 'A', octave: 3 },
  '5.5': { pitch: 'D', octave: 4 },
  '6.5': { pitch: 'B', octave: 3 }
};

export const InteractiveStaff: React.FC<InteractiveStaffProps> = ({
  width = 800,
  height = 200,
  keySignature = 'C',
  timeSignature = '4/4',
  clef = 'treble',
  notes,
  onNotesChange,
  selectedNote,
  selectedAccidental,
  selectedOctave,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Constantes para el dibujo
  const STAFF_START_X = 80;
  const STAFF_END_X = width - 40;
  const STAFF_START_Y = 40;
  const STAFF_SPACING = 15; // Espacio entre líneas del pentagrama
  const NOTE_RADIUS = 8;

  // Dibujar el pentagrama y las notas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Dibujar líneas del pentagrama
    for (let i = 0; i < 5; i++) {
      const y = STAFF_START_Y + (i * STAFF_SPACING);
      ctx.beginPath();
      ctx.moveTo(STAFF_START_X, y);
      ctx.lineTo(STAFF_END_X, y);
      ctx.stroke();
    }

    // Dibujar clave de sol (simplificada)
    ctx.font = '40px serif';
    ctx.fillText('𝄞', STAFF_START_X - 50, STAFF_START_Y + 45);

    // Dibujar compás
    ctx.font = '16px Arial';
    ctx.fillText('4', STAFF_START_X - 20, STAFF_START_Y - 5);
    ctx.fillText('4', STAFF_START_X - 20, STAFF_START_Y + 15);

    // Dibujar líneas de compás
    ctx.beginPath();
    ctx.moveTo(STAFF_START_X, STAFF_START_Y - 10);
    ctx.lineTo(STAFF_START_X, STAFF_START_Y + (4 * STAFF_SPACING) + 10);
    ctx.stroke();

    // Dibujar notas
    notes.forEach(note => {
      drawNote(ctx, note);
    });

    // Dibujar nota siendo arrastrada
    if (draggedNote) {
      drawNote(ctx, draggedNote, true);
    }
  }, [notes, draggedNote, width, height]);

  // Dibujar una nota individual
  const drawNote = (ctx: CanvasRenderingContext2D, note: Note, isDragged: boolean = false) => {
    const x = note.position.x;
    const y = note.position.y;
    
    // Color de la nota
    ctx.fillStyle = isDragged ? '#ff6b6b' : '#000';
    ctx.strokeStyle = isDragged ? '#ff6b6b' : '#000';

    // Dibujar cabeza de nota (óvalo)
    ctx.beginPath();
    ctx.ellipse(x, y, NOTE_RADIUS, NOTE_RADIUS * 0.8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar plica (stem)
    ctx.beginPath();
    ctx.moveTo(x + NOTE_RADIUS - 1, y);
    ctx.lineTo(x + NOTE_RADIUS - 1, y - 30);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;

    // Dibujar alteración si la hay
    if (note.accidental && note.accidental !== 'natural') {
      ctx.font = '16px Arial';
      const symbol = note.accidental === 'sharp' ? '♯' : '♭';
      ctx.fillText(symbol, x - 20, y + 5);
    }

    // Dibujar líneas adicionales si es necesario
    const staffPos = note.staffPosition;
    if (staffPos < 0 || staffPos > 4) {
      drawLedgerLines(ctx, x, y, staffPos);
    }
  };

  // Dibujar líneas adicionales
  const drawLedgerLines = (ctx: CanvasRenderingContext2D, x: number, y: number, staffPos: number) => {
    const lineLength = 25;
    
    if (staffPos < 0) {
      // Líneas adicionales arriba
      for (let i = -1; i >= staffPos; i--) {
        if (i % 1 === 0) { // Solo líneas, no espacios
          const lineY = STAFF_START_Y + (i * STAFF_SPACING);
          ctx.beginPath();
          ctx.moveTo(x - lineLength / 2, lineY);
          ctx.lineTo(x + lineLength / 2, lineY);
          ctx.stroke();
        }
      }
    } else if (staffPos > 4) {
      // Líneas adicionales abajo
      for (let i = 5; i <= staffPos; i++) {
        if (i % 1 === 0) { // Solo líneas, no espacios
          const lineY = STAFF_START_Y + (i * STAFF_SPACING);
          ctx.beginPath();
          ctx.moveTo(x - lineLength / 2, lineY);
          ctx.lineTo(x + lineLength / 2, lineY);
          ctx.stroke();
        }
      }
    }
  };

  // Convertir posición Y a posición en el pentagrama
  const yToStaffPosition = (y: number): number => {
    const relativeY = y - STAFF_START_Y;
    return relativeY / (STAFF_SPACING / 2); // Cada media línea
  };

  // Convertir posición del pentagrama a Y
  const staffPositionToY = (staffPos: number): number => {
    return STAFF_START_Y + (staffPos * (STAFF_SPACING / 2));
  };

  // Obtener información de nota basada en posición del pentagrama
  const getNoteFromStaffPosition = (staffPos: number) => {
    const roundedPos = Math.round(staffPos * 2) / 2; // Redondear a medias posiciones
    const key = roundedPos.toString();
    return TREBLE_CLEF_POSITIONS[key] || { pitch: 'C', octave: 4 };
  };

  // Manejar clic en el pentagrama
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Verificar si está dentro del área del pentagrama
    if (x < STAFF_START_X || x > STAFF_END_X) return;

    const staffPos = yToStaffPosition(y);
    const snappedY = staffPositionToY(Math.round(staffPos * 2) / 2);
    const noteInfo = getNoteFromStaffPosition(staffPos);

    // Crear nueva nota
    const newNote: Note = {
      id: `note-${Date.now()}`,
      pitch: selectedNote,
      octave: selectedOctave,
      accidental: selectedAccidental,
      position: { x, y: snappedY },
      staffPosition: Math.round(staffPos * 2) / 2
    };

    onNotesChange([...notes, newNote]);
  };

  // Manejar inicio de arrastre
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Buscar nota bajo el cursor
    const clickedNote = notes.find(note => {
      const dx = x - note.position.x;
      const dy = y - note.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= NOTE_RADIUS + 5;
    });

    if (clickedNote) {
      setDraggedNote(clickedNote);
      setDragOffset({
        x: x - clickedNote.position.x,
        y: y - clickedNote.position.y
      });
      
      // Remover la nota de la lista mientras se arrastra
      onNotesChange(notes.filter(n => n.id !== clickedNote.id));
    }
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNote) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Ajustar a líneas del pentagrama
    const staffPos = yToStaffPosition(y);
    const snappedY = staffPositionToY(Math.round(staffPos * 2) / 2);

    setDraggedNote({
      ...draggedNote,
      position: { x, y: snappedY },
      staffPosition: Math.round(staffPos * 2) / 2
    });
  };

  // Finalizar arrastre
  const handleMouseUp = () => {
    if (draggedNote) {
      onNotesChange([...notes, draggedNote]);
      setDraggedNote(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Doble clic para eliminar nota
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Buscar nota bajo el cursor
    const clickedNote = notes.find(note => {
      const dx = x - note.position.x;
      const dy = y - note.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= NOTE_RADIUS + 5;
    });

    if (clickedNote) {
      onNotesChange(notes.filter(n => n.id !== clickedNote.id));
    }
  };

  // Actualizar canvas cuando cambien las notas
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-50 ${className}`}>
      <div className="mb-4">
        <h4 className="text-lg font-medium mb-2">Pentagrama Interactivo</h4>
        <div className="text-sm text-gray-600 dark:text-gray-500 space-y-1">
          <p>• <strong>Clic simple:</strong> Colocar nota ({selectedNote}{selectedAccidental !== 'natural' ? (selectedAccidental === 'sharp' ? '♯' : '♭') : ''}{selectedOctave})</p>
          <p>• <strong>Arrastrar:</strong> Mover nota existente</p>
          <p>• <strong>Doble clic:</strong> Eliminar nota</p>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="cursor-crosshair border border-gray-200 dark:border-gray-400 rounded"
        style={{ backgroundColor: '#fefefe' }}
      />
      
      {notes.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-100 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Notas colocadas ({notes.length}):</h5>
          <div className="flex flex-wrap gap-2">
            {notes.map((note, index) => {
              const staffInfo = getNoteFromStaffPosition(note.staffPosition);
              return (
                <span
                  key={note.id}
                  className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm font-mono"
                >
                  {staffInfo.pitch}
                  {note.accidental !== 'natural' && (note.accidental === 'sharp' ? '♯' : '♭')}
                  <sub>{staffInfo.octave}</sub>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
