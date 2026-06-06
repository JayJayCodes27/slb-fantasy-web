import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const LeaguesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
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

  useEffect(() => {
    if (!user) return;
    fetchSettings();
    fetchMyLeagues();
  }, [user]);

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
    if (!leagueName.trim()) return;
    setCreating(true);
    setCreateSuccess(null);

    try {
      const code = generateInviteCode();
      console.log('Attempting insert with:', {
        name: leagueName,
        commissioner_id: user.id,
        league_type: 'private',
        format: 'total_points',
        max_managers: 50,
        draft_complete: false,
        invite_code: code
      });

      const result = await supabase
        .from('leagues')
        .insert({
          name: leagueName,
          commissioner_id: user.id,
          league_type: 'private',
          format: 'total_points',
          max_managers: 50,
          draft_complete: false,
          invite_code: code
        })
        .select()
        .single();

      console.log('Full result:', JSON.stringify(result));
      console.log('Data:', result.data);
      console.log('Error:', result.error);
      console.log('Status:', result.status);
      console.log('StatusText:', result.statusText);

      if (result.error) {
        console.log('Error code:', result.error.code);
        console.log('Error message:', result.error.message);
        console.log('Error details:', result.error.details);
        console.log('Error hint:', result.error.hint);
        throw result.error;
      }

      // Add commissioner as member
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: result.data.id,
          user_id: user.id
        });

      if (memberError) {
        console.log('Add member error:', memberError);
        throw memberError;
      }

      setCreateSuccess({
        leagueId: result.data.id,
        leagueName: result.data.name,
        inviteCode: code
      });

      setLeagueName('');
      fetchMyLeagues();
    } catch (err) {
      console.log('Caught error:', JSON.stringify(err));
      console.log('Error message:', err.message);
      console.log('Error code:', err.code);
      alert('Failed to create league. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinPublicLeague = async () => {
    setJoiningPublic(true);
    setJoinSuccess(null);
    setJoinError('');

    try {
      // Step 1: Fetch all public leagues
      const { data: publicLeagues, error: fetchError } = await supabase
        .from('leagues')
        .select('id, name, max_managers, league_type')
        .eq('league_type', 'public')
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.log('Fetch error:', fetchError);
        throw fetchError;
      }

      // Step 2 & 3: Find first league with space where user is not already a member
      let targetLeague = null;
      for (const league of publicLeagues || []) {
        // Get member count
        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', league.id);

        if (count < league.max_managers) {
          // Check if user is already a member
          const { data: existing } = await supabase
            .from('league_members')
            .select('id')
            .eq('league_id', league.id)
            .eq('user_id', user.id)
            .single();

          if (!existing) {
            targetLeague = league;
            break;
          }
        }
      }

      let joinedLeague = null;

      if (targetLeague) {
        // Step 4: Join available league
        try {
          await supabase
            .from('league_members')
            .insert({ league_id: targetLeague.id, user_id: user.id });
          joinedLeague = targetLeague;
        } catch (error) {
          console.log('Step 4 - Join available league error:', JSON.stringify(error, null, 2));
          console.log('Current user id:', user.id);
          console.log('League id:', targetLeague.id);
          throw error;
        }
      } else {
        // Step 5: Create new public league
        const { count: totalPublic } = await supabase
          .from('leagues')
          .select('*', { count: 'exact', head: true })
          .eq('league_type', 'public');

        const { data: newLeague, error: createError } = await supabase
          .from('leagues')
          .insert({
            name: 'League ' + (totalPublic + 1),
            league_type: 'public',
            max_managers: 20,
            format: 'total_points',
            commissioner_id: user.id,
            draft_complete: false
          })
          .select()
          .single();

        if (createError) {
          console.log('Step 5 - Create new public league error:', JSON.stringify(createError, null, 2));
          console.log('Current user id:', user.id);
          console.log('Commissioner id being set:', user.id);
          throw createError;
        }

        // Join the new league
        try {
          await supabase
            .from('league_members')
            .insert({ league_id: newLeague.id, user_id: user.id });
          joinedLeague = newLeague;
        } catch (error) {
          console.log('Step 5 - Join new league error:', JSON.stringify(error, null, 2));
          console.log('Current user id:', user.id);
          console.log('League id:', newLeague.id);
          throw error;
        }
      }

      // Get member count for success message
      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', joinedLeague.id);

      setJoinSuccess({
        leagueId: joinedLeague.id,
        leagueName: joinedLeague.name,
        managerNumber: count
      });

      fetchMyLeagues();
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
      // Check season state
      if (settings?.season_state === 'season_active' && settings?.current_gameweek > 3) {
        setJoinError('Leagues are locked after Gameweek 3. You cannot join this league.');
        setJoiningPrivate(false);
        return;
      }

      // Find league by invite code
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('invite_code', privateInviteCode.toUpperCase())
        .single();

      if (leagueError || !league) {
        setJoinError('Invalid invite code. Check with your friend and try again.');
        setJoiningPrivate(false);
        return;
      }

      // Check if league is full
      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id);

      if (count >= league.max_managers) {
        setJoinError(`This league is full (${count}/${league.max_managers} managers).`);
        setJoiningPrivate(false);
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        setJoinError("You are already in this league.");
        setJoiningPrivate(false);
        return;
      }

      // Add user to league
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      setJoinSuccess({
        leagueId: league.id,
        leagueName: league.name
      });

      fetchMyLeagues();
    } catch (error) {
      console.error('Error joining private league:', error);
      setJoinError('Failed to join league. Please try again.');
    } finally {
      setJoiningPrivate(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeasonStateBadge = (league) => {
    if (!league.draft_complete) return { text: 'Pre-Season', color: 'text-[#a0a0a0]' };
    return { text: 'Active', color: 'text-green-500 animate-pulse' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isOffSeason = settings?.season_state === 'off_season';
  const isLeaguesLocked = settings?.season_state === 'leagues_locked';
  const canJoinLeagues = settings?.season_state === 'pre_season' || 
    (settings?.season_state === 'season_active' && settings?.current_gameweek <= 3);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 sm:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <h1 className="text-white font-oswald text-3xl sm:text-5xl font-bold mb-6 sm:mb-8">Leagues</h1>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Left Column - My Leagues */}
          <div className="w-full lg:w-[40%]">
            <h2 className="text-white font-bold text-xl sm:text-2xl mb-4">My Leagues</h2>
            
            {myLeagues.length === 0 ? (
              <div className="card p-4 sm:p-6 text-center mb-6">
                <p className="text-[#a0a0a0] mb-2 text-sm sm:text-base">No leagues yet. Create or join one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {myLeagues.map((league) => {
                  const stateBadge = getSeasonStateBadge(league);
                  const topMembers = league.members?.slice(0, 5) || [];
                  const currentUserMember = league.members?.find(m => m.user_id === user.id);
                  const moreManagers = league.member_count - 5;

                  return (
                    <div key={league.id} className="card p-4 sm:p-5">
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-oswald font-bold text-base sm:text-lg">{league.name}</h3>
                            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-pill ${
                              league.league_type === 'public' 
                                ? 'bg-blue-500/20 text-blue-500' 
                                : 'bg-[#FF5500]/20 text-[#FF5500]'
                            }`}>
                              {league.league_type === 'public' ? 'Public' : 'Private'}
                            </span>
                            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-pill ${stateBadge.color.replace('text-', 'bg-').replace('animate-pulse', '')} ${stateBadge.color.replace('text-', 'text-')}`}>
                              {stateBadge.text}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/leagues/${league.id}`}
                          className="text-[#FF5500] text-xs font-semibold border border-[#FF5500] px-3 py-1.5 rounded-button hover:bg-[#FF5500] hover:text-white transition-colors whitespace-nowrap"
                        >
                          Enter League
                        </Link>
                      </div>

                      {/* Mini Standings Table */}
                      {!league.draft_complete ? (
                        <div className="text-center py-6 bg-[#1a1a1a] rounded-lg mb-3">
                          <p className="text-[#a0a0a0] text-xs sm:text-sm">Season starts soon — standings will appear here</p>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <table className="w-full text-xs sm:text-sm">
                            <thead>
                              <tr className="text-left text-[#a0a0a0] text-[10px] uppercase tracking-wider">
                                <th className="pb-2 pr-2 w-8">#</th>
                                <th className="pb-2 pr-2">Team</th>
                                <th className="pb-2 pr-2 text-right w-12">GW</th>
                                <th className="pb-2 text-right w-12">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topMembers.map((member, index) => {
                                const isCurrentUser = member.user_id === user.id;
                                return (
                                  <tr
                                    key={member.user_id}
                                    className={`border-t border-[#242424] ${isCurrentUser ? 'bg-[#FF5500]/10 border-l-2 border-l-[#FF5500]' : ''}`}
                                  >
                                    <td className="py-2 pr-2 font-bold">{index + 1}</td>
                                    <td className="py-2 pr-2">
                                      <div className="text-white font-bold text-xs">{member.users?.team_name || member.users?.username || 'Unknown'}</div>
                                      <div className="text-[#a0a0a0] text-[10px]">{member.users?.username || ''}</div>
                                    </td>
                                    <td className="py-2 pr-2 text-right">{member.gameweek_points || 0}</td>
                                    <td className="py-2 text-right font-bold">{member.total_points || 0}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {moreManagers > 0 && (
                            <Link
                              to={`/leagues/${league.id}`}
                              className="block text-center text-[#FF5500] text-xs font-semibold hover:underline mt-2"
                            >
                              + {moreManagers} more managers
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Current User Rank */}
                      <div className="text-[#a0a0a0] text-xs">
                        You are <span className="text-white font-bold">{league.current_user_rank}th</span> of {league.member_count} managers
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Playing without a league info card */}
            <div className="card p-4 sm:p-5">
              <h3 className="text-white font-bold text-xs sm:text-sm mb-2">Playing without a league?</h3>
              <p className="text-[#a0a0a0] text-xs sm:text-sm mb-3">You still earn points every gameweek. Your score appears on the global leaderboard.</p>
              <Link to="/leaderboard" className="text-[#FF5500] text-xs sm:text-sm font-semibold hover:underline">
                View Global Leaderboard
              </Link>
            </div>
          </div>

          {/* Right Column - Create or Join */}
          <div className="w-full lg:w-[60%]">
            <div className="card p-4 sm:p-6">
              {/* Off Season Banner */}
              {isOffSeason && (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-4 animate-bounce">🏀</div>
                  <h2 className="text-white font-oswald text-xl sm:text-3xl font-bold mb-2">Leagues are coming soon</h2>
                  <p className="text-[#a0a0a0] text-sm sm:text-base">SLB Fantasy leagues open before the 2026/27 season. Check back soon.</p>
                </div>
              )}

              {/* Leagues Locked Banner */}
              {isLeaguesLocked && (
                <div className="text-center py-8 sm:py-12">
                  <h2 className="text-white font-oswald text-xl sm:text-2xl font-bold mb-2">League joining is now closed</h2>
                  <p className="text-[#a0a0a0] mb-2 text-sm sm:text-base">Leagues locked after Gameweek 3</p>
                  <p className="text-[#555555] text-xs sm:text-sm">You can still view your existing leagues</p>
                </div>
              )}

              {/* Full Interface */}
              {canJoinLeagues && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <button
                      onClick={() => {
                        setActiveTab('create');
                        setCreateSuccess(null);
                        setJoinSuccess(null);
                      }}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-button font-bold text-xs sm:text-base ${
                        activeTab === 'create'
                          ? 'bg-[#FF5500] text-white'
                          : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                      }`}
                    >
                      Create Private League
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('join');
                        setCreateSuccess(null);
                        setJoinSuccess(null);
                      }}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-button font-bold text-xs sm:text-base ${
                        activeTab === 'join'
                          ? 'bg-[#FF5500] text-white'
                          : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                      }`}
                    >
                      Join a League
                    </button>
                  </div>

                  {/* Create Private League Tab */}
                  {activeTab === 'create' && (
                    <>
                      {createSuccess ? (
                        <div className="text-center py-6 sm:py-8">
                          <div className="text-green-500 text-3xl sm:text-4xl mb-4">✓</div>
                          <h3 className="text-white font-bold text-xl sm:text-2xl mb-4">League Created!</h3>
                          <p className="text-[#a0a0a0] mb-4 text-sm sm:text-base">Share this code with your friends</p>
                          <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg p-4 sm:p-6 mb-4">
                            <p className="text-[#FF5500] font-oswald font-bold text-3xl sm:text-5xl mb-2">{createSuccess.inviteCode}</p>
                            <button
                              onClick={() => copyToClipboard(createSuccess.inviteCode)}
                              className="text-[#a0a0a0] text-xs sm:text-sm hover:text-white underline"
                            >
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <Link
                            to={`/leagues/${createSuccess.leagueId}`}
                            className="inline-block bg-[#FF5500] text-white font-bold px-6 sm:px-8 py-3 rounded-button hover:bg-[#e05f00] transition-colors text-sm sm:text-base"
                          >
                            Enter My League
                          </Link>
                        </div>
                      ) : (
                        <form onSubmit={handleCreatePrivateLeague} className="space-y-4">
                          <div>
                            <label className="text-white text-xs sm:text-sm font-medium mb-2 block">League Name</label>
                            <input
                              type="text"
                              value={leagueName}
                              onChange={(e) => setLeagueName(e.target.value.slice(0, 30))}
                              className="w-full bg-[#1a1a1a] border border-[#2A2A2A] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500] transition-colors text-sm sm:text-base"
                              placeholder="e.g. The Hoops Gang"
                              required
                            />
                            <p className="text-[#555555] text-[10px] sm:text-xs mt-1">{leagueName.length}/30 characters</p>
                          </div>

                          <button
                            type="submit"
                            disabled={creating}
                            className="w-full bg-[#FF5500] text-white font-bold py-3 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                          >
                            {creating ? 'Creating...' : 'Create League'}
                          </button>
                        </form>
                      )}
                    </>
                  )}

                  {/* Join a League Tab */}
                  {activeTab === 'join' && (
                    <>
                      {joinSuccess ? (
                        <div className="text-center py-6 sm:py-8">
                          <div className="text-green-500 text-3xl sm:text-4xl mb-4">✓</div>
                          <h3 className="text-white font-bold text-xl sm:text-2xl mb-2">
                            You have joined {joinSuccess.leagueName}!
                          </h3>
                          {joinSuccess.managerNumber && (
                            <p className="text-[#a0a0a0] mb-4 text-sm sm:text-base">You are manager number {joinSuccess.managerNumber}.</p>
                          )}
                          <Link
                            to={`/leagues/${joinSuccess.leagueId}`}
                            className="inline-block bg-[#FF5500] text-white font-bold px-6 sm:px-8 py-3 rounded-button hover:bg-[#e05f00] transition-colors text-sm sm:text-base"
                          >
                            Enter League
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Public League Card */}
                          <div className="card p-4 sm:p-5">
                            <div className="text-3xl sm:text-4xl mb-3">🏀</div>
                            <h3 className="text-white font-bold text-base sm:text-lg mb-2">Public League</h3>
                            <p className="text-[#a0a0a0] text-xs sm:text-sm mb-4">Compete against other SLB Fantasy managers. You'll be placed in the next available league.</p>
                            <button
                              onClick={handleJoinPublicLeague}
                              disabled={joiningPublic}
                              className="w-full bg-[#FF5500] text-white font-bold py-2 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                              {joiningPublic ? 'Joining...' : 'Join Public League'}
                            </button>
                          </div>

                          {/* Private League Card */}
                          <div className="card p-4 sm:p-5">
                            <div className="text-3xl sm:text-4xl mb-3">🔒</div>
                            <h3 className="text-white font-bold text-base sm:text-lg mb-2">Private League</h3>
                            <p className="text-[#a0a0a0] text-xs sm:text-sm mb-4">Enter the invite code from your friend to join their private league.</p>
                            <form onSubmit={handleJoinPrivateLeague} className="space-y-3">
                              <input
                                type="text"
                                value={privateInviteCode}
                                onChange={(e) => setPrivateInviteCode(e.target.value.toUpperCase())}
                                className="w-full bg-[#1a1a1a] border border-[#2A2A2A] rounded-button px-4 py-2 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500] transition-colors uppercase text-sm sm:text-base"
                                placeholder="XXXXXX"
                                maxLength={6}
                                required
                              />
                              {joinError && (
                                <p className="text-red-500 text-[10px] sm:text-xs">{joinError}</p>
                              )}
                              <button
                                type="submit"
                                disabled={joiningPrivate}
                                className="w-full bg-[#FF5500] text-white font-bold py-2 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                              >
                                {joiningPrivate ? 'Joining...' : 'Join with Code'}
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaguesPage;
