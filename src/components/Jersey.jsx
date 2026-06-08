import React from 'react';

const Jersey = ({ primaryColour, secondaryColour, number, size = 'md' }) => {
  // Size configurations
  const sizes = {
    sm: { width: 40, height: 48, fontSize: 12 },
    md: { width: 64, height: 76, fontSize: 18 },
    lg: { width: 96, height: 112, fontSize: 24 }
  };

  const { width, height, fontSize } = sizes[size] || sizes.md;

  // Determine text colour based on secondary colour brightness
  const getTextColor = (colour) => {
    const hex = colour.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const textColor = getTextColor(secondaryColour);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Jersey body - primary colour */}
      <path
        d="M16 12 L8 20 L8 28 L16 24 L16 68 L48 68 L48 24 L56 28 L56 20 L48 12 L40 8 L24 8 L16 12 Z"
        fill={primaryColour}
      />
      
      {/* Collar - secondary colour */}
      <path
        d="M24 8 L28 4 L36 4 L40 8 L32 12 L24 8 Z"
        fill={secondaryColour}
      />
      
      {/* Left sleeve trim - secondary colour */}
      <path
        d="M8 20 L12 18 L16 20 L16 24 L12 22 L8 24 Z"
        fill={secondaryColour}
      />
      
      {/* Right sleeve trim - secondary colour */}
      <path
        d="M56 20 L52 18 L48 20 L48 24 L52 22 L56 24 Z"
        fill={secondaryColour}
      />
      
      {/* Left side panel - secondary colour */}
      <path
        d="M16 24 L20 22 L20 68 L16 68 Z"
        fill={secondaryColour}
      />
      
      {/* Right side panel - secondary colour */}
      <path
        d="M48 24 L44 22 L44 68 L48 68 Z"
        fill={secondaryColour}
      />
      
      {/* Number */}
      {number != null && !isNaN(number) && (
        <text
          x="32"
          y="42"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
        >
          {number}
        </text>
      )}
    </svg>
  );
};

export default Jersey;
