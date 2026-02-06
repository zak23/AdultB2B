'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import type { ProfileResponse } from '@/types/profile';

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Public',
  logged_in: 'Logged-in users only',
  connections: 'Connections only',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<ProfileResponse>('/profiles/me');
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <Link href="/profile/edit" className="btn-primary">
          Edit profile
        </Link>
      </div>

      {/* Banner */}
      {profile?.bannerUrl ? (
        <div className="card overflow-hidden">
          <img
            src={profile.bannerUrl}
            alt="Profile banner"
            className="w-full h-40 object-cover"
          />
        </div>
      ) : (
        <div className="card h-24 bg-gray-100 rounded-xl" />
      )}

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
            {profile?.headline && (
              <p className="text-gray-600 mt-0.5">{profile.headline}</p>
            )}
            {profile?.location && (
              <p className="text-gray-500 text-sm mt-1">{profile.location}</p>
            )}
            {profile?.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link text-sm mt-1 inline-block"
              >
                {profile.websiteUrl}
              </a>
            )}
            {profile?.visibility && (
              <p className="text-gray-400 text-sm mt-1">
                Visibility: {VISIBILITY_LABELS[profile.visibility] ?? profile.visibility}
              </p>
            )}
          </div>
        </div>

        {profile?.about && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-1">About</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{profile.about}</p>
          </div>
        )}

        {(profile?.skills?.length ?? 0) > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile!.skills.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile?.services?.length ?? 0) > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {profile!.services.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-lg text-sm"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile?.niches?.length ?? 0) > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Niches</h3>
            <div className="flex flex-wrap gap-2">
              {profile!.niches.map((n) => (
                <span
                  key={n.id}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                >
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile?.experiences?.length ?? 0) > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Experience</h3>
            <ul className="space-y-4">
              {profile!.experiences
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((exp) => (
                  <li key={exp.id} className="border-l-2 border-primary-200 pl-4">
                    <p className="font-medium text-gray-900">{exp.title}</p>
                    {exp.companyName && (
                      <p className="text-gray-600 text-sm">{exp.companyName}</p>
                    )}
                    <p className="text-gray-500 text-sm">
                      {exp.startDate
                        ? new Date(exp.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                      {exp.isCurrent
                        ? ' – Present'
                        : exp.endDate
                          ? ` – ${new Date(exp.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : ''}
                    </p>
                    {exp.description && (
                      <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">
                        {exp.description}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
