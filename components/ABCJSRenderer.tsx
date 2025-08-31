import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import ABCJS from 'abcjs';

interface ABCJSRendererProps {
  abcNotation: string;
  onError?: (error: Error) => void;
}

export interface ABCJSRendererHandle {
  forceUpdate: () => void;
  cleanup: () => void;
}

export const ABCJSRenderer = forwardRef<ABCJSRendererHandle, ABCJSRendererProps>(
  ({ abcNotation, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const abcInstanceRef = useRef<any>(null);
    const isCleaningRef = useRef(false);

    const cleanup = useCallback(() => {
      if (isCleaningRef.current) return;
      isCleaningRef.current = true;

      try {
        if (containerRef.current) {
          // Usar una estrategia más agresiva para limpiar
          const container = containerRef.current;
          
          // Desconectar el contenedor del DOM temporalmente para evitar conflictos
          const parent = container.parentNode;
          const nextSibling = container.nextSibling;
          
          if (parent) {
            parent.removeChild(container);
            
            // Limpiar completamente el contenedor
            container.innerHTML = '';
            
            // Volver a conectar el contenedor limpio
            if (nextSibling) {
              parent.insertBefore(container, nextSibling);
            } else {
              parent.appendChild(container);
            }
          } else {
            // Si no tiene padre, solo limpiar el contenido
            container.innerHTML = '';
          }
        }
        abcInstanceRef.current = null;
      } catch (error) {
        console.debug('Cleanup completed with minor issues:', error);
      } finally {
        isCleaningRef.current = false;
      }
    }, []);

    const renderABC = useCallback(() => {
      if (!containerRef.current || isCleaningRef.current) return;

      try {
        // Limpiar renderizado anterior
        cleanup();

        if (!containerRef.current) return;

        // Crear un elemento de renderizado único
        const renderElement = document.createElement('div');
        renderElement.className = 'abcjs-container';
        renderElement.style.cssText = 'width: 100%; height: auto; overflow: visible;';
        
        containerRef.current.appendChild(renderElement);

        // Renderizar con ABCJS
        abcInstanceRef.current = ABCJS.renderAbc(renderElement, abcNotation, {
          responsive: 'resize',
          paddingleft: 10,
          paddingright: 10,
          paddingtop: 10,
          paddingbottom: 10,
          staffwidth: 400,
          add_classes: true,
          scale: 1.0
        });

      } catch (error) {
        console.error('Error rendering ABC:', error);
        if (onError) {
          onError(error as Error);
        }
        
        // Mostrar mensaje de error sin usar React
        if (containerRef.current && !isCleaningRef.current) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'text-red-500 p-4 bg-red-50 rounded border border-red-200';
          errorDiv.textContent = 'Error al renderizar la notación musical';
          containerRef.current.appendChild(errorDiv);
        }
      }
    }, [abcNotation, cleanup, onError]);

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      forceUpdate: renderABC,
      cleanup: cleanup
    }), [renderABC, cleanup]);

    // Efecto para renderizar cuando cambie la notación
    useEffect(() => {
      const timeoutId = setTimeout(renderABC, 10);
      return () => clearTimeout(timeoutId);
    }, [renderABC]);

    // Limpieza al desmontar
    useEffect(() => {
      return () => {
        cleanup();
      };
    }, [cleanup]);

    return (
      <div 
        ref={containerRef}
        className="abcjs-wrapper w-full min-h-[150px]"
        style={{ 
          position: 'relative', 
          isolation: 'isolate',
          containIntrinsicSize: 'none'
        }}
      />
    );
  }
);

ABCJSRenderer.displayName = 'ABCJSRenderer';
