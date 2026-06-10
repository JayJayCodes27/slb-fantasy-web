// FixturesPage.jsx — Real SLB game fixtures from slb_fixtures table
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FixturesPage = () => {
  const [gameweeks, setGameweeks] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gwLoading, setGwLoading] = useState(true);
  const [selectedGwId, setSelectedGwId] = useState(null);

  // Load gameweeks on mount, default to active one
  useEffect(() => {
    const fetchGameweeks = async () => {
      const { data } = await supabase
        .from('gameweeks')
        .select('id, week_number, deadline, is_active, is_complete')
        .order('week_number');

      if (data && data.length > 0) {
        setGameweeks(data);
        const active = data.find(gw => gw.is_active) || data[0];
        setSelectedGwId(active.id);
      }
      setGwLoading(false);
    };
    fetchGameweeks();
  }, []);

  // Fetch fixtures whenever selected gameweek changes
  useEffect(() => {
    if (!selectedGwId) return;
    setLoading(true);
    const fetchFixtures = async () => {
      const { data, error } = await supabase
        .from('slb_fixtures')
        .select(`
          id,
          home_score,
          away_score,
          played_at,
          is_complete,
          home_team:slb_teams!slb_fixtures_home_team_id_fkey (
            id, name, short_name, primary_colour
          ),
          away_team:slb_teams!slb_fixtures_away_team_id_fkey (
            id, name, short_name, primary_colour
          )
        `)
        .eq('gameweek_id', selectedGwId)
        .order('played_at', { nullsFirst: false });

      if (!error && data) setFixtures(data);
      setLoading(false);
    };
    fetchFixtures();
  }, [selectedGwId]);

  const formatDateTime = (ts) => {
    if (!ts) return null;
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedGw = gameweeks.find(gw => gw.id === selectedGwId);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-2">FIXTURES</h1>
          <p className="text-[#A0A0A0] text-base">SLB game schedule and results</p>
        </div>
      </div>

      {/* Gameweek tabs */}
      <div className="px-4 sm:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          {gwLoading ? (
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 w-14 rounded-lg bg-[#111111] animate-pulse" />
              ))}
            </div>
          ) : gameweeks.length === 0 ? (
            <p className="text-[#555555] text-sm">No gameweeks set up yet</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {gameweeks.map((gw) => (
                <button
                  key={gw.id}
                  onClick={() => setSelectedGwId(gw.id)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm flex-shrink-0 ${
                    selectedGwId === gw.id
                      ? 'bg-[#F4622A] text-white'
                      : 'bg-[#111111] text-[#A0A0A0] hover:text-white border border-[#222222]'
                  }`}
                >
                  GW{gw.week_number}
                  {gw.is_active && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block align-middle" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixture cards */}
      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Gameweek deadline */}
          {selectedGw?.deadline && (
            <p className="text-[#555555] text-xs mb-4">
              GW{selectedGw.week_number} deadline: {formatDateTime(selectedGw.deadline)}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-xl p-6 h-32 animate-pulse" />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="text-center py-20 bg-[#111111] border border-[#222222] rounded-xl">
              <p className="text-[#555555] text-lg mb-2">No fixtures for this gameweek</p>
              <p className="text-[#444444] text-sm">Check back once the schedule is published</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fixtures.map((fixture) => {
                const isLive = !fixture.is_complete && fixture.played_at && new Date(fixture.played_at) <= new Date();
                return (
                  <div
                    key={fixture.id}
                    className={`bg-[#111111] border rounded-xl p-5 sm:p-6 ${
                      fixture.is_complete ? 'border-[#222222]' : isLive ? 'border-[#F4622A]/40' : 'border-[#222222]'
                    }`}
                  >
                    {/* Teams + score row */}
                    <div className="flex items-center gap-2 sm:gap-4">
                      {/* Home team */}
                      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                        <p className="text-white font-bold text-sm sm:text-base truncate text-right">
                          {fixture.home_team?.short_name || 'TBD'}
                        </p>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: fixture.home_team?.primary_colour || '#555' }}
                        />
                      </div>

                      {/* Score / VS */}
                      <div className="flex-shrink-0 text-center w-20 sm:w-24">
                        {fixture.is_complete ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-white font-black text-xl sm:text-2xl">{fixture.home_score ?? '—'}</span>
                            <span className="text-[#444444] text-sm mx-1">–</span>
                            <span className="text-white font-black text-xl sm:text-2xl">{fixture.away_score ?? '—'}</span>
                          </div>
                        ) : isLive ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#F4622A] animate-pulse" />
                            <span className="text-[#F4622A] font-bold text-xs uppercase tracking-wide">Live</span>
                          </div>
                        ) : (
                          <span className="text-[#555555] font-bold text-base">vs</span>
                        )}
                      </div>

                      {/* Away team */}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: fixture.away_team?.primary_colour || '#555' }}
                        />
                        <p className="text-white font-bold text-sm sm:text-base truncate">
                          {fixture.away_team?.short_name || 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Full team names */}
                    <div className="flex items-center justify-between mt-2 px-1">
                      <p className="text-[#666666] text-[11px] truncate flex-1 text-right pr-2">{fixture.home_team?.name}</p>
                      <div className="w-20 sm:w-24 flex-shrink-0" />
                      <p className="text-[#666666] text-[11px] truncate flex-1 pl-2">{fixture.away_team?.name}</p>
                    </div>

                    {/* Date / status footer */}
                    <div className="mt-3 pt-3 border-t border-[#1A1A1A] flex items-center justify-center gap-2">
                      {fixture.played_at ? (
                        <span className="text-[#555555] text-xs">{formatDateTime(fixture.played_at)}</span>
                      ) : (
                        <span className="text-[#444444] text-xs italic">Date TBC</span>
                      )}
                      {fixture.is_complete && (
                        <span className="text-[#22c55e] text-[10px] font-semibold uppercase tracking-wide ml-2">Final</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixturesPage;
