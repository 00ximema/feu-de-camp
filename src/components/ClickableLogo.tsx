
import React from 'react';

const ClickableLogo = ({ className = "" }: { className?: string }) => {
  const handleLogoClick = () => {
    window.open('https://fondationmg.fr/', '_blank');
  };

  return (
    <div 
      onClick={handleLogoClick}
      className={`cursor-pointer transition-opacity hover:opacity-80 ${className}`}
      title="Visiter fondationmg.fr"
    >
      {/* Vous pouvez remplacer ce texte par votre logo */}
      <div className="bg-purple-600 text-white px-3 py-2 rounded font-bold text-lg">
        MG
      </div>
    </div>
  );
};

export default ClickableLogo;
