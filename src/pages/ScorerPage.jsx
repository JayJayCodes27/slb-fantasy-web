import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ScorerPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [currentQuarter, setCurrentQuarter] = useState('Q1');
  const [eventStack, setEventStack] = useState([]);
  const [playerPoints, setPlayerPoints] = useState({});
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState(0);

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

  if (!user || user.email !== 'jamaljohnson29@gmail.com') {
    navigate('/');
    return null;
  }

  useEffect(() => {
    fetchFixtures();
    fetchCurrentGameweek();
    setupNetworkListeners();
    loadQueuedEvents();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setupNetworkListeners = () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };

  const handleOnline = () => {
    setIsOffline(false);
    flushQueue();
  };

  const handleOffline = () => {
    setIsOffline(true);
  };

  const loadQueuedEvents = () => {
    const queue = JSON.parse(localStorage.getItem('scorer_queue') || '[]');
    if (queue.length > 0) {
      showToast(`Offline — ${queue.length} events queued`);
    }
  };

  const flushQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('scorer_queue') || '[]');
    if (queue.length === 0) return;

    try {
      for (const event of queue) {
        await supabase.from('live_events').insert(event);
      }
      localStorage.removeItem('scorer_queue');
      showToast(`Back online — ${queue.length} events synced`);
    } catch (error) {
      console.error('Error flushing queue:', error);
    }
  };

  const fetchCurrentGameweek = async () => {
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('current_gameweek')
        .single();

      setCurrentGameweek(settings?.current_gameweek || 0);
    } catch (error) {
      console.error('Error fetching gameweek:', error);
    }
  };

  const fetchFixtures = async () => {
    try {
      const { data: fixturesData } = await supabase
        .from('fixture_difficulty')
        .select(`
          *,
          home_team:slb_teams!fixture_difficulty_home_team_id_fkey(name, primary_colour),
          away_team:slb_teams!fixture_difficulty_away_team_id_fkey(name, primary_colour)
        `)
        .order('gameweek_number', { ascending: true });

      setFixtures(fixturesData || []);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScoring = async (fixture) => {
    setActiveGame(fixture);
    setCurrentQuarter('Q1');

    try {
      // Fetch home team players
      const { data: homeData } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', fixture.home_team_id);

      // Fetch away team players
      const { data: awayData } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', fixture.away_team_id);

      setHomePlayers(homeData || []);
      setAwayPlayers(awayData || []);

      // Initialize player points
      const pointsMap = {};
      [...(homeData || []), ...(awayData || [])].forEach(p => {
        pointsMap[p.id] = 0;
      });
      setPlayerPoints(pointsMap);

    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const getEventPoints = (eventType) => {
    const pts = {
      'FG2': 1, 'FG3': 4, 'FT': 1,
      'AST': 3, 'REB': 2, 'STL': 3,
      'BLK': 3, 'TOV': -1, 'FOUL': 0
    };
    return pts[eventType] || 0;
  };

  const handleStatButton = async (player, eventType) => {
    const pointsDelta = getEventPoints(eventType);
    const event = {
      player_id: player.id,
      event_type: eventType,
      gameweek: currentGameweek,
      is_undone: false,
      fantasy_points_delta: pointsDelta
    };

    // Optimistic update
    setPlayerPoints(prev => ({
      ...prev,
      [player.id]: (prev[player.id] || 0) + pointsDelta
    }));

    // Add to event stack
    setEventStack(prev => [...prev, {
      id: Date.now(), // temporary ID
      player_id: player.id,
      event_type: eventType,
      player_name: player.name,
      timestamp: new Date().toISOString()
    }]);

    // Show toast
    showToast(`${player.name} — ${eventType}`);

    // Insert to Supabase or queue if offline
    if (isOffline) {
      const queue = JSON.parse(localStorage.getItem('scorer_queue') || '[]');
      queue.push(event);
      localStorage.setItem('scorer_queue', JSON.stringify(queue));
    } else {
      try {
        const { data: insertedEvent } = await supabase
          .from('live_events')
          .insert(event)
          .select()
          .single();

        // Update event stack with real ID
        setEventStack(prev => prev.map(e => 
          e.id === Date.now() ? { ...e, id: insertedEvent.id } : e
        ));
      } catch (error) {
        console.error('Error inserting event:', error);
        // Queue on error
        const queue = JSON.parse(localStorage.getItem('scorer_queue') || '[]');
        queue.push(event);
        localStorage.setItem('scorer_queue', JSON.stringify(queue));
      }
    }
  };

  const handleUndo = async () => {
    if (eventStack.length === 0) return;

    const lastEvent = eventStack[eventStack.length - 1];
    setShowUndoConfirm(false);

    try {
      await supabase
        .from('live_events')
        .update({ is_undone: true })
        .eq('id', lastEvent.id);

      // Reverse optimistic update
      const pointsDelta = getEventPoints(lastEvent.event_type);
      setPlayerPoints(prev => ({
        ...prev,
        [lastEvent.player_id]: (prev[lastEvent.player_id] || 0) - pointsDelta
      }));

      // Pop from stack
      setEventStack(prev => prev.slice(0, -1));

      showToast(`Undone: ${lastEvent.player_name} ${lastEvent.event_type}`);
    } catch (error) {
      console.error('Error undoing event:', error);
    }
  };

  const handleEndGame = async () => {
    setShowEndGameConfirm(false);
    setActiveGame(null);
    setEventStack([]);
    setPlayerPoints({});
    showToast('Game ended');
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1000);
  };

  const getButtonColor = (eventType) => {
    if (eventType === 'FG2' || eventType === 'FG3' || eventType === 'FT') {
      return { bg: '#1a3a1a', border: '#2a5a2a' };
    }
    if (eventType === 'AST' || eventType === 'REB') {
      return { bg: '#1a2a4a', border: '#2a4a6a' };
    }
    if (eventType === 'STL' || eventType === 'BLK') {
      return { bg: '#1a3a3a', border: '#2a5a5a' };
    }
    if (eventType === 'TOV') {
      return { bg: '#3a1a1a', border: '#5a2a2a' };
    }
    return { bg: '#2a2a2a', border: '#3a3a3a' };
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A' 
    }}>
      {/* Offline Banner */}
      {isOffline && (
        <div style={{
          backgroundColor: '#FFA500',
          color: '#000',
          padding: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          OFFLINE — events are being queued
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#141414',
          border: '1px solid #2A2A2A',
          borderRadius: '8px',
          padding: '12px 24px',
          color: 'white',
          fontSize: '14px',
          zIndex: 1000
        }}>
          {toast}
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {showUndoConfirm && eventStack.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #2A2A2A',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '20px',
              color: 'white',
              marginBottom: '16px'
            }}>
              Undo last event?
            </h3>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#666',
              marginBottom: '24px'
            }}>
              {eventStack[eventStack.length - 1]?.player_name} — {eventStack[eventStack.length - 1]?.event_type}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowUndoConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2A2A2A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUndo}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#FF6B00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      {showEndGameConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#141414',
            border: '1px solid #2A2A2A',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '20px',
              color: 'white',
              marginBottom: '16px'
            }}>
              End Game?
            </h3>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#666',
              marginBottom: '24px'
            }}>
              This will mark the game as complete and return to the game selector.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowEndGameConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2A2A2A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEndGame}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#FF6B00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}

      {!activeGame ? (
        /* Game Selector */
        <div style={{ padding: '20px' }}>
          <h1 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: '24px',
            color: '#FF6B00',
            marginBottom: '24px'
          }}>
            Select a game to score
          </h1>
          {fixtures.length === 0 ? (
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#666'
            }}>
              No fixtures available.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  style={{
                    backgroundColor: '#141414',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <p style={{
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '18px',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    {fixture.home_team?.name} vs {fixture.away_team?.name}
                  </p>
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '16px'
                  }}>
                    {new Date(fixture.fixture_date).toLocaleString()}
                  </p>
                  <button
                    onClick={() => startScoring(fixture)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#FF6B00',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Start Scoring
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Scoring Interface */
        <div>
          {/* Top Bar */}
          <div style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#141414',
            border: '1px solid #2A2A2A',
            padding: '16px',
            zIndex: 100
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '20px',
                color: '#FF6B00'
              }}>
                SCORER
              </h1>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: 'white'
              }}>
                {activeGame.home_team?.name} vs {activeGame.away_team?.name}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => eventStack.length > 0 && setShowUndoConfirm(true)}
                  disabled={eventStack.length === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: eventStack.length > 0 ? '#EF4444' : '#2A2A2A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: eventStack.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  UNDO ({eventStack.length})
                </button>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginTop: '12px',
              justifyContent: 'center'
            }}>
              {['Q1', 'Q2', 'Q3', 'Q4', 'OT'].map((q) => (
                <button
                  key={q}
                  onClick={() => setCurrentQuarter(q)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentQuarter === q ? '#FF6B00' : '#2A2A2A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Player Columns */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            padding: '16px',
            gap: '16px'
          }}>
            {/* Home Team */}
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '18px',
                color: activeGame.home_team?.primary_colour || '#FF6B00',
                marginBottom: '16px'
              }}>
                {activeGame.home_team?.name}
              </h2>
              {homePlayers.map((player) => (
                <div
                  key={player.id}
                  style={{
                    backgroundColor: '#141414',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <p style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '4px'
                      }}>
                        {player.name}
                      </p>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#2A2A2A',
                        color: '#666',
                        fontSize: '10px',
                        borderRadius: '4px'
                      }}>
                        {player.position}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: 'Oswald, sans-serif',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#FF6B00'
                    }}>
                      {playerPoints[player.id] || 0}
                    </p>
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(5, 1fr)', 
                    gap: '4px' 
                  }}>
                    {['FG2', 'FG3', 'FT', 'AST', 'REB'].map((stat) => {
                      const colors = getButtonColor(stat);
                      return (
                        <button
                          key={stat}
                          onClick={() => handleStatButton(player, stat)}
                          style={{
                            minHeight: '44px',
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif'
                          }}
                        >
                          {stat}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '4px',
                    marginTop: '4px'
                  }}>
                    {['STL', 'BLK', 'TOV', 'FOUL'].map((stat) => {
                      const colors = getButtonColor(stat);
                      return (
                        <button
                          key={stat}
                          onClick={() => handleStatButton(player, stat)}
                          style={{
                            minHeight: '44px',
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif'
                          }}
                        >
                          {stat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Away Team */}
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '18px',
                color: activeGame.away_team?.primary_colour || '#FF6B00',
                marginBottom: '16px'
              }}>
                {activeGame.away_team?.name}
              </h2>
              {awayPlayers.map((player) => (
                <div
                  key={player.id}
                  style={{
                    backgroundColor: '#141414',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <p style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '4px'
                      }}>
                        {player.name}
                      </p>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#2A2A2A',
                        color: '#666',
                        fontSize: '10px',
                        borderRadius: '4px'
                      }}>
                        {player.position}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: 'Oswald, sans-serif',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#FF6B00'
                    }}>
                      {playerPoints[player.id] || 0}
                    </p>
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(5, 1fr)', 
                    gap: '4px' 
                  }}>
                    {['FG2', 'FG3', 'FT', 'AST', 'REB'].map((stat) => {
                      const colors = getButtonColor(stat);
                      return (
                        <button
                          key={stat}
                          onClick={() => handleStatButton(player, stat)}
                          style={{
                            minHeight: '44px',
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif'
                          }}
                        >
                          {stat}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '4px',
                    marginTop: '4px'
                  }}>
                    {['STL', 'BLK', 'TOV', 'FOUL'].map((stat) => {
                      const colors = getButtonColor(stat);
                      return (
                        <button
                          key={stat}
                          onClick={() => handleStatButton(player, stat)}
                          style={{
                            minHeight: '44px',
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif'
                          }}
                        >
                          {stat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* End Game Button */}
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => setShowEndGameConfirm(true)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#2A2A2A',
                color: 'white',
                border: '1px solid #3A3A3A',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              End Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScorerPage;
