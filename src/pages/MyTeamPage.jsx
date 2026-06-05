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
    <div className="min-h-screen bg-[#0D0D0D] text-white font-dm-sans pt-32">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Team Name */}
            <div className="card p-6">
              <h1 className="font-bebas text-2xl font-bold text-white">My SLB Squad</h1>
            </div>

            {/* Points & Rankings */}
            <div className="card p-6">
              <h2 className="font-bebas text-lg font-bold mb-4 text-white">Points & Rankings</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#999999]">Gameweek points</span>
                  <span className="text-white font-semibold">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999999]">Overall points</span>
                  <span className="text-white font-semibold">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999999]">Overall rank</span>
                  <span className="text-white font-semibold">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999999]">Gameweek rank</span>
                  <span className="text-white font-semibold">—</span>
                </div>
              </div>
            </div>

            {/* Chips */}
            <div className="card p-6">
              <h2 className="font-bebas text-lg font-bold mb-4 text-white">My Chips</h2>
              <div className="grid grid-cols-2 gap-3">
                {chips.map((chip) => (
                  <div key={chip.name} className="bg-[#1C1C1C] rounded-lg p-3 border border-[#2A2A2A]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-sm">{chip.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        chip.color === 'green' ? 'bg-[#00FF87]/20 text-[#00FF87]' :
                        chip.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                        chip.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-[#FF5500]/20 text-[#FF5500]'
                      }`}>
                        ×{chip.remaining} remaining
                      </span>
                    </div>
                    <p className="text-[#999999] text-xs">{chip.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance */}
            <div className="card p-6">
              <h2 className="font-bebas text-lg font-bold mb-4 text-white">Finance</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#999999]">Squad value</span>
                  <span className="text-white font-semibold">£10.0m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999999]">In the bank</span>
                  <span className="text-white font-semibold">£0.0m</span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3">
                  <span className="text-[#999999]">Total budget</span>
                  <span className="text-white font-semibold">£10.0m</span>
                </div>
              </div>
            </div>

            {/* Transfers */}
            <div className="card p-6">
              <h2 className="font-bebas text-lg font-bold mb-4 text-white">Transfers</h2>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#999999]">Free transfers available</span>
                <span className="text-white font-semibold text-xl">1</span>
              </div>
              <button className="w-full bg-[#FF5500] text-white py-3 rounded-lg font-semibold hover:bg-[#FF6B1A] transition-colors">
                Make Transfer
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Bar */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bebas text-3xl font-bold text-white">Gameweek 1</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('court')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      view === 'court' ? 'bg-[#FF5500] text-white' : 'bg-[#1C1C1C] text-[#999999] hover:text-white'
                    }`}
                  >
                    Court View
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      view === 'list' ? 'bg-[#FF5500] text-white' : 'bg-[#1C1C1C] text-[#999999] hover:text-white'
                    }`}
                  >
                    List View
                  </button>
                </div>
              </div>
              <p className="text-[#999999] text-sm">Deadline: Fri 3 Oct, 7:00pm</p>
            </div>

            {/* Total Score */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bebas text-4xl font-bold text-[#FF5500]">Total: 54 pts</p>
                  <p className="text-[#999999] text-sm mt-1">GW1 • 5 players playing</p>
                </div>
              </div>
            </div>

            {/* Court View */}
            {view === 'court' && (
              <>
                {/* Basketball Court */}
                <div className="card p-6">
                  <div className="relative" style={{ height: '400px', backgroundColor: '#1a472a', borderRadius: '8px' }}>
                    {/* Court Lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                      {/* Three point arc */}
                      <ellipse cx="200" cy="350" rx="120" ry="100" fill="none" stroke="white" strokeWidth="2" />
                      {/* Paint area */}
                      <rect x="140" y="280" width="120" height="120" fill="none" stroke="white" strokeWidth="2" />
                      {/* Free throw circle */}
                      <circle cx="200" cy="280" r="30" fill="none" stroke="white" strokeWidth="2" />
                      {/* Center circle half */}
                      <path d="M 50 200 A 150 150 0 0 1 350 200" fill="none" stroke="white" strokeWidth="2" />
                      {/* Baseline */}
                      <line x1="50" y1="400" x2="350" y2="400" stroke="white" strokeWidth="2" />
                    </svg>

                    {/* Player Slots */}
                    {/* PG - Bottom Centre */}
                    <div className="absolute" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                      <div className="text-center cursor-pointer" onClick={() => {}}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: startingPlayers[0].teamColour }}>
                          <span className="font-bebas text-xl font-bold text-white">PG</span>
                        </div>
                        <p className="text-white font-semibold text-sm">{startingPlayers[0].name}</p>
                        <p className="text-[#FF5500] font-bold text-sm">{startingPlayers[0].points} pts</p>
                        {startingPlayers[0].isCaptain && <span className="inline-block mt-1 px-2 py-0.5 bg-[#FF5500] text-white text-xs rounded-full">C</span>}
                      </div>
                    </div>

                    {/* SG - Bottom Left Wing */}
                    <div className="absolute" style={{ bottom: '80px', left: '80px' }}>
                      <div className="text-center cursor-pointer" onClick={() => {}}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: startingPlayers[1].teamColour }}>
                          <span className="font-bebas text-xl font-bold text-white">SG</span>
                        </div>
                        <p className="text-white font-semibold text-sm">{startingPlayers[1].name}</p>
                        <p className="text-[#FF5500] font-bold text-sm">{startingPlayers[1].points} pts</p>
                      </div>
                    </div>

                    {/* SF - Top Left Wing */}
                    <div className="absolute" style={{ top: '100px', left: '60px' }}>
                      <div className="text-center cursor-pointer" onClick={() => {}}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: startingPlayers[2].teamColour }}>
                          <span className="font-bebas text-xl font-bold text-white">SF</span>
                        </div>
                        <p className="text-white font-semibold text-sm">{startingPlayers[2].name}</p>
                        <p className="text-[#FF5500] font-bold text-sm">{startingPlayers[2].points} pts</p>
                      </div>
                    </div>

                    {/* PF - Top Right Wing */}
                    <div className="absolute" style={{ top: '100px', right: '60px' }}>
                      <div className="text-center cursor-pointer" onClick={() => {}}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: startingPlayers[3].teamColour }}>
                          <span className="font-bebas text-xl font-bold text-white">PF</span>
                        </div>
                        <p className="text-white font-semibold text-sm">{startingPlayers[3].name}</p>
                        <p className="text-[#FF5500] font-bold text-sm">{startingPlayers[3].points} pts</p>
                        {startingPlayers[3].isViceCaptain && <span className="inline-block mt-1 px-2 py-0.5 bg-[#FF5500] text-white text-xs rounded-full">V</span>}
                      </div>
                    </div>

                    {/* C - Centre Top */}
                    <div className="absolute" style={{ top: '40px', left: '50%', transform: 'translateX(-50%)' }}>
                      <div className="text-center cursor-pointer" onClick={() => {}}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: startingPlayers[4].teamColour }}>
                          <span className="font-bebas text-xl font-bold text-white">C</span>
                        </div>
                        <p className="text-white font-semibold text-sm">{startingPlayers[4].name}</p>
                        <p className="text-[#FF5500] font-bold text-sm">{startingPlayers[4].points} pts</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bench */}
                <div className="card p-6">
                  <div className="border-b border-[#2A2A2A] pb-4 mb-4">
                    <h3 className="font-bebas text-xl font-bold text-white">Bench</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {benchPlayers.map((player, index) => (
                      <div key={player?.id || index} className="text-center">
                        {player.name ? (
                          <div className="cursor-pointer" onClick={() => {}}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 mx-auto" style={{ backgroundColor: player.teamColour }}>
                              <span className="font-bebas text-lg font-bold text-white">{player.position}</span>
                            </div>
                            <p className="text-white font-semibold text-xs">{player.name}</p>
                            <p className="text-[#FF5500] font-bold text-xs">{player.points} pts</p>
                          </div>
                        ) : (
                          <div className="bg-[#1C1C1C] rounded-lg p-4 border border-dashed border-[#2A2A2A]">
                            <p className="text-[#555555] text-xs">Add Player</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* List View */}
            {view === 'list' && (
              <div className="card p-6">
                <div className="border-b border-[#2A2A2A] pb-4 mb-4">
                  <h3 className="font-bebas text-xl font-bold text-white">Starting 5</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A2A2A]">
                      <th className="text-left py-3 px-4 font-bebas text-sm text-[#999999]">Player</th>
                      <th className="text-left py-3 px-4 font-bebas text-sm text-[#999999]">Value</th>
                      <th className="text-left py-3 px-4 font-bebas text-sm text-[#999999]">GW Points</th>
                      <th className="text-left py-3 px-4 font-bebas text-sm text-[#999999]">Captain</th>
                      <th className="text-left py-3 px-4 font-bebas text-sm text-[#999999]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {startingPlayers.map((player) => (
                      <tr key={player.id} className="border-b border-[#2A2A2A]/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: player.teamColour }}>
                              <span className="font-bebas text-xs font-bold text-white">{player.position}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{player.name}</p>
                              <p className="text-[#999999] text-xs">{player.team}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white">£2.0m</td>
                        <td className="py-3 px-4 text-[#FF5500] font-semibold">{player.points}</td>
                        <td className="py-3 px-4">
                          {player.isCaptain ? (
                            <span className="px-2 py-1 bg-[#FF5500] text-white text-xs rounded-full">C</span>
                          ) : player.isViceCaptain ? (
                            <span className="px-2 py-1 bg-[#FF5500] text-white text-xs rounded-full">V</span>
                          ) : (
                            <button className="text-[#999999] hover:text-[#FF5500] text-xs">Set C</button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-[#FF3B3B] hover:text-[#FF6B6B] text-xs">Transfer Out</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-b border-[#2A2A2A] pb-4 mb-4 mt-8">
                  <h3 className="font-bebas text-xl font-bold text-white">Bench</h3>
                </div>
                <table className="w-full">
                  <tbody>
                    {benchPlayers.filter(p => p.name).map((player) => (
                      <tr key={player.id} className="border-b border-[#2A2A2A]/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: player.teamColour }}>
                              <span className="font-bebas text-xs font-bold text-white">{player.position}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white">{player.name}</p>
                              <p className="text-[#999999] text-xs">{player.team}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white">£1.5m</td>
                        <td className="py-3 px-4 text-[#FF5500] font-semibold">{player.points}</td>
                        <td className="py-3 px-4">—</td>
                        <td className="py-3 px-4">
                          <button className="text-[#FF3B3B] hover:text-[#FF6B6B] text-xs">Transfer Out</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamPage;
