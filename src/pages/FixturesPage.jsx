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

      console.log('Fixtures data:', data);
      console.log('Fixtures error:', error);

      if (error) throw error;
      if (data) setFixtures(data);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyInfo = (rating) => {
    const difficulties = {
      1: { label: 'Easy', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      2: { label: 'Fairly Easy', color: 'bg-green-400/20 text-green-300 border-green-400/30' },
      3: { label: 'Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      4: { label: 'Hard', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      5: { label: 'Very Hard', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-dm-sans">
      {/* Page Header */}
      <div className="pt-32 pb-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-oswald text-5xl font-bold mb-4">Fixtures</h1>
          <p className="text-xl text-gray-400">Full SLB fixture list with difficulty ratings</p>
        </div>
      </div>

      {/* Gameweek Filter */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((gw) => (
              <button
                key={gw}
                onClick={() => setSelectedGameweek(gw)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedGameweek === gw
                    ? 'bg-orange text-white'
                    : 'bg-[#111111] text-gray-400 hover:text-white'
                }`}
              >
                GW{gw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixture Cards */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-[#111111] rounded-xl p-6 animate-pulse" />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-400">No fixtures scheduled for this gameweek</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fixtures.map((fixture) => (
                <div key={fixture.id} className="bg-[#111111] rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    {/* Home Team */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: fixture.home_team?.primary_colour || '#6B7280' }}
                        />
                        <p className="font-oswald text-xl font-bold">{fixture.home_team?.name || 'TBD'}</p>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyInfo(fixture.home_difficulty).color}`}
                      >
                        {getDifficultyInfo(fixture.home_difficulty).label}
                      </span>
                    </div>

                    {/* VS */}
                    <div className="px-8">
                      <p className="font-oswald text-3xl font-bold text-orange">VS</p>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-oswald text-xl font-bold">{fixture.away_team?.name || 'TBD'}</p>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: fixture.away_team?.primary_colour || '#6B7280' }}
                        />
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyInfo(fixture.away_difficulty).color}`}
                      >
                        {getDifficultyInfo(fixture.away_difficulty).label}
                      </span>
                    </div>
                  </div>

                  {/* Date and Venue */}
                  <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
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
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <a
            href="https://www.superleaguebasketballm.co.uk/fixtures"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            View full official fixture list at <span className="text-[#FF5C00]">superleaguebasketballm.co.uk</span> →
          </a>
        </div>
      </div>

      {/* Difficulty Rating Key */}
      <div className="px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111111] rounded-xl p-6 border border-white/10">
            <h3 className="font-oswald text-xl font-bold mb-4">Difficulty Rating Key</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm">1 = Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-400" />
                <span className="text-sm">2 = Fairly Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-sm">3 = Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500" />
                <span className="text-sm">4 = Hard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm">5 = Very Hard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixturesPage;
