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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ color: '#FF5500', fontSize: '18px' }}>Loading...</div>
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
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0A0A0A', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: '#FF6B00' }}>Loading...</div>
      </div>
    );
  }

  if (totalManagers === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0A0A0A', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: '#666'
          }}>
            No managers yet. Be the first to build your squad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A', 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Top Card - Your Position */}
      {currentUserRank && (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            {currentUserRank.users?.team_name || currentUserRank.users?.username}
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '18px',
            color: 'white',
            marginBottom: '16px'
          }}>
            You are {getRankBadge(currentUserRank.current_user_rank)} of {totalManagers} managers
          </p>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                Total Points
              </p>
              <p style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#FF6B00',
                lineHeight: 1
              }}>
                {currentUserRank.total_points || 0}
              </p>
            </div>
            <div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                Last GW
              </p>
              <p style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#666',
                lineHeight: 1
              }}>
                {currentUserRank.gameweek_points || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div style={{
        backgroundColor: '#141414',
        border: '1px solid #2A2A2A',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: '80px'
              }}>
                Rank
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Team
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Manager
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'right',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: '100px'
              }}>
                GW Pts
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'right',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: '100px'
              }}>
                Total
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'right',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                width: '80px'
              }}>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((member, index) => {
              const isCurrentUser = member.user_id === user.id;
              return (
                <tr
                  key={member.user_id}
                  style={{
                    borderBottom: '1px solid #1A1A1A',
                    backgroundColor: isCurrentUser ? '#1a1a1a' : 'transparent',
                    borderLeft: isCurrentUser ? '3px solid #FF6B00' : '3px solid transparent'
                  }}
                >
                  <td style={{
                    padding: '16px',
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {getRankBadge(member.current_user_rank)}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: 'white',
                    fontWeight: '500'
                  }}>
                    {member.users?.team_name || member.users?.username}
                  </td>
                  <td style={{
                    padding: '16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {member.users?.username}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'right',
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    {member.gameweek_points || 0}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'right',
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#FF6B00'
                  }}>
                    {member.total_points || 0}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'right',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px'
                  }}>
                    {getRankChangeBadge(member.rank_change)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalManagers > 100 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid #2A2A2A'
          }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: page === 1 ? '#1A1A1A' : '#2A2A2A',
                color: page === 1 ? '#666' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              Previous
            </button>
            <span style={{
              padding: '8px 16px',
              color: '#666',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Page {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 100 >= totalManagers}
              style={{
                padding: '8px 16px',
                backgroundColor: page * 100 >= totalManagers ? '#1A1A1A' : '#2A2A2A',
                color: page * 100 >= totalManagers ? '#666' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: page * 100 >= totalManagers ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
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
