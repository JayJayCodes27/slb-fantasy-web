import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const LeagueDetailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: leagueId } = useParams();
  const [activeTab, setActiveTab] = useState('standings');
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const chips = [
    { name: 'Wildcard', description: 'Unlimited transfers', color: 'green', remaining: 2 },
    { name: 'Full Rotation', description: 'Rotate entire squad', color: 'blue', remaining: 1 },
    { name: 'Deep Squad', description: 'Extra bench slot', color: 'purple', remaining: 1 },
    { name: 'Franchise Player', description: 'Double points on one player', color: 'orange', remaining: 1 }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchLeagueData();
  }, [user, navigate, leagueId]);

  const fetchLeagueData = async () => {
    try {
      // Fetch league details
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (leagueError) throw leagueError;
      setLeague(leagueData);

      // Fetch league members with user details
      const { data: membersData, error: membersError } = await supabase
        .from('league_members')
        .select('*, users(username, avatar_url)')
        .eq('league_id', leagueId)
        .order('total_points', { ascending: false });

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching league data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeasonStateBadge = () => {
    if (!league) return { text: 'Loading...', color: 'text-[#a0a0a0]' };
    if (!league.draft_complete) return { text: 'Pre-Season', color: 'text-[#a0a0a0]' };
    return { text: 'Active', color: 'text-green-500 animate-pulse' };
  };

  const getCurrentUserMember = () => {
    return members.find(m => m.user_id === user?.id);
  };

  const getCurrentUserRank = () => {
    const rank = members.findIndex(m => m.user_id === user?.id);
    return rank >= 0 ? rank + 1 : '-';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">League not found</div>
      </div>
    );
  }

  const stateBadge = getSeasonStateBadge();
  const currentUserMember = getCurrentUserMember();
  const currentUserRank = getCurrentUserRank();
  const isCommissioner = league.commissioner_id === user?.id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter p-4 sm:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link to="/leagues" className="text-[#FF6B00] text-sm font-semibold hover:underline mb-2 inline-block">
            ← Back to Leagues
          </Link>
          <h1 className="text-white font-oswald text-3xl sm:text-5xl font-bold mt-2">{league.name}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Left Column (35%) */}
          <div className="w-full lg:w-[35%] space-y-4">
            {/* League Info Card */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2 py-1 rounded-pill ${
                  league.league_type === 'public' 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : 'bg-[#FF6B00]/20 text-[#FF6B00]'
                }`}>
                  {league.league_type === 'public' ? 'Public' : 'Private'}
                </span>
                {isCommissioner && (
                  <span className="text-xs px-2 py-1 rounded-pill bg-yellow-500/20 text-yellow-500">
                    Commissioner
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0] text-sm">Managers</span>
                  <span className="text-white font-bold text-sm">{members.length} / {league.max_managers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0] text-sm">Season Status</span>
                  <span className={`text-sm font-semibold ${stateBadge.color}`}>
                    {stateBadge.text}
                  </span>
                </div>
              </div>
              {league.league_type === 'private' && league.invite_code && (
                <div className="border-t border-[#242424] mt-4 pt-4">
                  <p className="text-[#a0a0a0] text-xs mb-2">Invite friends</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg px-3 py-2">
                      <span className="text-[#FF6B00] font-oswald font-bold text-lg">{league.invite_code}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(league.invite_code)}
                      className="px-3 py-2 bg-[#FF6B00] text-white font-bold text-xs rounded-button hover:bg-[#e05f00] transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current User Stats Card */}
            <div className="card p-4 sm:p-5">
              <h2 className="text-white font-bold text-sm mb-4">My Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0] text-sm">Gameweek points</span>
                  <span className="text-[#FF6B00] font-bold text-sm">{currentUserMember?.gameweek_points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0] text-sm">Overall points</span>
                  <span className="text-white font-bold text-sm">{currentUserMember?.total_points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0] text-sm">League rank</span>
                  <span className="text-white font-bold text-sm">{currentUserRank}th</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0] text-sm">Total transfers</span>
                  <span className="text-white font-bold text-sm">{currentUserMember?.total_transfers || 0}</span>
                </div>
              </div>
              <Link
                to="/my-team"
                className="block w-full bg-[#FF6B00] text-white font-bold py-2 rounded-button text-center hover:bg-[#e05f00] transition-colors mt-4 text-sm"
              >
                Manage My Squad
              </Link>
            </div>

            {/* Chips Remaining Card */}
            <div className="card p-4 sm:p-5">
              <h2 className="text-white font-bold text-sm mb-3">My Chips</h2>
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
          </div>

          {/* Right Column (65%) */}
          <div className="w-full lg:w-[65%]">
            <div className="card p-4 sm:p-6">
              {/* Tab Bar */}
              <div className="flex gap-4 sm:gap-6 mb-6 border-b border-[#242424]">
                {['standings', 'fixtures', 'members'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm sm:text-base font-semibold transition-colors ${
                      activeTab === tab
                        ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
                        : 'text-[#a0a0a0] hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Standings Tab */}
              {activeTab === 'standings' && (
                <div>
                  {!league.draft_complete ? (
                    <div className="text-center py-12">
                      <p className="text-[#a0a0a0]">Season hasn't started yet. Standings will appear here once the season begins.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-[#a0a0a0] text-xs uppercase tracking-wider">
                            <th className="pb-3 pr-4">Rank</th>
                            <th className="pb-3 pr-4">Manager</th>
                            <th className="pb-3 pr-4 text-right">GW Points</th>
                            <th className="pb-3 pr-4 text-right">Total Points</th>
                            <th className="pb-3 text-right">+/-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member, index) => {
                            const isCurrentUser = member.user_id === user?.id;
                            const rankChange = member.rank_change || 0;
                            return (
                              <tr
                                key={member.id}
                                className={`border-t border-[#242424] ${isCurrentUser ? 'bg-[#FF6B00]/10' : ''}`}
                              >
                                <td className="py-3 pr-4 font-bold text-sm">{index + 1}</td>
                                <td className="py-3 pr-4 text-sm">{member.users?.username || 'Unknown'}</td>
                                <td className="py-3 pr-4 text-right text-sm">{member.gameweek_points || 0}</td>
                                <td className="py-3 pr-4 text-right text-sm font-bold">{member.total_points || 0}</td>
                                <td className="py-3 text-right text-sm">
                                  {rankChange > 0 ? (
                                    <span className="text-green-500">↑{rankChange}</span>
                                  ) : rankChange < 0 ? (
                                    <span className="text-red-500">↓{Math.abs(rankChange)}</span>
                                  ) : (
                                    <span className="text-[#a0a0a0]">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Fixtures Tab */}
              {activeTab === 'fixtures' && (
                <div>
                  {!league.draft_complete ? (
                    <div className="text-center py-12">
                      <p className="text-[#a0a0a0]">Fixtures will appear once the season starts.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Placeholder for fixtures - will need to fetch actual fixture data */}
                      <div className="text-center py-12">
                        <p className="text-[#a0a0a0]">Head-to-head fixtures coming soon.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {members.map((member) => {
                      const isCommissioner = league.commissioner_id === member.user_id;
                      const initials = member.users?.username?.slice(0, 2).toUpperCase() || '??';
                      return (
                        <div key={member.id} className="card p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center font-bold text-white">
                              {initials}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-sm">{member.users?.username || 'Unknown'}</h3>
                                {isCommissioner && (
                                  <span className="text-xs px-2 py-0.5 rounded-pill bg-yellow-500/20 text-yellow-500">
                                    Commissioner
                                  </span>
                                )}
                              </div>
                              <p className="text-[#a0a0a0] text-xs">
                                Joined {new Date(member.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#a0a0a0] text-xs">Total Points</span>
                            <span className="text-white font-bold text-sm">{member.total_points || 0}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetailPage;
