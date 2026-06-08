import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalManagers, setTotalManagers] = useState(0);

  if (authLoading) return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-[#F4622A] text-lg">Loading...</div>
    </div>
  );

  if (!user) {
    navigate('/signin');
    return null;
  }

  useEffect(() => {
    fetchLeaderboard();
  }, [user, page]);

  const fetchLeaderboard = async () => {
    try {
      const { data: members, error } = await supabase
        .from('league_members')
        .select(`
          *,
          users (username, team_name)
        `)
        .order('total_points', { ascending: false })
        .range((page - 1) * 100, page * 100 - 1);

      if (error) throw error;

      setLeaderboard(members || []);

      // Get total count
      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true });

      setTotalManagers(count || 0);

      // Find current user's rank
      const userRank = members?.find(m => m.user_id === user.id);
      setCurrentUserRank(userRank);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankChangeBadge = (rankChange) => {
    if (!rankChange || rankChange === 0) return <span style={{ color: '#666' }}>—</span>;
    if (rankChange > 0) return <span style={{ color: '#22c55e' }}>▲{rankChange}</span>;
    return <span style={{ color: '#ef4444' }}>▼{Math.abs(rankChange)}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-[#F4622A]">Loading...</div>
      </div>
    );
  }

  if (totalManagers === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-5">
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-10 text-center max-w-md">
          <p className="text-[#666666] text-base">
            No managers yet. Be the first to build your squad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter'] p-5 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12">
        <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-2">LEADERBOARD</h1>
      </div>

      {/* Top Card - Your Position */}
      {currentUserRank && (
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 mb-6">
          <p className="text-[#A0A0A0] text-sm mb-2">
            {currentUserRank.users?.team_name || currentUserRank.users?.username}
          </p>
          <p className="text-white text-lg mb-4">
            You are {getRankBadge(currentUserRank.current_user_rank)} of {totalManagers} managers
          </p>
          <div className="flex gap-8">
            <div>
              <p className="text-[#A0A0A0] text-xs uppercase tracking-widest mb-1">Total Points</p>
              <p className="text-[#F4622A] font-bold text-4xl leading-none">
                {currentUserRank.total_points || 0}
              </p>
            </div>
            <div>
              <p className="text-[#A0A0A0] text-xs uppercase tracking-widest mb-1">Last GW</p>
              <p className="text-[#A0A0A0] font-bold text-4xl leading-none">
                {currentUserRank.gameweek_points || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#222222]">
              <th className="p-4 text-left text-[#A0A0A0] text-xs uppercase tracking-widest w-20">Rank</th>
              <th className="p-4 text-left text-[#A0A0A0] text-xs uppercase tracking-widest">Team</th>
              <th className="p-4 text-left text-[#A0A0A0] text-xs uppercase tracking-widest">Manager</th>
              <th className="p-4 text-right text-[#A0A0A0] text-xs uppercase tracking-widest w-24">GW Pts</th>
              <th className="p-4 text-right text-[#A0A0A0] text-xs uppercase tracking-widest w-24">Total</th>
              <th className="p-4 text-right text-[#A0A0A0] text-xs uppercase tracking-widest w-20"></th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((member, index) => {
              const isCurrentUser = member.user_id === user.id;
              const rank = (page - 1) * 100 + index + 1;
              const getRankBorder = () => {
                if (rank === 1) return 'border-l-4 border-[#FFD700]';
                if (rank === 2) return 'border-l-4 border-[#C0C0C0]';
                if (rank === 3) return 'border-l-4 border-[#CD7F32]';
                if (isCurrentUser) return 'border-l-4 border-[#F4622A]';
                return 'border-l-4 border-transparent';
              };
              return (
                <tr
                  key={member.user_id}
                  className={`border-b border-[#1A1A1A] ${isCurrentUser ? 'bg-[#1A1A1A]' : ''} ${getRankBorder()}`}
                >
                  <td className="p-4 text-[#C9A84C] font-bold text-base">
                    {getRankBadge(rank)}
                  </td>
                  <td className="p-4 text-white font-semibold text-sm">
                    {member.users?.team_name || member.users?.username}
                  </td>
                  <td className="p-4 text-[#A0A0A0] text-sm">
                    {member.users?.username}
                  </td>
                  <td className="p-4 text-right text-[#A0A0A0] font-bold text-base">
                    {member.gameweek_points || 0}
                  </td>
                  <td className="p-4 text-right text-[#F4622A] font-bold text-base">
                    {member.total_points || 0}
                  </td>
                  <td className="p-4 text-right text-sm">
                    {getRankChangeBadge(member.rank_change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalManagers > 100 && (
          <div className="flex justify-center gap-2 p-4 border-t border-[#222222]">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                page === 1 
                  ? 'bg-[#1A1A1A] text-[#666666] cursor-not-allowed' 
                  : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
              }`}
            >
              Previous
            </button>
            <span className="px-4 py-2 text-[#666666] text-sm">
              Page {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 100 >= totalManagers}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                page * 100 >= totalManagers 
                  ? 'bg-[#1A1A1A] text-[#666666] cursor-not-allowed' 
                  : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
