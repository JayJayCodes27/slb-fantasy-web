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

  // Create League form state
  const [leagueName, setLeagueName] = useState('');
  const [maxManagers, setMaxManagers] = useState(8);
  const [format, setFormat] = useState('H2H');
  const [draftDate, setDraftDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [inviteCode, setInviteCode] = useState('');

  // Join League form state
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchMyLeagues();
  }, [user, navigate]);

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
            format,
            draft_date,
            invite_code,
            commissioner_id
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateLeague = async (e) => {
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
          max_managers: maxManagers,
          format: format,
          draft_date: draftDate,
          invite_code: newInviteCode
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Add commissioner as member
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id,
          draft_position: null
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

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    setJoining(true);
    setJoinSuccess(null);
    setJoinError('');

    try {
      // Find league by invite code
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('invite_code', joinInviteCode.toUpperCase())
        .single();

      if (leagueError || !league) {
        setJoinError('Invalid invite code');
        setJoining(false);
        return;
      }

      // Check if league is full
      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', league.id);

      if (count >= league.max_managers) {
        setJoinError('This league is full');
        setJoining(false);
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
        setJoinError("You're already in this league");
        setJoining(false);
        return;
      }

      // Add user to league
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: user.id,
          draft_position: null
        });

      if (memberError) throw memberError;

      setJoinSuccess({
        leagueId: league.id,
        leagueName: league.name
      });

      fetchMyLeagues();
    } catch (error) {
      console.error('Error joining league:', error);
      setJoinError('Failed to join league. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert('Invite code copied to clipboard!');
  };

  const getDraftStatus = (league) => {
    if (!league.draft_date) return 'Draft Pending';
    const draftDate = new Date(league.draft_date);
    const now = new Date();
    if (draftDate > now) return 'Draft Pending';
    return 'Draft Complete';
  };

  const getDraftStatusColor = (league) => {
    const status = getDraftStatus(league);
    if (status === 'Draft Pending') return 'text-[#a0a0a0]';
    if (status === 'Draft Complete') return 'text-blue-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <h1 className="text-white font-oswald text-5xl font-bold mb-8">Leagues</h1>

        <div className="flex gap-8">
          {/* Left Column - My Leagues */}
          <div className="w-[40%]">
            <h2 className="text-white font-oswald text-2xl font-bold mb-4">My Leagues</h2>
            
            {myLeagues.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-[#a0a0a0] mb-2">You haven't joined any leagues yet</p>
                <p className="text-[#555555] text-sm">Create one below or ask a friend for their invite code</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myLeagues.map((league) => (
                  <div key={league.id} className="card p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-bold text-lg">{league.name}</h3>
                      <span className="bg-[#FF6B00]/20 text-[#FF6B00] text-xs px-2 py-1 rounded-pill">
                        {league.format === 'H2H' ? 'H2H' : 'Total Points'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[#a0a0a0] text-sm">{league.member_count} managers</span>
                      <span className={`text-sm ${getDraftStatusColor(league)}`}>
                        {getDraftStatus(league)}
                      </span>
                    </div>
                    <Link
                      to={`/leagues/${league.id}`}
                      className="block w-full bg-[#FF6B00] text-white font-bold py-2 rounded-button text-center hover:bg-[#e05f00] transition-colors"
                    >
                      Enter League
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Create or Join */}
          <div className="w-[60%]">
            <div className="card p-6">
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
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  Create League
                </button>
                <button
                  onClick={() => {
                    setActiveTab('join');
                    setCreateSuccess(null);
                    setJoinSuccess(null);
                  }}
                  className={`px-4 py-2 rounded-button font-bold ${
                    activeTab === 'join'
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  Join League
                </button>
              </div>

              {/* Create League Tab */}
              {activeTab === 'create' && (
                <>
                  {createSuccess ? (
                    <div className="text-center py-8">
                      <h3 className="text-white font-bold text-2xl mb-4">League created!</h3>
                      <p className="text-[#a0a0a0] mb-4">Share this code with friends to invite them:</p>
                      <div className="bg-[#1a1a1a] border border-[#242424] rounded-lg p-6 mb-4">
                        <p className="text-[#FF6B00] font-bold text-4xl mb-2">{createSuccess.inviteCode}</p>
                        <button
                          onClick={() => copyToClipboard(createSuccess.inviteCode)}
                          className="text-[#a0a0a0] text-sm hover:text-white underline"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                      <Link
                        to={`/leagues/${createSuccess.leagueId}`}
                        className="inline-block bg-[#FF6B00] text-white font-bold px-8 py-3 rounded-button hover:bg-[#e05f00] transition-colors"
                      >
                        Enter My League
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateLeague} className="space-y-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">League Name</label>
                        <input
                          type="text"
                          value={leagueName}
                          onChange={(e) => setLeagueName(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors"
                          placeholder="Enter league name"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Number of Managers</label>
                        <div className="flex gap-2">
                          {[6, 8, 10, 12].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setMaxManagers(num)}
                              className={`flex-1 py-2 rounded-button font-bold ${
                                maxManagers === num
                                  ? 'bg-[#FF6B00] text-white'
                                  : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Format</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormat('H2H')}
                            className={`flex-1 py-2 rounded-button font-bold ${
                              format === 'H2H'
                                ? 'bg-[#FF6B00] text-white'
                                : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                            }`}
                          >
                            Head to Head
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormat('Total Points')}
                            className={`flex-1 py-2 rounded-button font-bold ${
                              format === 'Total Points'
                                ? 'bg-[#FF6B00] text-white'
                                : 'bg-[#1a1a1a] text-[#a0a0a0] hover:text-white'
                            }`}
                          >
                            Total Points
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Draft Date</label>
                        <input
                          type="datetime-local"
                          value={draftDate}
                          onChange={(e) => setDraftDate(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={creating}
                        className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creating ? 'Creating...' : 'Create League'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Join League Tab */}
              {activeTab === 'join' && (
                <>
                  {joinSuccess ? (
                    <div className="text-center py-8">
                      <h3 className="text-white font-bold text-2xl mb-4">You've joined {joinSuccess.leagueName}!</h3>
                      <Link
                        to={`/leagues/${joinSuccess.leagueId}`}
                        className="inline-block bg-[#FF6B00] text-white font-bold px-8 py-3 rounded-button hover:bg-[#e05f00] transition-colors"
                      >
                        Enter League
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleJoinLeague} className="space-y-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">Enter Invite Code</label>
                        <input
                          type="text"
                          value={joinInviteCode}
                          onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                          className="w-full bg-[#1a1a1a] border border-[#242424] rounded-button px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors uppercase"
                          placeholder="XXXXXX"
                          maxLength={6}
                          required
                        />
                      </div>

                      {joinError && (
                        <p className="text-red-500 text-sm">{joinError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={joining}
                        className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-button hover:bg-[#e05f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {joining ? 'Joining...' : 'Join League'}
                      </button>
                    </form>
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
