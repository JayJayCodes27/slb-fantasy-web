import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(1);
  const [seasonState, setSeasonState] = useState(null);
  const [loading, setLoading] = useState(true);

  if (authLoading) return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ color: 'white' }}>Loading...</div>
    </div>
  );

  if (!user) {
    navigate('/signin');
    return null;
  }

  useEffect(() => {
    checkOnboardingStatus();
    fetchSeasonState();
  }, [user, navigate]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      if (userData?.onboarding_complete) {
        navigate('/fantasy');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
    setLoading(false);
  };

  const fetchSeasonState = async () => {
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('season_state')
        .single();

      setSeasonState(settings?.season_state || 'off_season');
    } catch (error) {
      console.error('Error fetching season state:', error);
      setSeasonState('off_season');
    }
  };

  const completeOnboarding = async () => {
    try {
      await supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate('/fantasy');
  };

  const handleNext = () => {
    if (currentScreen < 4) {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const handleBuildSquad = async () => {
    await completeOnboarding();
    navigate('/squad-selection');
  };

  const handleJoinWaitlist = async () => {
    await completeOnboarding();
    navigate('/');
  };

  const handleCreatePrivateLeague = async () => {
    await completeOnboarding();
    navigate('/leagues');
  };

  const handleJoinPublicLeague = async () => {
    await completeOnboarding();
    // Auto-join public league logic here
    navigate('/fantasy');
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

  // Skip screen 4 if off_season
  if (currentScreen === 4 && (seasonState === 'off_season' || seasonState === 'leagues_locked')) {
    handleSkip();
    return null;
  }

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
        maxWidth: '560px',
        width: '100%',
        backgroundColor: '#141414',
        border: '1px solid #2A2A2A',
        borderRadius: '16px',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Skip Link */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif'
          }}
        >
          Skip
        </button>

        {/* Screen Content */}
        <div style={{
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease'
        }}>
          {currentScreen === 1 && (
            <Screen1 
              user={user} 
              onNext={handleNext}
            />
          )}

          {currentScreen === 2 && (
            <Screen2 onNext={handleNext} />
          )}

          {currentScreen === 3 && (
            <Screen3 
              seasonState={seasonState}
              onBuildSquad={handleBuildSquad}
              onJoinWaitlist={handleJoinWaitlist}
              onNext={handleNext}
            />
          )}

          {currentScreen === 4 && (
            <Screen4 
              onCreatePrivateLeague={handleCreatePrivateLeague}
              onJoinPublicLeague={handleJoinPublicLeague}
              onSkip={handleSkip}
            />
          )}
        </div>

        {/* Progress Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '32px'
        }}>
          {[1, 2, 3, 4].map((dot) => (
            <div
              key={dot}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: dot <= currentScreen ? '#FF6B00' : '#333',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Screen1 = ({ user, onNext }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏀</div>
    <h1 style={{
      fontFamily: 'Oswald, sans-serif',
      fontSize: '32px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '8px'
    }}>
      Welcome to SLB Fantasy
    </h1>
    <p style={{
      fontFamily: 'Oswald, sans-serif',
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#FF6B00',
      marginBottom: '24px'
    }}>
      {user?.username}!
    </p>
    <p style={{
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '18px',
      color: '#666',
      marginBottom: '32px',
      lineHeight: '1.5'
    }}>
      The UK's first fantasy basketball game for Super League Basketball.
    </p>
    <button
      onClick={onNext}
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: '#FF6B00',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#e05f00'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#FF6B00'}
    >
      Let's go →
    </button>
  </div>
);

const Screen2 = ({ onNext }) => (
  <div>
    <h2 style={{
      fontFamily: 'Oswald, sans-serif',
      fontSize: '28px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '32px',
      textAlign: 'center'
    }}>
      How it works
    </h2>
    <div 
      className="how-it-works-cards"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '16px',
        marginBottom: '32px'
      }}
    >
      <div style={{
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        minWidth: '0'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏀</div>
        <h3 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          Build your squad
        </h3>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          Pick 9 players within a £100m budget. Guards, Forwards and Centres.
        </p>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        minWidth: '0'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
        <h3 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          Score live points
        </h3>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          Your players earn points as they perform in real SLB games.
        </p>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        minWidth: '0'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏆</div>
        <h3 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          Top your league
        </h3>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          Compete against friends in private leagues or join a public league.
        </p>
      </div>
    </div>
    <style>
      {`
        @media (max-width: 640px) {
          .how-it-works-cards {
            flex-direction: column !important;
          }
          .how-it-works-cards > div {
            min-width: 100% !important;
          }
        }
      `}
    </style>
    <button
      onClick={onNext}
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: '#FF6B00',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#e05f00'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#FF6B00'}
    >
      Next →
    </button>
  </div>
);

const Screen3 = ({ seasonState, onBuildSquad, onJoinWaitlist, onNext }) => {
  let icon, heading, body, buttonText, buttonAction;

  if (seasonState === 'pre_season') {
    icon = '🟢';
    heading = 'Leagues are open';
    body = 'The 2026/27 season is coming. Build your squad and join a league before the season tips off.';
    buttonText = 'Build my squad →';
    buttonAction = onBuildSquad;
  } else if (seasonState === 'season_active') {
    icon = '🔴 Live';
    heading = 'The season is live';
    body = 'Games are being played right now. Build your squad and start scoring points straight away.';
    buttonText = 'Build my squad →';
    buttonAction = onBuildSquad;
  } else {
    icon = '🕐';
    heading = 'Coming soon';
    body = 'The 2026/27 season hasn\'t started yet. Add yourself to the waitlist and we\'ll let you know when leagues open.';
    buttonText = 'Join the waitlist →';
    buttonAction = onJoinWaitlist;
  }

  const showNextButton = seasonState === 'pre_season' || seasonState === 'season_active';

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '24px' }}>{icon}</div>
      <h2 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: '28px',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '16px'
      }}>
        {heading}
      </h2>
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '16px',
        color: '#666',
        marginBottom: '32px',
        lineHeight: '1.5'
      }}>
        {body}
      </p>
      <button
        onClick={buttonAction}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#FF6B00',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          marginBottom: showNextButton ? '12px' : '0',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#e05f00'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#FF6B00'}
      >
        {buttonText}
      </button>
      {showNextButton && (
        <button
          onClick={onNext}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: 'transparent',
            color: '#666',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.color = '#888'}
          onMouseOut={(e) => e.target.style.color = '#666'}
        >
          Next →
        </button>
      )}
    </div>
  );
};

const Screen4 = ({ onCreatePrivateLeague, onJoinPublicLeague, onSkip }) => (
  <div style={{ textAlign: 'center' }}>
    <h2 style={{
      fontFamily: 'Oswald, sans-serif',
      fontSize: '28px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '16px'
    }}>
      Join a league
    </h2>
    <p style={{
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '16px',
      color: '#666',
      marginBottom: '32px',
      lineHeight: '1.5'
    }}>
      Compete with friends in a private league or get placed with other managers in a public league.
    </p>
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '16px'
    }}>
      <button
        onClick={onCreatePrivateLeague}
        style={{
          flex: 1,
          padding: '16px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          border: '1px solid #FF6B00',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2a2a2a'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#1a1a1a'}
      >
        Create private league
      </button>
      <button
        onClick={onJoinPublicLeague}
        style={{
          flex: 1,
          padding: '16px',
          backgroundColor: '#FF6B00',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#e05f00'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#FF6B00'}
      >
        Join public league
      </button>
    </div>
    <button
      onClick={onSkip}
      style={{
        background: 'none',
        border: 'none',
        color: '#666',
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        textDecoration: 'underline',
        transition: 'color 0.2s ease'
      }}
      onMouseOver={(e) => e.target.style.color = '#888'}
      onMouseOut={(e) => e.target.style.color = '#666'}
    >
      Skip for now
    </button>
  </div>
);

export default OnboardingPage;
