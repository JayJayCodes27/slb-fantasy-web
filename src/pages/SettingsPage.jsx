// SettingsPage.jsx — Account settings and preferences
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const SettingsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    gameweekReminder: true,
    transferDeadline: true,
    playerNews: false,
    leagueUpdates: true,
  });

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[32px] mb-2">ACCOUNT SETTINGS</h1>
          <p className="text-[#A0A0A0] text-base">Manage your account preferences</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile Section */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
            <h2 className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest mb-5">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[#A0A0A0] text-xs uppercase tracking-widest block mb-2">Team Name</label>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm">
                  {user?.team_name || '—'}
                </div>
              </div>
              <div>
                <label className="text-[#A0A0A0] text-xs uppercase tracking-widest block mb-2">Username</label>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm">
                  {user?.username || '—'}
                </div>
              </div>
              <div>
                <label className="text-[#A0A0A0] text-xs uppercase tracking-widest block mb-2">Email</label>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm">
                  {user?.email || '—'}
                </div>
              </div>
              <p className="text-[#555555] text-xs">Profile editing coming soon.</p>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
            <h2 className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest mb-5">Notifications</h2>
            <div className="space-y-4">
              {[
                { key: 'gameweekReminder', label: 'Gameweek reminders', desc: 'Get reminded before each gameweek starts' },
                { key: 'transferDeadline', label: 'Transfer deadline alerts', desc: 'Alerts 24h before the transfer window closes' },
                { key: 'playerNews', label: 'Player news', desc: 'Injuries, suspensions and squad updates' },
                { key: 'leagueUpdates', label: 'League updates', desc: 'When someone joins or your rank changes' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-semibold">{label}</p>
                    <p className="text-[#666666] text-xs mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      notifications[key] ? 'bg-[#F4622A]' : 'bg-[#2A2A2A]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[#555555] text-xs mt-5">Notification delivery coming soon.</p>
          </div>

          {/* More Coming Soon */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 text-center">
            <p className="text-[#555555] text-sm">More settings coming soon.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
