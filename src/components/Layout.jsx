// Layout.jsx — Main layout component with fixed header navigation and ticker
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  const isPrivacyOrTermsPage = location.pathname === '/privacy' || location.pathname === '/terms';

  useEffect(() => {
    const consent = localStorage.getItem('slb_cookie_consent');
    if (!consent) setShowBanner(true);
  }, []);

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    const parts = email.split('@');
    const username = parts[0];
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Fixed Header Wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]">
        {/* Results Ticker Bar - Fixed */}
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

        {/* Main Navigation - Fixed */}
        {!isAuthPage && (
          <nav className="flex items-center justify-between px-4 sm:px-8 h-12 sm:h-14 bg-[#0A0A0A] border-b border-[#222222]">
          {/* Left Cluster - Logo */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="flex flex-col leading-none">
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-xl sm:text-2xl font-['Bebas_Neue'] tracking-wide">SLB</span>
                <span className="text-[#F4622A] text-sm sm:text-base">🏀</span>
              </div>
              <span className="text-[#F4622A] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">FANTASY</span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-4 sm:gap-6">
              {user ? (
                <>
                  <Link to="/" className={`text-[13px] font-medium uppercase tracking-widest relative group ${location.pathname === '/' ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>Home</Link>
                  <Link to="/fantasy" className={`text-[13px] font-medium uppercase tracking-widest relative group ${['/fantasy','/transfers','/leaderboard','/players'].includes(location.pathname) ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>Fantasy</Link>
                  <Link to="/news" className={`text-[13px] font-medium uppercase tracking-widest relative group ${location.pathname === '/news' ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>News</Link>
                  <Link to="/fixtures" className={`text-[13px] font-medium uppercase tracking-widest relative group ${location.pathname === '/fixtures' ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>Fixtures</Link>
                </>
              ) : (
                <>
                  <Link to="/" className={`text-[13px] font-medium uppercase tracking-widest relative group ${location.pathname === '/' ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>Home</Link>
                  <Link to="/news" className={`text-[13px] font-medium uppercase tracking-widest relative group ${location.pathname === '/news' ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>News</Link>
                  <Link to="/fixtures" className={`text-[13px] font-medium uppercase tracking-widest relative group ${location.pathname === '/fixtures' ? 'text-[#F4622A]' : 'text-white hover:text-[#F4622A] transition-colors'}`}>Fixtures</Link>
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
                {/* Notifications Bell */}
                <div className="relative hidden sm:block" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-white hover:text-[#FF6B00] transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-[#111111] border border-[#222222] rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#222222]">
                        <p className="text-white font-bold text-sm uppercase tracking-widest">Notifications</p>
                      </div>
                      <div className="px-4 py-6 text-center">
                        <p className="text-[#555555] text-sm">No notifications yet</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Avatar / Dropdown */}
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
                      {user?.email === 'slbfantasy@gmail.com' && (
                        <>
                          <Link
                            to="/scorer"
                            onClick={() => setShowDropdown(false)}
                            className="block w-full text-left px-4 py-2 bg-[#FF5500] text-white font-bold rounded-lg text-sm mb-2 text-center"
                          >
                            🏀 Live Scorer
                          </Link>
                          <Link
                            to="/admin"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-3 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
                          >
                            🔧 Admin Panel
                          </Link>
                        </>
                      )}
                      <Link
                        to="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-3 text-white text-sm hover:bg-[#1a1a1a] transition-colors"
                      >
                        Settings
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
            {user ? (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Home</Link>
                <Link to="/fantasy" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Fantasy</Link>
                <Link to="/news" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">News</Link>
                <Link to="/fixtures" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Fixtures</Link>
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3">Settings</Link>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Home</Link>
                <Link to="/players" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Players</Link>
                <Link to="/fixtures" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Fixtures</Link>
                <Link to="/news" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">News</Link>
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3 border-b border-[#242424]">Sign In</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-white text-sm font-medium py-3">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Close Fixed Header Wrapper */}
      </div>

      {/* Main Content */}
      <div className={isAuthPage ? '' : 'pt-24'}>
        {children}
      </div>

      {/* GDPR Cookie Consent Banner */}
      {showBanner && !isPrivacyOrTermsPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#141414] border-t border-[#2A2A2A] px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[#999999] text-sm flex-1">
              We use cookies to improve your experience and serve relevant ads. By continuing to use SLB Fantasy you accept our use of cookies.{' '}
              <Link to="/privacy" className="text-[#FF5500] hover:underline">Privacy Policy</Link>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  localStorage.setItem('slb_cookie_consent', 'accepted');
                  setShowBanner(false);
                }}
                className="bg-[#FF5500] text-white font-bold px-6 py-2 rounded-full hover:bg-[#e04400] transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('slb_cookie_consent', 'declined');
                  setShowBanner(false);
                }}
                className="bg-[#1a1a1a] text-[#999999] border border-[#2A2A2A] font-bold px-6 py-2 rounded-full hover:bg-[#2a2a2a] transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
