'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { formatTime } from '@/lib/utils';

interface TodayStatus {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string | null;
  workHours: number | null;
}

export function CheckInOut() {
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/attendance/today');
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get location
  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          setLocationError('');
          resolve(loc);
        },
        (err) => {
          setLocationError('Unable to get location. Please enable location services.');
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handleCheckIn = async () => {
    setError('');
    setLocationError(''); // Clear previous location warning
    setActionLoading(true);

    try {
      // Try to get location, but don't fail if unavailable
      let loc = { lat: 0, lng: 0 };
      let locationCaptured = false;

      try {
        loc = await getLocation();
        locationCaptured = true;
      } catch (locErr) {
        console.warn('Location unavailable, proceeding without it:', locErr);
        // Don't set error - location is optional
      }

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: loc.lat,
          longitude: loc.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      // Show success message if location wasn't captured
      if (!locationCaptured) {
        setLocationError('Check-in successful (location not available)');
      }

      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError('');
    setLocationError(''); // Clear previous location warning
    setActionLoading(true);

    try {
      // Try to get location, but don't fail if unavailable
      let loc = { lat: 0, lng: 0 };
      let locationCaptured = false;

      try {
        loc = await getLocation();
        locationCaptured = true;
      } catch (locErr) {
        console.warn('Location unavailable, proceeding without it:', locErr);
        // Don't set error - location is optional
      }

      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: loc.lat,
          longitude: loc.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Check-out failed');
      }

      // Show success message if location wasn't captured
      if (!locationCaptured) {
        setLocationError('Check-out successful (location not available)');
      }

      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-40 bg-dark-600 rounded-lg" />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-secondary/5" />

      <div className="relative">
        {/* Current Time */}
        <div className="text-center mb-6">
          <p className="text-5xl font-bold text-white mb-1">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </p>
          <p className="text-gray-400">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Status Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-600/50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Check In</p>
            <p className="text-xl font-semibold text-white">
              {status?.checkInTime ? formatTime(status.checkInTime) : '--:--'}
            </p>
          </div>
          <div className="bg-dark-600/50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Check Out</p>
            <p className="text-xl font-semibold text-white">
              {status?.checkOutTime ? formatTime(status.checkOutTime) : '--:--'}
            </p>
          </div>
        </div>

        {/* Location Status */}
        {location && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
            <svg className="w-4 h-4 text-status-success" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Location captured</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm text-center">
            {error}
          </div>
        )}

        {/* Location Info Message */}
        {locationError && !error && (
          <div className="mb-4 p-3 rounded-lg bg-status-info/10 border border-status-info/30 text-status-info text-sm text-center">
            {locationError}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          {!status?.isCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              loading={actionLoading}
              className="w-full max-w-xs py-4 text-lg"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Check In
            </Button>
          ) : !status?.isCheckedOut ? (
            <Button
              onClick={handleCheckOut}
              loading={actionLoading}
              variant="secondary"
              className="w-full max-w-xs py-4 text-lg"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Check Out
            </Button>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-status-success/20 text-status-success">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Day Complete</span>
              </div>
              {status.workHours && (
                <p className="text-sm text-gray-400 mt-2">
                  Total Hours: {status.workHours.toFixed(2)} hrs
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
