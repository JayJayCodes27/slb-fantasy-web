import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchSettings();
    fetchMyLeagues();
  }, [user, navigate]);

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
      const { data, error } = await supabase
        .from('league_members')
        .select(`
          *,
          leagues (
            id,
            name,
            max_managers,
            league_type,
            draft_complete
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Count members for each league
      const leaguesWithCounts = await Promise.all(
        (data || []).map(async (member) => {
          const { count } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', member.leagues.id);
          
          return {
            ...member.leagues,
            member_count: count || 0,
            is_commissioner: member.leagues.commissioner_id === user.id
          };
        })
      );

      setMyLeagues(leaguesWithCounts);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreatePrivateLeague = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateSuccess(null);

    try {
      const newInviteCode = generateInviteCode();

      // Insert league
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .insert({
          name: leagueName,
          commissioner_id: user.id,
          league_type: 'private',
          format: 'total_points',
          max_managers: 50,
          invite_code: newInviteCode,
          draft_complete: false
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Add commissioner as member
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      setCreateSuccess({
        leagueId: leagueData.id,
        leagueName: leagueData.name,
        inviteCode: newInviteCode
      });

      fetchMyLeagues();
    } catch (error) {
      console.error('Error creating league:', error);
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
      // Find public leagues with space
      const { data: publicLeagues, error: leaguesError } = await supabase
        .from('leagues')
        .select('id, name, max_managers')
        .eq('league_type', 'public')
        .order('created_at', { ascending: true });

      if (leaguesError) throw leaguesError;

      // Find first league with space where user is not already a member
      let targetLeague = null;
      for (const league of publicLeagues || []) {
        const { count } = await supabase
          .from('league_members')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', league.id);

        if (count < league.max_managers) {
          // Check if user is already a member
          const { data: existingMember } = await supabase
            .from('league_members')
            .select('*')
            .eq('league_id', league.id)
            .eq('user_id', user.id)
            .single();

          if (!existingMember) {
            targetLeague = league;
            break;
          }
        }
      }

      let joinedLeague = null;

      if (targetLeague) {
        // Join existing league
        const { error: memberError } = await supabase
          .from('league_members')
          .insert({
            league_id: targetLeague.id,
            user_id: user.id
          });

        if (memberError) throw memberError;
        joinedLeague = targetLeague;
      } else {
        // Create new public league
        const { count } = await supabase
          .from('leagues')
          .select('*', { count: 'exact', head: true })
          .eq('league_type', 'public');

        const newLeagueName = `League ${count + 1}`;

        const { data: newLeague, error: createError } = await supabase
          .from('leagues')
          .insert({
            name: newLeagueName,
            commissioner_id: user.id,
            league_type: 'public',
            format: 'total_points',
            max_managers: 20,
            draft_complete: false
          })
          .select()
          .single();

        if (createError) throw createError;

        // Add user as member
        const { error: memberError } = await supabase
          .from('league_members')
          .insert({
            league_id: newLeague.id,
            user_id: user.id
          });

        if (memberError) throw memberError;
        joinedLeague = newLeague;
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
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <h1 className="text-white font-oswald text-5xl font-bold mb-8">Leagues</h1>

        <div className="flex gap-8">
          {/* Left Column - My Leagues */}
          <div className="w-[40%]">
            <h2 className="text-white font-bold text-2xl mb-4">My Leagues</h2>
            
            {myLeagues.length === 0 ? (
              <div className="card p-6 text-center mb-6">
                <p className="text-[#a0a0a0] mb-2">No leagues yet. Create or join one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {myLeagues.map((league) => {
                  const stateBadge = getSeasonStateBadge(league);
                  return (
                    <div key={league.id} className="card p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-white font-bold text-lg">{league.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-pill ${
                          league.league_type === 'public' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : 'bg-[#FF5500]/20 text-[#FF5500]'
                        }`}>
                          {league.league_type === 'public' ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[#a0a0a0] text-sm">{league.member_count} / {league.max_managers} managers</span>
                        <span className={`text-sm ${stateBadge.color}`}>
                          {stateBadge.text}
                        </span>
                      </div>
                      <Link
                        to={`/leagues/${league.id}`}
                        className="block w-full border border-[#FF5500] text-[#FF5500] font-bold py-2 rounded-button text-center hover:bg-[#FF5500] hover:text-white transition-colors"
                      >
                        Enter League
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Playing without a league info card */}
            <div className="card p-5">
              <h3 className="text-white font-bold text-sm mb-2">Playing without a league?</h3>
              <p className="text-[#a0a0a0] text-sm mb-3">You still earn points every gameweek. Your score appears on the global leaderboard.</p>
              <Link to="/leaderboard" className="text-[#FF5500] text-sm font-semibold hover:underline">
                View Global Leaderboard
              </Link>
            </div>
          </div>

          {/* Right Column - Create or Join */}
          <div className="w-[60%]">
            <div className="card p-6">
              {/* Off Season Banner */}
              {isOffSeason && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-bounce">🏀</div>
                  <h2 className="text-white font-oswald text-3xl font-bold mb-2">Leagues are coming soon</h2>
                  <p className="text-[#a0a0a0]">SLB Fantasy leagues open before the 2026/27 season. Check back soon.</p>
                </div>
              )}

              {/* Leagues Locked Banner */}
              {isLeaguesLocked && (
                <div className="text-center py-12">
                  <h2 className="text-white font-oswald text-2xl font-bold mb-2">League joining is now closed</h2>
                  <p className="text-[#a0a0a0] mb-2">Leagues locked after Gameweek 3</p>
                  <p className="text-[#555555] text-sm">You can still view your existing leagues</p>
                </div>
              )}

              {/* Full Interface */}
              {canJoinLeagues && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => {
                        setActiveTab('create');
                        setCreateSuccess(null);
                        setJoinSuccess(null);
                      }}
                      className={`px-4 py-2 rounded-button font-bold ${
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
                      className={`px-4 py-2 rounded-button font-bold ${
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
                        <div className="text-center py-8">
                          <div className="text-green-500 text-4xl mb-4">✓</div>
                          <h3 className="text-white font-bold text-2xl mb-4">League Created!</h3>
                          <p className="text-[#a0a0a0] mb-4">Share this code with your friends</p>
                          <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg p-6 mb-4">
                            <p className="text-[#FF5500] font-oswald font-bold text-5xl mb-2">{createSuccess.inviteCode}</p>
                            <button
                              onClick={() => copyToClipboard(createSuccess.inviteCode)}
                              className="text-[#a0a0a0] text-sm hover:text-white underline"
                            >
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <Link
                            to={`/leagues/${createSuccess.leagueId}`}
                            className="inline-block bg-[#FF5500] text-white font-bold px-8 py-3 rounded-button hover:bg-[#e05f00] transition-colors"
                          >
                            Enter My League
                          </Link>
                        </div>
                      ) : (
                        <form onSubmit={handleCreatePrivateLeague} className="space-y-4">
                          <div>
                            <label className="text-white text-sm font-medium mb-2 block">League Name</label>
                            <input
                              type="text"
                              value={leagueName}
                              onChange={(e) => setLeagueName(e.target.value.slice(0, 30))}
                              className="w-full bg-[#1a1a1a] border border-[#2A2A2A] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500] transition-colors"
                              placeholder="e.g. The Hoops Gang"
                              required
                            />
                            <p className="text-[#555555] text-xs mt-1">{leagueName.length}/30 characters</p>
                          </div>

                          <button
                            type="submit"
                            disabled={creating}
                            className="w-full bg-[#FF5500] text-white font-bold py-3 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="text-center py-8">
                          <div className="text-green-500 text-4xl mb-4">✓</div>
                          <h3 className="text-white font-bold text-2xl mb-2">
                            You have joined {joinSuccess.leagueName}!
                          </h3>
                          {joinSuccess.managerNumber && (
                            <p className="text-[#a0a0a0] mb-4">You are manager number {joinSuccess.managerNumber}.</p>
                          )}
                          <Link
                            to={`/leagues/${joinSuccess.leagueId}`}
                            className="inline-block bg-[#FF5500] text-white font-bold px-8 py-3 rounded-button hover:bg-[#e05f00] transition-colors"
                          >
                            Enter League
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Public League Card */}
                          <div className="card p-5">
                            <div className="text-4xl mb-3">🏀</div>
                            <h3 className="text-white font-bold text-lg mb-2">Public League</h3>
                            <p className="text-[#a0a0a0] text-sm mb-4">Compete against other SLB Fantasy managers. You'll be placed in the next available league.</p>
                            <button
                              onClick={handleJoinPublicLeague}
                              disabled={joiningPublic}
                              className="w-full bg-[#FF5500] text-white font-bold py-2 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {joiningPublic ? 'Joining...' : 'Join Public League'}
                            </button>
                          </div>

                          {/* Private League Card */}
                          <div className="card p-5">
                            <div className="text-4xl mb-3">🔒</div>
                            <h3 className="text-white font-bold text-lg mb-2">Private League</h3>
                            <p className="text-[#a0a0a0] text-sm mb-4">Enter the invite code from your friend to join their private league.</p>
                            <form onSubmit={handleJoinPrivateLeague} className="space-y-3">
                              <input
                                type="text"
                                value={privateInviteCode}
                                onChange={(e) => setPrivateInviteCode(e.target.value.toUpperCase())}
                                className="w-full bg-[#1a1a1a] border border-[#2A2A2A] rounded-button px-4 py-2 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF5500] transition-colors uppercase"
                                placeholder="XXXXXX"
                                maxLength={6}
                                required
                              />
                              {joinError && (
                                <p className="text-red-500 text-xs">{joinError}</p>
                              )}
                              <button
                                type="submit"
                                disabled={joiningPrivate}
                                className="w-full bg-[#FF5500] text-white font-bold py-2 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
