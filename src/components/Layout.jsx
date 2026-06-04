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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-dm-sans">
      {/* Live Scores Ticker */}
      <div className="bg-[#111111] py-2 overflow-hidden border-b border-white/10">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...scores, ...scores, ...scores].map((score, i) => (
            <span key={i} className="mx-6 text-xs">
              <span className="text-white font-bold">{score.split('–')[0]}</span>
              <span className="text-orange mx-1 font-bold">{score.split('–')[1]}</span>
              <span className="text-gray-500 mx-4">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-[#111111]/95 backdrop-blur-sm fixed w-full top-10 z-50 border-b border-white/10">
        <Link to="/" className="font-oswald text-2xl font-bold text-orange">SLB FANTASY</Link>
        <div className="flex items-center gap-8">
          <Link to="/" className="text-white hover:text-orange transition-colors">Home</Link>
          <Link to="/players" className="text-white hover:text-orange transition-colors">Players</Link>
          <Link to="/fixtures" className="text-white hover:text-orange transition-colors">Fixtures</Link>
          <Link to="/news" className="text-white hover:text-orange transition-colors">News</Link>
          <Link to="/leagues" className="text-white hover:text-orange transition-colors">Leagues</Link>
          <Link to="/signin" className="bg-orange text-white px-6 py-2 rounded font-semibold hover:bg-orange/90 transition-colors">Sign In</Link>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div style={{backgroundColor: '#111111', borderBottom: '1px solid #222222'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '8px 24px', display: 'flex', gap: '32px'}}>
          <Link to="/" style={{color: '#999', fontSize: '13px', textDecoration: 'none'}}>Home</Link>
          <Link to="/news" style={{color: '#999', fontSize: '13px', textDecoration: 'none'}}>Scout</Link>
          <Link to="/news" style={{color: '#999', fontSize: '13px', textDecoration: 'none'}}>Injuries</Link>
          <Link to="/fixtures" style={{color: '#999', fontSize: '13px', textDecoration: 'none'}}>Fixtures</Link>
          <Link to="/players" style={{color: '#999', fontSize: '13px', textDecoration: 'none'}}>Statistics</Link>
          <Link to="/news" style={{color: '#999', fontSize: '13px', textDecoration: 'none'}}>News</Link>
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
