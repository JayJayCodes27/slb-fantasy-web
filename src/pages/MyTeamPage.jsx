import React, { useState } from 'react';
import JerseyCard from '../components/JerseyCard';

const MyTeamPage = () => {
  const [view, setView] = useState('court');

  const startingPlayers = [
    { id: 1, name: 'Aaryn Rai', position: 'PG', team: 'LEI', teamColour: '#003366', points: 12, isCaptain: true, isViceCaptain: false },
    { id: 2, name: 'Jordan Hunt', position: 'SG', team: 'LDN', teamColour: '#FF5C00', points: 8, isCaptain: false, isViceCaptain: false },
    { id: 3, name: 'Marcus Webb', position: 'SF', team: 'NEW', teamColour: '#0066CC', points: 6, isCaptain: false, isViceCaptain: false },
    { id: 4, name: 'Tyler James', position: 'PF', team: 'BRI', teamColour: '#FF6600', points: 4, isCaptain: false, isViceCaptain: true },
    { id: 5, name: 'Devon Bell', position: 'C', team: 'CHE', teamColour: '#0066CC', points: 17, isCaptain: false, isViceCaptain: false }
  ];

  const benchPlayers = [
    { id: 6, name: 'Chris Tye', position: 'PG', team: 'SHE', teamColour: '#CC0000', points: 3 },
    { id: 7, name: 'Nate Williams', position: 'SG', team: 'MAN', teamColour: '#000000', points: 9 },
    { id: 8, name: 'Darius King', position: 'SF', team: 'SUR', teamColour: '#9900CC', points: 5 },
    { id: 9, name: 'Liam Foster', position: 'PF', team: 'CAL', teamColour: '#006600', points: 2 },
    { id: 10, name: null, position: null, team: null, teamColour: null, points: null }
  ];

  const chips = [
    { name: 'Wildcard', description: 'Unlimited transfers', color: 'green', remaining: 2 },
    { name: 'Full Rotation', description: 'Rotate entire squad', color: 'blue', remaining: 1 },
    { name: 'Deep Squad', description: 'Extra bench slot', color: 'purple', remaining: 1 },
    { name: 'Franchise Player', description: 'Double points on one player', color: 'orange', remaining: 1 }
  ];

  const allPlayers = [...startingPlayers, ...benchPlayers.filter(p => p.name)];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Page Sub-header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg sm:text-xl uppercase tracking-wide">GAMEWEEK 1</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
            <span className="text-[#22c55e] text-xs">Live</span>
            <span className="text-[#a0a0a0] text-xs">•</span>
            <span className="text-[#a0a0a0] text-xs">5 players playing</span>
          </div>
        </div>
        <div className="flex gap-0 w-full sm:w-auto">
          <button
            onClick={() => setView('court')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-button transition-colors ${
              view === 'court' ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a1a] text-white border border-[#242424]'
            }`}
          >
            Court View
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-button transition-colors ${
              view === 'list' ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a1a] text-white border border-[#242424]'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar — 260px wide, hidden on mobile */}
        <div className="hidden lg:block w-[260px] flex-shrink-0 p-6 space-y-3">
          {/* Sidebar Card 1 — My SLB Squad */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-sm">My SLB Squad</h2>
              <span className="text-[#FF6B00] text-xs cursor-pointer">Edit Team</span>
            </div>
            <div className="border-t border-[#242424] my-3"></div>
            <div className="space-y-3">
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Gameweek points</span>
                <span className="text-[#FF6B00] font-bold text-sm">54</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Overall points</span>
                <span className="text-white font-bold text-sm">54</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Overall rank</span>
                <span className="text-white font-bold text-sm">—</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Gameweek rank</span>
                <span className="text-white font-bold text-sm">—</span>
              </div>
            </div>
          </div>

          {/* Sidebar Card 2 — My Chips */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#a0a0a0] text-xs">ⓘ</span>
              <h2 className="text-white font-bold text-sm">My Chips</h2>
            </div>
            <div className="border-t border-[#242424] my-3"></div>
            <div className="grid grid-cols-2 gap-2">
              {chips.map((chip) => (
                <div key={chip.name} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-button p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-xs">{chip.name}</span>
                    <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-pill">×{chip.remaining}</span>
                  </div>
                  <p className="text-[#a0a0a0] text-[11px]">Available</p>
                  <p className="text-[#666] text-[11px]">{chip.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Card 3 — Finance */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#a0a0a0] text-xs">💰</span>
              <h2 className="text-white font-bold text-sm">Finance</h2>
            </div>
            <div className="border-t border-[#242424] my-3"></div>
            <div className="space-y-3">
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Squad value</span>
                <span className="text-white font-bold text-sm">£10.0m</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">In the bank</span>
                <span className="text-white font-bold text-sm">£0.0m</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Total budget</span>
                <span className="text-white font-bold text-sm">£10.0m</span>
              </div>
            </div>
          </div>

          {/* Sidebar Card 4 — Transfers */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#a0a0a0] text-xs">⇄</span>
              <h2 className="text-white font-bold text-sm">Transfers</h2>
            </div>
            <div className="border-t border-[#242424] my-3"></div>
            <div className="flex justify-between h-8 mb-3">
              <span className="text-[#a0a0a0] text-xs">Free transfers available</span>
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <button className="w-full bg-[#FF6B00] text-white font-bold text-sm h-10 rounded-button hover:bg-[#e05f00] transition-colors">
              Make Transfer →
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 space-y-3">
          {/* Court Panel */}
          <div className="card p-4 sm:p-5 h-auto sm:h-[520px]">
            {/* Panel Header */}
            <div className="mb-4 sm:mb-6">
              <p className="text-[#FF6B00] font-bold text-xl sm:text-2xl">Total: 54 pts</p>
              <p className="text-[#a0a0a0] text-xs mt-1">GW1 • 5 players playing</p>
            </div>

            {/* Basketball Court */}
            <div className="relative w-full" style={{ height: '280px sm:380px', backgroundColor: '#181818', borderRadius: '8px' }}>
              {/* Court Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 380">
                {/* Three point arc */}
                <ellipse cx="200" cy="320" rx="150" ry="120" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                {/* Paint area */}
                <rect x="120" y="240" width="160" height="140" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                {/* Free throw circle */}
                <circle cx="200" cy="240" r="40" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                {/* Small circle at top of key */}
                <circle cx="200" cy="100" r="15" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                {/* Baseline */}
                <line x1="0" y1="380" x2="400" y2="380" stroke="#2e2e2e" strokeWidth="2" />
                {/* Sidelines */}
                <line x1="0" y1="0" x2="0" y2="380" stroke="#2e2e2e" strokeWidth="2" />
                <line x1="400" y1="0" x2="400" y2="380" stroke="#2e2e2e" strokeWidth="2" />
              </svg>

              {/* Player Jersey Positions */}
              {/* C - Top Centre (near basket) */}
              <div className="absolute" style={{ top: '20px sm:30px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="text-center cursor-pointer">
                  <div className="relative w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                    <svg viewBox="0 0 60 50" className="w-full h-full">
                      <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[4].teamColour} />
                      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">C</text>
                    </svg>
                  </div>
                  <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[4].name}</p>
                  <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[4].points} pts</p>
                </div>
              </div>

              {/* PF - Top Left of Paint */}
              <div className="absolute" style={{ top: '70px sm:100px', left: '100px sm:130px' }}>
                <div className="text-center cursor-pointer">
                  <div className="relative w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                    <svg viewBox="0 0 60 50" className="w-full h-full">
                      <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[3].teamColour} />
                      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">PF</text>
                    </svg>
                    {startingPlayers[3].isViceCaptain && (
                      <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF6B00] flex items-center justify-center">
                        <span className="text-white text-[8px] sm:text-[10px] font-bold">V</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[3].name}</p>
                  <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[3].points} pts</p>
                </div>
              </div>

              {/* SF - Left Wing Outside Arc */}
              <div className="absolute" style={{ top: '130px sm:180px', left: '20px sm:40px' }}>
                <div className="text-center cursor-pointer">
                  <div className="w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                    <svg viewBox="0 0 60 50" className="w-full h-full">
                      <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[2].teamColour} />
                      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">SF</text>
                    </svg>
                  </div>
                  <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[2].name}</p>
                  <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[2].points} pts</p>
                </div>
              </div>

              {/* SG - Right Wing Outside Arc */}
              <div className="absolute" style={{ top: '130px sm:180px', right: '20px sm:40px' }}>
                <div className="text-center cursor-pointer">
                  <div className="w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                    <svg viewBox="0 0 60 50" className="w-full h-full">
                      <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[1].teamColour} />
                      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">SG</text>
                    </svg>
                  </div>
                  <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[1].name}</p>
                  <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[1].points} pts</p>
                </div>
              </div>

              {/* PG - Bottom Centre (ball handler) */}
              <div className="absolute" style={{ bottom: '15px sm:20px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="text-center cursor-pointer">
                  <div className="relative w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                    <svg viewBox="0 0 60 50" className="w-full h-full">
                      <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[0].teamColour} />
                      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">PG</text>
                    </svg>
                    {startingPlayers[0].isCaptain && (
                      <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF6B00] flex items-center justify-center">
                        <span className="text-white text-[8px] sm:text-[10px] font-bold">C</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[0].name}</p>
                  <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[0].points} pts</p>
                </div>
              </div>
            </div>

            {/* Bench Section */}
            <div className="border-t border-[#242424] mt-3 sm:mt-4 pt-3 sm:pt-4">
              <h3 className="text-white font-bold text-xs sm:text-sm mb-2 sm:mb-3">Bench</h3>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                {benchPlayers.map((player, index) => (
                  <div key={player?.id || index} className="text-center flex-shrink-0 flex-1 sm:flex-none">
                    {player.name ? (
                      <div className="cursor-pointer">
                        <div className="w-[45px] sm:w-[55px] h-[40px] sm:h-[50px] mx-auto mb-1">
                          <svg viewBox="0 0 60 50" className="w-full h-full">
                            <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={player.teamColour} />
                            <text x="30" y="30" textAnchor="middle" fill="white" fontSize="12 sm:14" fontWeight="bold">{player.position}</text>
                          </svg>
                        </div>
                        <p className="text-white font-bold text-[10px] sm:text-[11px]">{player.name}</p>
                        <p className="text-[#FF6B00] font-bold text-[10px] sm:text-[11px]">{player.points} pts</p>
                      </div>
                    ) : (
                      <div className="border border-dashed border-[#333] rounded-button p-2 h-[60px] sm:h-[70px] flex flex-col items-center justify-center">
                        <span className="text-[#555] text-[10px] sm:text-[11px]">Player</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="card h-auto sm:h-20 flex flex-col sm:flex-row items-center">
            <div className="flex-1 flex items-center justify-center border-r border-[#242424] w-full sm:w-auto py-3 sm:py-0">
              <div className="text-center">
                <p className="text-[#a0a0a0] text-[10px] sm:text-[11px] uppercase tracking-wider mb-1">GAMEWEEK POINTS</p>
                <p className="text-[#FF6B00] font-bold text-xl sm:text-2xl">54</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center border-r border-[#242424] w-full sm:w-auto py-3 sm:py-0">
              <div className="text-center">
                <p className="text-[#a0a0a0] text-[10px] sm:text-[11px] uppercase tracking-wider mb-1">OVERALL POINTS</p>
                <p className="text-white font-bold text-xl sm:text-2xl">54</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center border-r border-[#242424] w-full sm:w-auto py-3 sm:py-0">
              <div className="text-center">
                <p className="text-[#a0a0a0] text-[10px] sm:text-[11px] uppercase tracking-wider mb-1">OVERALL RANK</p>
                <p className="text-white font-bold text-xl sm:text-2xl">—</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center w-full sm:w-auto py-3 sm:py-0">
              <div className="text-center">
                <p className="text-[#a0a0a0] text-[10px] sm:text-[11px] uppercase tracking-wider mb-1">TRANSFERS</p>
                <p className="text-white font-bold text-xl sm:text-2xl">1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamPage;
