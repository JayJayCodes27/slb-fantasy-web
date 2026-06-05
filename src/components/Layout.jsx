import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const scores = [
    "LON 104–81 CHE",
    "MAN 92–89 LEI",
    "NEW 109–104 CAL",
    "BRI 78–60 SHE",
    "SUR 89–83 LON",
    "LEI 72–79 LON",
    "CHE 89–92 MAN",
    "SHE 93–65 LEI",
    "MAN 92–67 BRI",
    "SHE 100–103 CHE"
  ];

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Scout', path: '/news' },
    { name: 'Injuries', path: '/news' },
    { name: 'Fixtures', path: '/fixtures' },
    { name: 'Statistics', path: '/players' },
    { name: 'News', path: '/news' }
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-dm-sans">
      {/* Live Scores Ticker */}
      <div className="bg-[#141414] py-2 overflow-hidden border-b border-[#2A2A2A] relative">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...scores, ...scores, ...scores].map((score, i) => (
            <span key={i} className="mx-6 text-xs">
              <span className="text-white font-bold">{score.split('–')[0]}</span>
              <span className="text-orange mx-1 font-bold">{score.split('–')[1]}</span>
              <span className="text-gray-500 mx-4">|</span>
            </span>
          ))}
        </div>
        <a
          href="https://www.superleaguebasketballm.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#FF5500] hover:text-[#FF6B1A] transition-colors"
          style={{ backgroundColor: '#141414', padding: '4px 16px' }}
        >
          Official SLB Site →
        </a>
      </div>

      {/* Main Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-[#0D0D0D] fixed w-full top-10 z-50 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-bebas text-3xl font-bold text-orange flex items-center gap-2">
            🏀 SLB FANTASY
          </Link>
          <a
            href="https://www.superleaguebasketballm.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#999999] hover:text-[#FF5500] transition-colors"
          >
            ↗ Official Site
          </a>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/" className={`text-white hover:text-orange transition-colors ${location.pathname === '/' ? 'text-orange border-b-2 border-orange' : ''}`}>Home</Link>
          <Link to="/my-team" className={`text-white hover:text-orange transition-colors ${location.pathname === '/my-team' ? 'text-orange border-b-2 border-orange' : ''}`}>My Team</Link>
          <Link to="/players" className={`text-white hover:text-orange transition-colors ${location.pathname === '/players' ? 'text-orange border-b-2 border-orange' : ''}`}>Players</Link>
          <Link to="/fixtures" className={`text-white hover:text-orange transition-colors ${location.pathname === '/fixtures' ? 'text-orange border-b-2 border-orange' : ''}`}>Fixtures</Link>
          <Link to="/news" className={`text-white hover:text-orange transition-colors ${location.pathname === '/news' ? 'text-orange border-b-2 border-orange' : ''}`}>News</Link>
          <Link to="/leagues" className={`text-white hover:text-orange transition-colors ${location.pathname === '/leagues' ? 'text-orange border-b-2 border-orange' : ''}`}>Leagues</Link>
          <button className="text-2xl hover:text-orange transition-colors">🔔</button>
          <Link to="/signin" className="bg-[#FF5500] text-white px-6 py-2 rounded-full font-bold hover:bg-[#FF6B1A] transition-colors">Sign In</Link>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div style={{backgroundColor: '#141414', borderBottom: '1px solid #2A2A2A'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '8px 24px', display: 'flex', gap: '32px'}}>
          <Link to="/" style={{color: '#999999', fontSize: '13px', textDecoration: 'none'}}>Home</Link>
          <Link to="/news" style={{color: '#999999', fontSize: '13px', textDecoration: 'none'}}>Scout</Link>
          <Link to="/news" style={{color: '#999999', fontSize: '13px', textDecoration: 'none'}}>Injuries</Link>
          <Link to="/fixtures" style={{color: '#999999', fontSize: '13px', textDecoration: 'none'}}>Fixtures</Link>
          <Link to="/players" style={{color: '#999999', fontSize: '13px', textDecoration: 'none'}}>Statistics</Link>
          <Link to="/news" style={{color: '#999999', fontSize: '13px', textDecoration: 'none'}}>News</Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-32">
        {children}
      </div>
    </div>
  );
};

export default Layout;
