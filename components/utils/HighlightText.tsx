
import React from 'react';
import { HighlightRule } from '../../constants/highlights';

interface HighlightTextProps {
  text: string;
  highlights: HighlightRule[];
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, highlights = [] }) => {
  if (!highlights.length || !text) {
    return <>{text}</>;
  }

  // Escape special regex characters from words
  const escapedWords = highlights.map(h => h.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const match = highlights.find(h => h.word.toLowerCase() === part.toLowerCase());
        if (match) {
          const style: React.CSSProperties = {};
          const classes = `font-bold text-${match.color}-400`;

          if (match.glow) {
            style.animation = `glow-text-${match.color} 1.5s ease-in-out infinite alternate`;
          }

          return (
            <span key={i} className={classes} style={style}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default HighlightText;
