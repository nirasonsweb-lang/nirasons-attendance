'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner } from '@/components/ui';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface SettingsFormData {
  workStartTime: string;
  workEndTime: string;
  lateThreshold: string;
  halfDayThreshold: string;
  timezone: string;
  allowRemoteCheckIn: boolean;
  requireLocation: boolean;
  maxCheckInDistance: string;
  companyName: string;
  companyEmail: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'attendance' | 'notifications'>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<SettingsFormData>({
    workStartTime: '09:00',
    workEndTime: '17:00',
    lateThreshold: '15',
    halfDayThreshold: '4',
    timezone: 'Asia/Jakarta',
    allowRemoteCheckIn: true,
    requireLocation: true,
    maxCheckInDistance: '100',
    companyName: 'NIRASONS',
    companyEmail: 'admin@nirasons.com',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || []);

          // Map settings to form
          const settingsMap = new Map(data.settings?.map((s: Setting) => [s.key, s.value]) || []);
          setFormData({
            workStartTime: (settingsMap.get('work_start_time') as string) || '09:00',
            workEndTime: (settingsMap.get('work_end_time') as string) || '17:00',
            lateThreshold: (settingsMap.get('late_threshold') as string) || '15',
            halfDayThreshold: (settingsMap.get('half_day_threshold') as string) || '4',
            timezone: (settingsMap.get('timezone') as string) || 'Asia/Jakarta',
            allowRemoteCheckIn: (settingsMap.get('allow_remote_checkin') as string) !== 'false',
            requireLocation: (settingsMap.get('require_location') as string) !== 'false',
            maxCheckInDistance: (settingsMap.get('max_checkin_distance') as string) || '100',
            companyName: (settingsMap.get('company_name') as string) || 'NIRASONS',
            companyEmail: (settingsMap.get('company_email') as string) || 'admin@nirasons.com',
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const settingsToSave = [
        { key: 'work_start_time', value: formData.workStartTime },
        { key: 'work_end_time', value: formData.workEndTime },
        { key: 'late_threshold', value: formData.lateThreshold },
        { key: 'half_day_threshold', value: formData.halfDayThreshold },
        { key: 'timezone', value: formData.timezone },
        { key: 'allow_remote_checkin', value: formData.allowRemoteCheckIn.toString() },
        { key: 'require_location', value: formData.requireLocation.toString() },
        { key: 'max_checkin_distance', value: formData.maxCheckInDistance },
        { key: 'company_name', value: formData.companyName },
        { key: 'company_email', value: formData.companyEmail },
      ];

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'attendance', label: 'Attendance', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'notifications', label: 'Notifications', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-300 mt-1">Manage your attendance system configuration</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-status-success/10 text-status-success border border-status-success/20' :
          'bg-status-error/10 text-status-error border border-status-error/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent text-dark-900 font-medium'
                      : 'text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Company Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Company Name
                      </label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Company Email
                      </label>
                      <Input
                        type="email"
                        value={formData.companyEmail}
                        onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                        placeholder="Enter company email"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-600 pt-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Regional Settings</h2>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Timezone
                    </label>
                    <select
                      className="input w-full"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Settings */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Work Hours</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Work Start Time
                      </label>
                      <input
                        type="time"
                        className="input w-full"
                        value={formData.workStartTime}
                        onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Work End Time
                      </label>
                      <input
                        type="time"
                        className="input w-full"
                        value={formData.workEndTime}
                        onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-600 pt-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Late & Absence Rules</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Late Threshold (minutes)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        value={formData.lateThreshold}
                        onChange={(e) => setFormData({ ...formData, lateThreshold: e.target.value })}
                        placeholder="Minutes after start time"
                      />
                      <p className="text-xs text-dark-400 mt-1">
                        Employees arriving after this many minutes will be marked as late
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Half Day Threshold (hours)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.halfDayThreshold}
                        onChange={(e) => setFormData({ ...formData, halfDayThreshold: e.target.value })}
                        placeholder="Minimum hours for half day"
                      />
                      <p className="text-xs text-dark-400 mt-1">
                        Minimum work hours to count as half day attendance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-600 pt-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Location Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Require Location for Check-in</p>
                        <p className="text-sm text-dark-400">Employees must share their location when checking in</p>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, requireLocation: !formData.requireLocation })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          formData.requireLocation ? 'bg-accent' : 'bg-dark-500'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          formData.requireLocation ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Allow Remote Check-in</p>
                        <p className="text-sm text-dark-400">Employees can check in from any location</p>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, allowRemoteCheckIn: !formData.allowRemoteCheckIn })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          formData.allowRemoteCheckIn ? 'bg-accent' : 'bg-dark-500'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          formData.allowRemoteCheckIn ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {!formData.allowRemoteCheckIn && (
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Maximum Check-in Distance (meters)
                        </label>
                        <Input
                          type="number"
                          min="10"
                          max="1000"
                          value={formData.maxCheckInDistance}
                          onChange={(e) => setFormData({ ...formData, maxCheckInDistance: e.target.value })}
                          placeholder="Distance in meters"
                        />
                        <p className="text-xs text-dark-400 mt-1">
                          Maximum distance from office for valid check-in
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white mb-4">Email Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Daily Attendance Report</p>
                      <p className="text-sm text-dark-400">Receive daily summary of attendance</p>
                    </div>
                    <button className="relative w-12 h-6 bg-accent rounded-full">
                      <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Late Check-in Alerts</p>
                      <p className="text-sm text-dark-400">Get notified when employees arrive late</p>
                    </div>
                    <button className="relative w-12 h-6 bg-accent rounded-full">
                      <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Absent Employee Alerts</p>
                      <p className="text-sm text-dark-400">Get notified when employees are absent</p>
                    </div>
                    <button className="relative w-12 h-6 bg-dark-500 rounded-full">
                      <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Weekly Summary Report</p>
                      <p className="text-sm text-dark-400">Receive weekly attendance summary every Monday</p>
                    </div>
                    <button className="relative w-12 h-6 bg-accent rounded-full">
                      <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-dark-600 pt-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Push Notifications</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Check-in Reminders</p>
                        <p className="text-sm text-dark-400">Remind employees to check in at work start time</p>
                      </div>
                      <button className="relative w-12 h-6 bg-accent rounded-full">
                        <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Check-out Reminders</p>
                        <p className="text-sm text-dark-400">Remind employees to check out at work end time</p>
                      </div>
                      <button className="relative w-12 h-6 bg-accent rounded-full">
                        <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end mt-6 pt-6 border-t border-dark-600">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
