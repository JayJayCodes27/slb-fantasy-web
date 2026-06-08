// LandingPage.jsx — Public landing page with features, countdown, and waitlist signup
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Jersey from '../components/Jersey.jsx';
import { getTeamColours } from '../constants/teamColours.js';
import { useAuth } from '../context/AuthContext.jsx';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [topPlayers, setTopPlayers] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [email, setEmail] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [waitlistError, setWaitlistError] = useState('');
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  // Auto-advance hero carousel
  useEffect(() => {
    if (heroPaused) return;
    const t = setInterval(() => setHeroSlide(s => (s + 1) % 3), 5000);
    return () => clearInterval(t);
  }, [heroPaused]);

  // Fetch deadline from active gameweek, fall back to 7 days from now
  useEffect(() => {
    const startCountdown = (deadlineDate) => {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = deadlineDate - now;
        if (diff > 0) {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          });
        } else {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      }, 1000);
      return timer;
    };

    let timer;
    const fetchDeadline = async () => {
      try {
        const { data } = await supabase
          .from('gameweeks')
          .select('deadline')
          .eq('is_active', true)
          .limit(1)
          .single();
        const deadline = data?.deadline ? new Date(data.deadline) : (() => {
          const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(18, 0, 0, 0); return d;
        })();
        timer = startCountdown(deadline);
      } catch {
        const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(18, 0, 0, 0);
        timer = startCountdown(d);
      }
    };
    fetchDeadline();
    return () => { if (timer) clearInterval(timer); };
  }, []);

  useEffect(() => {
    fetchTopPlayers();
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

  return (
    <>
      {/* Hero Carousel */}
      <section
        className="py-12 sm:py-20 px-4 sm:px-12 relative overflow-hidden"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="max-w-7xl mx-auto">
          {/* Slides */}
          <div className="relative min-h-[320px] sm:min-h-[380px]">

            {/* Slide 1 */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 h-full">
                <div className="w-full lg:w-[55%] text-center lg:text-left">
                  <p className="text-[#C9A84C] text-[13px] font-bold uppercase tracking-widest mb-4">SUPER LEAGUE BASKETBALL</p>
                  <h1 className="text-white font-['Bebas_Neue'] text-5xl sm:text-6xl lg:text-[64px] leading-none mb-2">YOUR SLB SQUAD.</h1>
                  <h2 className="text-[#F4622A] font-['Bebas_Neue'] text-5xl sm:text-6xl lg:text-[64px] leading-none mb-6">OWN THE SEASON.</h2>
                  <p className="text-[#A0A0A0] text-base leading-relaxed mb-8">The UK's first fantasy basketball game for Super League Basketball. Live scoring. Season-long leagues. Free to play.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    {!user && <Link to="/signup" className="bg-[#F4622A] text-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#d4521a] transition-colors text-center">Get Started</Link>}
                    <Link to="/about" className="bg-transparent text-white font-bold text-sm px-6 py-3 rounded-lg border border-white hover:bg-white hover:text-black transition-colors text-center">Learn More</Link>
                  </div>
                </div>
                <div className="hidden lg:flex w-[45%] items-center justify-center">
                  <div className="relative" style={{ width: '280px', height: '350px' }}>
                    <div className="absolute inset-0 bg-gradient-radial from-[#FF6B00]/30 via-[#FF6B00]/10 to-transparent rounded-full blur-3xl"></div>
                    <div className="relative transform rotate-[-10deg]">
                      <svg viewBox="0 0 280 350" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(255,107,0,0.3))' }}>
                        <path d="M30 20 L250 20 L270 50 L270 180 L250 220 L140 240 L30 220 L10 180 L10 50 Z" fill="#0a0a0a" />
                        <path d="M30 20 L250 20 L270 50 L250 70 L30 70 L10 50 Z" fill="#FF6B00" />
                        <path d="M10 50 L30 70 L30 220 L10 180 Z" fill="#FF6B00" />
                        <path d="M250 20 L270 50 L270 180 L250 220 L250 70 Z" fill="#FF6B00" />
                        <path d="M100 20 L140 40 L180 20" fill="none" stroke="#FF6B00" strokeWidth="4" />
                        <text x="140" y="100" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="sans-serif">SLB</text>
                        <text x="140" y="180" textAnchor="middle" fill="white" fontSize="100" fontWeight="bold" fontFamily="sans-serif">23</text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === 1 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 h-full">
                <div className="w-full lg:w-[55%] text-center lg:text-left">
                  <p className="text-[#C9A84C] text-[13px] font-bold uppercase tracking-widest mb-4">SUPER LEAGUE BASKETBALL</p>
                  <h1 className="text-white font-['Bebas_Neue'] text-5xl sm:text-6xl lg:text-[64px] leading-none mb-2">BUILD YOUR</h1>
                  <h2 className="text-[#F4622A] font-['Bebas_Neue'] text-5xl sm:text-6xl lg:text-[64px] leading-none mb-6">DREAM TEAM.</h2>
                  <p className="text-[#A0A0A0] text-base leading-relaxed mb-8">9 players. £100m budget. Every decision counts.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <Link to="/about" className="bg-[#F4622A] text-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#d4521a] transition-colors text-center">How It Works</Link>
                  </div>
                </div>
                <div className="hidden lg:flex w-[45%] items-center justify-center">
                  <div className="w-[280px] h-[350px] bg-[#111111] rounded-2xl border border-[#222222] flex items-center justify-center">
                    <span className="text-[#F4622A] font-['Bebas_Neue'] text-6xl">SLB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3 */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${heroSlide === 2 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 h-full">
                <div className="w-full lg:w-[55%] text-center lg:text-left">
                  <p className="text-[#C9A84C] text-[13px] font-bold uppercase tracking-widest mb-4">SUPER LEAGUE BASKETBALL</p>
                  <h1 className="text-white font-['Bebas_Neue'] text-5xl sm:text-6xl lg:text-[64px] leading-none mb-2">COMPETE. SCORE.</h1>
                  <h2 className="text-[#F4622A] font-['Bebas_Neue'] text-5xl sm:text-6xl lg:text-[64px] leading-none mb-6">WIN.</h2>
                  <p className="text-[#A0A0A0] text-base leading-relaxed mb-8">Live scoring. Season-long leagues. Free to play.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <a href="mailto:hello@slbfantasy.co.uk" className="bg-[#F4622A] text-white font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#d4521a] transition-colors text-center">Join the Waitlist</a>
                  </div>
                </div>
                <div className="hidden lg:flex w-[45%] items-center justify-center">
                  <div className="w-[280px] h-[350px] bg-[#111111] rounded-2xl border border-[#222222] flex items-center justify-center">
                    <span className="text-[#F4622A] font-['Bebas_Neue'] text-6xl">SLB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`rounded-full transition-all ${heroSlide === i ? 'w-6 h-2 bg-[#F4622A]' : 'w-2 h-2 bg-[#333333] hover:bg-[#555555]'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Icons Row */}
      <section className="px-4 sm:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 h-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 h-full">
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2 text-[#C9A84C]">👥</div>
                <h3 className="text-white font-inter font-bold text-[16px] uppercase mb-1">Create or Join Leagues</h3>
                <p className="text-[#A0A0A0] text-sm font-['Inter']">Compete with friends</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2 text-[#C9A84C]">📅</div>
                <h3 className="text-white font-inter font-bold text-[16px] uppercase mb-1">Weekly Gameweeks</h3>
                <p className="text-[#A0A0A0] text-sm font-['Inter']">Real matchups, real points</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2 text-[#C9A84C]">🏆</div>
                <h3 className="text-white font-inter font-bold text-[16px] uppercase mb-1">Climb the Rankings</h3>
                <p className="text-[#A0A0A0] text-sm font-['Inter']">Top the leaderboard</p>
              </div>
              <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
                <div className="text-3xl mb-2 text-[#C9A84C]">🎁</div>
                <h3 className="text-white font-inter font-bold text-[16px] uppercase mb-1">Free to Play</h3>
                <p className="text-[#A0A0A0] text-sm font-['Inter']">No entry fees. Ever.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown Banner */}
      <section className="px-4 sm:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111111] border border-[#222222] rounded-xl h-auto sm:h-20 flex flex-col sm:flex-row items-center px-4 sm:px-8 py-4 sm:py-0 gap-4">
            <span className="text-[#C9A84C] font-['Barlow_Condensed'] text-[11px] uppercase tracking-widest">NEXT DEADLINE</span>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-white font-['Bebas_Neue'] text-4xl sm:text-[64px] leading-none">{String(countdown.days).padStart(2, '0')}</div>
                <div className="text-[#555555] text-[11px] uppercase font-['Inter']">DAYS</div>
              </div>
              <div className="text-[#F4622A] font-bold text-xl sm:text-3xl">:</div>
              <div className="text-center">
                <div className="text-white font-['Bebas_Neue'] text-4xl sm:text-[64px] leading-none">{String(countdown.hours).padStart(2, '0')}</div>
                <div className="text-[#555555] text-[11px] uppercase font-['Inter']">HRS</div>
              </div>
              <div className="text-[#F4622A] font-bold text-xl sm:text-3xl">:</div>
              <div className="text-center">
                <div className="text-white font-['Bebas_Neue'] text-4xl sm:text-[64px] leading-none">{String(countdown.minutes).padStart(2, '0')}</div>
                <div className="text-[#555555] text-[11px] uppercase font-['Inter']">MINS</div>
              </div>
              <div className="text-[#F4622A] font-bold text-xl sm:text-3xl">:</div>
              <div className="text-center">
                <div className="text-white font-['Bebas_Neue'] text-4xl sm:text-[64px] leading-none">{String(countdown.seconds).padStart(2, '0')}</div>
                <div className="text-[#555555] text-[11px] uppercase font-['Inter']">SECS</div>
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
      <section className="py-16 px-4 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-inter font-bold text-[22px] sm:text-[26px] uppercase tracking-wide">TOP POINTS SCORERS</h2>
            <Link to="/players" className="text-[#F4622A] font-['Inter'] font-medium text-sm">View all →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {topPlayers.length > 0 ? (
              topPlayers.map((player, index) => (
                <div key={player.id} className="bg-[#111111] border border-[#222222] rounded-xl p-4 h-[200px] flex-shrink-0 snap-start hover:border-[#F4622A] hover:scale-[1.02] transition-all cursor-pointer" style={{ width: '200px' }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[#C9A84C] font-['Bebas_Neue'] font-bold text-2xl">{index + 1}</span>
                  </div>
                  <div className="flex justify-center mb-4">
                    <Jersey
                      primaryColour={getTeamColours(player.slb_teams?.name).primary}
                      secondaryColour={getTeamColours(player.slb_teams?.name).secondary}
                      number={player.squad_number ?? null}
                      size="lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-['Inter'] font-semibold text-sm mb-1">{player.name}</p>
                    <p className="text-[#F4622A] font-['Barlow_Condensed'] font-bold text-sm uppercase">{player.total_season_points} PTS</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#A0A0A0]">Loading top players...</p>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white font-inter font-bold text-[22px] sm:text-[26px] uppercase tracking-wide mb-8">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'Sign Up', desc: "Create your free account in seconds and join the UK's first SLB fantasy game." },
              { num: '02', title: 'Pick Squad', desc: 'Choose 9 players — 3 Guards, 3 Forwards, 3 Centres — within your £100m budget.' },
              { num: '03', title: 'Score Points', desc: 'Your players earn points from real SLB stats every gameweek. Captain doubles up.' },
              { num: '04', title: 'Win', desc: 'Climb the public leaderboard or top your private league to be crowned champion.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="bg-[#111111] border border-[#222222] rounded-xl p-6">
                <div className="text-[#C9A84C] font-bold text-3xl font-['Bebas_Neue'] mb-3">{num}</div>
                <h3 className="text-white font-inter font-bold text-base uppercase mb-2">{title}</h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
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
              <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">About</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Terms</Link>
              <a href="mailto:hello@slbfantasy.co.uk" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Contact</a>
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
