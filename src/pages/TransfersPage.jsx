// TransfersPage.jsx — Transfer players in SLB Fantasy
// Supabase column checks:
// alter table users add column if not exists free_transfers_available int default 1;
// alter table users add column if not exists bank_balance int default 0;
// alter table user_squads add column if not exists purchase_price int default 0;
// alter table user_squads add column if not exists was_starter boolean default true;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const TransfersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [squadData, setSquadData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [freeTransfers, setFreeTransfers] = useState(1);
  const [bankBalance, setBankBalance] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewMode, setViewMode] = useState('own'); // 'own' or 'replacement'
  const [soldPlayer, setSoldPlayer] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [fixtures, setFixtures] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [settings, setSettings] = useState(null);
  const [emptySlots, setEmptySlots] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [buyingPlayer, setBuyingPlayer] = useState(null);
  const [pointsDeduction, setPointsDeduction] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]); // Track pending transfers
  const [showConfirmAllDialog, setShowConfirmAllDialog] = useState(false);
  const [initialBankBalance, setInitialBankBalance] = useState(0);
  const [initialFreeTransfers, setInitialFreeTransfers] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchData();
  }, [user]);

  // Pre-select player from ?incoming=<player_id> query param (from Players page "Add" button)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const incomingId = params.get('incoming');
    if (!incomingId || loading) return;
    const fetchIncoming = async () => {
      const { data } = await supabase
        .from('players')
        .select('*, slb_teams(*)')
        .eq('id', incomingId)
        .single();
      if (data) {
        setViewMode('replacement');
        setSoldPlayer({ players: { position: data.position } });
        fetchAvailablePlayers(data.position);
      }
    };
    fetchIncoming();
  }, [location.search, loading]);

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
      setFreeTransfers(userData.free_transfers_available || 1);
      setBankBalance(userData.bank_balance || 0);
      setInitialBankBalance(userData.bank_balance || 0);
      setInitialFreeTransfers(userData.free_transfers_available || 1);

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
        .gte('gameweek_number', currentGameweek)
        .order('gameweek_number', { ascending: true })
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

  const calculateSellPrice = (player, purchasePrice) => {
    const currentValue = player.value;
    if (currentValue <= purchasePrice) {
      return currentValue;
    }
    const profit = currentValue - purchasePrice;
    return purchasePrice + Math.floor(profit * 0.5);
  };

  const handleSellClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSell = async () => {
    try {
      // Calculate sell price with correct formula
      const purchasePrice = selectedPlayer.purchase_price || selectedPlayer.players?.value || 0;
      const sellPrice = calculateSellPrice(selectedPlayer.players, purchasePrice);

      // Add to pending transfers instead of committing immediately
      const newPendingTransfer = {
        type: 'sell',
        player: selectedPlayer,
        sellPrice: sellPrice,
        purchasePrice: purchasePrice
      };

      setPendingTransfers([...pendingTransfers, newPendingTransfer]);

      // Update local bank balance (preview)
      setBankBalance(bankBalance + sellPrice);

      // Remove from squad display (local only)
      setSquadData(squadData.filter(s => s.player_id !== selectedPlayer.player_id));

      // Add empty slot
      setEmptySlots([...emptySlots, { position: selectedPlayer.players?.position, slotIndex: emptySlots.length }]);

      // Show success toast
      setShowToast(`${selectedPlayer.players?.name} marked for transfer`);
      setTimeout(() => setShowToast(null), 3000);

      // Close panel
      setSelectedPlayer(null);
      setShowConfirmDialog(false);

    } catch (error) {
      console.error('Error selling player:', error);
      setShowToast('Error selling player. Please try again.');
      setTimeout(() => setShowToast(null), 3000);
      setShowConfirmDialog(false);
    }
  };

  const handleUndoSale = (transferIndex) => {
    const transfer = pendingTransfers[transferIndex];
    if (!transfer || transfer.type !== 'sell') return;

    // Remove from pending transfers
    const newPendingTransfers = pendingTransfers.filter((_, i) => i !== transferIndex);
    setPendingTransfers(newPendingTransfers);

    // Restore player to squad
    setSquadData([...squadData, transfer.player]);

    // Restore bank balance
    setBankBalance(bankBalance - transfer.sellPrice);

    // Remove empty slot
    const slotIndex = emptySlots.findIndex(slot => slot.position === transfer.player.players?.position);
    if (slotIndex !== -1) {
      const newEmptySlots = [...emptySlots];
      newEmptySlots.splice(slotIndex, 1);
      setEmptySlots(newEmptySlots);
    }

    setShowToast(`Undo: ${transfer.player.players?.name} restored to squad`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleConfirmAllTransfers = async () => {
    try {
      setShowConfirmAllDialog(false);

      // Commit all pending transfers to Supabase
      for (const transfer of pendingTransfers) {
        if (transfer.type === 'sell') {
          // Delete from user_squads
          await supabase
            .from('user_squads')
            .delete()
            .eq('user_id', user.id)
            .eq('player_id', transfer.player.player_id);
        }
      }

      // Update user transfers and bank
      const currentFreeTransfers = initialFreeTransfers;
      const transfersUsed = pendingTransfers.filter(t => t.type === 'sell').length;
      const newFreeTransfers = Math.max(0, currentFreeTransfers - transfersUsed);
      const newBankBalance = bankBalance;

      // Set points deduction flag if no free transfers
      if (currentFreeTransfers === 0) {
        setPointsDeduction(true);
      }

      await supabase
        .from('users')
        .update({
          free_transfers_available: newFreeTransfers,
          bank_balance: newBankBalance
        })
        .eq('id', user.id);

      // Refetch user data to refresh display
      const { data: refreshed } = await supabase
        .from('users')
        .select('free_transfers_available, bank_balance')
        .eq('id', user.id)
        .single();

      if (refreshed) {
        setFreeTransfers(refreshed.free_transfers_available);
        setBankBalance(refreshed.bank_balance);
        setInitialFreeTransfers(refreshed.free_transfers_available);
        setInitialBankBalance(refreshed.bank_balance);
      }

      // Refresh squad display
      const { data: updatedSquad } = await supabase
        .from('user_squads')
        .select('*, players(*, slb_teams(*))')
        .eq('user_id', user.id);

      if (updatedSquad) setSquadData(updatedSquad);

      // Clear pending transfers
      setPendingTransfers([]);

      // Show success toast
      setShowToast(`${transfersUsed} transfer${transfersUsed !== 1 ? 's' : ''} confirmed!`);
      setTimeout(() => setShowToast(null), 3000);

    } catch (error) {
      console.error('Error confirming transfers:', error);
      setShowToast('Error confirming transfers. Please try again.');
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleResetAll = () => {
    // Restore initial state
    setBankBalance(initialBankBalance);
    setFreeTransfers(initialFreeTransfers);
    setPendingTransfers([]);
    setEmptySlots([]);
    setPointsDeduction(false);

    // Refetch squad data
    fetchData();

    setShowToast('All pending transfers reset');
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleBuyClick = (player) => {
    setBuyingPlayer(player);
    setShowBuyConfirm(true);
  };

  const handleConfirmBuy = async () => {
    try {
      const player = buyingPlayer;
      if (!player) return;

      // Validate budget
      const playerValue = player.value || 0;
      const currentBank = userData.bank_balance || 0;

      if (playerValue > currentBank) {
        setShowToast(`Insufficient funds — you need £${((playerValue - currentBank) / 1000000).toFixed(1)}m more`);
        setTimeout(() => setShowToast(null), 3000);
        setShowBuyConfirm(false);
        return;
      }

      // Check club limit (exclude sold player)
      const clubCounts = squadData.reduce((acc, s) => {
        const teamId = s.players?.slb_teams?.id;
        if (teamId) acc[teamId] = (acc[teamId] || 0) + 1;
        return acc;
      }, {});

      const teamId = player.slb_teams?.id;
      const count = clubCounts[teamId] || 0;
      const isClubLimited = count >= 2;

      if (isClubLimited) {
        setShowToast('Club limit reached (max 2 players per team)');
        setTimeout(() => setShowToast(null), 3000);
        setShowBuyConfirm(false);
        return;
      }

      // Insert into user_squads
      const { error: insertError } = await supabase
        .from('user_squads')
        .insert({
          user_id: user.id,
          player_id: player.id,
          is_starter: true,
          purchase_price: player.value
        });

      if (insertError) throw insertError;

      // Update bank balance with floor at 0
      const newBalance = Math.max(0, currentBank - playerValue);
      const { error: updateError } = await supabase
        .from('users')
        .update({
          bank_balance: newBalance
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Remove empty slot
      const slotIndex = emptySlots.findIndex(slot => slot.position === player.position);
      if (slotIndex !== -1) {
        const newEmptySlots = [...emptySlots];
        newEmptySlots.splice(slotIndex, 1);
        setEmptySlots(newEmptySlots);
      }

      // Show success toast
      setShowToast(`${player.name} added to your squad!`);
      setTimeout(() => setShowToast(null), 3000);

      // Close panel and refresh
      setSelectedPlayer(null);
      setViewMode('own');
      setShowBuyConfirm(false);
      setBuyingPlayer(null);
      fetchData();

    } catch (error) {
      console.error('Error buying player:', error);
      setShowToast('Error buying player. Please try again.');
      setTimeout(() => setShowToast(null), 3000);
      setShowBuyConfirm(false);
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

  const handleEmptySlotClick = (slot) => {
    setSelectedPlayer(null);
    setViewMode('replacement');
    setSoldPlayer({ players: { position: slot.position } });
    fetchAvailablePlayers(slot.position);
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
  const usedTransfers = pendingTransfers.filter(t => t.type === 'sell').length;
  const totalBudget = 100000000;

  // Reusable squad row component
  const SquadRow = ({ squadPlayer }) => {
    const isTransferringOut = pendingTransfers.some(t => t.player.player_id === squadPlayer.player_id);
    const isSelected = selectedPlayer?.player_id === squadPlayer.player_id;
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
          isTransferringOut
            ? 'bg-[#1A1A1A] border-l-4 border-[#F4622A] border-t-[#222222] border-r-[#222222] border-b-[#222222]'
            : isSelected
            ? 'bg-[#1A1A1A] border-[#F4622A]'
            : 'bg-[#111111] border-[#222222] hover:border-[#F4622A]'
        }`}
        onClick={() => !isTransferringOut && handlePlayerClick(squadPlayer)}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: squadPlayer.players?.slb_teams?.primary_colour || '#666' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{squadPlayer.players?.name}</p>
          <p className="text-[#A0A0A0] text-xs">{squadPlayer.players?.slb_teams?.short_name}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          squadPlayer.players?.position === 'G' ? 'bg-[#F4622A]/20 text-[#F4622A]' :
          squadPlayer.players?.position === 'F' ? 'bg-[#C9A84C]/20 text-[#C9A84C]' :
          'bg-white/10 text-white'
        }`}>{squadPlayer.players?.position}</span>
        <span className="text-[#F4622A] font-bold text-sm w-8 text-right">{squadPlayer.players?.gw_points || 0}</span>
        <span className="text-[#C9A84C] text-sm w-12 text-right">{formatValue(squadPlayer.players?.value)}</span>
        {isTransferringOut ? (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[#F4622A] text-xs font-semibold">Out</span>
            <button
              onClick={(e) => { e.stopPropagation(); const idx = pendingTransfers.findIndex(t => t.player.player_id === squadPlayer.player_id); if (idx !== -1) handleUndoSale(idx); }}
              className="text-[#666666] text-xs hover:text-white transition-colors"
            >Undo</button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayerClick(squadPlayer); }}
            className="ml-2 text-[#666666] hover:text-[#F4622A] transition-colors flex-shrink-0"
            title="Transfer Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-1">TRANSFERS</h1>
            <p className="text-[#666666] text-sm">Select a player to transfer out</p>
          </div>
          {/* Stats pills */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-[#111111] border border-[#222222] rounded-lg px-4 py-2 text-center">
              <p className="text-[#666666] text-[10px] uppercase tracking-wide">Free</p>
              <p className={`font-bold text-base ${freeTransfers > 0 ? 'text-white' : 'text-red-400'}`}>{freeTransfers}</p>
            </div>
            <div className="bg-[#111111] border border-[#222222] rounded-lg px-4 py-2 text-center">
              <p className="text-[#666666] text-[10px] uppercase tracking-wide">Bank</p>
              <p className="font-bold text-base text-[#C9A84C]">{formatValue(bankBalance)}</p>
            </div>
            {(freeTransfers === 0 || pointsDeduction) && (
              <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg px-3 py-2">
                <p className="text-orange-400 text-xs font-semibold">-4 pts penalty</p>
              </div>
            )}
          </div>
        </div>
        {/* Mobile stats */}
        <div className="sm:hidden max-w-7xl mx-auto mt-3 flex gap-2">
          <div className="flex-1 bg-[#111111] border border-[#222222] rounded-lg px-3 py-2 text-center">
            <p className="text-[#666666] text-[10px]">Free Transfers</p>
            <p className={`font-bold text-sm ${freeTransfers > 0 ? 'text-white' : 'text-red-400'}`}>{freeTransfers}</p>
          </div>
          <div className="flex-1 bg-[#111111] border border-[#222222] rounded-lg px-3 py-2 text-center">
            <p className="text-[#666666] text-[10px]">Bank</p>
            <p className="font-bold text-sm text-[#C9A84C]">{formatValue(bankBalance)}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="px-4 sm:px-6 pb-28">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

          {/* LEFT — Your Squad (60%) */}
          <div className="lg:w-[60%] space-y-5">
            {/* Guards */}
            <div>
              <p className="text-[#C9A84C] font-bold text-[11px] uppercase tracking-widest mb-2">Guards</p>
              <div className="space-y-2">
                {guards.map(sp => <SquadRow key={sp.player_id} squadPlayer={sp} />)}
                {emptySlots.filter(s => s.position === 'G').map((slot, idx) => (
                  <button key={`eg-${idx}`} onClick={() => handleEmptySlotClick(slot)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#F4622A]/40 hover:border-[#F4622A] transition-colors text-[#F4622A] text-sm font-semibold">
                    <span className="text-xl leading-none">+</span> Add Guard
                  </button>
                ))}
              </div>
            </div>

            {/* Forwards */}
            <div>
              <p className="text-[#C9A84C] font-bold text-[11px] uppercase tracking-widest mb-2">Forwards</p>
              <div className="space-y-2">
                {forwards.map(sp => <SquadRow key={sp.player_id} squadPlayer={sp} />)}
                {emptySlots.filter(s => s.position === 'F').map((slot, idx) => (
                  <button key={`ef-${idx}`} onClick={() => handleEmptySlotClick(slot)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#F4622A]/40 hover:border-[#F4622A] transition-colors text-[#F4622A] text-sm font-semibold">
                    <span className="text-xl leading-none">+</span> Add Forward
                  </button>
                ))}
              </div>
            </div>

            {/* Centres */}
            <div>
              <p className="text-[#C9A84C] font-bold text-[11px] uppercase tracking-widest mb-2">Centres</p>
              <div className="space-y-2">
                {centres.map(sp => <SquadRow key={sp.player_id} squadPlayer={sp} />)}
                {emptySlots.filter(s => s.position === 'C').map((slot, idx) => (
                  <button key={`ec-${idx}`} onClick={() => handleEmptySlotClick(slot)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#F4622A]/40 hover:border-[#F4622A] transition-colors text-[#F4622A] text-sm font-semibold">
                    <span className="text-xl leading-none">+</span> Add Centre
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Replacement Picker (40%) */}
          <div className="lg:w-[40%]">
            {viewMode === 'replacement' ? (
              <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-4 border-b border-[#222222] flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">SELECT REPLACEMENT</p>
                    <p className="text-[#666666] text-xs mt-0.5">{soldPlayer?.players?.position} — {formatValue(bankBalance)} available</p>
                  </div>
                  <button
                    onClick={() => { setViewMode('own'); setSoldPlayer(null); setAvailablePlayers([]); setSelectedPlayer(null); }}
                    className="text-[#666666] hover:text-white text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Search + Sort */}
                <div className="px-4 py-3 border-b border-[#1A1A1A] space-y-2">
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#F4622A]"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4622A]"
                  >
                    <option value="value">Best value</option>
                    <option value="points">Most points</option>
                    <option value="price_high">Price high-low</option>
                    <option value="price_low">Price low-high</option>
                  </select>
                </div>

                {/* Player list */}
                <div className="overflow-y-auto max-h-[480px] divide-y divide-[#1A1A1A]">
                  {filterAndSortPlayers().map((player) => {
                    const canAfford = player.value <= bankBalance;
                    const clubCounts = squadData.reduce((acc, s) => {
                      const tid = s.players?.slb_teams?.id;
                      if (tid) acc[tid] = (acc[tid] || 0) + 1;
                      return acc;
                    }, {});
                    const isClubLimited = (clubCounts[player.slb_teams?.id] || 0) >= 2;
                    const disabled = !canAfford || isClubLimited;
                    return (
                      <div
                        key={player.id}
                        onClick={() => !disabled && handleBuyClick(player)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1A1A1A]'}`}
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: player.slb_teams?.primary_colour || '#666' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                          <p className="text-[#666666] text-xs">{player.slb_teams?.short_name}</p>
                        </div>
                        <span className="text-[#F4622A] text-xs font-bold w-8 text-right">{player.gw_points || 0}</span>
                        <span className="text-[#C9A84C] text-sm font-semibold w-12 text-right">{formatValue(player.value)}</span>
                        {!disabled && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBuyClick(player); }}
                            className="ml-1 bg-[#F4622A] text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-[#d4521a] transition-colors flex-shrink-0"
                          >
                            Add
                          </button>
                        )}
                        {isClubLimited && <span className="text-orange-400 text-xs ml-1 flex-shrink-0">Limit</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Empty state when no player selected */
              <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </div>
                <p className="text-[#666666] text-sm">Select a player from your squad to see replacement options</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur border-t border-[#222222] px-4 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            {pendingTransfers.length > 0 ? (
              <>
                <p className="text-white font-semibold text-sm">{pendingTransfers.length} transfer{pendingTransfers.length !== 1 ? 's' : ''} pending</p>
                <p className="text-[#666666] text-xs">{freeTransfers > 0 ? 'No points cost' : `-${pendingTransfers.length * 4} pts deduction`}</p>
              </>
            ) : (
              <p className="text-[#666666] text-sm">{freeTransfers} free transfer{freeTransfers !== 1 ? 's' : ''} available</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              disabled={pendingTransfers.length === 0}
              className="px-4 py-2 border border-[#333333] text-[#A0A0A0] font-semibold text-sm rounded-lg hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Reset All
            </button>
            <button
              onClick={() => setShowConfirmAllDialog(true)}
              disabled={pendingTransfers.length === 0}
              className="px-5 py-2 bg-[#F4622A] text-white font-semibold text-sm rounded-lg hover:bg-[#d4521a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Confirm All Transfers Dialog */}
      {showConfirmAllDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-2">Confirm Transfers</h3>
            <p className="text-gray-400 mb-4">
              Are you sure? This will use {pendingTransfers.length} of your free transfers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmAllDialog(false)}
                className="flex-1 px-4 py-2 border border-[#2A2A2A] text-white font-semibold text-sm rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAllTransfers}
                className="flex-1 px-4 py-2 bg-[#F4622A] text-white font-semibold text-sm rounded-lg hover:bg-[#d4521a] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-2">Confirm Transfer</h3>
            <p className="text-gray-400 mb-1">
              Sell {selectedPlayer?.players?.name} for £{(
                calculateSellPrice(
                  selectedPlayer?.players,
                  selectedPlayer?.purchase_price || selectedPlayer?.players?.value || 0
                ) / 1000000
              ).toFixed(1)}m?
            </p>
            {freeTransfers === 0 && (
              <p className="text-red-400 text-sm mb-4">⚠️ This will cost -4 points</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirmSell}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold"
              >
                Confirm Sale
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-[#2A2A2A] text-gray-400 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Confirmation Dialog */}
      {showBuyConfirm && buyingPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-2">Confirm Transfer</h3>
            <p className="text-gray-400 mb-1">
              Buy {buyingPlayer.name} for £{(buyingPlayer.value / 1000000).toFixed(1)}m?
            </p>
            {freeTransfers === 0 && (
              <p className="text-red-400 text-sm mb-4">⚠️ This will cost -4 points</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirmBuy}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold"
              >
                Confirm Buy
              </button>
              <button
                onClick={() => {
                  setShowBuyConfirm(false);
                  setBuyingPlayer(null);
                }}
                className="flex-1 bg-[#2A2A2A] text-gray-400 py-2 rounded-lg"
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
