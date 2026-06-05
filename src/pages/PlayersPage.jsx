import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PlayersPage = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [sortBy, setSortBy] = useState('value-desc');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [players, searchTerm, positionFilter, teamFilter, sortBy]);

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

      console.log('Players data:', data);
      console.log('Players error:', error);

      if (error) throw error;

      const { data: teamsData } = await supabase
        .from('slb_teams')
        .select('id, name, short_name')
        .order('name');

      if (teamsData) setTeams(teamsData);
      if (data) setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (positionFilter !== 'All') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    // Team filter
    if (teamFilter !== 'All') {
      filtered = filtered.filter(player => player.slb_teams?.name === teamFilter);
    }

    // Sort
    switch (sortBy) {
      case 'value-desc':
        filtered.sort((a, b) => b.value - a.value);
        break;
      case 'value-asc':
        filtered.sort((a, b) => a.value - b.value);
        break;
      case 'points-desc':
        filtered.sort((a, b) => b.total_season_points - a.total_season_points);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredPlayers(filtered);
  };

  const formatValue = (value) => {
    return `£${(value / 1000000).toFixed(1)}m`;
  };

  const getPositionColor = (position) => {
    const colors = {
      PG: '#3B82F6',
      SG: '#10B981',
      SF: '#F59E0B',
      PF: '#EF4444',
      C: '#8B5CF6'
    };
    return colors[position] || '#6B7280';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Page Header */}
      <div className="pt-32 pb-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-5xl uppercase tracking-wide mb-4">Players</h1>
          <p className="text-xl text-[#a0a0a0]">Full SLB player pool — stats, values and availability</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="card p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Position Filter */}
              <div className="flex gap-2">
                {['All', 'PG', 'SG', 'SF', 'PF', 'C'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      positionFilter === pos
                        ? 'bg-[#FF6B00] text-white'
                        : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Team Filter */}
              <div className="min-w-[180px]">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded-button px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
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
              <div className="min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded-button px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="value-desc">Value (high to low)</option>
                  <option value="value-asc">Value (low to high)</option>
                  <option value="points-desc">Points (high to low)</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Table */}
      <div className="px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="card h-16 animate-pulse" />
              ))}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-[#a0a0a0]">No players found</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#242424]">
                    <th className="text-left py-4 px-6 text-lg text-[#a0a0a0]">Player</th>
                    <th className="text-left py-4 px-6 text-lg text-[#a0a0a0]">Position</th>
                    <th className="text-left py-4 px-6 text-lg text-[#a0a0a0]">Team</th>
                    <th className="text-left py-4 px-6 text-lg text-[#a0a0a0]">Value</th>
                    <th className="text-left py-4 px-6 text-lg text-[#a0a0a0]">Season Points</th>
                    <th className="text-left py-4 px-6 text-lg text-[#a0a0a0]">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="border-b border-[#242424]/5 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold">{player.name}</td>
                      <td className="py-4 px-6">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{ backgroundColor: getPositionColor(player.position) + '20', color: getPositionColor(player.position) }}
                        >
                          {player.position}
                        </span>
                      </td>
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: player.slb_teams?.primary_colour || '#6B7280' }}
                        />
                        {player.slb_teams?.name || 'Unknown'}
                      </td>
                      <td className="py-4 px-6 font-semibold">{formatValue(player.value)}</td>
                      <td className="py-4 px-6">{player.total_season_points}</td>
                      <td className="py-4 px-6">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            player.is_available ? 'bg-[#00FF87]' : 'bg-[#FF3B3B]'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Official SLB Link */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <a
            href="https://www.superleaguebasketballm.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
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
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#141414] border-l border-[#242424] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-6 right-6 text-[#a0a0a0] hover:text-white text-2xl"
              >
                ×
              </button>

              {/* Player Header */}
              <div className="mb-8">
                <h2 className="text-white text-4xl font-bold mb-2">{selectedPlayer.name}</h2>
                <span
                  className="px-4 py-2 rounded-full text-sm font-semibold inline-block"
                  style={{ backgroundColor: getPositionColor(selectedPlayer.position) + '20', color: getPositionColor(selectedPlayer.position) }}
                >
                  {selectedPlayer.position}
                </span>
              </div>

              {/* Team Info */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedPlayer.slb_teams?.primary_colour || '#6B7280' }}
                  />
                  <p className="text-xl font-semibold">{selectedPlayer.slb_teams?.name || 'Unknown'}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                  <p className="text-[#a0a0a0] text-sm mb-1">Value</p>
                  <p className="text-2xl font-bold text-[#FF6B00]">{formatValue(selectedPlayer.value)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                  <p className="text-[#a0a0a0] text-sm mb-1">Season Points</p>
                  <p className="text-2xl font-bold">{selectedPlayer.total_season_points}</p>
                </div>
              </div>

              {/* Per Game Stats */}
              <div>
                <h3 className="text-white text-xl font-bold mb-4">Per Game Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Points</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Assists</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Rebounds</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424]">
                    <p className="text-[#a0a0a0] text-sm mb-1">Blocks</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-button p-4 border border-[#242424] col-span-2">
                    <p className="text-[#a0a0a0] text-sm mb-1">Steals</p>
                    <p className="text-2xl font-bold">0</p>
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
