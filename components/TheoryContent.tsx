import React from 'react';
import { marked } from 'marked';
import { MusicalExample } from './MusicalExample';

interface TheoryContentProps {
  content: string;
}

export const TheoryContent: React.FC<TheoryContentProps> = ({ content }) => {
  // Parsear el contenido y extraer ejemplos ABC
  const parseContent = (rawContent: string) => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    
    // Buscar patrones [abc]...[/abc]
    const abcRegex = /\[abc\]([\s\S]*?)\[\/abc\]/g;
    let match;
    let partIndex = 0;

    while ((match = abcRegex.exec(rawContent)) !== null) {
      const beforeText = rawContent.slice(lastIndex, match.index);
      
      // Agregar el contenido antes del ABC como HTML
      if (beforeText.trim()) {
        parts.push(
          <div 
            key={`text-${partIndex}`}
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(beforeText) }} 
          />
        );
      }

      // Agregar el ejemplo musical como componente
      const abcContent = match[1];
      const exampleId = `example-${Date.now()}-${partIndex}`;
      
      parts.push(
        <MusicalExample 
          key={`abc-${partIndex}`}
          abcContent={abcContent} 
          exampleId={exampleId}
        />
      );

      lastIndex = match.index + match[0].length;
      partIndex++;
    }

    // Agregar el contenido restante después del último ABC
    const remainingText = rawContent.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push(
        <div 
          key={`text-final`}
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: marked(remainingText) }} 
        />
      );
    }

    // Si no hay ejemplos ABC, renderizar todo como markdown normal
    if (parts.length === 0) {
      parts.push(
        <div 
          key="full-content"
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: marked(rawContent) }} 
        />
      );
    }

    return parts;
  };

  const contentParts = parseContent(content);

  return (
    <div className="theory-content space-y-4">
      {contentParts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
        </React.Fragment>
      ))}
    </div>
  );
};
