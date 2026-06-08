// FixturesPage.jsx — Fixtures display with gameweek selection and difficulty ratings
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FixturesPage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameweek, setSelectedGameweek] = useState(1);

  useEffect(() => {
    fetchFixtures();
  }, [selectedGameweek]);

  const fetchFixtures = async () => {
    try {
      const { data, error } = await supabase
        .from('fixture_difficulty')
        .select(`
          *,
          home_team:slb_teams!fixture_difficulty_home_team_id_fkey (
            name,
            short_name,
            primary_colour,
            secondary_colour
          ),
          away_team:slb_teams!fixture_difficulty_away_team_id_fkey (
            name,
            short_name,
            primary_colour,
            secondary_colour
          )
        `)
        .eq('gameweek_number', selectedGameweek)
        .order('match_date');

      if (error) throw error;
      if (data) setFixtures(data);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyInfo = (rating) => {
    const difficulties = {
      1: { label: 'Easy', color: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30' },
      2: { label: 'Fairly Easy', color: 'bg-green-400/20 text-green-300 border-green-400/30' },
      3: { label: 'Medium', color: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30' },
      4: { label: 'Hard', color: 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/30' },
      5: { label: 'Very Hard', color: 'bg-[#FF3B3B]/20 text-[#FF3B3B] border-[#FF3B3B]/30' }
    };
    return difficulties[rating] || difficulties[3];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-2">FIXTURES</h1>
        </div>
      </div>

      {/* Gameweek Filter */}
      <div className="px-4 sm:px-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((gw) => (
              <button
                key={gw}
                onClick={() => setSelectedGameweek(gw)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
                  selectedGameweek === gw
                    ? 'bg-[#F4622A] text-white'
                    : 'bg-[#111111] text-[#A0A0A0] hover:text-white'
                }`}
              >
                GW{gw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixture Cards */}
      <div className="px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-xl p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl sm:text-2xl text-[#A0A0A0]">No fixtures scheduled for this gameweek</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fixtures.map((fixture) => (
                <div key={fixture.id} className="bg-[#111111] border border-[#222222] rounded-xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    {/* Home Team */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <p className="text-white font-semibold text-base">{fixture.home_team?.short_name || 'TBD'}</p>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: fixture.home_team?.primary_colour || '#6B7280' }}
                        />
                      </div>
                    </div>

                    {/* Score */}
                    <div className="px-6">
                      <p className="text-[#F4622A] font-bold text-2xl">vs</p>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: fixture.away_team?.primary_colour || '#6B7280' }}
                        />
                        <p className="text-white font-semibold text-base">{fixture.away_team?.short_name || 'TBD'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date and Live Indicator */}
                  <div className="flex items-center justify-center gap-3 text-[#A0A0A0] text-xs">
                    <span>{formatDate(fixture.match_date)}</span>
                    {/* Pulsing orange dot for live games */}
                    <div className="w-2 h-2 rounded-full bg-[#F4622A] animate-pulse" />
                    <span className="text-[#F4622A]">LIVE</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixturesPage;
