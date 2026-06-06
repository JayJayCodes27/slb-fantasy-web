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

      // Fetch squad_confirmed from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('squad_confirmed')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      setHasSquad(userData?.squad_confirmed || false);

      // Fetch user squad with player values
      const { data: squadData, error: squadError } = await supabase
        .from('user_squads')
        .select('*, players(value)')
        .eq('user_id', user.id);

      if (squadError) throw squadError;

      // Calculate squad value
      const calculatedSquadValue = squadData?.reduce((sum, s) => sum + (s.players?.value || 0), 0) || 0;
      setSquadValue(calculatedSquadValue);
      setBank(100000000 - calculatedSquadValue);
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
            <button className="w-full bg-[#FF6B00] text-white font-bold text-sm h-10 rounded-button hover:bg-[#e05f00] transition-colors">
              Make Transfer →
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 space-y-3">
          {activeTab === 'team' ? (
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
                  <button
                    className="inline-block bg-[#FF6B00] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e05f00] transition-colors"
                  >
                    Make Transfer →
                  </button>
                </div>
              )}

              {/* Court Panel */}
              <div className="card p-4 sm:p-5 h-auto sm:h-[520px]">
                {/* Panel Header */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-[#FF6B00] font-bold text-xl sm:text-2xl">Total: 54 pts</p>
                  <p className="text-[#a0a0a0] text-xs mt-1">GW1 • 5 players playing</p>
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
                  >
                  {/* C - Top Centre (near basket) */}
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      top: '15%',
                      left: '50%'
                    }}
                    className="text-center cursor-pointer"
                  >
                    <div style={{textAlign: 'center'}}>
                      <img
                        src={getJerseyForTeam(startingPlayers[4].team)}
                        style={{width: '64px', height: '80px', objectFit: 'contain'}}
                        alt={startingPlayers[4].position}
                      />
                      <div style={{color: 'white', fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>
                        {startingPlayers[4].name.split(' ')[0]}
                      </div>
                      <div style={{color: '#FF5500', fontSize: '12px'}}>
                        {startingPlayers[4].points} pts
                      </div>
                    </div>
                  </div>

                  {/* PF - Top Left of Paint */}
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      top: '35%',
                      left: '25%'
                    }}
                    className="text-center cursor-pointer"
                  >
                    <div style={{textAlign: 'center'}}>
                      <img
                        src={getJerseyForTeam(startingPlayers[3].team)}
                        style={{width: '64px', height: '80px', objectFit: 'contain'}}
                        alt={startingPlayers[3].position}
                      />
                      {startingPlayers[3].isViceCaptain && (
                        <div style={{position: 'absolute', top: '-8px', right: '-8px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FF5500', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span style={{color: 'white', fontSize: '10px', fontWeight: 'bold'}}>V</span>
                        </div>
                      )}
                      <div style={{color: 'white', fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>
                        {startingPlayers[3].name.split(' ')[0]}
                      </div>
                      <div style={{color: '#FF5500', fontSize: '12px'}}>
                        {startingPlayers[3].points} pts
                      </div>
                    </div>
                  </div>

                  {/* SF - Right Wing */}
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      top: '35%',
                      left: '75%'
                    }}
                    className="text-center cursor-pointer"
                  >
                    <div style={{textAlign: 'center'}}>
                      <img
                        src={getJerseyForTeam(startingPlayers[2].team)}
                        style={{width: '64px', height: '80px', objectFit: 'contain'}}
                        alt={startingPlayers[2].position}
                      />
                      <div style={{color: 'white', fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>
                        {startingPlayers[2].name.split(' ')[0]}
                      </div>
                      <div style={{color: '#FF5500', fontSize: '12px'}}>
                        {startingPlayers[2].points} pts
                      </div>
                    </div>
                  </div>

                  {/* SG - Left Wing */}
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      top: '65%',
                      left: '20%'
                    }}
                    className="text-center cursor-pointer"
                  >
                    <div style={{textAlign: 'center'}}>
                      <img
                        src={getJerseyForTeam(startingPlayers[1].team)}
                        style={{width: '64px', height: '80px', objectFit: 'contain'}}
                        alt={startingPlayers[1].position}
                      />
                      <div style={{color: 'white', fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>
                        {startingPlayers[1].name.split(' ')[0]}
                      </div>
                      <div style={{color: '#FF5500', fontSize: '12px'}}>
                        {startingPlayers[1].points} pts
                      </div>
                    </div>
                  </div>

                  {/* PG - Bottom Centre (ball handler) */}
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      top: '65%',
                      left: '50%'
                    }}
                    className="text-center cursor-pointer"
                  >
                    <div style={{textAlign: 'center'}}>
                      <img
                        src={getJerseyForTeam(startingPlayers[0].team)}
                        style={{width: '64px', height: '80px', objectFit: 'contain'}}
                        alt={startingPlayers[0].position}
                      />
                      {startingPlayers[0].isCaptain && (
                        <div style={{position: 'absolute', top: '-8px', right: '-8px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FF5500', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <span style={{color: 'white', fontSize: '10px', fontWeight: 'bold'}}>C</span>
                        </div>
                      )}
                      <div style={{color: 'white', fontSize: '13px', fontWeight: 'bold', marginTop: '4px'}}>
                        {startingPlayers[0].name.split(' ')[0]}
                      </div>
                      <div style={{color: '#FF5500', fontSize: '12px'}}>
                        {startingPlayers[0].points} pts
                      </div>
                    </div>
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
                            <img
                              src={getJerseyForTeam(player.team)}
                              style={{width: '48px', height: '60px', objectFit: 'contain'}}
                              alt={player.position}
                            />
                            <p className="text-white font-bold text-[10px] sm:text-[11px] mt-1">{player.name}</p>
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
            </>
          ) : (
            <>
              {/* My Leagues Section */}
              <div className="space-y-3">
                {/* Create/Join League Card */}
                <div className="card p-4 sm:p-5">
                  <h2 className="text-white font-bold text-lg mb-4">My Leagues</h2>
                  
                  {myLeagues.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#a0a0a0] text-sm mb-4">You're not in any leagues yet. Create one or join an existing league to get started!</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => setLeagueName('')}
                          className="bg-[#FF6B00] text-white font-bold text-sm px-6 py-2 rounded-button hover:bg-[#e05f00] transition-colors"
                        >
                          Create League
                        </button>
                        <button
                          onClick={handleJoinPublicLeague}
                          disabled={joiningPublic}
                          className="bg-[#1a1a1a] text-white font-bold text-sm px-6 py-2 rounded-button border border-[#242424] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
                        >
                          {joiningPublic ? 'Joining...' : 'Join Public League'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myLeagues.map((league) => (
                        <Link
                          key={league.id}
                          to={`/leagues/${league.id}`}
                          className="card p-4 hover:border-[#FF6B00] transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-white font-bold text-sm">{league.name}</h3>
                              <p className="text-[#a0a0a0] text-xs">{league.league_type === 'private' ? 'Private' : 'Public'} League</p>
                            </div>
                            {league.is_commissioner && (
                              <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-0.5 rounded-pill">Commissioner</span>
                            )}
                          </div>
                          <div className="border-t border-[#242424] my-3"></div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0] text-xs">Members</span>
                              <span className="text-white text-xs font-bold">{league.member_count}/{league.max_managers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0] text-xs">Your Rank</span>
                              <span className="text-[#FF6B00] text-xs font-bold">{league.current_user_rank}</span>
                            </div>
                          </div>
                          {/* Mini Standings */}
                          <div className="border-t border-[#242424] my-3 pt-3">
                            <p className="text-[#a0a0a0] text-xs mb-2">Top 3</p>
                            <div className="space-y-1">
                              {league.members.slice(0, 3).map((member, idx) => (
                                <div
                                  key={member.user_id}
                                  className={`flex justify-between items-center text-xs py-1 px-2 rounded ${
                                    member.user_id === user?.id ? 'bg-[#FF6B00]/20 border-l-2 border-[#FF6B00]' : ''
                                  }`}
                                >
                                  <div>
                                    <span className="text-white font-bold mr-2">{idx + 1}.</span>
                                    <span className="text-white">{member.users?.team_name || member.users?.username}</span>
                                  </div>
                                  <span className="text-[#FF6B00] font-bold">{member.total_points || 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Link>
                      ))}
                      {/* Create/Join League Button */}
                      <button
                        onClick={() => setLeagueName('')}
                        className="card p-4 hover:border-[#FF6B00] transition-colors cursor-pointer border-2 border-dashed border-[#333]"
                      >
                        <div className="text-center">
                          <p className="text-white font-bold text-sm mb-1">+ Create or Join League</p>
                          <p className="text-[#a0a0a0] text-xs">Start a new league or join an existing one</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Create League Form */}
                {leagueName !== '' && (
                  <div className="card p-4 sm:p-5">
                    <h3 className="text-white font-bold text-lg mb-4">Create Private League</h3>
                    <form onSubmit={handleCreatePrivateLeague}>
                      <div className="mb-4">
                        <label className="text-[#a0a0a0] text-xs block mb-2">League Name</label>
                        <input
                          type="text"
                          value={leagueName}
                          onChange={(e) => setLeagueName(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B00]"
                          placeholder="Enter league name"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={creating}
                          className="flex-1 bg-[#FF6B00] text-white font-bold text-sm px-4 py-2 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50"
                        >
                          {creating ? 'Creating...' : 'Create League'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeagueName('')}
                          className="flex-1 bg-[#1a1a1a] text-white font-bold text-sm px-4 py-2 rounded-button border border-[#242424] hover:bg-[#2a2a2a] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                    {createSuccess && (
                      <div className="mt-4 p-3 bg-[#22c55e]/10 border border-[#22c55e] rounded-lg">
                        <p className="text-[#22c55e] text-sm font-bold mb-1">League Created!</p>
                        <p className="text-[#a0a0a0] text-xs mb-2">Share this invite code with friends:</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-[#1a1a1a] text-[#FF6B00] font-bold px-3 py-1 rounded text-sm">{createSuccess}</code>
                          <button
                            onClick={() => copyToClipboard(createSuccess)}
                            className="text-[#FF6B00] text-xs hover:underline"
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Join Private League Form */}
                <div className="card p-4 sm:p-5">
                  <h3 className="text-white font-bold text-lg mb-4">Join Private League</h3>
                  <form onSubmit={handleJoinPrivateLeague}>
                    <div className="mb-4">
                      <label className="text-[#a0a0a0] text-xs block mb-2">Invite Code</label>
                      <input
                        type="text"
                        value={privateInviteCode}
                        onChange={(e) => setPrivateInviteCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B00] uppercase"
                        placeholder="Enter 6-character code"
                        maxLength={6}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={joiningPrivate}
                      className="w-full bg-[#FF6B00] text-white font-bold text-sm px-4 py-2 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50"
                    >
                      {joiningPrivate ? 'Joining...' : 'Join League'}
                    </button>
                  </form>
                  {joinSuccess && (
                    <div className="mt-4 p-3 bg-[#22c55e]/10 border border-[#22c55e] rounded-lg">
                      <p className="text-[#22c55e] text-sm font-bold">{joinSuccess}</p>
                    </div>
                  )}
                  {joinError && (
                    <div className="mt-4 p-3 bg-[#ef4444]/10 border border-[#ef4444] rounded-lg">
                      <p className="text-[#ef4444] text-sm">{joinError}</p>
                    </div>
                  )}
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
