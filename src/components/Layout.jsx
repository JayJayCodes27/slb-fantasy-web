import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    const parts = email.split('@');
    const username = parts[0];
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Results Ticker Bar */}
      <div className="bg-[#0D0D0D] border-b border-[#242424] h-6 sm:h-8 flex items-center overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 LON 104–81 CHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 MAN 92–89 LEI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 NEW 109–104 CAL</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 BRI 78–60 SHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 SUR 89–83 LON</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 LEI 72–79 LON</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 CHE 89–92 MAN</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 SHE 93–65 LEI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 MAN 92–67 BRI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 SHE 100–103 CHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 LON 89–83 CHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 NEW 85–91 LEI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 BRI 76–88 MAN</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 CAL 71–95 LON</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 LON 104–81 CHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 MAN 92–89 LEI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 NEW 109–104 CAL</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 BRI 78–60 SHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 SUR 89–83 LON</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 LEI 72–79 LON</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 CHE 89–92 MAN</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 SHE 93–65 LEI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 MAN 92–67 BRI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 SHE 100–103 CHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 LON 89–83 CHE</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 NEW 85–91 LEI</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 BRI 76–88 MAN</span>
          <span className="mx-4 sm:mx-8 text-[#a0a0a0] text-[10px] sm:text-xs">🏀 CAL 71–95 LON</span>
        </div>
      </div>

      {/* Main Navigation */}
      {!isAuthPage && (
        <nav className="flex items-center justify-between px-4 sm:px-8 h-12 sm:h-14 bg-[#0a0a0a] fixed w-full top-6 sm:top-8 z-50 border-b border-[#242424]">
          {/* Left Cluster - Logo */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="flex flex-col leading-none">
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-xl sm:text-2xl">SLB</span>
                <span className="text-[#FF6B00] text-sm sm:text-base">🏀</span>
              </div>
              <span className="text-[#FF6B00] text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">FANTASY</span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-4 sm:gap-6">
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
                  <Link to="/leagues" className={`text-sm font-medium ${location.pathname === '/leagues' ? 'text-white font-bold border-b-2 border-[#FF6B00] pb-0.5' : 'text-white hover:text-[#FF6B00] transition-colors'}`}>Leagues</Link>
                  <Link to="/fixtures" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">Fixtures</Link>
                  <Link to="/news" className="text-white text-sm font-medium hover:text-[#FF6B00] transition-colors">News</Link>
                </>
              )}
            </div>
          </div>

          {/* Right Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white text-2xl p-2"
            >
              ☰
            </button>

            {user ? (
              <>
                <button className="hidden sm:block text-white text-lg hover:text-[#FF6B00] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{getUserInitials()}</span>
                    </div>
                    <span className="hidden sm:block text-white text-xs">∨</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-[#242424] rounded-lg shadow-lg overflow-hidden">
                      <Link
                        to="/my-team"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-3 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
                      >
                        My Team
                      </Link>
                      <Link
                        to="/leagues"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-3 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
                      >
                        My Leagues
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/signin" className="hidden sm:block text-white text-sm font-medium">Log In</Link>
                <Link to="/signup" className="bg-[#FF6B00] text-white text-sm font-bold px-4 sm:px-5 py-2 rounded-button hover:bg-[#e05f00] transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-18 sm:top-22 left-0 right-0 bg-[#141414] border-b border-[#242424] z-40">
          <div className="flex flex-col p-4">
            {isLandingPage ? (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Home</Link>
                <Link to="/leagues" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Leagues</Link>
                <Link to="/players" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Players</Link>
                <Link to="/fixtures" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Fixtures</Link>
                <Link to="/news" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">News</Link>
                <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3">Leaderboard</Link>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Home</Link>
                <Link to="/my-team" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">My Team</Link>
                <Link to="/players" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Players</Link>
                <Link to="/leagues" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Leagues</Link>
                <Link to="/fixtures" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Fixtures</Link>
                <Link to="/news" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3">News</Link>
              </>
            )}
            {!user && (
              <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-t border-[#242424]">Log In</Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isAuthPage ? '' : 'pt-18 sm:pt-22'}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
