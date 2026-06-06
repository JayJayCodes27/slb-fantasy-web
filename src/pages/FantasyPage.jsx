import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const FantasyPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('team');
  const [view, setView] = useState('court');
  const [myLeagues, setMyLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

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

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchMyLeagues = async () => {
    try {
      if (!user?.id) {
        console.log('fetchMyLeagues: user.id is undefined, skipping');
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
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMyLeagues();
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
      console.error('Error creating league:', error);
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
      console.error('Error joining public league:', error);
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
      console.error('Error joining private league:', error);
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
              <span className="text-[#FF6B00] text-xs cursor-pointer">Edit Team</span>
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
                <span className="text-white font-bold text-sm">£10.0m</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">In the bank</span>
                <span className="text-white font-bold text-sm">£0.0m</span>
              </div>
              <div className="flex justify-between h-8">
                <span className="text-[#a0a0a0] text-xs">Total budget</span>
                <span className="text-white font-bold text-sm">£10.0m</span>
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
              {/* Court Panel */}
              <div className="card p-4 sm:p-5 h-auto sm:h-[520px]">
                {/* Panel Header */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-[#FF6B00] font-bold text-xl sm:text-2xl">Total: 54 pts</p>
                  <p className="text-[#a0a0a0] text-xs mt-1">GW1 • 5 players playing</p>
                </div>

                {/* Basketball Court */}
                <div className="relative w-full" style={{ height: '280px sm:380px', backgroundColor: '#181818', borderRadius: '8px' }}>
                  {/* Court Lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 380">
                    {/* Three point arc */}
                    <ellipse cx="200" cy="320" rx="150" ry="120" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                    {/* Paint area */}
                    <rect x="120" y="240" width="160" height="140" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                    {/* Free throw circle */}
                    <circle cx="200" cy="240" r="40" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                    {/* Small circle at top of key */}
                    <circle cx="200" cy="100" r="15" fill="none" stroke="#2e2e2e" strokeWidth="2" />
                    {/* Baseline */}
                    <line x1="0" y1="380" x2="400" y2="380" stroke="#2e2e2e" strokeWidth="2" />
                    {/* Sidelines */}
                    <line x1="0" y1="0" x2="0" y2="380" stroke="#2e2e2e" strokeWidth="2" />
                    <line x1="400" y1="0" x2="400" y2="380" stroke="#2e2e2e" strokeWidth="2" />
                  </svg>

                  {/* Player Jersey Positions */}
                  {/* C - Top Centre (near basket) */}
                  <div className="absolute" style={{ top: '20px sm:30px', left: '50%', transform: 'translateX(-50%)' }}>
                    <div className="text-center cursor-pointer">
                      <div className="relative w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                        <svg viewBox="0 0 60 50" className="w-full h-full">
                          <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[4].teamColour} />
                          <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">C</text>
                        </svg>
                      </div>
                      <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[4].name}</p>
                      <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[4].points} pts</p>
                    </div>
                  </div>

                  {/* PF - Top Left of Paint */}
                  <div className="absolute" style={{ top: '70px sm:100px', left: '100px sm:130px' }}>
                    <div className="text-center cursor-pointer">
                      <div className="relative w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                        <svg viewBox="0 0 60 50" className="w-full h-full">
                          <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[3].teamColour} />
                          <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">PF</text>
                        </svg>
                        {startingPlayers[3].isViceCaptain && (
                          <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF6B00] flex items-center justify-center">
                            <span className="text-white text-[8px] sm:text-[10px] font-bold">V</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[3].name}</p>
                      <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[3].points} pts</p>
                    </div>
                  </div>

                  {/* SF - Left Wing Outside Arc */}
                  <div className="absolute" style={{ top: '130px sm:180px', left: '20px sm:40px' }}>
                    <div className="text-center cursor-pointer">
                      <div className="w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                        <svg viewBox="0 0 60 50" className="w-full h-full">
                          <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[2].teamColour} />
                          <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">SF</text>
                        </svg>
                      </div>
                      <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[2].name}</p>
                      <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[2].points} pts</p>
                    </div>
                  </div>

                  {/* SG - Right Wing Outside Arc */}
                  <div className="absolute" style={{ top: '130px sm:180px', right: '20px sm:40px' }}>
                    <div className="text-center cursor-pointer">
                      <div className="w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                        <svg viewBox="0 0 60 50" className="w-full h-full">
                          <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[1].teamColour} />
                          <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">SG</text>
                        </svg>
                      </div>
                      <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[1].name}</p>
                      <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[1].points} pts</p>
                    </div>
                  </div>

                  {/* PG - Bottom Centre (ball handler) */}
                  <div className="absolute" style={{ bottom: '15px sm:20px', left: '50%', transform: 'translateX(-50%)' }}>
                    <div className="text-center cursor-pointer">
                      <div className="relative w-[45px] sm:w-[60px] h-[40px] sm:h-[50px] mx-auto mb-1 sm:mb-2">
                        <svg viewBox="0 0 60 50" className="w-full h-full">
                          <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={startingPlayers[0].teamColour} />
                          <text x="30" y="30" textAnchor="middle" fill="white" fontSize="14 sm:16" fontWeight="bold">PG</text>
                        </svg>
                        {startingPlayers[0].isCaptain && (
                          <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF6B00] flex items-center justify-center">
                            <span className="text-white text-[8px] sm:text-[10px] font-bold">C</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white font-bold text-[10px] sm:text-xs">{startingPlayers[0].name}</p>
                      <p className="text-[#FF6B00] font-bold text-[10px] sm:text-xs">{startingPlayers[0].points} pts</p>
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
                            <div className="w-[45px] sm:w-[55px] h-[40px] sm:h-[50px] mx-auto mb-1">
                              <svg viewBox="0 0 60 50" className="w-full h-full">
                                <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={player.teamColour} />
                                <text x="30" y="30" textAnchor="middle" fill="white" fontSize="12 sm:14" fontWeight="bold">{player.position}</text>
                              </svg>
                            </div>
                            <p className="text-white font-bold text-[10px] sm:text-[11px]">{player.name}</p>
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
