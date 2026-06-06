// AdminPage.jsx — Admin panel for managing players, news, injuries, scout picks, fixtures, and settings
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase';

const AdminPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('players');
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState(null);

  // Wait for auth to load before checking
  if (loading) return (
    <div style={{color: 'white', padding: '40px'}}>
      Loading...
    </div>
  );

  // Then check email
  if (!user || user.email !== 'jamaljohnson29@gmail.com') {
    return <Navigate to="/" replace />;
  }

  // Fetch settings
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
    } catch (error) {
      // Silent error handling
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-[#FF5500]">SLB Fantasy Admin</h1>
          {settings && (
            <div className="px-3 py-1 rounded-full bg-[#FF5500]/20 text-[#FF5500] text-sm font-medium">
              {settings.season_state?.replace('_', ' ').toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-[#141414] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['players', 'news', 'injuries', 'scout_picks', 'fixtures', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#FF5500] text-[#FF5500]'
                    : 'border-transparent text-[#a0a0a0] hover:text-white'
                }`}
              >
                {tab.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'players' && <PlayersTab showToast={showToast} />}
        {activeTab === 'news' && <NewsTab showToast={showToast} />}
        {activeTab === 'injuries' && <InjuriesTab showToast={showToast} />}
        {activeTab === 'scout_picks' && <ScoutPicksTab showToast={showToast} />}
        {activeTab === 'fixtures' && <FixturesTab showToast={showToast} />}
        {activeTab === 'settings' && <SettingsTab showToast={showToast} settings={settings} onSettingsUpdate={fetchSettings} />}
      </div>
    </div>
  );
};

// Players Tab Component
const PlayersTab = ({ showToast }) => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: 'Guard',
    team_id: '',
    value: 0,
    available: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersData, teamsData] = await Promise.all([
        supabase.from('players').select('*, slb_teams(*)').order('name'),
        supabase.from('slb_teams').select('*').order('name')
      ]);
      if (playersData.error) throw playersData.error;
      if (teamsData.error) throw teamsData.error;
      setPlayers(playersData.data || []);
      setTeams(teamsData.data || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const valueInMillions = parseFloat(formData.value) * 1000000;
      const playerData = {
        name: formData.name,
        position: formData.position,
        team_id: formData.team_id,
        value: valueInMillions,
        available: formData.available
      };

      let error;
      if (editingPlayer) {
        const result = await supabase.from('players').update(playerData).eq('id', editingPlayer.id);
        error = result.error;
      } else {
        const result = await supabase.from('players').insert(playerData);
        error = result.error;
      }

      if (error) throw error;
      showToast('Saved successfully');
      setShowModal(false);
      setEditingPlayer(null);
      setFormData({ name: '', position: 'Guard', team_id: '', value: 0, available: true });
      fetchData();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted successfully');
      fetchData();
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      position: player.position,
      team_id: player.team_id,
      value: player.value / 1000000,
      available: player.available
    });
    setShowModal(true);
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'All' || player.position === positionFilter;
    const matchesTeam = teamFilter === 'All' || player.team_id === teamFilter;
    return matchesSearch && matchesPosition && matchesTeam;
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm w-64"
          />
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm"
          >
            <option value="All">All Positions</option>
            <option value="Guard">Guard</option>
            <option value="Forward">Forward</option>
            <option value="Centre">Centre</option>
          </select>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm"
          >
            <option value="All">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingPlayer(null);
            setFormData({ name: '', position: 'Guard', team_id: '', value: 0, available: true });
            setShowModal(true);
          }}
          className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e04a00] transition-colors"
        >
          Add Player
        </button>
      </div>

      {/* Player Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#FF5500]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Position</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Team</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Value</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player, index) => (
              <tr key={player.id} className={index % 2 === 0 ? 'bg-[#141414]' : 'bg-[#1a1a1a]'}>
                <td className="px-4 py-3 text-sm">{player.name}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded bg-[#2A2A2A] text-xs">{player.position}</span>
                </td>
                <td className="px-4 py-3 text-sm flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: player.slb_teams?.primary_colour }}
                  />
                  {player.slb_teams?.name}
                </td>
                <td className="px-4 py-3 text-sm">£{(player.value / 1000000).toFixed(1)}m</td>
                <td className="px-4 py-3 text-sm">
                  <div
                    className={`w-3 h-3 rounded-full ${player.available ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => handleEdit(player)} className="text-[#FF5500] mr-2">Edit</button>
                  <button onClick={() => handleDelete(player.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingPlayer ? 'Edit Player' : 'Add Player'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Position</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                >
                  <option value="Guard">Guard</option>
                  <option value="Forward">Forward</option>
                  <option value="Centre">Centre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Value (in millions, e.g. 14.5 for £14.5m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Available</label>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleSave} className="flex-1 bg-[#FF5500] text-white py-2 rounded-lg font-medium">
                  Save
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-[#2A2A2A] text-white py-2 rounded-lg font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// News Tab Component
const NewsTab = ({ showToast }) => {
  const [news, setNews] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    player_id: '',
    headline: '',
    body: '',
    status: 'fit'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsData, playersData] = await Promise.all([
        supabase.from('player_news').select('*, players(*), slb_teams(*)').order('created_at', { ascending: false }),
        supabase.from('players').select('id, name, slb_teams(*)').order('name')
      ]);
      if (newsData.error) throw newsData.error;
      if (playersData.error) throw playersData.error;
      setNews(newsData.data || []);
      setPlayers(playersData.data || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const newsData = {
        player_id: formData.player_id,
        headline: formData.headline,
        body: formData.body,
        status: formData.status
      };

      let error;
      if (editingNews) {
        const result = await supabase.from('player_news').update(newsData).eq('id', editingNews.id);
        error = result.error;
      } else {
        const result = await supabase.from('player_news').insert(newsData);
        error = result.error;
      }

      if (error) throw error;
      showToast('Saved successfully');
      setShowModal(false);
      setEditingNews(null);
      setFormData({ player_id: '', headline: '', body: '', status: 'fit' });
      fetchData();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this news update?')) return;
    try {
      const { error } = await supabase.from('player_news').delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted successfully');
      fetchData();
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      player_id: newsItem.player_id,
      headline: newsItem.headline,
      body: newsItem.body,
      status: newsItem.status
    });
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setEditingNews(null);
            setFormData({ player_id: '', headline: '', body: '', status: 'fit' });
            setShowModal(true);
          }}
          className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e04a00] transition-colors"
        >
          Post News Update
        </button>
      </div>

      {/* News Cards */}
      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{item.players?.name}</span>
                  <span className="text-[#a0a0a0]">•</span>
                  <span className="text-[#a0a0a0]">{item.players?.slb_teams?.name}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.headline}</h3>
                <p className="text-[#a0a0a0] text-sm mb-4">{item.body.substring(0, 100)}{item.body.length > 100 ? '...' : ''}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    item.status === 'fit' ? 'bg-green-600/20 text-green-400' :
                    item.status === 'doubtful' ? 'bg-yellow-600/20 text-yellow-400' :
                    item.status === 'out' ? 'bg-red-600/20 text-red-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                  <span className="text-[#a0a0a0]">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="text-[#FF5500] text-sm">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-500 text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingNews ? 'Edit News' : 'Post News Update'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Player</label>
                <select
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Player</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>{player.name} ({player.slb_teams?.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Body</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 h-32"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                >
                  <option value="fit">Fit</option>
                  <option value="doubtful">Doubtful</option>
                  <option value="out">Out</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleSave} className="flex-1 bg-[#FF5500] text-white py-2 rounded-lg font-medium">
                  Save
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-[#2A2A2A] text-white py-2 rounded-lg font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Injuries Tab Component
const InjuriesTab = ({ showToast }) => {
  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('player_news')
        .select('*, players(*), slb_teams(*)')
        .in('status', ['doubtful', 'out'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInjuries(data || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { error } = await supabase.from('player_news').update({ status }).eq('id', id);
      if (error) throw error;
      showToast(`Marked as ${status}`);
      fetchData();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="space-y-4">
        {injuries.map((item) => (
          <div key={item.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{item.players?.name}</span>
                  <span className="text-[#a0a0a0]">•</span>
                  <span className="text-[#a0a0a0]">{item.players?.slb_teams?.name}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.headline}</h3>
                <p className="text-[#a0a0a0] text-sm mb-4">{item.body.substring(0, 100)}{item.body.length > 100 ? '...' : ''}</p>
                <span className={`px-2 py-1 rounded ${
                  item.status === 'doubtful' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleStatusChange(item.id, 'fit')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                  Mark Fit
                </button>
                <button onClick={() => handleStatusChange(item.id, 'out')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                  Mark Out
                </button>
                <button onClick={() => handleStatusChange(item.id, 'doubtful')} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm">
                  Mark Doubtful
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scout Picks Tab Component
const ScoutPicksTab = ({ showToast }) => {
  const [picks, setPicks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    player_id: '',
    gameweek: 1,
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [picksData, playersData] = await Promise.all([
        supabase.from('weekly_picks').select('*, players(*), slb_teams(*)').order('created_at', { ascending: false }),
        supabase.from('players').select('id, name, slb_teams(*)').order('name')
      ]);
      if (picksData.error) throw picksData.error;
      if (playersData.error) throw playersData.error;
      setPicks(picksData.data || []);
      setPlayers(playersData.data || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const pickData = {
        player_id: formData.player_id,
        gameweek: formData.gameweek,
        reason: formData.reason
      };

      const { error } = await supabase.from('weekly_picks').insert(pickData);
      if (error) throw error;
      showToast('Saved successfully');
      setShowModal(false);
      setFormData({ player_id: '', gameweek: 1, reason: '' });
      fetchData();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scout pick?')) return;
    try {
      const { error } = await supabase.from('weekly_picks').delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted successfully');
      fetchData();
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const currentWeekPicks = picks.filter(p => p.gameweek === formData.gameweek);
  const maxPicksReached = currentWeekPicks.length >= 3;

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm">Gameweek:</label>
          <input
            type="number"
            min="1"
            max="38"
            value={formData.gameweek}
            onChange={(e) => setFormData({ ...formData, gameweek: parseInt(e.target.value) })}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm w-20"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={maxPicksReached}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            maxPicksReached
              ? 'bg-[#2A2A2A] text-[#a0a0a0] cursor-not-allowed'
              : 'bg-[#FF5500] text-white hover:bg-[#e04a00] transition-colors'
          }`}
        >
          {maxPicksReached ? '3 picks set for this gameweek' : 'Add Scout Pick'}
        </button>
      </div>

      {/* Scout Picks Cards */}
      <div className="space-y-4">
        {picks.filter(p => p.gameweek === formData.gameweek).map((pick) => (
          <div key={pick.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{pick.players?.name}</span>
                  <span className="px-2 py-1 rounded bg-[#2A2A2A] text-xs">{pick.players?.position}</span>
                </div>
                <div className="text-[#a0a0a0] text-sm mb-2">
                  {pick.players?.slb_teams?.name} • £{(pick.players?.value / 1000000).toFixed(1)}m
                </div>
                <p className="text-sm">{pick.reason}</p>
              </div>
              <button onClick={() => handleDelete(pick.id)} className="text-red-500 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Scout Pick</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Player</label>
                <select
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Player</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>{player.name} ({player.slb_teams?.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Gameweek</label>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={formData.gameweek}
                  onChange={(e) => setFormData({ ...formData, gameweek: parseInt(e.target.value) })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Reason (shown publicly)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 h-32"
                  required
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleSave} className="flex-1 bg-[#FF5500] text-white py-2 rounded-lg font-medium">
                  Save
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-[#2A2A2A] text-white py-2 rounded-lg font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fixtures Tab Component
const FixturesTab = ({ showToast }) => {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [formData, setFormData] = useState({
    gameweek: 1,
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    home_difficulty: 3,
    away_difficulty: 3
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fixturesData, teamsData] = await Promise.all([
        supabase.from('fixture_difficulty').select('*, home_team:slb_teams(*), away_team:slb_teams(*)').order('gameweek'),
        supabase.from('slb_teams').select('*').order('name')
      ]);
      if (fixturesData.error) throw fixturesData.error;
      if (teamsData.error) throw teamsData.error;
      setFixtures(fixturesData.data || []);
      setTeams(teamsData.data || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const fixtureData = {
        gameweek: formData.gameweek,
        home_team_id: formData.home_team_id,
        away_team_id: formData.away_team_id,
        match_date: formData.match_date,
        home_difficulty: formData.home_difficulty,
        away_difficulty: formData.away_difficulty
      };

      let error;
      if (editingFixture) {
        const result = await supabase.from('fixture_difficulty').update(fixtureData).eq('id', editingFixture.id);
        error = result.error;
      } else {
        const result = await supabase.from('fixture_difficulty').insert(fixtureData);
        error = result.error;
      }

      if (error) throw error;
      showToast('Saved successfully');
      setShowModal(false);
      setEditingFixture(null);
      setFormData({ gameweek: 1, home_team_id: '', away_team_id: '', match_date: '', home_difficulty: 3, away_difficulty: 3 });
      fetchData();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fixture?')) return;
    try {
      const { error } = await supabase.from('fixture_difficulty').delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted successfully');
      fetchData();
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (fixture) => {
    setEditingFixture(fixture);
    setFormData({
      gameweek: fixture.gameweek,
      home_team_id: fixture.home_team_id,
      away_team_id: fixture.away_team_id,
      match_date: fixture.match_date,
      home_difficulty: fixture.home_difficulty,
      away_difficulty: fixture.away_difficulty
    });
    setShowModal(true);
  };

  const getDifficultyColor = (rating) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-green-400',
      3: 'bg-amber-500',
      4: 'bg-orange-500',
      5: 'bg-red-500'
    };
    return colors[rating] || 'bg-gray-500';
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setEditingFixture(null);
            setFormData({ gameweek: 1, home_team_id: '', away_team_id: '', match_date: '', home_difficulty: 3, away_difficulty: 3 });
            setShowModal(true);
          }}
          className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e04a00] transition-colors"
        >
          Add Fixture
        </button>
      </div>

      {/* Fixture Table */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#FF5500]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold">Gameweek</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Match</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Home Diff</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Away Diff</th>
              <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((fixture, index) => (
              <tr key={fixture.id} className={index % 2 === 0 ? 'bg-[#141414]' : 'bg-[#1a1a1a]'}>
                <td className="px-4 py-3 text-sm">GW{fixture.gameweek}</td>
                <td className="px-4 py-3 text-sm">
                  {fixture.home_team?.name} vs {fixture.away_team?.name}
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(fixture.match_date).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className={`w-6 h-6 rounded ${getDifficultyColor(fixture.home_difficulty)} flex items-center justify-center text-xs font-bold`}>
                    {fixture.home_difficulty}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className={`w-6 h-6 rounded ${getDifficultyColor(fixture.away_difficulty)} flex items-center justify-center text-xs font-bold`}>
                    {fixture.away_difficulty}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => handleEdit(fixture)} className="text-[#FF5500] mr-2">Edit</button>
                  <button onClick={() => handleDelete(fixture.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingFixture ? 'Edit Fixture' : 'Add Fixture'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Gameweek</label>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={formData.gameweek}
                  onChange={(e) => setFormData({ ...formData, gameweek: parseInt(e.target.value) })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Home Team</label>
                <select
                  value={formData.home_team_id}
                  onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Away Team</label>
                <select
                  value={formData.away_team_id}
                  onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.filter(t => t.id !== formData.home_team_id).map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Match Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.match_date}
                  onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Home Difficulty (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFormData({ ...formData, home_difficulty: rating })}
                      className={`w-10 h-10 rounded ${formData.home_difficulty === rating ? getDifficultyColor(rating) : 'bg-[#2A2A2A]'} flex items-center justify-center font-bold`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Away Difficulty (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFormData({ ...formData, away_difficulty: rating })}
                      className={`w-10 h-10 rounded ${formData.away_difficulty === rating ? getDifficultyColor(rating) : 'bg-[#2A2A2A]'} flex items-center justify-center font-bold`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleSave} className="flex-1 bg-[#FF5500] text-white py-2 rounded-lg font-medium">
                  Save
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-[#2A2A2A] text-white py-2 rounded-lg font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ showToast, settings, onSettingsUpdate }) => {
  const [formData, setFormData] = useState({
    season_state: 'off_season',
    current_gameweek: 0,
    draft_date: '',
    season_start_date: '',
    leagues_open_date: '',
    league_join_deadline_gameweek: 3,
    public_league_max_managers: 20,
    private_league_max_managers: 50
  });
  const [waitlist, setWaitlist] = useState([]);

  useEffect(() => {
    if (settings) {
      setFormData({
        season_state: settings.season_state || 'off_season',
        current_gameweek: settings.current_gameweek || 0,
        draft_date: settings.draft_date || '',
        season_start_date: settings.season_start_date || '',
        leagues_open_date: settings.leagues_open_date || '',
        league_join_deadline_gameweek: settings.league_join_deadline_gameweek || 3,
        public_league_max_managers: settings.public_league_max_managers || 20,
        private_league_max_managers: settings.private_league_max_managers || 50
      });
    }
    fetchWaitlist();
  }, [settings]);

  const fetchWaitlist = async () => {
    try {
      const { data, error } = await supabase.from('waitlist').select('*').order('created_at');
      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleSave = async (field) => {
    try {
      const { error } = await supabase.from('app_settings').update({ [field]: formData[field] }).eq('id', 1);
      if (error) throw error;
      showToast('Saved successfully');
      onSettingsUpdate();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const exportWaitlist = () => {
    const csv = 'Email,Date Joined\n' + waitlist.map(w => `${w.email},${w.created_at}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waitlist.csv';
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Season State */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Season State</h3>
        <div className="flex items-center gap-4">
          <select
            value={formData.season_state}
            onChange={(e) => setFormData({ ...formData, season_state: e.target.value })}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
          >
            <option value="off_season">Off Season</option>
            <option value="pre_season">Pre Season</option>
            <option value="season_active">Season Active</option>
            <option value="leagues_locked">Leagues Locked</option>
          </select>
          <button onClick={() => handleSave('season_state')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
            Save
          </button>
        </div>
      </div>

      {/* Current Gameweek */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Current Gameweek</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="0"
            max="38"
            value={formData.current_gameweek}
            onChange={(e) => setFormData({ ...formData, current_gameweek: parseInt(e.target.value) })}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 w-20"
          />
          <button onClick={() => handleSave('current_gameweek')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
            Save
          </button>
        </div>
      </div>

      {/* Date Settings */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Date Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm w-40">Draft Date:</label>
            <input
              type="datetime-local"
              value={formData.draft_date}
              onChange={(e) => setFormData({ ...formData, draft_date: e.target.value })}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
            />
            <button onClick={() => handleSave('draft_date')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm w-40">Season Start:</label>
            <input
              type="datetime-local"
              value={formData.season_start_date}
              onChange={(e) => setFormData({ ...formData, season_start_date: e.target.value })}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
            />
            <button onClick={() => handleSave('season_start_date')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm w-40">Leagues Open:</label>
            <input
              type="datetime-local"
              value={formData.leagues_open_date}
              onChange={(e) => setFormData({ ...formData, leagues_open_date: e.target.value })}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
            />
            <button onClick={() => handleSave('leagues_open_date')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* League Settings */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">League Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm w-40">Join Deadline GW:</label>
            <input
              type="number"
              min="1"
              max="38"
              value={formData.league_join_deadline_gameweek}
              onChange={(e) => setFormData({ ...formData, league_join_deadline_gameweek: parseInt(e.target.value) })}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 w-20"
            />
            <button onClick={() => handleSave('league_join_deadline_gameweek')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm w-40">Public Max Managers:</label>
            <input
              type="number"
              value={formData.public_league_max_managers}
              onChange={(e) => setFormData({ ...formData, public_league_max_managers: parseInt(e.target.value) })}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 w-20"
            />
            <button onClick={() => handleSave('public_league_max_managers')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm w-40">Private Max Managers:</label>
            <input
              type="number"
              value={formData.private_league_max_managers}
              onChange={(e) => setFormData({ ...formData, private_league_max_managers: parseInt(e.target.value) })}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 w-20"
            />
            <button onClick={() => handleSave('private_league_max_managers')} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Waitlist */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Waitlist ({waitlist.length} signups)</h3>
          <button onClick={exportWaitlist} className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium">
            Export CSV
          </button>
        </div>
        <div className="space-y-2">
          {waitlist.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-sm">{entry.email}</span>
              <span className="text-xs text-[#a0a0a0]">{new Date(entry.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
