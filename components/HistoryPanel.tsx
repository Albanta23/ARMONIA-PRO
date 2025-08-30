import React from 'react';
import { Card } from './Card';
import { GeneratedAnalysis } from '../types';

interface HistoryPanelProps {
  history: GeneratedAnalysis[];
  onLoad: (item: GeneratedAnalysis) => void;
  onClear: () => void;
  disabled: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onClear, disabled }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <Card 
      title="Historial de Generaciones"
      actions={
        <button 
          onClick={onClear}
          disabled={disabled}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          Limpiar Historial
        </button>
      }
    >
      <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onLoad(item)}
            disabled={disabled}
            className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
              {item.params.key} {item.params.mode} - {item.params.style}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.progression.map(c => c.name).join(' - ')}
            </p>
          </button>
        ))}
      </div>
    </Card>
  );
};
