import React from 'react';

interface UwuIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  variant?: 'default' | 'black' | 'white';
  useImage?: boolean; // New prop to use the PNG image instead of SVG
}

const UwuIcon: React.FC<UwuIconProps> = ({ 
  size = 24, 
  variant = 'default',
  useImage = false, // Default to false to maintain backward compatibility
  className = '',
  ...props 
}) => {
  // If useImage is true, render the PNG image
  if (useImage) {
    return (
      <img
        src="/uwu icon large pink.png"
        alt="UwUverse.ai Logo"
        width={size}
        height={size}
        className={`${className}`}
        style={{ 
          width: size, 
          height: size,
          objectFit: 'contain'
        }}
        {...props}
      />
    );
  }

  // Original SVG fallback
  const getColorClass = () => {
    switch (variant) {
      case 'black':
        return 'text-black';
      case 'white':
        return 'text-white';
      default:
        return 'text-pink-400';
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${getColorClass()} ${className}`}
      {...props}
    >
      {/* Heart shape */}
      <path 
        d="M100 180C100 180 20 120 20 70C20 45 40 25 65 25C80 25 90 35 100 45C110 35 120 25 135 25C160 25 180 45 180 70C180 120 100 180 100 180Z" 
        fill="white" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinejoin="round"
      />
      
      {/* UwU text */}
      <g fill="currentColor">
        {/* First U */}
        <path 
          d="M45 80 L45 100 Q45 110 55 110 Q65 110 65 100 L65 80" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round" 
          fill="none"
        />
        
        {/* w */}
        <path 
          d="M80 85 L85 105 L90 95 L95 105 L100 85" 
          stroke="currentColor" 
          strokeWidth="5" 
          strokeLinecap="round" 
          fill="none"
        />
        
        {/* Second U */}
        <path 
          d="M115 80 L115 100 Q115 110 125 110 Q135 110 135 100 L135 80" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round" 
          fill="none"
        />
      </g>
      
      {/* Fallback text for accessibility */}
      <title>💖</title>
    </svg>
  );
};

export default UwuIcon;