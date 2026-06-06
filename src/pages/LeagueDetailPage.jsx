// LeagueDetailPage.jsx — League detail page with standings and squad view modal
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const LeagueDetailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [settings, setSettings] = useState(null);

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
        .select('*, users(username, team_name, avatar_url)')
        .eq('league_id', leagueId)
        .order('total_points', { ascending: false });

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSettings();
    fetchLeagueData();
  }, [user, leagueId]);

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
              
              {/* User's Team Name */}
              <div className="mb-4 pb-4 border-b border-[#242424]">
                <p className="text-[#a0a0a0] text-xs uppercase tracking-wider mb-1">MY TEAM</p>
                <p className="text-white font-oswald font-bold text-xl sm:text-2xl">{user?.team_name || user?.username || 'My Team'}</p>
                <p className="text-[#a0a0a0] text-sm">{user?.username || ''}</p>
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
          </div>

          {/* Right Column (65%) */}
          <div className="w-full lg:w-[65%]">
            <div className="card p-4 sm:p-6">
              {/* Standings Header */}
              <h2 className="text-white font-oswald text-xl sm:text-2xl font-bold mb-6">Standings</h2>

              {/* Standings Table */}
              {!league.draft_complete ? (
                <div className="text-center py-12">
                  <p className="text-[#a0a0a0]">Season hasn't started yet. Standings will appear here once the season begins.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[#a0a0a0] text-xs uppercase tracking-wider">
                        <th className="pb-3 pr-4 w-16">Rank</th>
                        <th className="pb-3 pr-4">Team</th>
                        <th className="pb-3 pr-4 text-right w-20">GW Pts</th>
                        <th className="pb-3 pr-4 text-right w-20">Total Pts</th>
                        <th className="pb-3 text-right w-16">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, index) => {
                        const isCurrentUser = member.user_id === user?.id;
                        const rankChange = member.rank_change || 0;
                        const highestGwPoints = Math.max(...members.map(m => m.gameweek_points || 0));
                        const isHighestGwPoints = member.gameweek_points === highestGwPoints;
                        
                        const getRankDisplay = (rank) => {
                          if (rank === 0) return '🥇 1st';
                          if (rank === 1) return '🥈 2nd';
                          if (rank === 2) return '🥉 3rd';
                          return `${rank + 1}th`;
                        };

                        return (
                          <tr
                            key={member.id}
                            onClick={() => {
                              setSelectedMember(member);
                              setShowSquadModal(true);
                            }}
                            className={`border-t border-[#242424] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${isCurrentUser ? 'bg-[#FF6B00]/10 border-l-2 border-l-[#FF6B00]' : ''}`}
                          >
                            <td className="py-3 pr-4 font-bold text-sm">{getRankDisplay(index)}</td>
                            <td className="py-3 pr-4">
                              <div className="text-white font-bold text-sm">{member.users?.team_name || member.users?.username || 'Unknown'}</div>
                              <div className="text-[#a0a0a0] text-xs">{member.users?.username || ''}</div>
                            </td>
                            <td className={`py-3 pr-4 text-right text-sm font-bold ${isHighestGwPoints ? 'text-[#FF6B00]' : ''}`}>{member.gameweek_points || 0}</td>
                            <td className="py-3 pr-4 text-right text-sm font-bold">{member.total_points || 0}</td>
                            <td className="py-3 text-right text-sm">
                              {rankChange > 0 ? (
                                <span className="text-green-500">▲ {rankChange}</span>
                              ) : rankChange < 0 ? (
                                <span className="text-red-500">▼ {Math.abs(rankChange)}</span>
                              ) : (
                                <span className="text-[#a0a0a0]">—</span>
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
          </div>
        </div>
      </div>

      {/* Squad Modal */}
      {showSquadModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowSquadModal(false)}>
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-white font-oswald text-xl font-bold">{selectedMember.users?.team_name || selectedMember.users?.username || 'Unknown Team'}</h3>
                <p className="text-[#a0a0a0] text-sm">{selectedMember.users?.username || 'Unknown Manager'}</p>
              </div>
              <button
                onClick={() => setShowSquadModal(false)}
                className="text-[#a0a0a0] hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-[#FF6B00] text-xs mb-4">Showing {selectedMember.users?.team_name || selectedMember.users?.username}'s squad for Gameweek {settings?.current_gameweek || 1}</p>

            {!league.draft_complete ? (
              <div className="text-center py-8 bg-[#1a1a1a] rounded-lg">
                <p className="text-[#a0a0a0] text-sm">Squad view will show live data once the season starts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Starting 5 */}
                <div>
                  <h4 className="text-white font-bold text-sm mb-3">Starting 5</h4>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-xs font-bold text-white">
                          {['PG', 'SG', 'SF', 'PF', 'C'][i]}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">Player {i + 1}</p>
                          <p className="text-[#a0a0a0] text-xs">Team</p>
                        </div>
                        <span className="text-[#FF6B00] font-bold text-sm">{Math.floor(Math.random() * 20)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bench */}
                <div>
                  <h4 className="text-white font-bold text-sm mb-3">Bench</h4>
                  <div className="space-y-2 opacity-60">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-[#555555] flex items-center justify-center text-xs font-bold text-white">
                          {['PG', 'SG', 'SF', 'PF', 'C'][i]}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">Bench {i + 1}</p>
                          <p className="text-[#a0a0a0] text-xs">Team</p>
                        </div>
                        <span className="text-[#a0a0a0] font-bold text-sm">{Math.floor(Math.random() * 10)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-[#242424] pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total GW Points</span>
                    <span className="text-[#FF6B00] font-bold text-xl">{selectedMember.gameweek_points || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueDetailPage;
