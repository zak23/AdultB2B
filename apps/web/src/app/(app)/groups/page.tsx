'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  createdAt: string;
}

interface PublicGroupsResponse {
  data: Group[];
  total: number;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'discover' | 'my'>('discover');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [publicRes, myRes] = await Promise.all([
          api.get<PublicGroupsResponse>('/groups?limit=50'),
          api.get<Group[]>('/groups/my'),
        ]);
        if (!cancelled) {
          setPublicGroups(publicRes?.data ?? []);
          setMyGroups(Array.isArray(myRes) ? myRes : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e && typeof e === 'object' && 'message' in e
              ? String((e as { message: string }).message)
              : 'Failed to load groups',
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

  const joinGroup = async (groupId: string) => {
    setJoiningId(groupId);
    try {
      await api.post(`/groups/${groupId}/join`);
      setMyGroups((prev) => {
        const added = publicGroups.find((g) => g.id === groupId);
        if (added && !prev.some((g) => g.id === groupId)) return [...prev, added];
        return prev;
      });
    } catch {
      // keep UI as-is
    } finally {
      setJoiningId(null);
    }
  };

  const myGroupIds = new Set(myGroups.map((g) => g.id));

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Groups</h1>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('discover')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            tab === 'discover'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Discover
        </button>
        <button
          type="button"
          onClick={() => setTab('my')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            tab === 'my'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My groups
        </button>
      </div>

      {tab === 'discover' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicGroups.length === 0 ? (
            <div className="col-span-full card p-6 text-center text-gray-500">
              No public groups yet.
            </div>
          ) : (
            publicGroups.map((g) => (
              <div key={g.id} className="card p-4 flex flex-col">
                <h3 className="font-semibold text-gray-900">{g.name}</h3>
                {g.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">/{g.slug}</p>
                {myGroupIds.has(g.id) ? (
                  <span className="mt-3 text-sm text-primary-600 font-medium">Member</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => joinGroup(g.id)}
                    disabled={joiningId === g.id}
                    className="mt-3 btn-primary text-sm py-1.5 px-3 self-start disabled:opacity-50"
                  >
                    {joiningId === g.id ? 'Joining…' : 'Join'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'my' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.length === 0 ? (
            <div className="col-span-full card p-6 text-center text-gray-500">
              You haven’t joined any groups. Discover public groups above.
            </div>
          ) : (
            myGroups.map((g) => (
              <div key={g.id} className="card p-4">
                <h3 className="font-semibold text-gray-900">{g.name}</h3>
                {g.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">/{g.slug}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
