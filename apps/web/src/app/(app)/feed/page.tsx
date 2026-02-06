'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface PostAuthor {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  type: 'user' | 'company';
}

interface FeedPost {
  id: string;
  author: PostAuthor;
  content: string | null;
  publishedAt: string | null;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
}

interface FeedResponse {
  data: FeedPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoading(true);
      setError(null);
      try {
        let personalized: FeedResponse | null = null;
        try {
          personalized = (await api.get<FeedResponse>('/feed?limit=50')) as FeedResponse;
        } catch {
          personalized = null;
        }
        if (!cancelled) {
          if (personalized && personalized.total > 1) {
            setPosts(personalized.data);
            setTotal(personalized.total);
          } else {
            const publicFeed = (await api.get<FeedResponse>('/feed/public?limit=50')) as FeedResponse;
            if (!cancelled) {
              setPosts(publicFeed.data);
              setTotal(publicFeed.total);
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load feed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (user) loadFeed();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left sidebar - Profile summary */}
      <div className="lg:col-span-1">
        <div className="card p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary-600 font-bold text-2xl">
                {user?.displayName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="mt-3 font-semibold text-gray-900">
              {user?.displayName}
            </h2>
            <p className="text-sm text-gray-500">@{user?.username || 'user'}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Connections</span>
              <span className="font-medium text-primary-600">0</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Profile views</span>
              <span className="font-medium text-primary-600">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main feed */}
      <div className="lg:col-span-2">
        {/* Create post */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {user?.displayName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <button className="flex-1 text-left px-4 py-2.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
              Start a post...
            </button>
          </div>
          <div className="flex justify-around mt-4 pt-3 border-t border-gray-100">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">Photo</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">Video</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-medium">Article</span>
            </button>
          </div>
        </div>

        {/* Feed posts or empty/error state */}
        {error && (
          <div className="card p-4 mb-4 text-red-600 bg-red-50">
            {error}
          </div>
        )}
        {loading && (
          <div className="card p-8 text-center text-gray-500">
            Loading feed...
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No posts yet
            </h3>
            <p className="mt-2 text-gray-500">
              Follow people and companies to see their posts in your feed.
            </p>
          </div>
        )}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-medium">
                      {post.author?.displayName?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {post.author?.displayName ?? 'Unknown'}
                      </span>
                      {post.author?.username && (
                        <span className="text-gray-500 text-sm">@{post.author.username}</span>
                      )}
                      <span className="text-gray-400 text-sm">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </div>
                    {post.content && (
                      <p className="mt-2 text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-gray-500 text-sm">
                      <span>{post.reactionCount} reactions</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {total > posts.length && (
              <p className="text-center text-sm text-gray-500">
                Showing {posts.length} of {total} posts
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="lg:col-span-1">
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900">Suggested Connections</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start connecting with professionals in your industry.
          </p>
          <button className="mt-4 btn-outline w-full text-sm">
            Explore Network
          </button>
        </div>
      </div>
    </div>
  );
}
