import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Main Navigation */}
      <nav className="flex items-center justify-between px-8 h-14 bg-[#0a0a0a] fixed w-full top-0 z-50 border-b border-[#242424]">
        {/* Left Cluster - Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex flex-col leading-none">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-2xl">SLB</span>
              <span className="text-[#FF6B00] text-base">🏀</span>
            </div>
            <span className="text-[#FF6B00] text-[9px] font-bold uppercase tracking-wider">FANTASY</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            {isLandingPage ? (
              <>
                <Link to="/" className="text-white text-sm font-medium border-b-2 border-[#FF6B00] pb-0.5">Home</Link>
                <Link to="/leagues" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Leagues</Link>
                <Link to="/players" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Players</Link>
                <Link to="/fixtures" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Fixtures</Link>
                <Link to="/news" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">News</Link>
                <Link to="/leaderboard" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Leaderboard</Link>
              </>
            ) : (
              <>
                <Link to="/" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Home</Link>
                <Link to="/my-team" className={`text-sm font-medium ${location.pathname === '/my-team' ? 'text-white font-bold border-b-2 border-[#FF6B00] pb-0.5' : 'text-white hover:text-[#FF6B00] transition-colors'}`}>My Team</Link>
                <Link to="/players" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Players</Link>
                <Link to="/leagues" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Leagues</Link>
                <Link to="/fixtures" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Fixtures</Link>
                <Link to="/news" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">News</Link>
              </>
            )}
          </div>
        </div>

        {/* Right Cluster */}
        <div className="flex items-center gap-3">
          {isLandingPage ? (
            <>
              <Link to="/signin" className="text-white text-sm font-medium">Log In</Link>
              <Link to="/signup" className="bg-[#FF6B00] text-white text-sm font-bold px-5 py-2 rounded-button hover:bg-[#e05f00] transition-colors">Sign Up</Link>
            </>
          ) : (
            <>
              <button className="text-white text-lg hover:text-[#FF6B00] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">JD</span>
                </div>
                <span className="text-white text-xs">∨</span>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  );
};

export default Layout;
