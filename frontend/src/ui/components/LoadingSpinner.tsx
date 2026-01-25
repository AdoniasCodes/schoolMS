import React from 'react';

type Size = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: Size;
  className?: string;
}

const sizeMap = {
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizePx = sizeMap[size];
  
  return (
    <div 
      className={`spinner ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        border: `2px solid var(--border)`,
        borderTop: `2px solid var(--primary)`,
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 1s linear infinite',
        flexShrink: 0,
      }}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
};

// Add to global styles if not already present
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
