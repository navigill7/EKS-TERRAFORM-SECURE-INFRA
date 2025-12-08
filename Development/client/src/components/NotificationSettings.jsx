import { useState, useEffect } from 'react';
import { Bell, X, Loader, Check, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';

const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:4001';

const NotificationSettings = ({ isOpen, onClose }) => {
  const token = useSelector((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        setError('Failed to load preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/preferences`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (type) => {
    const newNotifications = {
      ...preferences.notifications,
      [type]: !preferences.notifications[type],
    };
    updatePreferences({ notifications: newNotifications });
  };

  const toggleEmailNotifications = () => {
    updatePreferences({ emailNotifications: !preferences.emailNotifications });
  };

  const togglePushNotifications = () => {
    updatePreferences({ pushNotifications: !preferences.pushNotifications });
  };

  const toggleQuietHours = () => {
    updatePreferences({
      quietHours: {
        ...preferences.quietHours,
        enabled: !preferences.quietHours.enabled,
      },
    });
  };

  const updateQuietHoursTime = (field, value) => {
    updatePreferences({
      quietHours: {
        ...preferences.quietHours,
        [field]: value,
      },
    });
  };

  if (!isOpen) return null;

  const notificationTypes = [
    { key: 'like', label: 'Post Likes', description: 'When someone likes your post' },
    { key: 'message', label: 'Messages', description: 'New messages from connections' },
    { key: 'friend-request', label: 'Friend Requests', description: 'New connection requests' },
    { key: 'profile-view', label: 'Profile Views', description: 'When someone views your profile' },
    { key: 'friend-post', label: 'Friend Posts', description: 'When friends share new posts' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-grey-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-grey-800 border-b border-grey-200 dark:border-grey-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-grey-800 dark:text-grey-100">
                  Notification Settings
                </h2>
                <p className="text-sm text-grey-500 dark:text-grey-400">
                  Manage how you receive notifications
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-grey-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {!loading && preferences && (
            <>
              {/* Notification Types */}
              <div>
                <h3 className="text-lg font-semibold text-grey-800 dark:text-grey-100 mb-4">
                  Notification Types
                </h3>
                <div className="space-y-3">
                  {notificationTypes.map((type) => (
                    <div
                      key={type.key}
                      className="flex items-center justify-between p-4 rounded-lg border border-grey-200 dark:border-grey-700 hover:bg-grey-50 dark:hover:bg-grey-700/50 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-grey-800 dark:text-grey-100">
                          {type.label}
                        </p>
                        <p className="text-sm text-grey-500 dark:text-grey-400">
                          {type.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleNotification(type.key)}
                        disabled={saving}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                          preferences.notifications[type.key]
                            ? 'bg-primary-500'
                            : 'bg-grey-300 dark:bg-grey-600'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            preferences.notifications[type.key] ? 'translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Methods */}
              <div>
                <h3 className="text-lg font-semibold text-grey-800 dark:text-grey-100 mb-4">
                  Delivery Methods
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-grey-200 dark:border-grey-700">
                    <div className="flex-1">
                      <p className="font-medium text-grey-800 dark:text-grey-100">
                        Email Notifications
                      </p>
                      <p className="text-sm text-grey-500 dark:text-grey-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <button
                      onClick={toggleEmailNotifications}
                      disabled={saving}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        preferences.emailNotifications
                          ? 'bg-primary-500'
                          : 'bg-grey-300 dark:bg-grey-600'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          preferences.emailNotifications ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-grey-200 dark:border-grey-700">
                    <div className="flex-1">
                      <p className="font-medium text-grey-800 dark:text-grey-100">
                        Push Notifications
                      </p>
                      <p className="text-sm text-grey-500 dark:text-grey-400">
                        Receive browser push notifications
                      </p>
                    </div>
                    <button
                      onClick={togglePushNotifications}
                      disabled={saving}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        preferences.pushNotifications
                          ? 'bg-primary-500'
                          : 'bg-grey-300 dark:bg-grey-600'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          preferences.pushNotifications ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <h3 className="text-lg font-semibold text-grey-800 dark:text-grey-100 mb-4">
                  Quiet Hours
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-grey-200 dark:border-grey-700">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-grey-500" />
                      <div className="flex-1">
                        <p className="font-medium text-grey-800 dark:text-grey-100">
                          Enable Quiet Hours
                        </p>
                        <p className="text-sm text-grey-500 dark:text-grey-400">
                          Mute notifications during specific hours
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleQuietHours}
                      disabled={saving}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        preferences.quietHours.enabled
                          ? 'bg-primary-500'
                          : 'bg-grey-300 dark:bg-grey-600'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          preferences.quietHours.enabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {preferences.quietHours.enabled && (
                    <div className="p-4 rounded-lg border border-grey-200 dark:border-grey-700 bg-grey-50 dark:bg-grey-700/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={preferences.quietHours.start}
                            onChange={(e) => updateQuietHoursTime('start', e.target.value)}
                            disabled={saving}
                            className="w-full px-3 py-2 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-grey-700 dark:text-grey-300 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={preferences.quietHours.end}
                            onChange={(e) => updateQuietHoursTime('end', e.target.value)}
                            disabled={saving}
                            className="w-full px-3 py-2 rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-800 text-grey-700 dark:text-grey-100 outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-grey-800 border-t border-grey-200 dark:border-grey-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-grey-500 dark:text-grey-400">
              {saving ? 'Saving...' : 'Changes are saved automatically'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-grey-100 dark:bg-grey-700 hover:bg-grey-200 dark:hover:bg-grey-600 text-grey-700 dark:text-grey-100 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;