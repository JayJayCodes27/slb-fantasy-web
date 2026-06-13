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
  if (!user || user.email !== 'slbfantasy@gmail.com') {
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
            {['players', 'news', 'injuries', 'fixtures', 'settings'].map((tab) => (
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
  const [sortBy, setSortBy] = useState('value-desc');
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

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch(sortBy) {
      case 'value-desc':
        return b.value - a.value;
      case 'value-asc':
        return a.value - b.value;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'position':
        return a.position.localeCompare(b.position);
      case 'team':
        return (a.slb_teams?.name || '').localeCompare(b.slb_teams?.name || '');
      default:
        return 0;
    }
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm"
          >
            <option value="value-desc">Value: High to Low</option>
            <option value="value-asc">Value: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="position">Position: G / F / C</option>
            <option value="team">Team: A to Z</option>
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
            {sortedPlayers.map((player, index) => (
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
const STATUS_BADGE = (status) => {
  const map = {
    fit: 'bg-green-600/20 text-green-400',
    available: 'bg-green-600/20 text-green-400',
    doubtful: 'bg-yellow-600/20 text-yellow-400',
    injured: 'bg-red-600/20 text-red-400',
    out: 'bg-red-600/20 text-red-400',
    suspended: 'bg-purple-600/20 text-purple-400',
    resting: 'bg-blue-600/20 text-blue-400',
    unknown: 'bg-gray-600/20 text-gray-400',
  };
  return map[status] || map.unknown;
};

const NewsTab = ({ showToast }) => {
  const [news, setNews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    slb_team_id: '',
    player_id: '',
    headline: '',
    body: '',
    status: 'fit',
    article_url: '',
    article_image_url: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [newsData, teamsData] = await Promise.all([
        supabase.from('player_news').select('*, players(name), slb_teams(name, short_name, primary_colour)').order('created_at', { ascending: false }),
        supabase.from('slb_teams').select('id, name, short_name').order('name'),
      ]);
      if (newsData.error) throw newsData.error;
      if (teamsData.error) throw teamsData.error;
      setNews(newsData.data || []);
      setTeams(teamsData.data || []);
    } catch (error) {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        slb_team_id: formData.slb_team_id || null,
        player_id: formData.player_id || null,
        headline: formData.headline,
        body: formData.body,
        status: formData.status,
        article_url: formData.article_url || null,
        article_image_url: formData.article_image_url || null,
      };
      let error;
      if (editingNews) {
        ({ error } = await supabase.from('player_news').update(payload).eq('id', editingNews.id));
      } else {
        ({ error } = await supabase.from('player_news').insert(payload));
      }
      if (error) throw error;
      showToast('Saved successfully');
      setShowModal(false);
      setEditingNews(null);
      setFormData({ slb_team_id: '', player_id: '', headline: '', body: '', status: 'fit', article_url: '', article_image_url: '' });
      fetchData();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this news item?')) return;
    try {
      const { error } = await supabase.from('player_news').delete().eq('id', id);
      if (error) throw error;
      showToast('Deleted');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setFormData({
      slb_team_id: item.slb_team_id || '',
      player_id: item.player_id || '',
      headline: item.headline || '',
      body: item.body || '',
      status: item.status || 'fit',
      article_url: item.article_url || '',
      article_image_url: item.article_image_url || '',
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
            setFormData({ slb_team_id: '', player_id: '', headline: '', body: '', status: 'fit', article_url: '', article_image_url: '' });
            setShowModal(true);
          }}
          className="bg-[#FF5500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e04a00] transition-colors"
        >
          Post News Update
        </button>
      </div>

      {/* News Cards */}
      <div className="space-y-3">
        {news.map((item) => (
          <div key={item.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  {item.slb_teams && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.slb_teams.primary_colour || '#555' }} />
                      <span className="text-[#a0a0a0] text-xs">{item.slb_teams.short_name}</span>
                    </div>
                  )}
                  {item.players?.name && <span className="text-white text-xs font-semibold">{item.players.name}</span>}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGE(item.status)}`}>{(item.status || '').toUpperCase()}</span>
                </div>
                <h3 className="text-sm font-bold mb-1 truncate">{item.headline}</h3>
                <p className="text-[#a0a0a0] text-xs">{(item.body || '').substring(0, 80)}{(item.body || '').length > 80 ? '...' : ''}</p>
                {item.article_url && <a href={item.article_url} target="_blank" rel="noreferrer" className="text-[#FF5500] text-xs mt-1 inline-block">Read article →</a>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(item)} className="text-[#FF5500] text-sm">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-500 text-sm">Del</button>
              </div>
            </div>
            <p className="text-[#555555] text-[10px] mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingNews ? 'Edit News' : 'Post News Update'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Team</label>
                <select
                  value={formData.slb_team_id}
                  onChange={(e) => setFormData({ ...formData, slb_team_id: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2"
                >
                  <option value="">No specific team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 h-28"
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
                  <option value="available">Available</option>
                  <option value="doubtful">Doubtful</option>
                  <option value="injured">Injured</option>
                  <option value="out">Out</option>
                  <option value="suspended">Suspended</option>
                  <option value="resting">Resting</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Article URL (optional)</label>
                <input
                  type="url"
                  value={formData.article_url}
                  onChange={(e) => setFormData({ ...formData, article_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={formData.article_image_url}
                  onChange={(e) => setFormData({ ...formData, article_image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleSave} className="flex-1 bg-[#FF5500] text-white py-2 rounded-lg font-medium">Save</button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-[#2A2A2A] text-white py-2 rounded-lg font-medium">Cancel</button>
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
  const [editingId, setEditingId] = useState(null);
  const [editProb, setEditProb] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('player_news')
        .select('*, players(name, position), slb_teams(name, short_name, primary_colour)')
        .not('status', 'in', '("fit","available")')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInjuries(data || []);
    } catch {
      // Silent
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
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const handleProbSave = async (id) => {
    try {
      const updates = { status: editStatus };
      if (editProb !== '') updates.probability_to_play = parseInt(editProb, 10);
      const { error } = await supabase.from('player_news').update(updates).eq('id', id);
      if (error) throw error;
      showToast('Updated');
      setEditingId(null);
      fetchData();
    } catch {
      showToast('Failed', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      {injuries.length === 0 && (
        <div className="text-center py-12 text-[#555555]">No injury or doubt concerns right now</div>
      )}
      <div className="space-y-3">
        {injuries.map((item) => (
          <div key={item.id} className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  {item.slb_teams && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.slb_teams.primary_colour || '#555' }} />
                      <span className="text-[#a0a0a0] text-xs">{item.slb_teams.short_name}</span>
                    </div>
                  )}
                  {item.players?.name && <span className="text-white text-xs font-semibold">{item.players.name}</span>}
                  {item.players?.position && <span className="text-[#a0a0a0] text-xs">{item.players.position}</span>}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGE(item.status)}`}>{(item.status || '').toUpperCase()}</span>
                  {item.probability_to_play != null && (
                    <span className="text-[#C9A84C] text-xs font-semibold">{item.probability_to_play}% fit</span>
                  )}
                </div>
                <p className="text-sm font-bold truncate">{item.headline}</p>
              </div>
              <button
                onClick={() => { setEditingId(item.id); setEditStatus(item.status); setEditProb(item.probability_to_play != null ? String(item.probability_to_play) : ''); }}
                className="text-[#FF5500] text-sm flex-shrink-0"
              >Edit</button>
            </div>

            {/* Inline edit row */}
            {editingId === item.id && (
              <div className="mt-3 pt-3 border-t border-[#2A2A2A] flex flex-wrap gap-2 items-center">
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1.5 text-sm"
                >
                  {['doubtful','injured','out','suspended','resting','unknown','fit','available'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0" max="100"
                  value={editProb}
                  onChange={e => setEditProb(e.target.value)}
                  placeholder="% fit (0-100)"
                  className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1.5 text-sm w-32"
                />
                <button onClick={() => handleProbSave(item.id)} className="bg-[#FF5500] text-white px-3 py-1.5 rounded text-sm">Save</button>
                <button onClick={() => setEditingId(null)} className="bg-[#2A2A2A] text-white px-3 py-1.5 rounded text-sm">Cancel</button>
                <button onClick={() => handleStatusChange(item.id, 'fit')} className="bg-green-700 text-white px-3 py-1.5 rounded text-sm">✓ Fit</button>
              </div>
            )}
          </div>
        ))}
      </div>
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
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('slb_teams')
        .select('id, name')
        .order('name');
      console.log('Teams:', data, error);
      if (data) setTeams(data);
    };
    fetchTeams();
  }, []);

  const fetchFixtures = async () => {
    const { data, error } = await supabase
      .from('fixture_difficulty')
      .select(`
        id, gameweek_number, match_date,
        home_difficulty, away_difficulty,
        home_team_id, away_team_id,
        home_team:slb_teams!fixture_difficulty_home_team_id_fkey(id, name),
        away_team:slb_teams!fixture_difficulty_away_team_id_fkey(id, name)
      `)
      .order('gameweek_number', { ascending: true });
    if (data) setFixtures(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFixtures();
  }, []);

  const handleSave = async () => {
    try {
      const fixtureData = {
        gameweek_number: formData.gameweek,
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
      fetchFixtures();
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
      fetchFixtures();
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (fixture) => {
    setEditingFixture(fixture);
    setFormData({
      gameweek: fixture.gameweek_number,
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
                <td className="px-4 py-3 text-sm">GW{fixture.gameweek_number}</td>
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
