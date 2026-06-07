import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const GameweekResultsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentGameweek, setCurrentGameweek] = useState(0);
  const [squadData, setSquadData] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [leagueMember, setLeagueMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [dreamTeam, setDreamTeam] = useState([]);

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
    fetchGameweekResults();
  }, [user]);

  const fetchGameweekResults = async () => {
    try {
      // Fetch current gameweek
      const { data: settings } = await supabase
        .from('app_settings')
        .select('current_gameweek')
        .single();

      const gw = settings?.current_gameweek || 0;
      setCurrentGameweek(gw);

      const completedGameweek = gw - 1;

      if (completedGameweek < 1) {
        setLoading(false);
        return;
      }

      // Fetch user's squad
      const { data: squad } = await supabase
        .from('user_squads')
        .select('*, players(*, slb_teams(*))')
        .eq('user_id', user.id);

      setSquadData(squad || []);

      // Fetch player game stats for completed gameweek
      const { data: stats } = await supabase
        .from('player_game_stats')
        .select('*')
        .eq('gameweek', completedGameweek);

      const statsMap = {};
      stats?.forEach(stat => {
        statsMap[stat.player_id] = stat;
      });
      setPlayerStats(statsMap);

      // Fetch user's league member data
      const { data: member } = await supabase
        .from('league_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setLeagueMember(member);

      // Fetch dream team
      const { data: allStats } = await supabase
        .from('player_game_stats')
        .select('*, players(name, position, slb_teams(name, primary_colour))')
        .eq('gameweek', completedGameweek)
        .order('total_fantasy_points', { ascending: false });

      // Get top 2 guards, top 2 forwards, top 1 centre
      const guards = allStats?.filter(s => s.players?.position === 'G').slice(0, 2) || [];
      const forwards = allStats?.filter(s => s.players?.position === 'F').slice(0, 2) || [];
      const centres = allStats?.filter(s => s.players?.position === 'C').slice(0, 1) || [];
      setDreamTeam([...guards, ...forwards, ...centres]);

    } catch (error) {
      console.error('Error fetching gameweek results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rankChange) => {
    if (!rankChange || rankChange === 0) return <span style={{ color: '#666' }}>—</span>;
    if (rankChange > 0) return <span style={{ color: '#22c55e' }}>▲{rankChange}</span>;
    return <span style={{ color: '#ef4444' }}>▼{Math.abs(rankChange)}</span>;
  };

  const getOrdinal = (n) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  const starters = squadData.filter(s => s.is_starter);
  const bench = squadData.filter(s => !s.is_starter);
  const completedGameweek = currentGameweek - 1;

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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A', 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Top Card - Gameweek Score */}
      {completedGameweek < 1 ? (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: '#666'
          }}>
            Gameweek results will appear here after the first gameweek completes.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#141414',
          border: '1px solid #2A2A2A',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              GAMEWEEK {completedGameweek} RESULTS
            </p>
            <p style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#FF6B00',
              lineHeight: 1,
              marginBottom: '8px'
            }}>
              {leagueMember?.gameweek_points || 0}
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#666'
            }}>
              Your score this gameweek
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              YOUR RANK
            </p>
            <p style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1,
              marginBottom: '8px'
            }}>
              {getOrdinal(leagueMember?.current_user_rank || '-')}
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#666'
            }}>
              {getRankBadge(leagueMember?.rank_change)}
            </p>
          </div>
        </div>
      )}

      {/* Middle Section - Your Players */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#FF6B00',
          marginBottom: '16px'
        }}>
          YOUR PLAYERS
        </h2>

        {/* Starters */}
        {starters.map((squadItem) => {
          const player = squadItem.players;
          const stats = playerStats[player.id];
          const points = stats?.total_fantasy_points || 0;
          const isExpanded = expandedPlayer === player.id;

          return (
            <div
              key={player.id}
              onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
              style={{
                backgroundColor: '#141414',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1a1a1a'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#141414'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: player.slb_teams?.primary_colour || '#666'
                  }} />
                  <div>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '4px'
                    }}>
                      {player.name}
                      {squadItem.is_captain && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          backgroundColor: '#FF6B00',
                          color: 'white',
                          fontSize: '10px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          C ×2
                        </span>
                      )}
                      {squadItem.is_vice_captain && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          backgroundColor: '#666',
                          color: 'white',
                          fontSize: '10px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          V ×2
                        </span>
                      )}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#2A2A2A',
                        color: '#666',
                        fontSize: '10px',
                        borderRadius: '4px'
                      }}>
                        {player.position}
                      </span>
                      <p style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {player.slb_teams?.name}
                      </p>
                    </div>
                  </div>
                </div>
                <p style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#FF6B00'
                }}>
                  {points} pts
                </p>
              </div>
              {isExpanded && stats && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #2A2A2A',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Base: {stats.base_points || 0}pts | Position bonus: {stats.position_bonus || 0}pts | Milestone: {stats.milestone_bonus || 0}pts
                </div>
              )}
            </div>
          );
        })}

        {/* Bench */}
        {bench.map((squadItem) => {
          const player = squadItem.players;
          const stats = playerStats[player.id];
          const points = stats?.total_fantasy_points || 0;

          return (
            <div
              key={player.id}
              style={{
                backgroundColor: '#0f0f0f',
                border: '1px solid #1A1A1A',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                opacity: 0.7
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: player.slb_teams?.primary_colour || '#666'
                  }} />
                  <div>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '4px'
                    }}>
                      {player.name} <span style={{ color: '#666', fontSize: '12px' }}>(bench)</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#1A1A1A',
                        color: '#666',
                        fontSize: '10px',
                        borderRadius: '4px'
                      }}>
                        {player.position}
                      </span>
                      <p style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {player.slb_teams?.name}
                      </p>
                    </div>
                  </div>
                </div>
                <p style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#666'
                }}>
                  {points} pts
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section - Dream Team */}
      <div>
        <h2 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#FF6B00',
          marginBottom: '8px'
        }}>
          GAMEWEEK DREAM TEAM
        </h2>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#666',
          marginBottom: '16px'
        }}>
          Best possible lineup from all managers this gameweek
        </p>

        {dreamTeam.length === 0 ? (
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #2A2A2A',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              color: '#666'
            }}>
              Dream Team will appear after the first gameweek completes.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '12px'
          }}>
            {dreamTeam.map((stat) => (
              <div
                key={stat.player_id}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  padding: '20px',
                  minWidth: '180px',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: stat.players?.slb_teams?.primary_colour || '#666'
                  }} />
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {stat.players?.name}
                  </p>
                </div>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  {stat.players?.slb_teams?.name}
                </p>
                <p style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#FF6B00',
                  marginBottom: '8px'
                }}>
                  {stat.total_fantasy_points} pts
                </p>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: '#FF6B00',
                  color: 'white',
                  fontSize: '10px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  DREAM TEAM
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameweekResultsPage;
