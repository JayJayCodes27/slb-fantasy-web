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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-5xl uppercase tracking-wide mb-4">Fixtures</h1>
          <p className="text-base sm:text-xl text-[#a0a0a0]">Full SLB fixture list with difficulty ratings</p>
        </div>
      </div>

      {/* Gameweek Filter */}
      <div className="px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((gw) => (
              <button
                key={gw}
                onClick={() => setSelectedGameweek(gw)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm sm:text-base ${
                  selectedGameweek === gw
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#141414] text-[#a0a0a0] hover:text-white'
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
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-4 sm:p-6 animate-pulse" />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl sm:text-2xl text-[#a0a0a0]">No fixtures scheduled for this gameweek</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fixtures.map((fixture) => (
                <div key={fixture.id} className="card p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    {/* Home Team */}
                    <div className="flex-1 text-center sm:text-right w-full sm:w-auto">
                      <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 mb-2">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                          style={{ backgroundColor: fixture.home_team?.primary_colour || '#6B7280' }}
                        />
                        <p className="text-white font-bold text-base sm:text-xl">{fixture.home_team?.name || 'TBD'}</p>
                      </div>
                      <span
                        className={`inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getDifficultyInfo(fixture.home_difficulty).color}`}
                      >
                        {getDifficultyInfo(fixture.home_difficulty).label}
                      </span>
                    </div>

                    {/* VS */}
                    <div className="px-4 sm:px-8">
                      <p className="font-oswald text-2xl sm:text-3xl font-bold text-orange">VS</p>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                        <p className="text-white font-bold text-base sm:text-xl">{fixture.away_team?.name || 'TBD'}</p>
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                          style={{ backgroundColor: fixture.away_team?.primary_colour || '#6B7280' }}
                        />
                      </div>
                      <span
                        className={`inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getDifficultyInfo(fixture.away_difficulty).color}`}
                      >
                        {getDifficultyInfo(fixture.away_difficulty).label}
                      </span>
                    </div>
                  </div>

                  {/* Date and Venue */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[#a0a0a0] text-xs sm:text-sm">
                    <span>{formatDate(fixture.match_date)}</span>
                    {fixture.venue && <span>• {fixture.venue}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Official SLB Link */}
      <div className="px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <a
            href="https://www.superleaguebasketballm.co.uk/fixtures"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            View full official fixture list at <span className="text-[#FF6B00]">superleaguebasketballm.co.uk</span> →
          </a>
        </div>
      </div>

      {/* Difficulty Rating Key */}
      <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="card p-4 sm:p-6">
            <h3 className="text-white font-bold text-lg sm:text-xl uppercase tracking-wide mb-4">Difficulty Rating Key</h3>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#22c55e]" />
                <span className="text-xs sm:text-sm">1 = Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-400" />
                <span className="text-xs sm:text-sm">2 = Fairly Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FFB800]" />
                <span className="text-xs sm:text-sm">3 = Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF6B00]" />
                <span className="text-xs sm:text-sm">4 = Hard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF3B3B]" />
                <span className="text-xs sm:text-sm">5 = Very Hard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixturesPage;
