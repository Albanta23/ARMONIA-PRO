import React, { memo } from 'react';

interface OptimizedWrapperProps {
  children: React.ReactNode;
  deps?: Array<any>;
}

export const OptimizedWrapper = memo<OptimizedWrapperProps>(
  ({ children }) => <>{children}</>,
  (prevProps, nextProps) => {
    // Comparación shallow personalizada para evitar re-renders innecesarios
    if (prevProps.deps && nextProps.deps) {
      return prevProps.deps.every((dep, index) => dep === nextProps.deps![index]);
    }
    return false;
  }
);

OptimizedWrapper.displayName = 'OptimizedWrapper';
