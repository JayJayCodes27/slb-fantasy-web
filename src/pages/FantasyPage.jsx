// FantasyPage.jsx — Main fantasy hub: My Team court view and My Leagues tab
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';
import halfCourt from '../assets/half-court.svg';
import jerseyBlue from '../assets/jersey-blue-blank.svg';
import jerseyDark from '../assets/jersey-dark-blank.svg';
import jerseyOrange from '../assets/jersey-orange-blank.svg';
import jerseyGreen from '../assets/jersey-green-blank.svg';
import jerseyPurple from '../assets/jersey-purple-blank.svg';
import jerseyRed from '../assets/jersey-red-blank.svg';

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

  const getJerseyForTeam = (shortName) => {
    const map = {
      'LDN': jerseyRed,
      'NEW': jerseyBlue,
      'LEI': jerseyBlue,
      'MAN': jerseyBlue,
      'CHE': jerseyOrange,
      'BRI': jerseyRed,
      'SHE': jerseyDark,
      'SUR': jerseyGreen,
      'CAL': jerseyPurple,
    };
    return map[shortName] || jerseyDark;
  };

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

      // Fetch squad_confirmed and formation from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('squad_confirmed, formation')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      setHasSquad(userData?.squad_confirmed || false);
      if (userData?.formation) {
        setFormation(userData.formation);
      }

      // Fetch user squad with player values and captain/vice captain
      const { data: squadData, error: squadError } = await supabase
        .from('user_squads')
        .select('*, players(*, slb_teams(*))')
        .eq('user_id', user.id);

      if (squadError) throw squadError;

      setSquadData(squadData || []);

      // Calculate squad value
      const calculatedSquadValue = squadData?.reduce((sum, s) => sum + (s.players?.value || 0), 0) || 0;
      setSquadValue(calculatedSquadValue);
      setBank(100000000 - calculatedSquadValue);

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

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    setDragOverTarget(null);

    if (!draggedId || draggedId === targetItem.id) {
      setDraggedId(null);
      return;
    }

    const draggedItem = squadData.find(s => s.id === draggedId);
    if (!draggedItem) {
      setDraggedId(null);
      return;
    }

    // Swap is_starter between the two players
    const draggedStarter = draggedItem.is_starter;
    const targetStarter = targetItem.is_starter;

    // Update local state immediately
    setSquadData(prev => prev.map(s => {
      if (s.id === draggedId) 
        return { ...s, is_starter: targetStarter };
      if (s.id === targetItem.id) 
        return { ...s, is_starter: draggedStarter };
      return s;
    }));

    // Save both to Supabase
    try {
      await supabase
        .from('user_squads')
        .update({ is_starter: targetStarter })
        .eq('id', draggedId);

      await supabase
        .from('user_squads')
        .update({ is_starter: draggedStarter })
        .eq('id', targetItem.id);
    } catch (error) {
      console.error('Error saving formation:', error);
    }

    setDraggedId(null);
  };

  const saveFormationToSupabase = async (squad) => {
    try {
      for (const s of squad) {
        await supabase
          .from('user_squads')
          .update({ is_starter: s.is_starter })
          .eq('id', s.id);
      }
    } catch (error) {
      console.error('Error saving formation:', error);
    }
  };

  const detectAndUpdateFormation = async (squad) => {
    const starters = squad.filter(s => s.is_starter);
    const guards = starters.filter(s => s.players?.position === 'G').length;
    const forwards = starters.filter(s => s.players?.position === 'F').length;
    const centres = starters.filter(s => s.players?.position === 'C').length;

    let newFormation = '2G-2F-1C';
    if (guards === 3 && forwards === 1 && centres === 1) {
      newFormation = '3G-1F-1C';
    } else if (guards === 1 && forwards === 3 && centres === 1) {
      newFormation = '1G-3F-1C';
    }

    setFormation(newFormation);

    // Save to users table
    try {
      await supabase
        .from('users')
        .update({ formation: newFormation })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving formation:', error);
    }
  };

  // Mobile tap-to-swap
  const handleTap = async (squadItem) => {
    // If nothing selected, select this player
    if (!selectedForSwap) {
      setSelectedForSwap(squadItem.id);
      return;
    }

    // If tapping the same player, deselect
    if (selectedForSwap === squadItem.id) {
      setSelectedForSwap(null);
      return;
    }

    // Swap the two players
    const firstItem = squadData.find(s => s.id === selectedForSwap);
    if (!firstItem) return;

    const firstStarter = firstItem.is_starter;
    const secondStarter = squadItem.is_starter;

    setSquadData(prev => prev.map(s => {
      if (s.id === selectedForSwap)
        return { ...s, is_starter: secondStarter };
      if (s.id === squadItem.id)
        return { ...s, is_starter: firstStarter };
      return s;
    }));

    try {
      await supabase
        .from('user_squads')
        .update({ is_starter: secondStarter })
        .eq('id', selectedForSwap);

      await supabase
        .from('user_squads')
        .update({ is_starter: firstStarter })
        .eq('id', squadItem.id);
    } catch (error) {
      console.error('Error saving formation:', error);
    }

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

  // Formation positions configuration
  const formationPositions = {
    '2G-2F-1C': [
      { position: 'C', top: '15%', left: '50%' },
      { position: 'F', top: '38%', left: '22%' },
      { position: 'F', top: '38%', left: '78%' },
      { position: 'G', top: '65%', left: '25%' },
      { position: 'G', top: '65%', left: '65%' }
    ],
    '3G-1F-1C': [
      { position: 'C', top: '15%', left: '50%' },
      { position: 'G', top: '35%', left: '15%' },
      { position: 'G', top: '35%', left: '85%' },
      { position: 'G', top: '65%', left: '50%' },
      { position: 'F', top: '50%', left: '50%' }
    ],
    '1G-3F-1C': [
      { position: 'C', top: '15%', left: '50%' },
      { position: 'F', top: '35%', left: '18%' },
      { position: 'F', top: '35%', left: '50%' },
      { position: 'F', top: '35%', left: '82%' },
      { position: 'G', top: '65%', left: '50%' }
    ]
  };

  // Get court and bench players based on formation
  const getCourtAndBenchPlayers = () => {
    if (!squadData || squadData.length === 0) {
      return { courtPlayers: [], benchPlayers: [] };
    }

    const guards = squadData.filter(s => s.players?.position === 'G');
    const forwards = squadData.filter(s => s.players?.position === 'F');
    const centres = squadData.filter(s => s.players?.position === 'C');

    let courtGuards, benchGuards, courtForwards, benchForwards, courtCentres, benchCentres;

    switch (formation) {
      case '3G-1F-1C':
        courtGuards = guards.slice(0, 3);
        benchGuards = guards.slice(3);
        courtForwards = forwards.slice(0, 1);
        benchForwards = forwards.slice(1);
        courtCentres = centres.slice(0, 1);
        benchCentres = centres.slice(1);
        break;
      case '1G-3F-1C':
        courtGuards = guards.slice(0, 1);
        benchGuards = guards.slice(1);
        courtForwards = forwards.slice(0, 3);
        benchForwards = forwards.slice(3);
        courtCentres = centres.slice(0, 1);
        benchCentres = centres.slice(1);
        break;
      default: // 2G-2F-1C
        courtGuards = guards.slice(0, 2);
        benchGuards = guards.slice(2);
        courtForwards = forwards.slice(0, 2);
        benchForwards = forwards.slice(2);
        courtCentres = centres.slice(0, 1);
        benchCentres = centres.slice(1);
        break;
    }

    const courtPlayers = [...courtGuards, ...courtForwards, ...courtCentres];
    const benchPlayers = [...benchGuards, ...benchForwards, ...benchCentres];

    return { courtPlayers, benchPlayers };
  };

  const { courtPlayers, benchPlayers } = getCourtAndBenchPlayers();

  // Calculate formation label from squadData
  const starters = squadData.filter(s => s.is_starter);
  const gCount = starters.filter(s => s.players?.position === 'G').length;
  const fCount = starters.filter(s => s.players?.position === 'F').length;
  const cCount = starters.filter(s => s.players?.position === 'C').length;
  const formationLabel = `${gCount}G · ${fCount}F · ${cCount}C`;

  // Calculate total points with captain double
  const totalPoints = courtPlayers.reduce((sum, s) => {
    const pts = s.players?.gw_points || 0;
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Page Sub-header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg sm:text-xl uppercase tracking-wide">FANTASY</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
            <span className="text-[#22c55e] text-xs">Live</span>
            <span className="text-[#a0a0a0] text-xs">•</span>
            <span className="text-[#a0a0a0] text-xs">Gameweek 1</span>
          </div>
        </div>
        <div className="flex gap-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-button transition-colors ${
              activeTab === 'team' ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a1a] text-white border border-[#242424]'
            }`}
          >
            MY TEAM
          </button>
          <Link
            to="/results"
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-button transition-colors bg-[#1a1a1a] text-white border border-[#242424] hover:bg-[#2a2a2a]"
          >
            RESULTS
          </Link>
          <button
            onClick={() => setActiveTab('leagues')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-button transition-colors ${
              activeTab === 'leagues' ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a1a] text-white border border-[#242424]'
            }`}
          >
            MY LEAGUES
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
              {settings?.season_state === 'pre_season' ? (
                <Link to="/squad-selection" className="text-[#FF6B00] text-xs cursor-pointer hover:underline">Edit Team</Link>
              ) : settings?.season_state === 'season_active' ? (
                <Link to="/transfers" className="text-[#FF6B00] text-xs cursor-pointer hover:underline">Make Transfer</Link>
              ) : null}
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
                <span className="text-white font-bold text-sm">£{(squadValue / 1000000).toFixed(1)}m</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">In the bank</span>
                <span className="text-white font-bold text-sm">£{(bank / 1000000).toFixed(1)}m</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Total budget</span>
                <span className="text-white font-bold text-sm">£100.0m</span>
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
            <Link to="/transfers" className="block w-full bg-[#FF6B00] text-white font-bold text-sm h-10 rounded-button hover:bg-[#e05f00] transition-colors text-center leading-10">
              Make Transfer →
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 space-y-3">
          {activeTab === 'team' && (
            <>
              {!hasSquad && settings?.season_state === 'pre_season' && (
                <div className="card p-6 text-center">
                  <h2 className="text-white font-bold text-xl mb-2">Build Your Squad</h2>
                  <p className="text-[#a0a0a0] text-sm mb-4">Select 10 players within £100m budget to get started</p>
                  <Link
                    to="/squad-selection"
                    className="inline-block bg-[#FF6B00] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e05f00] transition-colors"
                  >
                    Build Your Squad →
                  </Link>
                </div>
              )}

              {hasSquad && (
                <div className="card p-6 text-center">
                  <h2 className="text-white font-bold text-xl mb-2">Transfers</h2>
                  <p className="text-[#a0a0a0] text-sm mb-4">Make changes to your squad</p>
                  <Link
                    to="/transfers"
                    className="inline-block bg-[#FF6B00] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e05f00] transition-colors"
                  >
                    Make Transfer →
                  </Link>
                </div>
              )}

              {/* Court Panel */}
              <div className="card p-4 sm:p-5 h-auto sm:h-[520px]">
                {/* Panel Header */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-[#FF6B00] font-bold text-xl sm:text-2xl">Total: {totalPoints} pts</p>
                  <p className="text-[#a0a0a0] text-xs mt-1">GW{settings?.current_gameweek || 1} · {playersScoring} players scoring</p>
                </div>

                {/* Formation Label */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-[#a0a0a0] text-xs">Formation: {formationLabel}</p>
                </div>

                {/* Basketball Court */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: '480px',
                    backgroundColor: '#1a472a'
                  }}
                >
                  {/* Court image as background layer */}
                  <img
                    src={halfCourt}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill',
                      objectPosition: 'center',
                      opacity: 0.9,
                      zIndex: 0,
                      pointerEvents: 'none'
                    }}
                    alt=""
                  />

                  {/* Players layer on top */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 1
                    }}
                    onClick={() => setSelectedPlayer(null)}
                  >
                    {formationPositions[formation]?.map((pos, index) => {
                      const player = courtPlayers[index];
                      if (!player || !player.players) return null;
                      
                      const isCaptain = captain === player.player_id;
                      const isViceCaptain = viceCaptain === player.player_id;
                      const isDragged = draggedId === player.id;
                      const isDragOver = dragOverTarget?.id === player.id;
                      const isSelectedForSwap = selectedForSwap === player.id;
                      
                      return (
                        <div
                          key={player.player_id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, player)}
                          onDragOver={(e) => handleDragOver(e, player)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, player)}
                          style={{
                            position: 'absolute',
                            transform: 'translate(-50%, -50%)',
                            top: pos.top,
                            left: pos.left,
                            opacity: isDragged ? 0.5 : 1,
                            border: isDragOver || isSelectedForSwap ? '2px dashed #FF5500' : 'none',
                            borderRadius: '8px',
                            padding: '4px',
                            animation: isSelectedForSwap ? 'pulse 1s infinite' : 'none'
                          }}
                          className="text-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth < 768) {
                              handleTap(player);
                            } else {
                              handlePlayerClick(player, e);
                            }
                          }}
                        >
                          <div style={{textAlign: 'center', position: 'relative'}}>
                            {/* Captain/Vice Captain Badge */}
                            {isCaptain && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  backgroundColor: '#FF6B00',
                                  color: 'white',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  zIndex: 2
                                }}
                              >
                                C
                              </div>
                            )}
                            {isViceCaptain && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  backgroundColor: '#666666',
                                  color: 'white',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  zIndex: 2
                                }}
                              >
                                V
                              </div>
                            )}
                            <img
                              src={getJerseyForTeam(player.players?.slb_teams?.short_name)}
                              style={{width: '64px', height: '80px', objectFit: 'contain'}}
                              alt={player.players.position}
                            />
                            <div style={{color: 'white', fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>
                              {player.players.name?.split(' ')[0]}
                            </div>
                            <div style={{color: '#FF5500', fontSize: '12px'}}>
                              {player.players.total_season_points || 0} pts
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Captain/Vice Captain Popup */}
                {selectedPlayer && !isMobile && (
                  <div 
                    className="absolute z-50 bg-[#1a1a1a] border border-[#FF5500] rounded-xl p-4 shadow-xl min-w-[180px]"
                    style={{ 
                      top: popupPosition.top, 
                      left: popupPosition.left 
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-white font-bold text-sm mb-3">{selectedPlayer.players?.name}</p>
                    
                    <button 
                      onClick={() => handleSetCaptain(selectedPlayer)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg mb-1 flex items-center gap-2 hover:bg-[#2a2a2a] text-orange-400 font-bold"
                    >
                      🅒 Set as Captain
                    </button>
                    
                    <button 
                      onClick={() => handleSetViceCaptain(selectedPlayer)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg mb-1 flex items-center gap-2 hover:bg-[#2a2a2a] text-gray-300"
                    >
                      Ⓥ Set as Vice Captain
                    </button>
                    
                    {captain === selectedPlayer.player_id && (
                      <button 
                        onClick={() => handleRemoveCaptain(selectedPlayer)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-[#2a2a2a]"
                      >
                        Remove Captain
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setSelectedPlayer(null)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-500 hover:bg-[#2a2a2a] mt-1"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Bench Section */}
                <div className="border-t border-[#242424] mt-3 sm:mt-4 pt-3 sm:pt-4">
                  <h3 className="text-white font-bold text-xs sm:text-sm mb-2 sm:mb-3">Bench</h3>
                  {isMobile && (
                    <p className="text-[#a0a0a0] text-xs mb-2">
                      {selectedForSwap ? "Tap another player to swap" : "Tap a player to move them"}
                    </p>
                  )}
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                    {benchPlayers.map((player, index) => {
                      if (!player || !player.players) return null;
                      const isCaptain = captain === player.player_id;
                      const isViceCaptain = viceCaptain === player.player_id;
                      const isDragged = draggedId === player.id;
                      const isDragOver = dragOverTarget?.id === player.id;
                      const isSelectedForSwap = selectedForSwap === player.id;
                      
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
                            if (window.innerWidth < 768) {
                              handleTap(player);
                            } else {
                              handlePlayerClick(player, e);
                            }
                          }}
                          style={{
                            opacity: isDragged ? 0.5 : 1,
                            border: isDragOver || isSelectedForSwap ? '2px dashed #FF5500' : 'none',
                            borderRadius: '8px',
                            padding: '4px',
                            animation: isSelectedForSwap ? 'pulse 1s infinite' : 'none'
                          }}
                        >
                          <div style={{position: 'relative', display: 'inline-block'}}>
                            {isCaptain && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-6px',
                                  right: '-6px',
                                  backgroundColor: '#FF6B00',
                                  color: 'white',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                  zIndex: 2
                                }}
                              >
                                C
                              </div>
                            )}
                            {isViceCaptain && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-6px',
                                  right: '-6px',
                                  backgroundColor: '#666666',
                                  color: 'white',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                  zIndex: 2
                                }}
                              >
                                V
                              </div>
                            )}
                            <img
                              src={getJerseyForTeam(player.players?.slb_teams?.short_name)}
                              style={{width: '48px', height: '60px', objectFit: 'contain'}}
                              alt={player.players.position}
                            />
                          </div>
                          <p className="text-white font-bold text-[10px] sm:text-[11px] mt-1">{player.players.name?.split(' ')[0]}</p>
                          <p className="text-[#FF6B00] font-bold text-[10px] sm:text-[11px]">{player.players.total_season_points || 0} pts</p>
                        </div>
                      );
                    })}
                    {[...Array(4 - benchPlayers.length)].map((_, index) => (
                      <div key={`empty-${index}`} className="text-center flex-shrink-0 flex-1 sm:flex-none">
                        <div className="border border-dashed border-[#333] rounded-button p-2 h-[60px] sm:h-[70px] flex flex-col items-center justify-center">
                          <span className="text-[#555] text-[10px] sm:text-[11px]">Player</span>
                        </div>
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
                <div className="flex-1 flex items-center justify-center w-full sm:w-auto py-3 sm:py-0">
                  <div className="text-center">
                    <p className="text-[#a0a0a0] text-[10px] sm:text-[11px] uppercase tracking-wider mb-1">OVERALL RANK</p>
                    <p className="text-white font-bold text-xl sm:text-2xl">—</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FantasyPage;
