// PlayersPage.jsx — Player listing with search, filters, and team selection
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Jersey from '../components/Jersey.jsx';
import { getTeamColours } from '../constants/teamColours.js';

const PlayersPage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [sortBy, setSortBy] = useState('value-desc');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Derive filtered list directly — no useEffect needed
  const filteredPlayers = players.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchPosition = positionFilter === 'All' || p.position === positionFilter;
    const matchTeam = teamFilter === 'All' || p.slb_teams?.name === teamFilter;
    return matchSearch && matchPosition && matchTeam;
  });

  const displayPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'value-desc') return b.value - a.value;
    if (sortBy === 'value-asc') return a.value - b.value;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          slb_teams (
            name,
            short_name,
            primary_colour,
            secondary_colour
          )
        `)
        .order('name');

      if (error) throw error;

      const { data: teamsData } = await supabase
        .from('slb_teams')
        .select('id, name, short_name')
        .order('name');

      if (teamsData) setTeams(teamsData);
      if (data) {
        setPlayers(data);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    return `£${(value / 1000000).toFixed(1)}m`;
  };

  const getPositionColor = (position) => {
    const colors = {
      G: '#3B82F6',
      F: '#F59E0B',
      C: '#8B5CF6'
    };
    return colors[position] || '#6B7280';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="pt-6 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-2">PLAYERS</h1>
          <p className="text-[#A0A0A0] text-base sm:text-lg">Browse and scout players</p>
        </div>
      </div>

      {/* Filter Bar - Sticky */}
      <div className="sticky top-16 z-30 bg-[#0A0A0A] px-4 sm:px-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="w-full sm:flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#222222] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#F4622A] text-sm sm:text-base"
                />
              </div>

              {/* Position Filter */}
              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {['All', 'G', 'F', 'C'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base whitespace-nowrap ${
                      positionFilter === pos
                        ? 'bg-[#F4622A] text-white'
                        : 'bg-[#1A1A1A] text-[#A0A0A0] hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Team Filter */}
              <div className="w-full sm:min-w-[180px]">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#222222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4622A] text-sm sm:text-base"
                >
                  <option value="All">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.short_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="w-full sm:min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#222222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F4622A] text-sm sm:text-base"
                >
                  <option value="value-desc">Value (high to low)</option>
                  <option value="value-asc">Value (low to high)</option>
                  <option value="name">Name (A to Z)</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 bg-[#1A1A1A] border border-[#222222] rounded-lg p-1">
                <button onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'grid' ? 'bg-[#F4622A] text-white' : 'text-[#A0A0A0] hover:text-white'}`}
                  title="Grid view">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button onClick={() => setViewMode('stats')}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'stats' ? 'bg-[#F4622A] text-white' : 'text-[#A0A0A0] hover:text-white'}`}
                  title="Stats view">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-xl h-48 animate-pulse" />
              ))}
            </div>
          ) : displayPlayers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl sm:text-2xl text-[#A0A0A0]">No players found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {displayPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="bg-[#111111] border border-[#222222] rounded-xl p-4 cursor-pointer hover:border-[#F4622A] hover:scale-[1.02] transition-all duration-200 group relative"
                >
                  <div className="flex justify-center mb-3">
                    <Jersey
                      primaryColour={getTeamColours(player.slb_teams?.name).primary}
                      secondaryColour={getTeamColours(player.slb_teams?.name).secondary}
                      number={player.squad_number ?? null}
                      size="sm"
                    />
                  </div>
                  <p className="text-white font-semibold text-sm mb-1 truncate">{player.name}</p>
                  <p className="text-[#A0A0A0] text-xs mb-2">{player.slb_teams?.short_name}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold mb-2 ${
                    player.position === 'G' ? 'bg-[#F4622A] text-white' :
                    player.position === 'F' ? 'bg-[#C9A84C] text-white' :
                    'bg-[#2A2A2A] text-white'
                  }`}>{player.position}</span>
                  <p className="text-[#C9A84C] font-semibold text-sm mb-1">{formatValue(player.value)}</p>
                  <p className="text-[#F4622A] font-bold text-lg">{player.total_season_points || 0}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/transfers?incoming=${player.id}`); }}
                    className="absolute bottom-4 right-4 bg-[#F4622A] text-white text-xs font-semibold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >Add</button>
                </div>
              ))}
            </div>
          ) : (
            /* Stats table view */
            <div className="overflow-x-auto rounded-xl border border-[#222222]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#111111] border-b border-[#222222]">
                    <th className="sticky left-0 bg-[#111111] text-left px-4 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap z-10 min-w-[160px]">Player</th>
                    <th className="text-left px-3 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">Pos</th>
                    <th className="text-right px-3 py-3 text-[#C9A84C] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">Price</th>
                    <th className="text-right px-3 py-3 text-[#F4622A] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">Total Pts</th>
                    <th className="text-right px-3 py-3 text-[#F4622A] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">GW Pts</th>
                    <th className="text-right px-3 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">PPG</th>
                    <th className="text-right px-3 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">RPG</th>
                    <th className="text-right px-3 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">APG</th>
                    <th className="text-right px-3 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">SPG</th>
                    <th className="text-right px-3 py-3 text-[#666666] text-xs uppercase tracking-wide font-semibold whitespace-nowrap">BPG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {displayPlayers.map((player) => (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="bg-[#0A0A0A] hover:bg-[#111111] cursor-pointer transition-colors group"
                    >
                      <td className="sticky left-0 bg-[#0A0A0A] group-hover:bg-[#111111] transition-colors px-4 py-3 z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: player.slb_teams?.primary_colour || '#666' }} />
                          <div>
                            <p className="text-white font-semibold whitespace-nowrap">{player.name}</p>
                            <p className="text-[#666666] text-xs">{player.slb_teams?.short_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          player.position === 'G' ? 'bg-[#F4622A]/20 text-[#F4622A]' :
                          player.position === 'F' ? 'bg-[#C9A84C]/20 text-[#C9A84C]' :
                          'bg-white/10 text-white'
                        }`}>{player.position}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-[#C9A84C] font-semibold">{formatValue(player.value)}</td>
                      <td className="px-3 py-3 text-right text-[#F4622A] font-bold">{player.total_season_points || 0}</td>
                      <td className="px-3 py-3 text-right text-white font-semibold">{player.gw_points || 0}</td>
                      <td className="px-3 py-3 text-right text-[#A0A0A0]">{player.points_per_game ? player.points_per_game.toFixed(1) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#A0A0A0]">{player.rebounds_per_game ? player.rebounds_per_game.toFixed(1) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#A0A0A0]">{player.assists_per_game ? player.assists_per_game.toFixed(1) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#A0A0A0]">{player.steals_per_game ? player.steals_per_game.toFixed(1) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#A0A0A0]">{player.blocks_per_game ? player.blocks_per_game.toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Official SLB Link */}
      <div className="px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <a
            href="https://www.superleaguebasketballm.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            Official SLB player stats at <span className="text-[#FF5C00]">superleaguebasketballm.co.uk</span> →
          </a>
        </div>
      </div>

      {/* Side Panel */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-[#141414] border-l border-[#242424] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 sm:top-6 right-4 sm:right-6 text-[#a0a0a0] hover:text-white text-2xl"
              >
                ×
              </button>

              {/* Player Header */}
              <div className="mb-6 sm:mb-8 mt-8 sm:mt-0">
                <h2 className="text-white text-2xl sm:text-4xl font-bold mb-2">{selectedPlayer.name}</h2>
                <span
                  className="px-4 py-2 rounded-full text-sm font-semibold inline-block"
                  style={{ backgroundColor: getPositionColor(selectedPlayer.position) + '20', color: getPositionColor(selectedPlayer.position) }}
                >
                  {selectedPlayer.position}
                </span>
              </div>

              {/* Team Info */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedPlayer.slb_teams?.primary_colour || '#6B7280' }}
                  />
                  <p className="text-lg sm:text-xl font-semibold">{selectedPlayer.slb_teams?.name || 'Unknown'}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8">
                <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                  <p className="text-[#a0a0a0] text-sm mb-1">Value</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#FF6B00]">{formatValue(selectedPlayer.value)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                  <p className="text-[#a0a0a0] text-sm mb-1">Season Points</p>
                  <p className="text-xl sm:text-2xl font-bold">{selectedPlayer.total_season_points}</p>
                </div>
              </div>

              {/* Per Game Stats */}
              <div>
                <h3 className="text-white text-lg sm:text-xl font-bold mb-4">Per Game Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Points</p>
                    <p className="text-xl sm:text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Assists</p>
                    <p className="text-xl sm:text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Rebounds</p>
                    <p className="text-xl sm:text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Blocks</p>
                    <p className="text-xl sm:text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424] col-span-2">
                    <p className="text-[#a0a0a0] text-sm mb-1">Steals</p>
                    <p className="text-xl sm:text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersPage;
