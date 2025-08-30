

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  // FIX: Add optional id prop to allow passing it to the underlying div for DOM manipulation.
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title, actions, id }) => {
  return (
    <div id={id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl ${className}`}>
      {title && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
