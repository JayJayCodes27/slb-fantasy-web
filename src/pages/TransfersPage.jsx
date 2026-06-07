// TransfersPage.jsx — Transfer players in SLB Fantasy
// Supabase column checks:
// alter table users add column if not exists free_transfers_available int default 1;
// alter table users add column if not exists bank_balance int default 0;
// alter table user_squads add column if not exists purchase_price int default 0;
// alter table user_squads add column if not exists was_starter boolean default true;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const TransfersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [squadData, setSquadData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewMode, setViewMode] = useState('own'); // 'own' or 'replacement'
  const [soldPlayer, setSoldPlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [fixtures, setFixtures] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('free_transfers_available, squad_confirmed, formation, bank_balance')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (!userData.squad_confirmed) {
        navigate('/squad-selection');
        return;
      }

      setUserData(userData);

      // Fetch squad data
      const { data: squadData, error: squadError } = await supabase
        .from('user_squads')
        .select('*, players(*, slb_teams(*))')
        .eq('user_id', user.id);

      if (squadError) throw squadError;

      setSquadData(squadData || []);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      setSettings(settingsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlayers = async (position) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*, slb_teams(*)')
        .eq('position', position)
        .eq('is_available', true)
        .order('value', { ascending: false });

      if (error) throw error;
      setAvailablePlayers(data || []);
    } catch (error) {
      console.error('Error fetching available players:', error);
    }
  };

  const fetchFixtures = async (teamId) => {
    try {
      const currentGameweek = settings?.current_gameweek || 1;
      const { data, error } = await supabase
        .from('fixture_difficulty')
        .select('*, home_team:slb_teams!home_team_id(name,short_name), away_team:slb_teams!away_team_id(name,short_name)')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .gte('gameweek', currentGameweek)
        .order('gameweek', { ascending: true })
        .limit(3);

      if (error) throw error;
      setFixtures(data || []);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setViewMode('own');
    fetchFixtures(player.players?.slb_teams?.id);
  };

  const handleSellClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSell = async () => {
    try {
      // Delete from user_squads
      const { error: deleteError } = await supabase
        .from('user_squads')
        .delete()
        .eq('user_id', user.id)
        .eq('player_id', selectedPlayer.player_id);

      if (deleteError) throw deleteError;

      // Calculate sell price
      const purchasePrice = selectedPlayer.purchase_price || 0;
      const currentValue = selectedPlayer.players?.value || 0;
      const sellPrice = currentValue <= purchasePrice 
        ? currentValue 
        : purchasePrice + (currentValue - purchasePrice) * 0.5;

      // Update user transfers and bank
      const newFreeTransfers = Math.max(0, (userData.free_transfers_available || 1) - 1);
      const newBankBalance = (userData.bank_balance || 0) + sellPrice;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          free_transfers_available: newFreeTransfers,
          bank_balance: newBankBalance
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Show success
      alert(`Sold ${selectedPlayer.players?.name} for £${(sellPrice / 1000000).toFixed(1)}m`);

      // Set sold player and switch to replacement mode
      setSoldPlayer({ ...selectedPlayer, sellPrice });
      setSelectedPlayer(null);
      setViewMode('replacement');
      fetchAvailablePlayers(selectedPlayer.players?.position);

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error selling player:', error);
      alert('Error selling player. Please try again.');
    } finally {
      setShowConfirmDialog(false);
    }
  };

  const handleBuyClick = async (player) => {
    try {
      // Validate budget
      const playerValue = player.value || 0;
      const currentBank = userData.bank_balance || 0;

      if (playerValue > currentBank) {
        alert(`You need £${((playerValue - currentBank) / 1000000).toFixed(1)}m more`);
        return;
      }

      // Check club limit
      const clubCount = squadData.filter(
        s => s.players?.slb_teams?.id === player.slb_teams?.id && s.player_id !== selectedPlayer?.player_id
      ).length;

      if (clubCount >= 3) {
        alert('Club limit reached (max 3 players per team)');
        return;
      }

      // Insert into user_squads
      const { error: insertError } = await supabase
        .from('user_squads')
        .insert({
          user_id: user.id,
          player_id: player.id,
          is_starter: soldPlayer?.is_starter || true,
          purchase_price: player.value
        });

      if (insertError) throw insertError;

      // Update bank balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          bank_balance: currentBank - playerValue
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert(`${player.name} added to your squad!`);
      navigate('/fantasy');

    } catch (error) {
      console.error('Error buying player:', error);
      alert('Error buying player. Please try again.');
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      1: { text: 'Easy', color: 'bg-green-900 text-green-300' },
      2: { text: 'Fairly Easy', color: 'bg-green-700 text-green-200' },
      3: { text: 'Medium', color: 'bg-amber-700 text-amber-200' },
      4: { text: 'Hard', color: 'bg-orange-700 text-orange-200' },
      5: { text: 'Very Hard', color: 'bg-red-900 text-red-300' }
    };
    return badges[difficulty] || badges[3];
  };

  const formatValue = (value) => {
    return `£${(value / 1000000).toFixed(1)}m`;
  };

  const groupPlayersByPosition = () => {
    const guards = squadData.filter(s => s.players?.position === 'G');
    const forwards = squadData.filter(s => s.players?.position === 'F');
    const centres = squadData.filter(s => s.players?.position === 'C');
    return { guards, forwards, centres };
  };

  const filterAndSortPlayers = () => {
    let filtered = availablePlayers;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Remove players already in squad
    filtered = filtered.filter(p => 
      !squadData.find(s => s.player_id === p.id)
    );

    // Sort
    switch (sortBy) {
      case 'value':
        filtered.sort((a, b) => (b.value || 0) - (a.value || 0));
        break;
      case 'points':
        filtered.sort((a, b) => (b.gw_points || 0) - (a.gw_points || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.value || 0) - (a.value || 0));
        break;
      case 'price_low':
        filtered.sort((a, b) => (a.value || 0) - (b.value || 0));
        break;
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5500] mx-auto mb-4"></div>
          <p className="text-[#a0a0a0]">Loading transfers...</p>
        </div>
      </div>
    );
  }

  const { guards, forwards, centres } = groupPlayersByPosition();
  const freeTransfers = userData?.free_transfers_available || 1;
  const bankBalance = userData?.bank_balance || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#2a2a2a]">
        <h1 className="text-white font-bold text-xl uppercase tracking-wide">TRANSFERS</h1>
      </div>

      {/* Section 1 - Transfer Status Bar */}
      <div className="bg-[#141414] p-4 border-b border-[#2a2a2a]">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className={freeTransfers > 0 ? 'text-green-400' : 'text-red-400'}>
            {freeTransfers} free transfer{freeTransfers !== 1 ? 's' : ''} available
          </div>
          <div className="text-white">
            {formatValue(bankBalance)} in the bank
          </div>
          {freeTransfers === 0 && (
            <div className="bg-orange-900/50 text-orange-400 px-3 py-1 rounded text-sm">
              Next transfer costs -4 points
            </div>
          )}
        </div>
      </div>

      {/* Section 2 - Your Squad */}
      <div className="p-4 sm:p-6">
        <h2 className="text-white font-bold text-lg mb-4">YOUR SQUAD — Select a player to transfer</h2>
        
        {/* Guards */}
        <div className="mb-6">
          <h3 className="text-[#a0a0a0] text-sm font-bold mb-3 uppercase">Guards</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {guards.map((squadPlayer) => (
              <div
                key={squadPlayer.player_id}
                onClick={() => handlePlayerClick(squadPlayer)}
                className={`bg-[#141414] border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPlayer?.player_id === squadPlayer.player_id
                    ? 'border-[#FF5500]'
                    : 'border-[#2a2a2a] hover:border-[#FF5500]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: squadPlayer.players?.slb_teams?.primary_colour || '#666' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{squadPlayer.players?.name}</p>
                    <p className="text-[#a0a0a0] text-xs">{squadPlayer.players?.slb_teams?.short_name}</p>
                  </div>
                </div>
                <p className="text-[#FF5500] font-bold text-sm">{formatValue(squadPlayer.players?.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Forwards */}
        <div className="mb-6">
          <h3 className="text-[#a0a0a0] text-sm font-bold mb-3 uppercase">Forwards</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {forwards.map((squadPlayer) => (
              <div
                key={squadPlayer.player_id}
                onClick={() => handlePlayerClick(squadPlayer)}
                className={`bg-[#141414] border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPlayer?.player_id === squadPlayer.player_id
                    ? 'border-[#FF5500]'
                    : 'border-[#2a2a2a] hover:border-[#FF5500]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: squadPlayer.players?.slb_teams?.primary_colour || '#666' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{squadPlayer.players?.name}</p>
                    <p className="text-[#a0a0a0] text-xs">{squadPlayer.players?.slb_teams?.short_name}</p>
                  </div>
                </div>
                <p className="text-[#FF5500] font-bold text-sm">{formatValue(squadPlayer.players?.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Centres */}
        <div>
          <h3 className="text-[#a0a0a0] text-sm font-bold mb-3 uppercase">Centres</h3>
          <div className="grid grid-cols-2 gap-3">
            {centres.map((squadPlayer) => (
              <div
                key={squadPlayer.player_id}
                onClick={() => handlePlayerClick(squadPlayer)}
                className={`bg-[#141414] border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPlayer?.player_id === squadPlayer.player_id
                    ? 'border-[#FF5500]'
                    : 'border-[#2a2a2a] hover:border-[#FF5500]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: squadPlayer.players?.slb_teams?.primary_colour || '#666' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{squadPlayer.players?.name}</p>
                    <p className="text-[#a0a0a0] text-xs">{squadPlayer.players?.slb_teams?.short_name}</p>
                  </div>
                </div>
                <p className="text-[#FF5500] font-bold text-sm">{formatValue(squadPlayer.players?.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3 - Player Detail Panel */}
      {selectedPlayer && viewMode === 'own' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#2a2a2a] p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left - Player Details */}
              <div>
                <h3 className="text-white font-bold text-2xl mb-2 font-oswald">{selectedPlayer.players?.name}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#2a2a2a] text-white text-xs px-2 py-1 rounded">
                    {selectedPlayer.players?.position}
                  </span>
                  <span className="text-[#a0a0a0] text-sm">{selectedPlayer.players?.slb_teams?.name}</span>
                  <span className="text-[#FF5500] font-bold">{formatValue(selectedPlayer.players?.value)}</span>
                </div>

                <h4 className="text-white font-bold text-sm mb-2">LAST 3 GAMEWEEKS</h4>
                <div className="bg-[#0a0a0a] rounded-lg p-3 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#a0a0a0]">
                        <th className="text-left pb-2">GW</th>
                        <th className="text-left pb-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1">GW1</td>
                        <td className="py-1 text-[#FF5500]">{selectedPlayer.players?.gw_points || 0}</td>
                      </tr>
                      <tr>
                        <td className="py-1">GW2</td>
                        <td className="py-1 text-[#a0a0a0]">No data</td>
                      </tr>
                      <tr>
                        <td className="py-1">GW3</td>
                        <td className="py-1 text-[#a0a0a0]">No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-white font-bold text-sm mb-2">UPCOMING FIXTURES</h4>
                <div className="space-y-2">
                  {fixtures.length > 0 ? (
                    fixtures.map((fixture) => {
                      const isHome = fixture.home_team_id === selectedPlayer.players?.slb_teams?.id;
                      const opponent = isHome ? fixture.away_team : fixture.home_team;
                      const badge = getDifficultyBadge(fixture.difficulty);
                      return (
                        <div key={fixture.id} className="bg-[#0a0a0a] rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[#a0a0a0] text-xs">{isHome ? 'vs' : '@'}</span>
                            <span className="text-white text-sm">{opponent?.short_name}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[#a0a0a0] text-sm">No upcoming fixtures</p>
                  )}
                </div>
              </div>

              {/* Right - Sell Info */}
              <div>
                <h4 className="text-white font-bold text-lg mb-4">SELL PRICE</h4>
                <p className="text-[#FF5500] font-bold text-3xl mb-2">
                  {formatValue(
                    (selectedPlayer.players?.value || 0) <= (selectedPlayer.purchase_price || 0)
                      ? (selectedPlayer.players?.value || 0)
                      : (selectedPlayer.purchase_price || 0) + ((selectedPlayer.players?.value || 0) - (selectedPlayer.purchase_price || 0)) * 0.5
                  )}
                </p>
                <p className="text-[#a0a0a0] text-sm mb-4">
                  You paid {formatValue(selectedPlayer.purchase_price || 0)}
                </p>

                <div className="mb-4">
                  {freeTransfers > 0 ? (
                    <p className="text-green-400 text-sm">1 free transfer will be used</p>
                  ) : (
                    <p className="text-red-400 text-sm">This will cost -4 points</p>
                  )}
                </div>

                <button
                  onClick={handleSellClick}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors mb-3"
                >
                  Sell {selectedPlayer.players?.name}
                </button>

                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="w-full text-[#a0a0a0] text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3 - Choose Replacement */}
      {viewMode === 'replacement' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#2a2a2a] p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-white font-bold text-lg mb-4">
              CHOOSE A {soldPlayer?.players?.position} — {formatValue(bankBalance)} available
            </h3>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF5500]"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF5500]"
              >
                <option value="value">Best value</option>
                <option value="points">Most points</option>
                <option value="price_high">Price high-low</option>
                <option value="price_low">Price low-high</option>
              </select>
            </div>

            {/* Player List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filterAndSortPlayers().map((player) => {
                const canAfford = player.value <= bankBalance;
                const clubCount = squadData.filter(
                  s => s.players?.slb_teams?.id === player.slb_teams?.id
                ).length;
                const clubLimit = clubCount >= 3;

                return (
                  <div
                    key={player.id}
                    onClick={() => canAfford && !clubLimit && setSelectedPlayer(player)}
                    className={`bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 flex items-center gap-3 ${
                      canAfford && !clubLimit ? 'cursor-pointer hover:border-[#FF5500]' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: player.slb_teams?.primary_colour || '#666' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{player.name}</p>
                      <p className="text-[#a0a0a0] text-xs">{player.slb_teams?.short_name}</p>
                    </div>
                    <p className="text-[#FF5500] font-bold text-sm">{formatValue(player.value)}</p>
                    {!canAfford && (
                      <span className="text-[#a0a0a0] text-xs">
                        £{((player.value - bankBalance) / 1000000).toFixed(1)}m needed
                      </span>
                    )}
                    {clubLimit && (
                      <span className="text-orange-400 text-xs">Club limit</span>
                    )}
                    {canAfford && !clubLimit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyClick(player);
                        }}
                        className="bg-[#FF5500] text-white text-xs font-bold px-3 py-1 rounded hover:bg-[#e04400] transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setViewMode('own');
                setSoldPlayer(null);
                setAvailablePlayers([]);
              }}
              className="w-full mt-4 text-[#a0a0a0] text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white font-bold text-lg mb-4">Confirm Transfer</h3>
            <p className="text-[#a0a0a0] mb-4">
              Sell {selectedPlayer?.players?.name} for {formatValue(
                (selectedPlayer?.players?.value || 0) <= (selectedPlayer?.purchase_price || 0)
                  ? (selectedPlayer?.players?.value || 0)
                  : (selectedPlayer?.purchase_price || 0) + ((selectedPlayer?.players?.value || 0) - (selectedPlayer?.purchase_price || 0)) * 0.5
              )}?
            </p>
            {freeTransfers === 0 && (
              <p className="text-red-400 text-sm mb-4">This will cost -4 points</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSell}
                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-[#2a2a2a] text-white font-bold py-2 rounded-lg hover:bg-[#3a3a3a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersPage;
