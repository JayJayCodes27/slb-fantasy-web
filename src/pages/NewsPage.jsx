import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const NewsPage = () => {
  const [playerNews, setPlayerNews] = useState([]);
  const [transferNews, setTransferNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      // Fetch player news with joins
      const { data: playerData, error: playerError } = await supabase
        .from('player_news')
        .select(`
          *,
          players (
            name,
            position
          ),
          slb_teams (
            name
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Player news data:', playerData);
      console.log('Player news error:', playerError);

      if (playerError) throw playerError;
      if (playerData) setPlayerNews(playerData);

      // Fetch transfer news
      const { data: transferData, error: transferError } = await supabase
        .from('transfer_news')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Transfer news data:', transferData);
      console.log('Transfer news error:', transferError);

      if (transferError) throw transferError;
      if (transferData) setTransferNews(transferData);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getStatusInfo = (status) => {
    const statuses = {
      fit: { label: 'Fit', color: 'bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/30' },
      doubtful: { label: 'Doubtful', color: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30' },
      out: { label: 'Out', color: 'bg-[#FF3B3B]/20 text-[#FF3B3B] border-[#FF3B3B]/30' }
    };
    return statuses[status?.toLowerCase()] || statuses.fit;
  };

  const getTransferStatusInfo = (status) => {
    const statuses = {
      rumour: { label: 'Rumour', color: 'bg-[#555555]/20 text-[#999999] border-[#555555]/30' },
      unconfirmed: { label: 'Unconfirmed', color: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30' },
      confirmed: { label: 'Confirmed', color: 'bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/30' }
    };
    return statuses[status?.toLowerCase()] || statuses.rumour;
  };

  const getPositionColor = (position) => {
    const colors = {
      PG: '#3B82F6',
      SG: '#10B981',
      SF: '#F59E0B',
      PF: '#EF4444',
      C: '#8B5CF6'
    };
    return colors[position] || '#6B7280';
  };

  const getFilteredNews = () => {
    const allNews = [
      ...playerNews.map(item => ({ ...item, type: 'injury' })),
      ...transferNews.map(item => ({ ...item, type: 'transfer' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    switch (activeFilter) {
      case 'Injuries':
        return allNews.filter(item => item.type === 'injury');
      case 'Transfers':
        return allNews.filter(item => item.type === 'transfer');
      case 'Team News':
        return allNews.filter(item => item.type === 'injury'); // Assuming team news is part of injury news for now
      default:
        return allNews;
    }
  };

  const filteredNews = getFilteredNews();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-dm-sans">
      {/* Page Header */}
      <div className="pt-32 pb-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-bebas text-5xl font-bold mb-4">News</h1>
          <p className="text-xl text-[#999999]">Latest SLB player news, injuries and transfers</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2">
            {['All', 'Injuries', 'Transfers', 'Team News'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeFilter === filter
                    ? 'bg-[#FF5500] text-white'
                    : 'bg-[#141414] text-[#999999] hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse" />
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl text-[#999999]">
                {activeFilter === 'Injuries' ? 'No injury updates right now' : 
                 activeFilter === 'Transfers' ? 'No transfer news right now' : 
                 'No news right now'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNews.map((item) => (
                <div key={item.id} className="card p-6">
                  {item.type === 'injury' ? (
                    // Injury/Availability Card
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-bebas text-2xl font-bold mb-1">
                              {item.players?.name || 'Unknown Player'}
                            </h3>
                            <div className="flex items-center gap-3">
                              {item.players?.position && (
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{ backgroundColor: getPositionColor(item.players.position) + '20', color: getPositionColor(item.players.position) }}
                                >
                                  {item.players.position}
                                </span>
                              )}
                              <span className="text-[#999999]">{item.slb_teams?.name || 'Unknown Team'}</span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusInfo(item.status).color}`}
                          >
                            {getStatusInfo(item.status).label}
                          </span>
                        </div>
                        <span className="text-[#555555] text-sm">{getTimeAgo(item.created_at)}</span>
                      </div>
                      <h4 className="text-xl font-semibold mb-2">{item.headline}</h4>
                      {item.body && <p className="text-[#999999]">{item.body}</p>}
                    </div>
                  ) : (
                    // Transfer Card
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          {item.player_name && (
                            <h3 className="font-bebas text-2xl font-bold mb-1">{item.player_name}</h3>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTransferStatusInfo(item.status).color}`}
                          >
                            {getTransferStatusInfo(item.status).label}
                          </span>
                        </div>
                        <span className="text-[#555555] text-sm">{getTimeAgo(item.created_at)}</span>
                      </div>
                      <h4 className="text-xl font-semibold mb-2">{item.headline}</h4>
                      {item.body && <p className="text-[#999999] mb-2">{item.body}</p>}
                      {item.source && <p className="text-[#FF5500] text-sm">Source: {item.source}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
