// PlayersPage.jsx — Player listing, list view only
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

  useEffect(() => { fetchPlayers(); }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*, slb_teams(name, short_name, primary_colour, secondary_colour)')
        .order('name');
      if (error) throw error;
      if (data) setPlayers(data);

      const { data: teamsData } = await supabase
        .from('slb_teams').select('id, name, short_name').order('name');
      if (teamsData) setTeams(teamsData);
    } catch (error) {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (v) => `£${(v / 1000000).toFixed(1)}m`;

  const displayPlayers = players
    .filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchPos = positionFilter === 'All' || p.position === positionFilter;
      const matchTeam = teamFilter === 'All' || p.slb_teams?.name === teamFilter;
      return matchSearch && matchPos && matchTeam;
    })
    .sort((a, b) => {
      if (sortBy === 'value-desc') return b.value - a.value;
      if (sortBy === 'value-asc') return a.value - b.value;
      if (sortBy === 'pts-desc') return (b.total_season_points || 0) - (a.total_season_points || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const positionColour = (pos) => {
    if (pos === 'G') return 'bg-[#F4622A]/20 text-[#F4622A]';
    if (pos === 'F') return 'bg-[#C9A84C]/20 text-[#C9A84C]';
    return 'bg-white/10 text-white';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Header */}
      <div className="pt-6 pb-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-1">PLAYERS</h1>
          <p className="text-[#A0A0A0] text-sm">Browse and scout all SLB players</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-[#0A0A0A] px-4 sm:px-8 pb-4 border-b border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#111111] border border-[#222222] rounded-lg px-4 py-2 text-white placeholder-[#555555] focus:outline-none focus:border-[#F4622A] text-sm w-full sm:w-48"
          />
          <div className="flex gap-1">
            {['All', 'G', 'F', 'C'].map(pos => (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${positionFilter === pos ? 'bg-[#F4622A] text-white' : 'bg-[#111111] text-[#A0A0A0] hover:text-white border border-[#222222]'}`}
              >{pos}</button>
            ))}
          </div>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="bg-[#111111] border border-[#222222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4622A]"
          >
            <option value="All">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.name}>{t.short_name}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-[#111111] border border-[#222222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4622A]"
          >
            <option value="value-desc">Value ↓</option>
            <option value="value-asc">Value ↑</option>
            <option value="pts-desc">Points ↓</option>
            <option value="name">Name A–Z</option>
          </select>
          <span className="text-[#555555] text-xs ml-auto">{displayPlayers.length} players</span>
        </div>
      </div>

      {/* Player list */}
      <div className="px-4 sm:px-8 py-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-[#111111] border border-[#222222] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : displayPlayers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#555555] text-lg">No players found</p>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#1A1A1A]">
              {displayPlayers.map(player => (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A] cursor-pointer transition-colors group"
                >
                  {/* Team colour dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.slb_teams?.primary_colour || '#555' }}
                  />
                  {/* Name */}
                  <p className="text-white font-semibold text-sm flex-1 min-w-0 truncate">{player.name}</p>
                  {/* Position badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${positionColour(player.position)}`}>
                    {player.position}
                  </span>
                  {/* Team name */}
                  <span className="text-[#666666] text-xs hidden sm:block flex-shrink-0 w-24 truncate">{player.slb_teams?.short_name}</span>
                  {/* GW Pts */}
                  <span className="text-[#F4622A] font-bold text-sm flex-shrink-0 w-10 text-right">{player.gw_points || 0}</span>
                  {/* Value */}
                  <span className="text-[#C9A84C] font-semibold text-sm flex-shrink-0 w-14 text-right">{formatValue(player.value)}</span>
                  {/* Availability dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${player.available !== false ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`}
                    title={player.available !== false ? 'Available' : 'Unavailable'}
                  />
                  {/* Add button */}
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/transfers?incoming=${player.id}`); }}
                    className="ml-1 text-[#555555] hover:text-[#F4622A] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Add to squad"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player detail side panel */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedPlayer(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full sm:max-w-sm bg-[#141414] border-l border-[#2A2A2A] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 text-[#555555] hover:text-white text-2xl">×</button>
              <div className="flex items-center gap-3 mt-4 mb-6">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedPlayer.slb_teams?.primary_colour || '#666' }} />
                <div>
                  <h2 className="text-white font-bold text-xl">{selectedPlayer.name}</h2>
                  <p className="text-[#666666] text-sm">{selectedPlayer.slb_teams?.name}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${positionColour(selectedPlayer.position)}`}>{selectedPlayer.position}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                  <p className="text-[#666666] text-xs mb-1">Value</p>
                  <p className="text-[#C9A84C] font-bold text-xl">{formatValue(selectedPlayer.value)}</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                  <p className="text-[#666666] text-xs mb-1">GW Pts</p>
                  <p className="text-[#F4622A] font-bold text-xl">{selectedPlayer.gw_points || 0}</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                  <p className="text-[#666666] text-xs mb-1">Season Pts</p>
                  <p className="text-white font-bold text-xl">{selectedPlayer.total_season_points || 0}</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A]">
                  <p className="text-[#666666] text-xs mb-1">Status</p>
                  <p className={`font-bold text-sm ${selectedPlayer.available !== false ? 'text-[#22c55e]' : 'text-[#EF4444]'}`}>
                    {selectedPlayer.available !== false ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedPlayer(null); navigate(`/transfers?incoming=${selectedPlayer.id}`); }}
                className="w-full bg-[#F4622A] text-white font-bold py-3 rounded-xl hover:bg-[#d4521a] transition-colors"
              >
                Add to Squad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersPage;
