'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface ProfileData {
  id: string;
  userId?: string;
  displayName?: string;
  headline?: string | null;
  bio?: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<ProfileData>('/profiles/me');
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e && typeof e === 'object' && 'message' in e
              ? String((e as { message: string }).message)
              : 'Failed to load profile',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (user) load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const displayName = profile?.displayName ?? user?.displayName ?? 'Profile';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
            {profile?.headline && (
              <p className="text-gray-600 mt-0.5">{profile.headline}</p>
            )}
          </div>
        </div>
        {profile?.bio && (
          <p className="mt-4 text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
        )}
        <p className="mt-6 text-sm text-gray-500">
          Full profile editing coming soon.
        </p>
      </div>
    </div>
  );
}
