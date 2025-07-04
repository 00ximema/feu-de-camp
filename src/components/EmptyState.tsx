
import React from 'react';

interface EmptyStateProps {
  text?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  text = "Non renseigné", 
  className = "" 
}) => {
  return (
    <span className={`text-gray-500 font-normal ${className}`}>
      {text}
    </span>
  );
};

export default EmptyState;
