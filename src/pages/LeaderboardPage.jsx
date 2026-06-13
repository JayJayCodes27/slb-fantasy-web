// LeaderboardPage.jsx — Clean minimal leaderboard
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalManagers, setTotalManagers] = useState(0);
  const [page, setPage] = useState(1);

  if (authLoading) return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-[#F4622A]">Loading...</div>
    </div>
  );

  if (!user) { navigate('/signin'); return null; }

  useEffect(() => { fetchLeaderboard(); }, [user, page]);

  const fetchLeaderboard = async () => {
    try {
      const { data: members } = await supabase
        .from('league_members')
        .select('*, users(username, team_name)')
        .order('total_points', { ascending: false })
        .range((page - 1) * 50, page * 50 - 1);

      setLeaderboard(members || []);

      const { count } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true });
      setTotalManagers(count || 0);

      setCurrentUserEntry(members?.find(m => m.user_id === user.id) || null);
    } catch (error) {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const rankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-[#F4622A]">Loading...</div>
    </div>
  );

  if (totalManagers === 0) return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🏀</div>
        <h2 className="text-white font-bold text-2xl mb-2">No managers yet</h2>
        <p className="text-[#666666] mb-6">Be the first to build your squad</p>
        <Link to="/squad-selection" className="bg-[#F4622A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#d4521a] transition-colors">
          Build Your Squad
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Header */}
      <div className="pt-6 pb-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-1">LEADERBOARD</h1>
          <p className="text-[#666666] text-sm">{totalManagers} managers competing</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Your position card */}
          {currentUserEntry && (
            <div className="bg-[#111111] border border-[#F4622A]/30 rounded-2xl p-5 sm:p-6">
              <p className="text-[#A0A0A0] text-xs uppercase tracking-widest mb-1">Your Team</p>
              <h2 className="text-white font-bold text-xl sm:text-2xl mb-3">
                {currentUserEntry.users?.team_name || currentUserEntry.users?.username}
              </h2>
              <p className="text-[#F4622A] font-semibold text-sm mb-4">
                Rank {leaderboard.findIndex(m => m.user_id === user.id) + 1 + (page - 1) * 50} of {totalManagers} managers
              </p>
              <div className="flex gap-8">
                <div>
                  <p className="text-[#666666] text-xs uppercase tracking-wide mb-1">Total Points</p>
                  <p className="text-[#F4622A] font-bold text-4xl">{currentUserEntry.total_points || 0}</p>
                </div>
                <div>
                  <p className="text-[#666666] text-xs uppercase tracking-wide mb-1">GW Points</p>
                  <p className="text-[#A0A0A0] font-bold text-4xl">{currentUserEntry.gameweek_points || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_64px_64px] px-4 py-3 border-b border-[#1A1A1A]">
              <span className="text-[#555555] text-xs uppercase tracking-wide">#</span>
              <span className="text-[#555555] text-xs uppercase tracking-wide">Team</span>
              <span className="text-[#555555] text-xs uppercase tracking-wide text-right">GW</span>
              <span className="text-[#555555] text-xs uppercase tracking-wide text-right">Total</span>
            </div>

            <div className="divide-y divide-[#1A1A1A]">
              {leaderboard.map((member, index) => {
                const rank = (page - 1) * 50 + index + 1;
                const isCurrentUser = member.user_id === user.id;
                return (
                  <div
                    key={member.user_id}
                    className={`grid grid-cols-[40px_1fr_64px_64px] px-4 py-3 items-center border-l-2 ${
                      isCurrentUser
                        ? 'border-[#F4622A] bg-[#1A1A1A]'
                        : index % 2 === 0 ? 'border-transparent' : 'border-transparent bg-[#141414]'
                    }`}
                  >
                    <span className="text-[#C9A84C] font-bold text-sm">{rankBadge(rank)}</span>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-white' : 'text-[#E0E0E0]'}`}>
                        {member.users?.team_name || member.users?.username}
                      </p>
                      <p className="text-[#555555] text-xs truncate">{member.users?.username}</p>
                    </div>
                    <span className="text-[#A0A0A0] font-bold text-sm text-right">{member.gameweek_points || 0}</span>
                    <span className="text-[#F4622A] font-bold text-sm text-right">{member.total_points || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {totalManagers > 50 && (
            <div className="flex justify-center gap-3">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="px-4 py-2 bg-[#111111] border border-[#222222] rounded-lg text-sm text-[#A0A0A0] disabled:opacity-30 hover:text-white transition-colors">Previous</button>
              <span className="px-4 py-2 text-[#666666] text-sm">Page {page}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * 50 >= totalManagers}
                className="px-4 py-2 bg-[#111111] border border-[#222222] rounded-lg text-sm text-[#A0A0A0] disabled:opacity-30 hover:text-white transition-colors">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
