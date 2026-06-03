import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-navy text-white font-dm-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-navy/95 backdrop-blur-sm fixed w-full top-0 z-50 border-b border-white/10">
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
      
      {/* Main Content */}
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
};

export default Layout;
