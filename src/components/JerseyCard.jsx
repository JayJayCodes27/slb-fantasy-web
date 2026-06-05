import React from 'react';

const JerseyCard = ({ playerName, position, teamColour, number, points, showRank, rank, showCaptain, isCaptain, isViceCaptain }) => {
  const displayNumber = number || position;

  return (
    <div className="card p-4 text-center cursor-pointer hover:bg-card-hover transition-colors relative">
      {showRank && rank && (
        <div className="absolute top-2 left-2 text-orange font-bebas text-2xl font-bold">#{rank}</div>
      )}
      <div className="flex flex-col items-center">
        {/* Jersey SVG Silhouette */}
        <svg width="80" height="90" viewBox="0 0 80 90" className="mb-3">
          {/* Jersey body */}
          <path
            d="M 10 20 L 20 10 L 35 10 L 40 25 L 45 10 L 60 10 L 70 20 L 65 35 L 70 85 L 10 85 L 15 35 Z"
            fill={teamColour}
            stroke="white"
            strokeWidth="1"
          />
          {/* Jersey number */}
          <text
            x="40"
            y="55"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="bold"
            fontFamily="Bebas Neue, sans-serif"
          >
            {displayNumber}
          </text>
        </svg>
        
        {/* Player name */}
        <p className="text-white font-semibold text-sm mb-1">{playerName}</p>
        
        {/* Points */}
        {points !== null && points !== undefined && (
          <p className="text-orange font-bebas text-xl font-bold">{points} pts</p>
        )}
        
        {/* Position badge */}
        {position && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded-full text-xs font-semibold text-white">
            {position}
          </span>
        )}
        
        {/* Captain/Vice Captain badges */}
        {showCaptain && (isCaptain || isViceCaptain) && (
          <div className="mt-2">
            {isCaptain && (
              <span className="inline-block px-2 py-0.5 bg-orange text-white text-xs rounded-full font-bold">C</span>
            )}
            {isViceCaptain && !isCaptain && (
              <span className="inline-block px-2 py-0.5 bg-orange text-white text-xs rounded-full font-bold">V</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JerseyCard;
