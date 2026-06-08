// FantasyPage.jsx — Main fantasy hub: My Team court view and My Leagues tab
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';
import halfCourt from '../assets/half-court.svg';
import Jersey from '../components/Jersey.jsx';
import { getTeamColours } from '../constants/teamColours.js';

const FantasyPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('team');
  const [view, setView] = useState('court');
  const [myLeagues, setMyLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [hasSquad, setHasSquad] = useState(false);
  const [squadValue, setSquadValue] = useState(0);
  const [bank, setBank] = useState(100000000);
  const [formation, setFormation] = useState('2G-2F-1C');
  const [captain, setCaptain] = useState(null);
  const [viceCaptain, setViceCaptain] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [squadData, setSquadData] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState(null);
  const [swapError, setSwapError] = useState(null);       // { ids: [id, id] } for red-flash
  const [swapToast, setSwapToast] = useState(null);       // string message

  // Create Private League form state
  const [leagueName, setLeagueName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  // Join League form state
  const [privateInviteCode, setPrivateInviteCode] = useState('');
  const [joiningPublic, setJoiningPublic] = useState(false);
  const [joiningPrivate, setJoiningPrivate] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const [joinError, setJoinError] = useState('');

  const startingPlayers = [
    { id: 1, name: 'Aaryn Rai', position: 'PG', team: 'LEI', teamColour: '#003366', points: 12, isCaptain: true, isViceCaptain: false },
    { id: 2, name: 'Jordan Hunt', position: 'SG', team: 'LDN', teamColour: '#FF5C00', points: 8, isCaptain: false, isViceCaptain: false },
    { id: 3, name: 'Marcus Webb', position: 'SF', team: 'NEW', teamColour: '#0066CC', points: 6, isCaptain: false, isViceCaptain: false },
    { id: 4, name: 'Tyler James', position: 'PF', team: 'BRI', teamColour: '#FF6600', points: 4, isCaptain: false, isViceCaptain: true },
    { id: 5, name: 'Devon Bell', position: 'C', team: 'CHE', teamColour: '#0066CC', points: 17, isCaptain: false, isViceCaptain: false }
  ];

  const mockBenchPlayers = [
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

  const allPlayers = [...startingPlayers, ...mockBenchPlayers.filter(p => p.name)];

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchUserSquad = async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Fetch squad_confirmed, formation, and bank_balance from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('squad_confirmed, formation, bank_balance')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      setHasSquad(userData?.squad_confirmed || false);
      if (userData?.formation) {
        setFormation(userData.formation);
      }
      // Use bank_balance from DB — same source TransfersPage writes to
      setBank(userData?.bank_balance ?? 100000000);

      // Fetch user squad with player values and captain/vice captain
      const { data: squadData, error: squadError } = await supabase
        .from('user_squads')
        .select('*, players(*, slb_teams(*))')
        .eq('user_id', user.id);

      if (squadError) throw squadError;

      setSquadData(squadData || []);

      const calculatedSquadValue = squadData?.reduce((sum, s) => {
        const cost = s.purchase_price != null ? s.purchase_price : (s.players?.value || 0);
        return sum + cost;
      }, 0) || 0;
      setSquadValue(calculatedSquadValue);

      // Load captain and vice captain
      const captainData = squadData?.find(s => s.is_captain);
      const viceCaptainData = squadData?.find(s => s.is_vice_captain);
      setCaptain(captainData?.player_id || null);
      setViceCaptain(viceCaptainData?.player_id || null);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchMyLeagues = async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Fetch user's league memberships with league details
      const { data: memberships, error: membershipError } = await supabase
        .from('league_members')
        .select(`
          league_id,
          leagues (
            id,
            name,
            max_managers,
            league_type,
            draft_complete,
            commissioner_id
          ),
          users (
            username,
            team_name
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setMyLeagues([]);
        setLoading(false);
        return;
      }

      // Get all league IDs
      const leagueIds = memberships.map(m => m.league_id);

      // Fetch all members for all leagues in one query
      const { data: allMembers, error: membersError } = await supabase
        .from('league_members')
        .select(`
          league_id,
          user_id,
          total_points,
          gameweek_points,
          users (
            username,
            team_name
          )
        `)
        .in('league_id', leagueIds);

      if (membersError) throw membersError;

      // Group members by league and sort by total_points
      const membersByLeague = {};
      (allMembers || []).forEach(member => {
        if (!membersByLeague[member.league_id]) {
          membersByLeague[member.league_id] = [];
        }
        membersByLeague[member.league_id].push(member);
      });

      // Sort each league's members by total_points
      Object.keys(membersByLeague).forEach(leagueId => {
        membersByLeague[leagueId].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      });

      // Build leagues with standings data
      const leaguesWithStandings = memberships.map(membership => {
        const league = membership.leagues;
        const leagueMembers = membersByLeague[league.id] || [];
        const currentUserRank = leagueMembers.findIndex(m => m.user_id === user.id) + 1;

        return {
          ...league,
          member_count: leagueMembers.length,
          is_commissioner: league.commissioner_id === user.id,
          members: leagueMembers,
          current_user_rank: currentUserRank || '-'
        };
      });

      setMyLeagues(leaguesWithStandings);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleFormationChange = async (newFormation) => {
    setFormation(newFormation);
    try {
      await supabase
        .from('users')
        .update({ formation: newFormation })
        .eq('id', user.id);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleCaptainChange = async (playerId) => {
    setCaptain(playerId);
    try {
      // Remove old captain
      await supabase
        .from('user_squads')
        .update({ is_captain: false })
        .eq('user_id', user.id);

      // Set new captain
      await supabase
        .from('user_squads')
        .update({ is_captain: true })
        .eq('user_id', user.id)
        .eq('player_id', playerId);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleViceCaptainChange = async (playerId) => {
    setViceCaptain(playerId);
    try {
      // Remove old vice captain
      await supabase
        .from('user_squads')
        .update({ is_vice_captain: false })
        .eq('user_id', user.id);

      // Set new vice captain
      await supabase
        .from('user_squads')
        .update({ is_vice_captain: true })
        .eq('user_id', user.id)
        .eq('player_id', playerId);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleSetCaptain = async (player) => {
    setCaptain(player.player_id);
    setSelectedPlayer(null);
    try {
      // Remove old captain
      await supabase
        .from('user_squads')
        .update({ is_captain: false })
        .eq('user_id', user.id);

      // Set new captain
      await supabase
        .from('user_squads')
        .update({ is_captain: true })
        .eq('user_id', user.id)
        .eq('player_id', player.player_id);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleSetViceCaptain = async (player) => {
    setViceCaptain(player.player_id);
    setSelectedPlayer(null);
    try {
      // Remove old vice captain
      await supabase
        .from('user_squads')
        .update({ is_vice_captain: false })
        .eq('user_id', user.id);

      // Set new vice captain
      await supabase
        .from('user_squads')
        .update({ is_vice_captain: true })
        .eq('user_id', user.id)
        .eq('player_id', player.player_id);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleRemoveCaptain = async (player) => {
    setCaptain(null);
    setSelectedPlayer(null);
    try {
      await supabase
        .from('user_squads')
        .update({ is_captain: false })
        .eq('user_id', user.id);
    } catch (error) {
      // Silent error handling
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, squadItem) => {
    setDraggedId(squadItem.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, squadItem) => {
    e.preventDefault();
    if (squadItem && squadItem.id !== draggedId) {
      setDragOverTarget(squadItem);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const showSwapToast = (msg) => {
    setSwapToast(msg);
    setTimeout(() => setSwapToast(null), 2500);
  };

  const flashInvalidSwap = (idA, idB) => {
    setSwapError({ ids: [idA, idB] });
    setTimeout(() => setSwapError(null), 600);
  };

  // Validate and execute a swap. Position-agnostic — any swap is allowed as long
  // as the resulting court composition passes all rules.
  const swapPlayers = async (playerA, playerB) => {
    const posLabel = { G: 'Guard', F: 'Forward', C: 'Centre' };
    const { courtPlayers: currentCourt } = getCourtAndBenchPlayers();

    const aOnCourt = currentCourt.some(p => p.id === playerA.id);
    const bOnCourt = currentCourt.some(p => p.id === playerB.id);
    const crossingBoundary = aOnCourt !== bOnCourt; // one on court, one on bench

    if (crossingBoundary) {
      // Simulate the resulting court after swap
      const courtPlayer = aOnCourt ? playerA : playerB;
      const benchPlayer = aOnCourt ? playerB : playerA;
      const simCourt = currentCourt
        .filter(p => p.id !== courtPlayer.id)
        .concat(benchPlayer);

      const count = (pos) => simCourt.filter(p => normPos(p.players?.position) === pos).length;

      // Min 1 of each position
      for (const pos of ['G', 'F', 'C']) {
        if (count(pos) < 1) {
          flashInvalidSwap(playerA.id, playerB.id);
          showSwapToast(`Court must have at least 1 ${posLabel[pos]}`);
          return;
        }
      }
      // Max 2 Centres
      if (count('C') > 2) {
        flashInvalidSwap(playerA.id, playerB.id);
        showSwapToast('Maximum 2 Centres allowed on court');
        return;
      }
    }

    const aStarter = playerA.is_starter;
    const bStarter = playerB.is_starter;

    // If a captain/VC is being moved to bench, strip their badge
    let captainUpdate = captain;
    let vcUpdate = viceCaptain;
    if (crossingBoundary) {
      const movingToBench = aOnCourt ? playerA : playerB;
      if (movingToBench.player_id === captain) {
        captainUpdate = null;
        setCaptain(null);
        showSwapToast('Captain moved to bench — please assign a new captain');
        try { await supabase.from('user_squads').update({ is_captain: false }).eq('user_id', user.id); } catch {}
      }
      if (movingToBench.player_id === viceCaptain) {
        vcUpdate = null;
        setViceCaptain(null);
        showSwapToast('Vice Captain moved to bench — please assign a new vice captain');
        try { await supabase.from('user_squads').update({ is_vice_captain: false }).eq('user_id', user.id); } catch {}
      }
    }

    setSquadData(prev => {
      const next = [...prev];
      const idxA = next.findIndex(s => s.id === playerA.id);
      const idxB = next.findIndex(s => s.id === playerB.id);
      next[idxA] = { ...playerB, is_starter: aStarter };
      next[idxB] = { ...playerA, is_starter: bStarter };
      return next;
    });

    if (aStarter !== bStarter) {
      try {
        await supabase.from('user_squads').update({ is_starter: bStarter }).eq('id', playerA.id);
        await supabase.from('user_squads').update({ is_starter: aStarter }).eq('id', playerB.id);
      } catch (error) {
        console.error('Error saving formation:', error);
      }
    }
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedId || draggedId === targetItem.id) { setDraggedId(null); return; }
    const draggedItem = squadData.find(s => s.id === draggedId);
    if (draggedItem) await swapPlayers(draggedItem, targetItem);
    setDraggedId(null);
  };

  // Mobile tap-to-swap
  const handleTap = async (squadItem) => {
    if (!selectedForSwap) { setSelectedForSwap(squadItem.id); return; }
    if (selectedForSwap === squadItem.id) { setSelectedForSwap(null); return; }
    const firstItem = squadData.find(s => s.id === selectedForSwap);
    if (firstItem) await swapPlayers(firstItem, squadItem);
    setSelectedForSwap(null);
  };

  const handlePlayerClick = (squadItem, e) => {
    setSelectedPlayer(squadItem);
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Absolute positions for 5 starting players on the half-court (as % of container)
  // 2 guards top, 2 forwards middle, 1 centre post
  const courtSlotPositions = [
    { top: '14%', left: '22%' },  // Guard 1
    { top: '14%', left: '78%' },  // Guard 2
    { top: '52%', left: '18%' },  // Forward 1
    { top: '52%', left: '82%' },  // Forward 2
    { top: '78%', left: '50%' },  // Centre
  ];

  // Normalise position strings to G / F / C
  const normPos = (pos) => {
    if (!pos) return null;
    if (pos === 'G' || pos === 'PG' || pos === 'SG') return 'G';
    if (pos === 'F' || pos === 'SF' || pos === 'PF') return 'F';
    if (pos === 'C') return 'C';
    return null;
  };

  // Split squad into 5 starters (court) and 4 bench players using is_starter flag.
  // Fallback when flag not set: first 5 by position order (G → F → C).
  const getCourtAndBenchPlayers = () => {
    if (!squadData || squadData.length === 0) {
      return { courtPlayers: [], benchPlayers: [] };
    }

    const hasFlags = squadData.some(s => s.is_starter === true || s.is_starter === false);
    if (hasFlags) {
      const starters = squadData.filter(s => s.is_starter);
      const nonStarters = squadData.filter(s => !s.is_starter);
      // If everyone is marked starter (e.g. seeded with all is_starter=true),
      // cap court at 5 and treat the overflow as bench players
      const courtPlayers = starters.slice(0, 5);
      const benchPlayers = nonStarters.length >= 4
        ? nonStarters.slice(0, 4)
        : [...nonStarters, ...starters.slice(5)].slice(0, 4);
      return { courtPlayers, benchPlayers };
    }

    // Fallback: order G first, then F, then C; first 5 to court
    const posOrder = { G: 0, F: 1, C: 2 };
    const sorted = [...squadData].sort((a, b) =>
      (posOrder[normPos(a.players?.position)] ?? 9) - (posOrder[normPos(b.players?.position)] ?? 9)
    );
    return { courtPlayers: sorted.slice(0, 5), benchPlayers: sorted.slice(5, 9) };
  };

  const { courtPlayers, benchPlayers } = getCourtAndBenchPlayers();

  // Auto-sub map: courtPlayer.id → bench replacement when starter scored 0 pts
  // and a bench player of the same position did score
  const autoSubMap = (() => {
    const map = {};
    const usedBenchIds = new Set();
    for (const cp of courtPlayers) {
      if ((cp.players?.gw_points || 0) > 0) continue;
      const cpPos = normPos(cp.players?.position);
      const sub = benchPlayers.find(
        bp => !usedBenchIds.has(bp.id) && normPos(bp.players?.position) === cpPos && (bp.players?.gw_points || 0) > 0
      );
      if (sub) { map[cp.id] = sub; usedBenchIds.add(sub.id); }
    }
    return map;
  })();

  const gCount = courtPlayers.filter(s => normPos(s.players?.position) === 'G').length;
  const fCount = courtPlayers.filter(s => normPos(s.players?.position) === 'F').length;
  const cCount = courtPlayers.filter(s => normPos(s.players?.position) === 'C').length;
  const formationLabel = `${gCount}G · ${fCount}F · ${cCount}C`;

  // Calculate total points with captain double and auto-sub
  const totalPoints = courtPlayers.reduce((sum, s) => {
    const sub = autoSubMap[s.id];
    const pts = sub ? (sub.players?.gw_points || 0) : (s.players?.gw_points || 0);
    const isCapt = s.is_captain;
    return sum + (isCapt ? pts * 2 : pts);
  }, 0);

  // Count players scoring
  const playersScoring = courtPlayers.filter(s => (s.players?.gw_points || 0) > 0).length;

  useEffect(() => {
    fetchSettings();
    fetchMyLeagues();
    fetchUserSquad();
  }, [user]);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for(let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  };

  const handleCreatePrivateLeague = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateSuccess(null);

    try {
      const inviteCode = generateInviteCode();

      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .insert({
          name: leagueName,
          league_type: 'private',
          max_managers: 8,
          commissioner_id: user.id,
          invite_code: inviteCode,
          draft_complete: false
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      setCreateSuccess(inviteCode);
      setLeagueName('');
      fetchMyLeagues();
    } catch (error) {
      setCreateSuccess(null);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinPublicLeague = async () => {
    setJoiningPublic(true);
    setJoinSuccess(null);
    setJoinError('');

    try {
      const { data: publicLeagues, error } = await supabase
        .from('leagues')
        .select('id, name, max_managers, league_type')
        .eq('league_type', 'public')
        .order('created_at', { ascending: true });

      if (error) throw error;

      for (const league of publicLeagues || []) {
        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', league.id);

        const { data: existing } = await supabase
          .from('league_members')
          .select('id')
          .eq('league_id', league.id)
          .eq('user_id', user.id)
          .single();

        if (count < league.max_managers && !existing) {
          const { error: joinError } = await supabase
            .from('league_members')
            .insert({
              league_id: league.id,
              user_id: user.id
            });

          if (joinError) throw joinError;

          setJoinSuccess('Successfully joined a public league!');
          fetchMyLeagues();
          return;
        }
      }

      setJoinError('No available public leagues at the moment. Try creating a private league instead.');
    } catch (error) {
      setJoinError('Failed to join public league. Please try again.');
    } finally {
      setJoiningPublic(false);
    }
  };

  const handleJoinPrivateLeague = async (e) => {
    e.preventDefault();
    setJoiningPrivate(true);
    setJoinSuccess(null);
    setJoinError('');

    try {
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, max_managers')
        .eq('invite_code', privateInviteCode)
        .single();

      if (leagueError) throw leagueError;

      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueData.id);

      if (count >= leagueData.max_managers) {
        setJoinError('This league is full.');
        setJoiningPrivate(false);
        return;
      }

      const { data: existing } = await supabase
        .from('league_members')
        .select('id')
        .eq('league_id', leagueData.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setJoinError('You are already a member of this league.');
        setJoiningPrivate(false);
        return;
      }

      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      setJoinSuccess('Successfully joined the league!');
      setPrivateInviteCode('');
      fetchMyLeagues();
    } catch (error) {
      setJoinError('Invalid invite code or league not found.');
    } finally {
      setJoiningPrivate(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="px-4 sm:px-8 pt-24 sm:pt-32 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-white font-bold text-4xl sm:text-[36px] leading-none mb-2">{user?.team_name || 'MY TEAM'}</h1>
              <p className="text-[#C9A84C] font-semibold text-[14px] uppercase tracking-widest">GAMEWEEK {settings?.current_gameweek || 1}</p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#F4622A] font-bold text-5xl sm:text-[48px] leading-none">{totalPoints}</span>
              <span className="text-[#C9A84C] font-semibold text-sm uppercase tracking-wider">PTS</span>
            </div>
          </div>
          
          {/* Quick Stats Pills */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="bg-[#1A1A1A] px-4 py-2 rounded-lg border border-[#222222]">
              <span className="text-[#A0A0A0] text-xs mr-2">Budget</span>
              <span className="text-white font-bold text-sm">£{(Math.max(0, bank) / 1000000).toFixed(1)}m</span>
            </div>
            <div className="bg-[#1A1A1A] px-4 py-2 rounded-lg border border-[#222222]">
              <span className="text-[#A0A0A0] text-xs mr-2">Transfers</span>
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <Link
              to="/transfers"
              className="bg-[#F4622A] text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-[#d4521a] transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v14l-7-7 7-7"/>
                <path d="M17 10v14l7-7-7-7"/>
                <path d="M14 4l-4 4 4 4"/>
                <path d="M10 8l4-4-4-4"/>
              </svg>
              Make Transfers
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Column - Court (~65%) */}
          <div className="w-full lg:w-[65%]">
            {!hasSquad && settings?.season_state === 'pre_season' && (
              <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 text-center">
                <h2 className="text-white font-bold text-xl mb-2 uppercase">Build Your Squad</h2>
                <p className="text-[#A0A0A0] text-sm mb-4">Select 9 players within £100m budget to get started</p>
                <Link
                  to="/squad-selection"
                  className="inline-block bg-[#F4622A] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#d4521a] transition-colors"
                >
                  Build Your Squad →
                </Link>
              </div>
            )}

            {hasSquad && (
              <>
                {/* Swap error toast */}
                {swapToast && (
                  <div className="mb-3 bg-[#1A1A1A] border border-[#EF4444] text-[#EF4444] text-sm font-semibold rounded-xl px-4 py-3 text-center">
                    {swapToast}
                  </div>
                )}

                {/* Basketball Court */}
                <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-4 sm:p-6" style={{ boxShadow: 'inset 0 0 40px rgba(244, 98, 42, 0.05)' }}>
                  {/* Court Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '60%',
                      backgroundColor: '#1A1A1A'
                    }}
                  >
                    {/* Court image as background layer */}
                    <img
                      src={halfCourt}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        opacity: 1,
                        zIndex: 0,
                        pointerEvents: 'none'
                      }}
                      alt=""
                    />

                    {/* 5 starting players — absolutely positioned on the court */}
                    <div
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                      onClick={() => setSelectedPlayer(null)}
                    >
                      {courtSlotPositions.map((slotPos, index) => {
                        const player = courtPlayers[index];
                        const isCaptain = captain === player?.player_id;
                        const isViceCaptain = viceCaptain === player?.player_id;
                        const isDragged = draggedId === player?.id;
                        const isDragOver = dragOverTarget?.id === player?.id;
                        const isSelectedForSwap = selectedForSwap === player?.id;
                        const isInvalidSwap = swapError?.ids.includes(player?.id);

                        // Empty slot
                        if (!player || !player.players) {
                          return (
                            <div
                              key={`empty-court-${index}`}
                              style={{
                                position: 'absolute',
                                top: slotPos.top,
                                left: slotPos.left,
                                transform: 'translate(-50%, -50%)',
                                width: '70px',
                                textAlign: 'center',
                              }}
                            >
                              <div className="border-2 border-dashed border-[#2E2E2E] rounded-xl flex items-center justify-center" style={{ width: '70px', height: '90px' }}>
                                <span className="text-[#555555] text-[11px] font-semibold uppercase tracking-wider">Empty</span>
                              </div>
                            </div>
                          );
                        }

                        const autoSub = autoSubMap[player.id];

                        return (
                          <div
                            key={player.player_id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, player)}
                            onDragOver={(e) => handleDragOver(e, player)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, player)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.innerWidth < 768) handleTap(player);
                              else handlePlayerClick(player, e);
                            }}
                            style={{
                              position: 'absolute',
                              top: slotPos.top,
                              left: slotPos.left,
                              transform: 'translate(-50%, -50%)',
                              opacity: isDragged ? 0.4 : 1,
                              cursor: 'pointer',
                              zIndex: isSelectedForSwap ? 3 : 2,
                            }}
                          >
                            <div
                              className="bg-[#111111] border rounded-xl p-2 hover:border-[#F4622A] transition-all text-center"
                              style={{
                                position: 'relative',
                                borderColor: isInvalidSwap ? '#EF4444' : isDragOver || isSelectedForSwap ? '#F4622A' : autoSub ? '#C9A84C' : '#222222',
                                boxShadow: isInvalidSwap ? '0 0 0 2px #EF4444' : isSelectedForSwap ? '0 0 0 2px #F4622A' : 'none',
                                minWidth: '64px',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                              }}
                            >
                              {isCaptain && (
                                <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#C9A84C', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', zIndex: 2 }}>C</div>
                              )}
                              {isViceCaptain && (
                                <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#666666', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', zIndex: 2 }}>V</div>
                              )}
                              {autoSub && (
                                <div style={{ position: 'absolute', top: '-8px', left: '-8px', backgroundColor: '#C9A84C', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px', zIndex: 2, whiteSpace: 'nowrap' }}>AUTO</div>
                              )}
                              <Jersey
                                primaryColour={getTeamColours(autoSub ? autoSub.players?.slb_teams?.name : player.players?.slb_teams?.name).primary}
                                secondaryColour={getTeamColours(autoSub ? autoSub.players?.slb_teams?.name : player.players?.slb_teams?.name).secondary}
                                number={(autoSub ? autoSub.players?.squad_number : player.players?.squad_number) ?? null}
                                size="sm"
                              />
                              <div style={{ color: autoSub ? '#C9A84C' : 'white', fontSize: '11px', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '64px' }}>
                                {(autoSub ? autoSub.players?.name : player.players?.name)?.split(' ')[0]}
                              </div>
                              <div style={{ color: '#F4622A', fontSize: '11px', fontWeight: 'bold' }}>
                                {(autoSub ? autoSub.players?.gw_points : player.players?.total_season_points) || 0} pts
                              </div>
                              <div style={{ color: '#A0A0A0', fontSize: '10px' }}>
                                £{(((autoSub ? autoSub.players?.value : player.players?.value) || 0) / 1000000).toFixed(1)}m
                              </div>
                              <div style={{ color: '#C9A84C', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {normPos((autoSub ? autoSub.players?.position : player.players?.position)) || player.players?.position}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Captain/Vice Captain Popup — court players only */}
                  {selectedPlayer && !isMobile && courtPlayers.some(p => p.id === selectedPlayer.id) && (
                    <div
                      className="absolute z-50 bg-[#1A1A1A] border border-[#F4622A] rounded-xl p-4 shadow-xl min-w-[180px]"
                      style={{
                        top: popupPosition.top,
                        left: popupPosition.left
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-white font-bold text-sm mb-3">{selectedPlayer.players?.name}</p>

                      <button
                        onClick={() => handleSetCaptain(selectedPlayer)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg mb-1 flex items-center gap-2 hover:bg-[#2A2A2A] text-[#F4622A] font-bold"
                      >
                        🅒 Set as Captain
                      </button>

                      <button
                        onClick={() => handleSetViceCaptain(selectedPlayer)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg mb-1 flex items-center gap-2 hover:bg-[#2A2A2A] text-[#A0A0A0]"
                      >
                        Ⓥ Set as Vice Captain
                      </button>

                      {captain === selectedPlayer.player_id && (
                        <button
                          onClick={() => handleRemoveCaptain(selectedPlayer)}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-[#2A2A2A]"
                        >
                          Remove Captain
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPlayer(null)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-[#555555] hover:bg-[#2A2A2A] mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Bench Section */}
                  <div className="border-t border-[#2E2E2E] mt-6 pt-6">
                    <h3 className="text-white font-bold text-sm uppercase mb-4">Bench</h3>
                    {isMobile && (
                      <p className="text-[#A0A0A0] text-xs mb-4">
                        {selectedForSwap ? "Tap another player to swap" : "Tap a player to move them"}
                      </p>
                    )}
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {benchPlayers.map((player, index) => {
                        if (!player || !player.players) return null;
                        const isCaptain = captain === player.player_id;
                        const isViceCaptain = viceCaptain === player.player_id;
                        const isDragged = draggedId === player.id;
                        const isDragOver = dragOverTarget?.id === player.id;
                        const isSelectedForSwap = selectedForSwap === player.id;
                        const isInvalidSwap = swapError?.ids.includes(player.id);

                        return (
                          <div
                            key={player.player_id}
                            className="text-center flex-shrink-0 flex-1 sm:flex-none cursor-pointer"
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, player)}
                            onDragOver={(e) => handleDragOver(e, player)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, player)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.innerWidth < 768) handleTap(player);
                              else handleTap(player); // bench players: tap-to-swap only, no captain menu
                            }}
                            style={{
                              opacity: isDragged ? 0.5 : 1,
                              border: isDragOver || isSelectedForSwap ? '2px dashed #F4622A' : 'none',
                              borderRadius: '12px',
                              padding: '4px',
                              animation: isSelectedForSwap ? 'pulse 1s infinite' : 'none'
                            }}
                          >
                            <div
                              className="bg-[#111111] border rounded-xl p-3 hover:border-[#F4622A] transition-all text-center"
                              style={{
                                position: 'relative',
                                borderColor: isInvalidSwap ? '#EF4444' : isDragOver || isSelectedForSwap ? '#F4622A' : '#222222',
                                boxShadow: isInvalidSwap ? '0 0 0 2px #EF4444' : isSelectedForSwap ? '0 0 0 2px #F4622A' : 'none',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                              }}
                            >
                              {isCaptain && (
                                <div style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#C9A84C', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', zIndex: 2 }}>C</div>
                              )}
                              {isViceCaptain && (
                                <div style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#666666', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', zIndex: 2 }}>V</div>
                              )}
                              <Jersey
                                primaryColour={getTeamColours(player.players?.slb_teams?.name).primary}
                                secondaryColour={getTeamColours(player.players?.slb_teams?.name).secondary}
                                number={player.players?.squad_number ?? null}
                                size="sm"
                              />
                              <p className="text-white font-semibold text-[11px] mt-2">{player.players.name?.split(' ')[0]}</p>
                              <p className="text-[#F4622A] font-bold text-[11px]">{player.players.total_season_points || 0} pts</p>
                              <p style={{ color: '#A0A0A0', fontSize: '10px' }}>£{((player.players?.value || 0) / 1000000).toFixed(1)}m</p>
                              <p style={{ color: '#C9A84C', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {normPos(player.players?.position) || player.players?.position}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {[...Array(4 - benchPlayers.length)].map((_, index) => (
                        <div key={`empty-${index}`} className="text-center flex-shrink-0 flex-1 sm:flex-none">
                          <div className="border-2 border-dashed border-[#2E2E2E] rounded-xl p-3 h-[100px] flex flex-col items-center justify-center">
                            <span className="text-[#444444] font-bold text-[12px] uppercase tracking-wider">Bench</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Panel (~35%) */}
          <div className="w-full lg:w-[35%] space-y-6">
            {/* Chips Section */}
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
              <h2 className="text-[#C9A84C] font-bold text-sm uppercase mb-4">CHIPS</h2>
              <div className="space-y-3">
                {chips.map((chip) => (
                  <div key={chip.name} className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-4 hover:border-[#F4622A] transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold text-sm">{chip.name}</span>
                      <span className={`text-white text-[10px] font-bold px-2 py-1 rounded-full ${chip.remaining > 0 ? 'bg-[#F4622A]' : 'bg-[#555555]'}`}>
                        {chip.remaining > 0 ? `×${chip.remaining}` : 'USED'}
                      </span>
                    </div>
                    <p className="text-[#A0A0A0] text-xs">{chip.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Squad List */}
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
              <h2 className="text-[#C9A84C] font-bold text-sm uppercase mb-4">SQUAD</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {squadData.map((squadItem) => {
                  if (!squadItem.players) return null;
                  const isCaptain = captain === squadItem.player_id;
                  const positionColor = squadItem.players.position === 'G' ? '#F4622A' : squadItem.players.position === 'F' ? '#C9A84C' : '#FFFFFF';
                  return (
                    <div key={squadItem.id} className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#222222]">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: squadItem.players.slb_teams?.primary_colour || '#6B7280' }}
                      />
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{squadItem.players.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: positionColor + '20', color: positionColor }}
                          >
                            {squadItem.players.position}
                          </span>
                          {isCaptain && (
                            <span className="text-[#C9A84C] text-[10px] font-bold">C</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[#F4622A] font-bold text-sm">{squadItem.players.total_season_points || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gameweek Stats */}
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
              <h2 className="text-[#C9A84C] font-bold text-sm uppercase mb-4">GAMEWEEK STATS</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0] text-sm">Points</span>
                  <span className="text-white font-bold text-lg">{totalPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0] text-sm">Players scoring</span>
                  <span className="text-white font-bold text-lg">{playersScoring}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0] text-sm">Formation</span>
                  <span className="text-white font-bold text-lg">{formationLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FantasyPage;
