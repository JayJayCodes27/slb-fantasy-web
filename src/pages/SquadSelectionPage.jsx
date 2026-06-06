// SquadSelectionPage.jsx — Squad selection page for users to pick 10 players within £100m budget
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const SquadSelectionPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('value-desc');
  const [toast, setToast] = useState(null);

  // Squad state
  const [squad, setSquad] = useState({
    guards: [],
    forwards: [],
    centres: []
  });
  const BUDGET = 100000000; // £100m

  // Wait for auth to load
  if (loading) {
    return (
      <div style={{ color: 'white', padding: '40px' }}>
        Loading...
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Fetch players
  useEffect(() => {
    checkExistingSquad();
    fetchPlayers();
  }, []);

  const checkExistingSquad = async () => {
    try {
      const { data: existingSquad } = await supabase
        .from('user_squads')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingSquad && existingSquad.length > 0) {
        showToast('Your squad is already set. Use Transfers to make changes.', 'error');
        setTimeout(() => navigate('/fantasy'), 2000);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchPlayers = async () => {
    try {
      const { data: playersData, error } = await supabase
        .from('players')
        .select('id, name, position, value, is_available, slb_teams(id, name, short_name, primary_colour)')
        .eq('is_available', true)
        .order('value', { ascending: false });

      console.log('Players fetch error:', error);
      console.log('Players data count:', playersData?.length);

      if (error) throw error;
      setPlayers(playersData || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Calculate current squad value
  const squadValue = squad.guards.reduce((sum, p) => sum + p.value, 0) +
                     squad.forwards.reduce((sum, p) => sum + p.value, 0) +
                     squad.centres.reduce((sum, p) => sum + p.value, 0);

  const remainingBudget = BUDGET - squadValue;
  const budgetUsed = (squadValue / BUDGET) * 100;

  // Get count of players from each team
  const getTeamCount = (teamId) => {
    return [...squad.guards, ...squad.forwards, ...squad.centres].filter(p => p.team_id === teamId).length;
  };

  // Check if position slot is available
  const isPositionSlotAvailable = (position) => {
    switch (position) {
      case 'G':
        return squad.guards.length < 4;
      case 'F':
        return squad.forwards.length < 4;
      case 'C':
        return squad.centres.length < 2;
      default:
        return false;
    }
  };

  // Add player to squad
  const addPlayer = (player) => {
    // Check position slot availability
    if (!isPositionSlotAvailable(player.position)) {
      const positionName = player.position === 'G' ? 'Guard' : player.position === 'F' ? 'Forward' : 'Centre';
      showToast(`${positionName} slots full`, 'error');
      return;
    }

    // Check club limit
    const teamCount = getTeamCount(player.team_id);
    if (teamCount >= 2) {
      showToast(`Club limit reached for ${player.slb_teams?.name}`, 'error');
      return;
    }

    // Check budget
    if (remainingBudget < player.value) {
      showToast('Insufficient budget', 'error');
      return;
    }

    // Add to appropriate position array
    setSquad(prev => {
      const newSquad = { ...prev };
      switch (player.position) {
        case 'G':
          newSquad.guards = [...prev.guards, player];
          break;
        case 'F':
          newSquad.forwards = [...prev.forwards, player];
          break;
        case 'C':
          newSquad.centres = [...prev.centres, player];
          break;
      }
      return newSquad;
    });

    showToast('Player added to squad');
  };

  // Remove player from squad
  const removePlayer = (player, position) => {
    setSquad(prev => {
      const newSquad = { ...prev };
      switch (position) {
        case 'G':
          newSquad.guards = prev.guards.filter(p => p.id !== player.id);
          break;
        case 'F':
          newSquad.forwards = prev.forwards.filter(p => p.id !== player.id);
          break;
        case 'C':
          newSquad.centres = prev.centres.filter(p => p.id !== player.id);
          break;
      }
      return newSquad;
    });
  };

  // Check if player is already in squad
  const isPlayerInSquad = (playerId) => {
    return [...squad.guards, ...squad.forwards, ...squad.centres].some(p => p.id === playerId);
  };

  // Check if club limit reached for player's team
  const isClubLimitReached = (teamId) => {
    return getTeamCount(teamId) >= 2;
  };

  // Filter and sort players
  const filteredPlayers = useCallback(() => {
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

    // Sort
    switch (sortBy) {
      case 'value-desc':
        filtered.sort((a, b) => b.value - a.value);
        break;
      case 'value-asc':
        filtered.sort((a, b) => a.value - b.value);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [players, searchTerm, positionFilter, sortBy]);

  // Confirm squad
  const confirmSquad = async () => {
    const totalPlayers = squad.guards.length + squad.forwards.length + squad.centres.length;
    if (totalPlayers !== 10) {
      showToast('Please fill all 10 squad slots', 'error');
      return;
    }

    try {
      // Prepare squad data
      const squadData = [];
      const allPlayers = [...squad.guards, ...squad.forwards, ...squad.centres];

      // First 2 guards, 2 forwards, 1 centre are starters
      const starterGuards = squad.guards.slice(0, 2);
      const starterForwards = squad.forwards.slice(0, 2);
      const starterCentres = squad.centres.slice(0, 1);
      const benchGuards = squad.guards.slice(2);
      const benchForwards = squad.forwards.slice(2);
      const benchCentres = squad.centres.slice(1);

      // Add starters
      [...starterGuards, ...starterForwards, ...starterCentres].forEach(player => {
        squadData.push({
          user_id: user.id,
          player_id: player.id,
          is_starter: true,
          is_captain: false,
          is_vice_captain: false
        });
      });

      // Add bench
      [...benchGuards, ...benchForwards, ...benchCentres].forEach(player => {
        squadData.push({
          user_id: user.id,
          player_id: player.id,
          is_starter: false,
          is_captain: false,
          is_vice_captain: false
        });
      });

      // Insert squad
      const { error } = await supabase.from('user_squads').insert(squadData);
      if (error) throw error;

      // Update user's squad_confirmed status
      await supabase
        .from('users')
        .update({ squad_confirmed: true })
        .eq('id', user.id);

      showToast('Squad saved! Head to Fantasy to set your captain.');
      setTimeout(() => navigate('/fantasy'), 2000);
    } catch (error) {
      showToast('Failed to save squad', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatValue = (value) => {
    return `£${(value / 1000000).toFixed(1)}m`;
  };

  const isSquadComplete = squad.guards.length === 4 && squad.forwards.length === 4 && squad.centres.length === 2;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="pt-24 sm:pt-32 pb-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-5xl uppercase tracking-wide mb-2">Squad Selection</h1>
          <p className="text-base sm:text-xl text-[#a0a0a0]">Pick your 10 players within £100m budget</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Squad (35%) */}
          <div className="lg:col-span-4">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-[#FF5500] mb-6 uppercase tracking-wide">My Squad</h2>

              {/* Budget Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#a0a0a0]">Remaining Budget</span>
                  <span className={`text-2xl font-bold ${remainingBudget < 5000000 ? 'text-red-500' : 'text-white'}`}>
                    {formatValue(remainingBudget)}
                  </span>
                </div>
                <div className="w-full h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${remainingBudget < 5000000 ? 'bg-red-500' : 'bg-[#FF5500]'}`}
                    style={{ width: `${budgetUsed}%` }}
                  />
                </div>
              </div>

              {/* Guards */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">GUARDS ({squad.guards.length}/4)</h3>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={`guard-${i}`}>
                      {squad.guards[i] ? (
                        <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: squad.guards[i].slb_teams?.primary_colour + '20' }}
                            >
                              <span className="text-xs font-bold" style={{ color: squad.guards[i].slb_teams?.primary_colour }}>
                                G
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{squad.guards[i].name}</p>
                              <p className="text-xs text-[#a0a0a0]">{squad.guards[i].slb_teams?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF5500] font-bold text-sm">{formatValue(squad.guards[i].value)}</span>
                            <button
                              onClick={() => removePlayer(squad.guards[i], 'G')}
                              className="text-red-500 hover:text-red-400 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-[#FF5500] transition-colors">
                          <span className="text-[#a0a0a0] text-sm">+ Guard</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Forwards */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">FORWARDS ({squad.forwards.length}/4)</h3>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={`forward-${i}`}>
                      {squad.forwards[i] ? (
                        <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: squad.forwards[i].slb_teams?.primary_colour + '20' }}
                            >
                              <span className="text-xs font-bold" style={{ color: squad.forwards[i].slb_teams?.primary_colour }}>
                                F
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{squad.forwards[i].name}</p>
                              <p className="text-xs text-[#a0a0a0]">{squad.forwards[i].slb_teams?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF5500] font-bold text-sm">{formatValue(squad.forwards[i].value)}</span>
                            <button
                              onClick={() => removePlayer(squad.forwards[i], 'F')}
                              className="text-red-500 hover:text-red-400 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-[#FF5500] transition-colors">
                          <span className="text-[#a0a0a0] text-sm">+ Forward</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Centres */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">CENTRES ({squad.centres.length}/2)</h3>
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={`centre-${i}`}>
                      {squad.centres[i] ? (
                        <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: squad.centres[i].slb_teams?.primary_colour + '20' }}
                            >
                              <span className="text-xs font-bold" style={{ color: squad.centres[i].slb_teams?.primary_colour }}>
                                C
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{squad.centres[i].name}</p>
                              <p className="text-xs text-[#a0a0a0]">{squad.centres[i].slb_teams?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF5500] font-bold text-sm">{formatValue(squad.centres[i].value)}</span>
                            <button
                              onClick={() => removePlayer(squad.centres[i], 'C')}
                              className="text-red-500 hover:text-red-400 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-[#FF5500] transition-colors">
                          <span className="text-[#a0a0a0] text-sm">+ Centre</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={confirmSquad}
                disabled={!isSquadComplete}
                className={`w-full py-3 rounded-lg font-bold text-sm ${
                  isSquadComplete
                    ? 'bg-[#FF5500] text-white hover:bg-[#e04a00] transition-colors'
                    : 'bg-[#2A2A2A] text-[#a0a0a0] cursor-not-allowed'
                }`}
              >
                Confirm Squad
              </button>
            </div>
          </div>

          {/* Right Column - Player Pool (65%) */}
          <div className="lg:col-span-8">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#FF5500] mb-6 uppercase tracking-wide">Pick Your Players</h2>

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-wrap gap-4 items-center mb-6">
                <div className="w-full sm:flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#242424] rounded-lg px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500] text-sm"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
                  {['All', 'G', 'F', 'C'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm whitespace-nowrap ${
                        positionFilter === pos
                          ? 'bg-[#FF5500] text-white'
                          : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:min-w-[200px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#242424] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF5500] text-sm"
                  >
                    <option value="value-desc">Value (high to low)</option>
                    <option value="value-asc">Value (low to high)</option>
                    <option value="alphabetical">Name</option>
                  </select>
                </div>
              </div>

              {/* Player List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {loadingPlayers ? (
                  <div className="text-center py-8">Loading players...</div>
                ) : filteredPlayers().length === 0 ? (
                  <div className="text-center py-8 text-[#a0a0a0]">No players found</div>
                ) : (
                  filteredPlayers().map((player) => {
                    const inSquad = isPlayerInSquad(player.id);
                    const clubLimitReached = isClubLimitReached(player.team_id);
                    const canAdd = !inSquad && !clubLimitReached && isPositionSlotAvailable(player.position) && remainingBudget >= player.value;

                    return (
                      <div
                        key={player.id}
                        className={`bg-[#1a1a1a] border rounded-lg p-4 flex items-center justify-between ${
                          inSquad ? 'border-[#2A2A2A] opacity-50' : clubLimitReached ? 'border-orange-500' : 'border-[#242424]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: player.slb_teams?.primary_colour + '20' }}
                          >
                            <span className="text-sm font-bold" style={{ color: player.slb_teams?.primary_colour }}>
                              {player.position}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{player.name}</p>
                            <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                              <span className="px-2 py-0.5 rounded bg-[#2A2A2A] text-xs">{player.position}</span>
                              <span>{player.slb_teams?.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[#FF5500] font-bold">{formatValue(player.value)}</span>
                          {inSquad ? (
                            <span className="text-green-500 text-sm">✓</span>
                          ) : clubLimitReached ? (
                            <span className="text-orange-500 text-sm">Club limit</span>
                          ) : !isPositionSlotAvailable(player.position) ? (
                            <span className="text-[#a0a0a0] text-sm">Full</span>
                          ) : remainingBudget < player.value ? (
                            <span className="text-[#a0a0a0] text-sm">No budget</span>
                          ) : (
                            <button
                              onClick={() => addPlayer(player)}
                              className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e04a00] transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadSelectionPage;
