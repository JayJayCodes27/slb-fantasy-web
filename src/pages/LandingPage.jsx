// LandingPage.jsx — Public landing page with features, countdown, and waitlist signup
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import JerseyCard from '../components/JerseyCard';

const LandingPage = () => {
  const [countdown, setCountdown] = useState({ days: 7, hours: 0, minutes: 0, seconds: 0 });
  const [topPlayers, setTopPlayers] = useState([]);
  const [scoutPicks, setScoutPicks] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [email, setEmail] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [waitlistError, setWaitlistError] = useState('');

  useEffect(() => {
    // Set deadline to 7 days from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    deadline.setHours(18, 0, 0, 0); // 6 PM

    const timer = setInterval(() => {
      const now = new Date();
      const diff = deadline - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTopPlayers();
    fetchScoutPicks();
    fetchNews();
  }, []);

  const fetchTopPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          slb_teams (
            name,
            primary_colour
          )
        `)
        .order('total_season_points', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setTopPlayers(data);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchScoutPicks = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_picks')
        .select(`
          *,
          players (
            name,
            position,
            value,
            slb_teams (
              name,
              short_name,
              primary_colour
            )
          )
        `)
        .limit(3);

      if (error) throw error;
      if (data) setScoutPicks(data);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchNews = async () => {
    try {
      const [playerNewsData, transferNewsData] = await Promise.all([
        supabase
          .from('player_news')
          .select('headline, players(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('transfer_news')
          .select('headline')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const newsItems = [
        ...playerNewsData.data?.map(item => ({
          type: 'injury',
          text: `${item.players?.name || 'Player'} — ${item.headline}`
        })) || [],
        ...transferNewsData.data?.map(item => ({
          type: 'transfer',
          text: item.headline
        })) || []
      ];

      setNewsItems(newsItems);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistMessage('');
    setWaitlistError('');

    try {
      const { data, error } = await supabase
        .from('waitlist')
        .insert([{ email }])
        .select();

      if (error) {
        if (error.code === '23505') { // Unique violation
          setWaitlistError("You're already on the list!");
        } else {
          throw error;
        }
      } else {
        setWaitlistMessage("You're on the list! We'll be in touch.");
        setEmail('');
      }
    } catch (error) {
      // Silent error handling
      setWaitlistError('Something went wrong. Please try again.');
    }
  };

  const formatValue = (value) => {
    return `£${(value / 1000000).toFixed(1)}m`;
  };

  const getPositionColor = (position) => {
    const colors = {
      PG: '#3B82F6',
      SG: '#10B981',
      SF: '#F59E0B',
      PF: '#EF4444',
      C: '#8B5CF6'
    };
    return colors[position] || '#6B7280';
  };

  const getPriceTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':
        return <span className="text-green-400">▲</span>;
      case 'falling':
        return <span className="text-red-400">▼</span>;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-12 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left Column */}
            <div className="w-full lg:w-[55%] text-center lg:text-left">
              <h1 className="text-white font-bold text-3xl sm:text-4xl lg:text-5xl uppercase leading-tight mb-4">
                YOUR SLB SQUAD.
              </h1>
              <h2 className="text-[#FF6B00] font-bold text-3xl sm:text-4xl lg:text-5xl uppercase leading-tight mb-6">
                OWN THE SEASON.
              </h2>
              <p className="text-[#c0c0c0] text-sm sm:text-base leading-relaxed mb-6">
                The UK's first fantasy basketball game for Super League Basketball.
              </p>
              <p className="text-[#c0c0c0] text-sm sm:text-base leading-relaxed mb-8">
                Live scoring. Season-long leagues. Free to play.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button className="bg-[#FF6B00] text-white font-bold text-sm px-5 py-3 rounded-button h-11 flex items-center justify-center gap-2 hover:bg-[#e05f00] transition-colors">
                  <span className="text-lg">🍎</span>
                  Download on iOS
                </button>
                <button className="bg-[#1e1e1e] text-white font-bold text-sm px-5 py-3 rounded-button h-11 border border-[#333] flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-colors">
                  <span className="text-lg">▶️</span>
                  Get it on Android
                </button>
              </div>
            </div>

            {/* Right Column - Jersey Graphic */}
            <div className="hidden lg:flex w-[45%] items-center justify-center">
              <div className="relative" style={{ width: '280px', height: '350px' }}>
                {/* Radiating light burst effect */}
                <div className="absolute inset-0 bg-gradient-radial from-[#FF6B00]/30 via-[#FF6B00]/10 to-transparent rounded-full blur-3xl"></div>
                
                {/* Jersey illustration */}
                <div className="relative transform rotate-[-10deg]">
                  <svg viewBox="0 0 280 350" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 107, 0, 0.3))' }}>
                    {/* Jersey body - proper basketball jersey shape */}
                    <path d="M30 20 L250 20 L270 50 L270 180 L250 220 L140 240 L30 220 L10 180 L10 50 Z" fill="#0a0a0a" />
                    
                    {/* Orange shoulders */}
                    <path d="M30 20 L250 20 L270 50 L250 70 L30 70 L10 50 Z" fill="#FF6B00" />
                    
                    {/* Orange side trim */}
                    <path d="M10 50 L30 70 L30 220 L10 180 Z" fill="#FF6B00" />
                    <path d="M250 20 L270 50 L270 180 L250 220 L250 70 Z" fill="#FF6B00" />
                    
                    {/* Orange collar/neckline */}
                    <path d="M100 20 L140 40 L180 20" fill="none" stroke="#FF6B00" strokeWidth="4" />
                    
                    {/* SLB text at chest level */}
                    <text x="140" y="100" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="sans-serif">SLB</text>
                    
                    {/* Number 23 large in centre */}
                    <text x="140" y="180" textAnchor="middle" fill="white" fontSize="100" fontWeight="bold" fontFamily="sans-serif">23</text>
                    
                    {/* Subtle texture lines */}
                    <line x1="140" y1="50" x2="140" y2="240" stroke="#1a1a1a" strokeWidth="1" />
                    <line x1="80" y1="60" x2="80" y2="230" stroke="#1a1a1a" strokeWidth="1" />
                    <line x1="200" y1="60" x2="200" y2="230" stroke="#1a1a1a" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Icons Row */}
      <section className="px-4 sm:px-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="card p-6 h-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 h-full">
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-white font-bold text-base mb-1">Create or Join Leagues</h3>
                <p className="text-[#a0a0a0] text-sm">Compete with friends</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="text-white font-bold text-base mb-1">Weekly Gameweeks</h3>
                <p className="text-[#a0a0a0] text-sm">Real matchups, real points</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="text-white font-bold text-base mb-1">Climb the Rankings</h3>
                <p className="text-[#a0a0a0] text-sm">Top the leaderboard</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2">🎁</div>
                <h3 className="text-white font-bold text-base mb-1">Free to Play</h3>
                <p className="text-[#a0a0a0] text-sm">No entry fees. Ever.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Banner */}
      <section className="px-4 sm:px-12 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="card h-auto sm:h-20 flex flex-col sm:flex-row items-center px-4 sm:px-8 py-4 sm:py-0 gap-4">
            <span className="text-[#a0a0a0] text-[10px] sm:text-xs uppercase tracking-widest">NEXT DEADLINE</span>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-[#FF6B00] font-bold text-2xl sm:text-4xl">{String(countdown.days).padStart(2, '0')}</div>
                <div className="text-[#555] text-[8px] sm:text-[10px] uppercase">DAYS</div>
              </div>
              <div className="text-[#FF6B00] font-bold text-xl sm:text-3xl">:</div>
              <div className="text-center">
                <div className="text-[#FF6B00] font-bold text-2xl sm:text-4xl">{String(countdown.hours).padStart(2, '0')}</div>
                <div className="text-[#555] text-[8px] sm:text-[10px] uppercase">HRS</div>
              </div>
              <div className="text-[#FF6B00] font-bold text-xl sm:text-3xl">:</div>
              <div className="text-center">
                <div className="text-[#FF6B00] font-bold text-2xl sm:text-4xl">{String(countdown.minutes).padStart(2, '0')}</div>
                <div className="text-[#555] text-[8px] sm:text-[10px] uppercase">MINS</div>
              </div>
              <div className="text-[#FF6B00] font-bold text-xl sm:text-3xl">:</div>
              <div className="text-center">
                <div className="text-[#FF6B00] font-bold text-2xl sm:text-4xl">{String(countdown.seconds).padStart(2, '0')}</div>
                <div className="text-[#555] text-[8px] sm:text-[10px] uppercase">SECS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Ticker */}
      <div className="bg-[#0D0D0D] overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap py-3">
          {newsItems.length > 0 ? (
            [...newsItems, ...newsItems].map((item, i) => (
              <span key={i} className="mx-8 text-[#a0a0a0] font-semibold">
                🏀 {item.text}
              </span>
            ))
          ) : (
            <span className="mx-8 text-[#a0a0a0] font-semibold">🏀 Loading news...</span>
          )}
        </div>
      </div>

      {/* Top Form Players */}
      <section className="py-8 px-4 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm sm:text-base uppercase tracking-wide">TOP FORM PLAYERS THIS WEEK</h2>
            <span className="text-[#FF6B00] text-xs cursor-pointer">View all →</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {topPlayers.length > 0 ? (
              topPlayers.map((player, index) => (
                <div key={player.id} className="card p-4 h-[200px] flex-shrink-0 snap-start" style={{ width: '200px' }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-white font-bold text-xl">{index + 1}</span>
                  </div>
                  <div className="flex justify-center mb-4">
                    <svg viewBox="0 0 60 50" className="w-[90px] h-[90px]">
                      <path d="M15 0 L45 0 L50 15 L50 35 L45 50 L15 50 L10 35 L10 15 Z" fill={player.slb_teams?.primary_colour || '#6B7280'} />
                      <text x="30" y="30" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{player.position}</text>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm mb-1">{player.name}</p>
                    <p className="text-[#FF6B00] font-bold text-xs uppercase">{player.total_season_points} PTS</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#a0a0a0]">Loading top players...</p>
            )}
          </div>
        </div>
      </section>

      {/* Scout Picks */}
      <section className="py-12 sm:py-20 px-4 sm:px-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-16">SCOUT PICKS THIS WEEK</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {scoutPicks.length > 0 ? (
              scoutPicks.map((pick) => (
                <div key={pick.id} className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                  <span className="bg-orange text-white px-3 py-1 rounded text-xs font-semibold mb-4 inline-block">SCOUT PICK</span>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-oswald text-lg sm:text-xl font-bold">{pick.players?.name || 'Unknown'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ backgroundColor: getPositionColor(pick.players?.position) + '20', color: getPositionColor(pick.players?.position) }}
                        >
                          {pick.players?.position || 'N/A'}
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: pick.slb_teams?.primary_colour || '#6B7280' }}
                          />
                          <span className="text-gray-400 text-sm">{pick.slb_teams?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {pick.reason && <p className="text-gray-400 italic mb-4 text-sm">"{pick.reason}"</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-orange font-oswald text-lg sm:text-xl font-bold">{pick.players?.total_season_points || 0}</span>
                    <span className="text-gray-400 text-sm">{formatValue(pick.players?.value || 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                  <span className="bg-orange/50 text-white px-3 py-1 rounded text-xs font-semibold mb-4 inline-block">SCOUT PICK</span>
                  <p className="text-gray-400 italic text-sm">Picks coming soon</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-16">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl font-oswald font-bold">1</div>
              <h3 className="font-oswald text-xl sm:text-2xl font-bold mb-4">Draft Your Team</h3>
              <p className="text-gray-400 text-sm sm:text-base">Select your players from across the SLB and build your dream squad within the budget.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl font-oswald font-bold">2</div>
              <h3 className="font-oswald text-xl sm:text-2xl font-bold mb-4">Score Live Points</h3>
              <p className="text-gray-400 text-sm sm:text-base">Watch your players score points in real-time as they play in actual SLB games.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl font-oswald font-bold">3</div>
              <h3 className="font-oswald text-xl sm:text-2xl font-bold mb-4">Top Your League</h3>
              <p className="text-gray-400 text-sm sm:text-base">Compete against friends and other fans to climb the leaderboard and win prizes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Picks */}
      <section className="py-12 sm:py-20 px-4 sm:px-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-16">TOP PICKS THIS WEEK</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-oswald text-xl sm:text-2xl font-bold">Aaryn Rai</h3>
                  <p className="text-gray-400 text-sm">London Lions</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded text-xs sm:text-sm font-semibold">PG</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-sm">Value: £12.5m</span>
                <span className="text-green-400 font-bold text-sm">Form: 9.2/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-oswald text-xl sm:text-2xl font-bold">Jordan Hunt</h3>
                  <p className="text-gray-400 text-sm">Newcastle Eagles</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded text-xs sm:text-sm font-semibold">SF</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-sm">Value: £10.8m</span>
                <span className="text-green-400 font-bold text-sm">Form: 8.7/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-oswald text-xl sm:text-2xl font-bold">Tariq Sboui</h3>
                  <p className="text-gray-400 text-sm">Leicester Riders</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded text-xs sm:text-sm font-semibold">C</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-sm">Value: £9.2m</span>
                <span className="text-green-400 font-bold text-sm">Form: 8.4/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange h-2 rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Injuries & Availability */}
      <section className="py-12 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-16">INJURIES & AVAILABILITY</h2>
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg">Player</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg hidden sm:table-cell">Team</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base">Aaryn Rai</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">London Lions</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6"><span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">Fit</span></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base">Jordan Hunt</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">Newcastle Eagles</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6"><span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">Doubtful</span></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base">Marcus Evans</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">Leicester Riders</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6"><span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">Out</span></td>
                </tr>
                <tr>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base">Tariq Sboui</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">Leicester Riders</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6"><span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">Fit</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-12 sm:py-20 px-4 sm:px-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-16">Latest News</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Large Featured Card - Left (60%) */}
            <Link to="/news" className="lg:col-span-3 relative h-64 sm:h-96 rounded-xl overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
              <div className="absolute inset-0 bg-[#111111] group-hover:bg-[#1a1a1a] transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
                <h3 className="font-oswald text-lg sm:text-2xl font-bold mb-2">London Lions seal SLB domestic Quadruple at The O2</h3>
                <p className="text-gray-300 text-xs sm:text-sm">The defending champions complete an historic season with their fourth trophy of the campaign.</p>
              </div>
            </Link>

            {/* Stacked Cards - Right (40%) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Top Right Card */}
              <Link to="/news" className="relative h-44 rounded-xl overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-[#111111] group-hover:bg-[#1a1a1a] transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20">
                  <h3 className="font-oswald text-base sm:text-lg font-bold mb-1">Patrick Robinson named 2025/26 Season MVP</h3>
                  <p className="text-gray-300 text-[10px] sm:text-xs">London Lions guard takes home the league's most prestigious individual award.</p>
                </div>
              </Link>

              {/* Bottom Right Card */}
              <Link to="/news" className="relative h-44 rounded-xl overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-[#111111] group-hover:bg-[#1a1a1a] transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20">
                  <h3 className="font-oswald text-base sm:text-lg font-bold mb-1">Joel Scott returns to London Lions for 2026/27 season</h3>
                  <p className="text-gray-300 text-[10px] sm:text-xs">Star forward commits to another year with the London Lions.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2025/26 Final Standings */}
      <section className="py-12 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-16">2025/26 Final Standings</h2>
          <div className="bg-[#111111] rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#1A1A1A]">
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg text-orange">Pos</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg text-orange">Team</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg text-orange hidden sm:table-cell">Record</th>
                  <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-oswald text-sm sm:text-lg text-orange">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 bg-orange/10">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-orange text-sm sm:text-base">1</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#FF5C00]" />
                    London Lions
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">26W 6L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">52</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">2</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#0066CC]" />
                    Cheshire Phoenix
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">20W 12L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">40</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">3</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#000000]" />
                    Manchester Basketball
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">19W 13L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">38</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">4</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#CC0000]" />
                    Sheffield Sharks
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">16W 16L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">32</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">5</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#003366]" />
                    Leicester Riders
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">15W 17L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">30</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">6</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#FF6600]" />
                    Bristol Flyers
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">15W 17L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">30</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">7</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#9900CC]" />
                    Surrey 89ers
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">14W 18L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">28</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">8</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#003399]" />
                    Newcastle Eagles
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">12W 20L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">24</td>
                </tr>
                <tr>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">9</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <div className="w-3 h-3 rounded-full bg-[#006600]" />
                    Caledonia Gladiators
                  </td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-400 hidden sm:table-cell text-sm sm:text-base">7W 25L</td>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-base">14</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Email Waitlist */}
      <section className="py-12 sm:py-20 px-4 sm:px-8 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold mb-4">Be first to play when we launch</h2>
          <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-10">Join the waitlist — launching autumn 2026</p>
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange text-sm sm:text-base"
            />
            <button
              type="submit"
              className="bg-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange/90 transition-colors text-sm sm:text-base"
            >
              Join Waitlist
            </button>
          </form>
          {waitlistMessage && (
            <p className="mt-4 text-green-400 font-semibold text-sm sm:text-base">{waitlistMessage}</p>
          )}
          {waitlistError && (
            <p className="mt-4 text-red-400 font-semibold text-sm sm:text-base">{waitlistError}</p>
          )}
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-12 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-oswald text-2xl sm:text-4xl font-bold mb-6">AVAILABLE FREE ON iOS AND ANDROID</h2>
          <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-10">Download now and start building your championship-winning squad.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/10 border border-white/20 rounded-xl px-6 sm:px-8 py-4 hover:bg-white/20 transition-colors cursor-pointer">
              <p className="font-oswald text-base sm:text-lg font-bold">App Store</p>
              <p className="text-xs sm:text-sm text-gray-400">Download on iOS</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-6 sm:px-8 py-4 hover:bg-white/20 transition-colors cursor-pointer">
              <p className="font-oswald text-base sm:text-lg font-bold">Google Play</p>
              <p className="text-xs sm:text-sm text-gray-400">Get it on Android</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-8 bg-[#1A1A1A] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
            <div className="font-oswald text-xl sm:text-2xl font-bold text-orange">SLB FANTASY</div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</Link>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Contact</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">@slbfantasy</a>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">slbfantasy.co.uk</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
