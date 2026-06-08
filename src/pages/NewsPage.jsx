// NewsPage.jsx — News feed with player news and transfer updates
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

      if (playerError) throw playerError;
      if (playerData) setPlayerNews(playerData);

      // Fetch transfer news
      const { data: transferData, error: transferError } = await supabase
        .from('transfer_news')
        .select('*')
        .order('created_at', { ascending: false });

      if (transferError) throw transferError;
      if (transferData) setTransferNews(transferData);
    } catch (error) {
      // Silent error handling
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
      fit: { label: 'Fit', color: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30' },
      doubtful: { label: 'Doubtful', color: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30' },
      out: { label: 'Out', color: 'bg-[#FF3B3B]/20 text-[#FF3B3B] border-[#FF3B3B]/30' }
    };
    return statuses[status?.toLowerCase()] || statuses.fit;
  };

  const getTransferStatusInfo = (status) => {
    const statuses = {
      rumour: { label: 'Rumour', color: 'bg-[#555555]/20 text-[#a0a0a0] border-[#555555]/30' },
      unconfirmed: { label: 'Unconfirmed', color: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30' },
      confirmed: { label: 'Confirmed', color: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30' }
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
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-2">NEWS</h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Injuries', 'Transfers', 'Team News'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-[#F4622A] text-white'
                    : 'bg-[#111111] text-[#A0A0A0] hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="px-4 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-xl p-6 animate-pulse h-48" />
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl sm:text-2xl text-[#A0A0A0]">
                {activeFilter === 'Injuries' ? 'No injury updates right now' : 
                 activeFilter === 'Transfers' ? 'No transfer news right now' : 
                 'No news right now'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredNews.map((item) => (
                <div key={item.id} className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden">
                  {item.type === 'injury' ? (
                    // Injury/Availability Card
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-white text-lg font-semibold mb-1">
                              {item.players?.name || 'Unknown Player'}
                            </h3>
                            <div className="flex items-center gap-2">
                              {item.players?.position && (
                                <span
                                  className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#F4622A] text-white"
                                >
                                  {item.players.position}
                                </span>
                              )}
                              <span className="text-[#A0A0A0] text-xs">{item.slb_teams?.name || 'Unknown Team'}</span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${getStatusInfo(item.status).color}`}
                          >
                            {getStatusInfo(item.status).label}
                          </span>
                        </div>
                        <span className="text-[#555555] text-xs">{getTimeAgo(item.created_at)}</span>
                      </div>
                      <h4 className="text-white font-semibold text-sm mb-2">{item.headline}</h4>
                      {item.body && <p className="text-[#A0A0A0] text-xs">{item.body}</p>}
                    </div>
                  ) : (
                    // Transfer Card
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          {item.player_name && (
                            <h3 className="text-white text-lg font-semibold mb-1">{item.player_name}</h3>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${getTransferStatusInfo(item.status).color}`}
                          >
                            {getTransferStatusInfo(item.status).label}
                          </span>
                        </div>
                        <span className="text-[#555555] text-xs">{getTimeAgo(item.created_at)}</span>
                      </div>
                      <h4 className="text-white font-semibold text-sm mb-2">{item.headline}</h4>
                      {item.body && <p className="text-[#A0A0A0] mb-2 text-xs">{item.body}</p>}
                      {item.source && <p className="text-[#F4622A] text-xs">Source: {item.source}</p>}
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
