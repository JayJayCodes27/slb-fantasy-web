import React from 'react';

const JerseyCard = ({ playerName, position, teamColour, number, points, showRank, rank, showCaptain, isCaptain, isViceCaptain }) => {
  const displayNumber = number || position;

  return (
    <div className="card p-4 text-center cursor-pointer hover:bg-[#1a1a1a] transition-colors relative">
      {showRank && rank && (
        <div className="absolute top-2 left-2 text-white font-bold text-xl">{rank}</div>
      )}
      <div className="flex flex-col items-center">
        {/* Jersey SVG Silhouette - proper basketball jersey shape */}
        <svg width="90" height="100" viewBox="0 0 90 100" className="mb-3">
          {/* Jersey body - wide shoulders, tapered sides, short sleeves */}
          <path
            d="M10 10 L80 10 L85 25 L75 35 L70 35 L70 95 L20 95 L20 35 L15 35 L5 25 Z"
            fill={teamColour}
          />
          {/* Jersey number */}
          <text
            x="45"
            y="60"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
          >
            {displayNumber}
          </text>
        </svg>
        
        {/* Player name */}
        <p className="text-white font-bold text-sm mb-1">{playerName}</p>
        
        {/* Points */}
        {points !== null && points !== undefined && (
          <p className="text-[#FF6B00] font-bold text-xs uppercase">{points} PTS</p>
        )}
        
        {/* Position badge */}
        {position && (
          <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center mt-2">
            <span className="text-white text-[10px] font-bold">{position}</span>
          </div>
        )}
        
        {/* Captain/Vice Captain badges */}
        {showCaptain && (isCaptain || isViceCaptain) && (
          <div className="absolute top-2 right-2">
            {isCaptain && (
              <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">C</span>
              </div>
            )}
            {isViceCaptain && !isCaptain && (
              <div className="w-5 h-5 rounded-full bg-[#666666] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">V</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JerseyCard;
