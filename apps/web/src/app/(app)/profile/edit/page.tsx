'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { uploadProfileImage, isApiError } from '@/lib/media-upload';
import type {
  ProfileResponse,
  UpdateProfileDto,
  ProfileVisibility,
  SkillDto,
  ServiceDto,
  NicheDto,
  ExperienceDto,
  CreateExperienceDto,
} from '@/types/profile';

const MAX_HEADLINE = 200;
const MAX_ABOUT = 5000;
const MAX_LOCATION = 200;
const MAX_EXP_TITLE = 200;
const MAX_EXP_DESCRIPTION = 2000;

const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'logged_in', label: 'Logged-in users only' },
  { value: 'connections', label: 'Connections only' },
];

export default function ProfileEditPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [niches, setNiches] = useState<NicheDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state (basics + lookup ids)
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [visibility, setVisibility] = useState<ProfileVisibility>('public');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [nicheIds, setNicheIds] = useState<string[]>([]);

  // Avatar / banner
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Experience form (add or edit)
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompanyName, setExpCompanyName] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expSaving, setExpSaving] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, skillsRes, servicesRes, nichesRes] = await Promise.all([
        api.get<ProfileResponse>('/profiles/me'),
        api.get<SkillDto[]>('/profiles/lookup/skills'),
        api.get<ServiceDto[]>('/profiles/lookup/services'),
        api.get<NicheDto[]>('/profiles/lookup/niches'),
      ]);
      setProfile(profileRes);
      setSkills(skillsRes ?? []);
      setServices(servicesRes ?? []);
      setNiches(nichesRes ?? []);
      setHeadline(profileRes.headline ?? '');
      setAbout(profileRes.about ?? '');
      setLocation(profileRes.location ?? '');
      setWebsiteUrl(profileRes.websiteUrl ?? '');
      setVisibility((profileRes.visibility as ProfileVisibility) ?? 'public');
      setSkillIds(profileRes.skills?.map((s) => s.id) ?? []);
      setServiceIds(profileRes.services?.map((s) => s.id) ?? []);
      setNicheIds(profileRes.niches?.map((n) => n.id) ?? []);
    } catch (e) {
      setSaveError(isApiError(e) ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    if (headline.length > MAX_HEADLINE || about.length > MAX_ABOUT || location.length > MAX_LOCATION) {
      setSaveError('One or more fields exceed maximum length.');
      return;
    }
    setSaving(true);
    try {
      const dto: UpdateProfileDto = {
        headline: headline || undefined,
        about: about || undefined,
        location: location || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        visibility,
        skillIds: skillIds.length ? skillIds : undefined,
        serviceIds: serviceIds.length ? serviceIds : undefined,
        nicheIds: nicheIds.length ? nicheIds : undefined,
      };
      const updated = await api.put<ProfileResponse>('/profiles/me', dto);
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(isApiError(e) ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const { mediaAssetId } = await uploadProfileImage(file);
      const updated = await api.put<ProfileResponse>('/profiles/me/avatar', {
        mediaAssetId,
      });
      setProfile(updated);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setBannerError(null);
    setBannerLoading(true);
    try {
      const { mediaAssetId } = await uploadProfileImage(file);
      const updated = await api.put<ProfileResponse>('/profiles/me/banner', {
        mediaAssetId,
      });
      setProfile(updated);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Banner upload failed');
    } finally {
      setBannerLoading(false);
    }
  };

  const toggleSkill = (id: string) => {
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleService = (id: string) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleNiche = (id: string) => {
    setNicheIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resetExperienceForm = () => {
    setEditingExperienceId(null);
    setExpTitle('');
    setExpCompanyName('');
    setExpStartDate('');
    setExpEndDate('');
    setExpIsCurrent(false);
    setExpDescription('');
    setExpError(null);
  };

  const fillExperienceForm = (exp: ExperienceDto) => {
    setEditingExperienceId(exp.id);
    setExpTitle(exp.title);
    setExpCompanyName(exp.companyName ?? '');
    setExpStartDate(exp.startDate ? exp.startDate.slice(0, 10) : '');
    setExpEndDate(exp.endDate ? exp.endDate.slice(0, 10) : '');
    setExpIsCurrent(exp.isCurrent);
    setExpDescription(exp.description ?? '');
    setExpError(null);
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);
    if (!expTitle.trim()) {
      setExpError('Title is required.');
      return;
    }
    if (expTitle.length > MAX_EXP_TITLE || expDescription.length > MAX_EXP_DESCRIPTION) {
      setExpError('Title or description exceeds maximum length.');
      return;
    }
    setExpSaving(true);
    try {
      const payload: CreateExperienceDto = {
        title: expTitle.trim(),
        companyName: expCompanyName.trim() || undefined,
        startDate: expStartDate || undefined,
        endDate: expIsCurrent ? undefined : (expEndDate || undefined),
        isCurrent: expIsCurrent,
        description: expDescription.trim() || undefined,
      };
      if (editingExperienceId) {
        const updated = await api.put<ProfileResponse>(
          `/profiles/me/experiences/${editingExperienceId}`,
          payload
        );
        setProfile(updated);
        resetExperienceForm();
      } else {
        const updated = await api.post<ProfileResponse>(
          '/profiles/me/experiences',
          payload
        );
        setProfile(updated);
        resetExperienceForm();
      }
    } catch (err) {
      setExpError(isApiError(err) ? err.message : 'Failed to save experience');
    } finally {
      setExpSaving(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const updated = await api.delete<ProfileResponse>(
        `/profiles/me/experiences/${id}`
      );
      setProfile(updated);
      if (editingExperienceId === id) resetExperienceForm();
    } catch (err) {
      setExpError(isApiError(err) ? err.message : 'Failed to delete experience');
    }
  };

  const displayName = profile?.displayName ?? user?.displayName ?? 'Profile';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600">{saveError ?? 'Failed to load profile'}</p>
        <Link href="/profile" className="link mt-4 inline-block">
          Back to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit profile</h1>
        <Link href="/profile" className="btn-outline">
          Back to profile
        </Link>
      </div>

      {saveError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
          Profile saved.
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Basics */}
        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Basics</h2>
          <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
              Headline
            </label>
            <input
              id="headline"
              type="text"
              maxLength={MAX_HEADLINE}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="input"
              placeholder="e.g. Senior Content Producer"
            />
            <p className="text-gray-400 text-xs mt-1">{headline.length}/{MAX_HEADLINE}</p>
          </div>
          <div>
            <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
              About
            </label>
            <textarea
              id="about"
              rows={5}
              maxLength={MAX_ABOUT}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="input"
              placeholder="Tell people about yourself..."
            />
            <p className="text-gray-400 text-xs mt-1">{about.length}/{MAX_ABOUT}</p>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              maxLength={MAX_LOCATION}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="e.g. Los Angeles, CA"
            />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Profile visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}
              className="input"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Avatar */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Avatar</h2>
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
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
            <div>
              <label className="btn-outline cursor-pointer inline-block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarLoading}
                />
                {avatarLoading ? 'Uploading...' : 'Change avatar'}
              </label>
              {avatarError && (
                <p className="text-red-600 text-sm mt-1">{avatarError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Banner</h2>
          <div className="space-y-3">
            {profile.bannerUrl ? (
              <img
                src={profile.bannerUrl}
                alt="Banner"
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded-lg" />
            )}
            <label className="btn-outline cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
                disabled={bannerLoading}
              />
              {bannerLoading ? 'Uploading...' : 'Change banner'}
            </label>
            {bannerError && (
              <p className="text-red-600 text-sm">{bannerError}</p>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {skills.length === 0 ? (
              <p className="text-gray-500 text-sm">No skills available.</p>
            ) : (
              skills.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={skillIds.includes(s.id)}
                    onChange={() => toggleSkill(s.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Services */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Services</h2>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {services.length === 0 ? (
              <p className="text-gray-500 text-sm">No services available.</p>
            ) : (
              services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Niches */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Niches</h2>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {niches.length === 0 ? (
              <p className="text-gray-500 text-sm">No niches available.</p>
            ) : (
              niches.map((n) => (
                <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={nicheIds.includes(n.id)}
                    onChange={() => toggleNiche(n.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{n.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>

      {/* Experiences */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
        <ul className="space-y-3 mb-6">
          {(profile.experiences ?? [])
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((exp) => (
              <li
                key={exp.id}
                className="flex justify-between items-start p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  {exp.companyName && (
                    <p className="text-gray-600 text-sm">{exp.companyName}</p>
                  )}
                  <p className="text-gray-500 text-xs">
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
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fillExperienceForm(exp)}
                    className="btn-outline text-sm py-1 px-2"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="btn-outline text-sm py-1 px-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
        </ul>

        <form onSubmit={handleSaveExperience} className="space-y-4 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700">
            {editingExperienceId ? 'Edit experience' : 'Add experience'}
          </h3>
          {expError && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-sm">
              {expError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              maxLength={MAX_EXP_TITLE}
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              className="input"
              placeholder="e.g. Content Director"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={expCompanyName}
              onChange={(e) => setExpCompanyName(e.target.value)}
              className="input"
              placeholder="e.g. Studio XYZ"
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={expStartDate}
                onChange={(e) => setExpStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={expEndDate}
                onChange={(e) => setExpEndDate(e.target.value)}
                className="input"
                disabled={expIsCurrent}
              />
            </div>
            <label className="flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={expIsCurrent}
                onChange={(e) => setExpIsCurrent(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">I currently work here</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              maxLength={MAX_EXP_DESCRIPTION}
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              className="input"
              placeholder="Optional description..."
            />
            <p className="text-gray-400 text-xs mt-1">{expDescription.length}/{MAX_EXP_DESCRIPTION}</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={expSaving} className="btn-primary">
              {expSaving ? 'Saving...' : editingExperienceId ? 'Update experience' : 'Add experience'}
            </button>
            {editingExperienceId && (
              <button
                type="button"
                onClick={resetExperienceForm}
                className="btn-outline"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
