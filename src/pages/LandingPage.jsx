import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

      console.log('Top players data:', data);
      console.log('Top players error:', error);

      if (error) throw error;
      if (data) setTopPlayers(data);
    } catch (error) {
      console.error('Error fetching top players:', error);
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
            total_season_points
          ),
          slb_teams (
            name,
            primary_colour
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('Scout picks data:', data);
      console.log('Scout picks error:', error);

      if (error) throw error;
      if (data) setScoutPicks(data);
    } catch (error) {
      console.error('Error fetching scout picks:', error);
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
      console.error('Error fetching news:', error);
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
      console.error('Error adding to waitlist:', error);
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
      <section className="pt-12 pb-20 px-8 animate-fade-in">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-oswald text-6xl md:text-7xl font-bold mb-6 leading-tight">
            BUILD YOUR SLB SQUAD.<br />
            <span className="text-orange">OWN THE SEASON.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            The first fantasy basketball game for UK Super League Basketball — live scoring, season-long leagues, free to play.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#" className="bg-orange text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange/90 transition-colors">
              Download on iOS
            </a>
            <a href="#" className="bg-white/10 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20">
              Get it on Android
            </a>
          </div>
        </div>
      </section>

      {/* Deadline Countdown */}
      <div className="bg-[#111D2E] py-6 px-8 border-0">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-8">
          <span className="text-gray-400 font-semibold">Next Deadline:</span>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="font-oswald text-4xl font-bold text-orange">{String(countdown.days).padStart(2, '0')}</div>
              <div className="text-xs text-gray-400">DD</div>
            </div>
            <div className="font-oswald text-4xl font-bold text-orange">:</div>
            <div className="text-center">
              <div className="font-oswald text-4xl font-bold text-orange">{String(countdown.hours).padStart(2, '0')}</div>
              <div className="text-xs text-gray-400">HH</div>
            </div>
            <div className="font-oswald text-4xl font-bold text-orange">:</div>
            <div className="text-center">
              <div className="font-oswald text-4xl font-bold text-orange">{String(countdown.minutes).padStart(2, '0')}</div>
              <div className="text-xs text-gray-400">MM</div>
            </div>
            <div className="font-oswald text-4xl font-bold text-orange">:</div>
            <div className="text-center">
              <div className="font-oswald text-4xl font-bold text-orange">{String(countdown.seconds).padStart(2, '0')}</div>
              <div className="text-xs text-gray-400">SS</div>
            </div>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <div className="bg-orange/10 border-y border-orange/20 overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap py-3">
          {newsItems.length > 0 ? (
            [...newsItems, ...newsItems].map((item, i) => (
              <span key={i} className="mx-8 text-orange font-semibold">
                🏀 {item.text}
              </span>
            ))
          ) : (
            <span className="mx-8 text-orange font-semibold">🏀 Loading news...</span>
          )}
        </div>
      </div>

      {/* Top Form Players */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-oswald text-4xl font-bold text-center mb-16">TOP FORM PLAYERS THIS WEEK</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {topPlayers.length > 0 ? (
              topPlayers.map((player) => (
                <div key={player.id} className="bg-white/5 rounded-xl p-6 border border-white/10 min-w-[280px] flex-shrink-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-oswald text-xl font-bold">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ backgroundColor: getPositionColor(player.position) + '20', color: getPositionColor(player.position) }}
                        >
                          {player.position}
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: player.slb_teams?.primary_colour || '#6B7280' }}
                          />
                          <span className="text-gray-400 text-sm">{player.slb_teams?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    {getPriceTrendIcon(player.price_trend)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange font-oswald text-2xl font-bold">{player.total_season_points}</span>
                    <span className="text-gray-400">{formatValue(player.value)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Loading top players...</p>
            )}
          </div>
        </div>
      </section>

      {/* Scout Picks */}
      <section className="py-20 px-8 bg-navy/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-oswald text-4xl font-bold text-center mb-16">SCOUT PICKS THIS WEEK</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {scoutPicks.length > 0 ? (
              scoutPicks.map((pick) => (
                <div key={pick.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <span className="bg-orange text-white px-3 py-1 rounded text-xs font-semibold mb-4 inline-block">SCOUT PICK</span>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-oswald text-xl font-bold">{pick.players?.name || 'Unknown'}</h3>
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
                  {pick.reason && <p className="text-gray-400 italic mb-4">"{pick.reason}"</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-orange font-oswald text-xl font-bold">{pick.players?.total_season_points || 0}</span>
                    <span className="text-gray-400">{formatValue(pick.players?.value || 0)}</span>
                  </div>
                </div>
              ))
            ) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <span className="bg-orange/50 text-white px-3 py-1 rounded text-xs font-semibold mb-4 inline-block">SCOUT PICK</span>
                  <p className="text-gray-400 italic">Picks coming soon</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-oswald text-4xl font-bold text-center mb-16">HOW IT WORKS</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-oswald font-bold">1</div>
              <h3 className="font-oswald text-2xl font-bold mb-4">Draft Your Team</h3>
              <p className="text-gray-400">Select your players from across the SLB and build your dream squad within the budget.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-oswald font-bold">2</div>
              <h3 className="font-oswald text-2xl font-bold mb-4">Score Live Points</h3>
              <p className="text-gray-400">Watch your players score points in real-time as they play in actual SLB games.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-oswald font-bold">3</div>
              <h3 className="font-oswald text-2xl font-bold mb-4">Top Your League</h3>
              <p className="text-gray-400">Compete against friends and other fans to climb the leaderboard and win prizes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Picks */}
      <section className="py-20 px-8 bg-navy/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-oswald text-4xl font-bold text-center mb-16">TOP PICKS THIS WEEK</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-oswald text-2xl font-bold">Aaryn Rai</h3>
                  <p className="text-gray-400">London Lions</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded text-sm font-semibold">PG</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Value: £12.5m</span>
                <span className="text-green-400 font-bold">Form: 9.2/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-oswald text-2xl font-bold">Jordan Hunt</h3>
                  <p className="text-gray-400">Newcastle Eagles</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded text-sm font-semibold">SF</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Value: £10.8m</span>
                <span className="text-green-400 font-bold">Form: 8.7/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-orange/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-oswald text-2xl font-bold">Tariq Sboui</h3>
                  <p className="text-gray-400">Leicester Riders</p>
                </div>
                <span className="bg-orange text-white px-3 py-1 rounded text-sm font-semibold">C</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Value: £9.2m</span>
                <span className="text-green-400 font-bold">Form: 8.4/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange h-2 rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Injuries & Availability */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-oswald text-4xl font-bold text-center mb-16">INJURIES & AVAILABILITY</h2>
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 font-oswald text-lg">Player</th>
                  <th className="text-left py-4 px-6 font-oswald text-lg">Team</th>
                  <th className="text-left py-4 px-6 font-oswald text-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-6">Aaryn Rai</td>
                  <td className="py-4 px-6 text-gray-400">London Lions</td>
                  <td className="py-4 px-6"><span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">Fit</span></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-6">Jordan Hunt</td>
                  <td className="py-4 px-6 text-gray-400">Newcastle Eagles</td>
                  <td className="py-4 px-6"><span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold">Doubtful</span></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-6">Marcus Evans</td>
                  <td className="py-4 px-6 text-gray-400">Leicester Riders</td>
                  <td className="py-4 px-6"><span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">Out</span></td>
                </tr>
                <tr>
                  <td className="py-4 px-6">Tariq Sboui</td>
                  <td className="py-4 px-6 text-gray-400">Leicester Riders</td>
                  <td className="py-4 px-6"><span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">Fit</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Fixtures This Week */}
      <section className="py-20 px-8 bg-navy/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-oswald text-4xl font-bold text-center mb-16">FIXTURES THIS WEEK</h2>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-oswald text-xl font-bold">Newcastle Eagles</p>
                </div>
                <span className="text-orange font-oswald text-2xl font-bold">vs</span>
                <div className="text-left">
                  <p className="font-oswald text-xl font-bold">London Lions</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-gray-400">Friday 7:30pm</p>
                </div>
                <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">Easy</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-oswald text-xl font-bold">Manchester Giants</p>
                </div>
                <span className="text-orange font-oswald text-2xl font-bold">vs</span>
                <div className="text-left">
                  <p className="font-oswald text-xl font-bold">Bristol Flyers</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-gray-400">Saturday 6:00pm</p>
                </div>
                <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold">Medium</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-oswald text-xl font-bold">Leicester Riders</p>
                </div>
                <span className="text-orange font-oswald text-2xl font-bold">vs</span>
                <div className="text-left">
                  <p className="font-oswald text-xl font-bold">Sheffield Sharks</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-gray-400">Sunday 4:00pm</p>
                </div>
                <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold">Hard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Waitlist */}
      <section className="py-20 px-8 bg-navy/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-oswald text-4xl font-bold mb-4">Be first to play when we launch</h2>
          <p className="text-xl text-gray-400 mb-10">Join the waitlist — launching autumn 2026</p>
          <form onSubmit={handleWaitlistSubmit} className="flex gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-navy border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange"
            />
            <button
              type="submit"
              className="bg-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange/90 transition-colors"
            >
              Join Waitlist
            </button>
          </form>
          {waitlistMessage && (
            <p className="mt-4 text-green-400 font-semibold">{waitlistMessage}</p>
          )}
          {waitlistError && (
            <p className="mt-4 text-red-400 font-semibold">{waitlistError}</p>
          )}
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-oswald text-4xl font-bold mb-6">AVAILABLE FREE ON iOS AND ANDROID</h2>
          <p className="text-xl text-gray-400 mb-10">Download now and start building your championship-winning squad.</p>
          <div className="flex gap-4 justify-center">
            <div className="bg-white/10 border border-white/20 rounded-xl px-8 py-4 hover:bg-white/20 transition-colors cursor-pointer">
              <p className="font-oswald text-lg font-bold">App Store</p>
              <p className="text-sm text-gray-400">Download on iOS</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-8 py-4 hover:bg-white/20 transition-colors cursor-pointer">
              <p className="font-oswald text-lg font-bold">Google Play</p>
              <p className="text-sm text-gray-400">Get it on Android</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-navy border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="font-oswald text-2xl font-bold text-orange">SLB FANTASY</div>
            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">@slbfantasy</a>
            </div>
            <p className="text-gray-500">slbfantasy.co.uk</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
