'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

interface MessageThread {
  id: string;
  threadType: string;
  lastMessageAt: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  content: string | null;
  senderUserId: string;
  senderUser?: { id: string; displayName: string; username?: string };
  createdAt: string;
}

interface ThreadsResponse {
  data: MessageThread[];
  total: number;
}

interface MessagesResponse {
  data: Message[];
  total: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!user) return;
    setLoadingThreads(true);
    setError(null);
    try {
      const res = await api.get<ThreadsResponse>('/messaging/threads?limit=50');
      setThreads(res.data || []);
      if (res.data?.length && !selectedThreadId) setSelectedThreadId(res.data[0].id);
    } catch (e) {
      setError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Failed to load conversations',
      );
    } finally {
      setLoadingThreads(false);
    }
  }, [user, selectedThreadId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!user || !selectedThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    api
      .get<MessagesResponse>(`/messaging/threads/${selectedThreadId}/messages?limit=100`)
      .then((res) => {
        if (!cancelled) setMessages(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, selectedThreadId]);

  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !selectedThreadId) return;
    setMessageInput('');
    try {
      const sent = await api.post<Message>(`/messaging/threads/${selectedThreadId}/messages`, {
        content,
      });
      setMessages((prev) => [...prev, sent]);
    } catch {
      setMessageInput(content);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
  };

  if (loadingThreads) {
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
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[400px]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="md:col-span-1 border-r border-gray-200 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">No conversations yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      selectedThreadId === t.id ? 'bg-primary-50 border-l-2 border-primary-600' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900 truncate">
                      {t.threadType === 'direct' ? 'Direct' : 'Group'} · {t.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.lastMessageAt ? formatTime(t.lastMessageAt) : 'No messages'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="md:col-span-2 flex flex-col">
          {!selectedThreadId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderUserId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-xs font-medium opacity-80 mb-0.5">
                              {m.senderUser?.displayName ?? 'Unknown'}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{m.content || ''}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-primary-100' : 'text-gray-500'}`}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button type="button" onClick={sendMessage} className="btn-primary py-2 px-4">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
