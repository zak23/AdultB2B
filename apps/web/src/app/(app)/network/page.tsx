'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface Connection {
  id: string;
  requesterId: string;
  requesterDisplayName: string;
  recipientId: string;
  recipientDisplayName: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
}

interface NetworkStats {
  followersCount: number;
  followingCount: number;
  connectionsCount: number;
}

export default function NetworkPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [connRes, pendingRes, statsRes] = await Promise.all([
          api.get<Connection[]>('/networking/connections'),
          api.get<Connection[]>('/networking/connections/pending'),
          api.get<NetworkStats>('/networking/stats'),
        ]);
        if (!cancelled) {
          setConnections(Array.isArray(connRes) ? connRes : []);
          setPending(Array.isArray(pendingRes) ? pendingRes : []);
          setStats(statsRes);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e && typeof e === 'object' && 'message' in e
              ? String((e as { message: string }).message)
              : 'Failed to load network',
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

  const acceptPending = async (connectionId: string) => {
    try {
      await api.post(`/networking/connections/${connectionId}/respond`, { action: 'accepted' });
      setPending((p) => p.filter((c) => c.id !== connectionId));
      setConnections((c) => [...c, pending.find((x) => x.id === connectionId)!].filter(Boolean));
      if (stats) setStats({ ...stats, connectionsCount: stats.connectionsCount + 1 });
    } catch {
      // keep UI as-is on error
    }
  };

  const declinePending = async (connectionId: string) => {
    try {
      await api.post(`/networking/connections/${connectionId}/respond`, { action: 'declined' });
      setPending((p) => p.filter((c) => c.id !== connectionId));
    } catch {
      // keep UI as-is on error
    }
  };

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

  const otherDisplayName = (c: Connection) =>
    c.requesterId === user?.id ? c.recipientDisplayName : c.requesterDisplayName;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Network</h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Connections</p>
            <p className="text-2xl font-semibold text-primary-600">{stats.connectionsCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Followers</p>
            <p className="text-2xl font-semibold text-primary-600">{stats.followersCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Following</p>
            <p className="text-2xl font-semibold text-primary-600">{stats.followingCount}</p>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending requests</h2>
          <ul className="card divide-y divide-gray-100">
            {pending.map((c) => (
              <li key={c.id} className="p-4 flex items-center justify-between">
                <span className="font-medium text-gray-900">{otherDisplayName(c)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptPending(c.id)}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => declinePending(c.id)}
                    className="btn-outline text-sm py-1 px-3"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Connections</h2>
        {connections.length === 0 ? (
          <div className="card p-6 text-center text-gray-500">
            No connections yet. Use the feed to find people and send connection requests.
          </div>
        ) : (
          <ul className="card divide-y divide-gray-100">
            {connections.map((c) => (
              <li key={c.id} className="p-4">
                <span className="font-medium text-gray-900">{otherDisplayName(c)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
