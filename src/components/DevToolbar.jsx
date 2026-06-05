import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

export default function DevToolbar() {
  const { user } = useAuth();
  const [seasonState, setSeasonState] = useState('off_season');
  const [currentGameweek, setCurrentGameweek] = useState(0);
  const [settings, setSettings] = useState(null);

  console.log('DevToolbar render, user:', user?.email);

  if (!user) {
    console.log('DevToolbar: no user');
    return null;
  }

  if (user.email !== 'jamaljohnson29@gmail.com') {
    console.log('DevToolbar: wrong email', user.email);
    return null;
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
      setSeasonState(data?.season_state || 'off_season');
      setCurrentGameweek(data?.current_gameweek || 0);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (updates) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update(updates)
        .eq('id', 1);

      if (error) throw error;
      fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleSeasonStateChange = (value) => {
    setSeasonState(value);
    updateSettings({ season_state: value });
  };

  const handleGameweekChange = (delta) => {
    const newValue = Math.max(0, Math.min(38, currentGameweek + delta));
    setCurrentGameweek(newValue);
    updateSettings({ current_gameweek: newValue });
  };

  const handleResetToOffSeason = () => {
    setSeasonState('off_season');
    setCurrentGameweek(0);
    updateSettings({ season_state: 'off_season', current_gameweek: 0 });
  };

  const handleSimulateGW1Start = () => {
    setSeasonState('season_active');
    setCurrentGameweek(1);
    updateSettings({ season_state: 'season_active', current_gameweek: 1 });
  };

  const handleLockLeagues = () => {
    setSeasonState('leagues_locked');
    setCurrentGameweek(4);
    updateSettings({ season_state: 'leagues_locked', current_gameweek: 4 });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#FF5500] h-12 flex items-center px-4 gap-6 z-50">
      <span className="text-[#FF5500] font-bold text-sm whitespace-nowrap">DEV TOOLS</span>

      {/* Season State Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-white text-xs">Season:</label>
        <select
          value={seasonState}
          onChange={(e) => handleSeasonStateChange(e.target.value)}
          className="bg-[#0a0a0a] border border-[#FF5500] text-white text-xs px-2 py-1 rounded"
        >
          <option value="off_season">Off Season</option>
          <option value="pre_season">Pre Season</option>
          <option value="season_active">Season Active</option>
          <option value="leagues_locked">Leagues Locked</option>
        </select>
      </div>

      {/* Gameweek Stepper */}
      <div className="flex items-center gap-2">
        <label className="text-white text-xs">GW:</label>
        <button
          onClick={() => handleGameweekChange(-1)}
          className="bg-[#0a0a0a] border border-[#FF5500] text-white text-xs w-6 h-6 rounded hover:bg-[#FF5500] transition-colors"
        >
          -
        </button>
        <span className="text-white text-xs w-6 text-center">{currentGameweek}</span>
        <button
          onClick={() => handleGameweekChange(1)}
          className="bg-[#0a0a0a] border border-[#FF5500] text-white text-xs w-6 h-6 rounded hover:bg-[#FF5500] transition-colors"
        >
          +
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleResetToOffSeason}
          className="bg-[#0a0a0a] border border-[#FF5500] text-white text-xs px-3 py-1 rounded hover:bg-[#FF5500] transition-colors"
        >
          Reset to Off Season
        </button>
        <button
          onClick={handleSimulateGW1Start}
          className="bg-[#0a0a0a] border border-[#FF5500] text-white text-xs px-3 py-1 rounded hover:bg-[#FF5500] transition-colors"
        >
          Simulate GW1 Start
        </button>
        <button
          onClick={handleLockLeagues}
          className="bg-[#0a0a0a] border border-[#FF5500] text-white text-xs px-3 py-1 rounded hover:bg-[#FF5500] transition-colors"
        >
          Lock Leagues (GW4)
        </button>
      </div>
    </div>
  );
};
