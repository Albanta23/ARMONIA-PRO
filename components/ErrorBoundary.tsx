import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // UI de fallback personalizada
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
              Oops! Algo salió mal
            </h2>
            <p className="text-red-600 dark:text-red-400 text-center mb-4">
              Ha ocurrido un error inesperado en esta sección.
            </p>
            {this.state.error && (
              <details className="w-full max-w-lg">
                <summary className="cursor-pointer text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100">
                  Ver detalles del error
                </summary>
                <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-200 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Recargar página
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
