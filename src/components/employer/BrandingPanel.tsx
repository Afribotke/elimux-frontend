'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface BrandColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  heading: string;
}

export interface BrandingEmployer {
  id: string;
  company_name: string;
  logo_url?: string | null;
  branding_primary_color?: string | null;
  brand_colors?: Partial<BrandColors> | null;
}

const PRESETS: { name: string; colors: BrandColors }[] = [
  { name: 'ElimuX Default', colors: { primary: '#EAB308', accent: '#F59E0B', background: '#FFFFFF', surface: '#F9FAFB', text: '#374151', heading: '#111827' } },
  { name: 'Corporate Blue', colors: { primary: '#3B82F6', accent: '#1D4ED8', background: '#FFFFFF', surface: '#F0F5FF', text: '#374151', heading: '#111827' } },
  { name: 'Healthcare Green', colors: { primary: '#10B981', accent: '#047857', background: '#FFFFFF', surface: '#ECFDF5', text: '#374151', heading: '#064E3B' } },
  { name: 'Tech Purple', colors: { primary: '#8B5CF6', accent: '#6D28D9', background: '#FFFFFF', surface: '#F5F3FF', text: '#374151', heading: '#3730A3' } },
  { name: 'Finance Gold', colors: { primary: '#F59E0B', accent: '#B45309', background: '#FFFFFF', surface: '#FFFBEB', text: '#374151', heading: '#78350F' } },
];

const DEFAULT_COLORS: BrandColors = PRESETS[0].colors;

const COLOR_FIELDS: { key: keyof BrandColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'heading', label: 'Heading' },
];

export default function BrandingPanel({
  employer,
  canEdit,
  onSaved,
}: {
  employer: BrandingEmployer;
  canEdit: boolean;
  onSaved: (message: string) => void;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialColors: BrandColors = {
    ...DEFAULT_COLORS,
    ...(employer.brand_colors || {}),
    primary: employer.branding_primary_color || employer.brand_colors?.primary || DEFAULT_COLORS.primary,
  };

  const [fullTheme, setFullTheme] = useState(!!employer.brand_colors);
  const [colors, setColors] = useState<BrandColors>(initialColors);
  const [logoUrl, setLogoUrl] = useState<string | null>(employer.logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(employer.logo_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateColor(key: keyof BrandColors, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleReset() {
    setColors(initialColors);
    setFullTheme(!!employer.brand_colors);
    setLogoFile(null);
    setLogoPreview(employer.logo_url || null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    let newLogoUrl = logoUrl;

    if (logoFile) {
      const ext = logoFile.name.split('.').pop() || 'png';
      const path = `employer-logos/${employer.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile, {
        upsert: true,
        contentType: logoFile.type,
      });

      if (uploadErr) {
        setError(`Logo upload failed: ${uploadErr.message}`);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(path);
      newLogoUrl = publicUrlData.publicUrl;
      setLogoUrl(newLogoUrl);
    }

    const fullPatch: Record<string, unknown> = {
      logo_url: newLogoUrl,
      branding_primary_color: colors.primary,
      brand_colors: fullTheme ? colors : null,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in again');
        return;
      }

      const res = await fetch(`${API_URL}/api/employers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(fullPatch),
      });

      if (res.status === 401) {
        setError('Please log in again');
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(`Save failed: ${body.error || 'Unknown error'}`);
      } else {
        setLogoFile(null);
        onSaved('Branding saved successfully');
      }
    } catch (err: any) {
      setError(`Save failed: ${err.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Logo</h2>
        <p className="text-sm text-gray-500 mb-4">Shown on your careers page and applicant emails.</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>
          {canEdit && (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs text-gray-400 mt-2">PNG or JPG, square works best.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Color Presets</h2>
        <p className="text-sm text-gray-500 mb-4">Start from a preset, then customize below.</p>
        <div className="flex flex-wrap gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              disabled={!canEdit}
              onClick={() => setColors(preset.colors)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-50"
            >
              <span className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.colors.primary }} />
                <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.colors.accent }} />
              </span>
              <span className="text-sm text-gray-700">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">{fullTheme ? 'Full Theme' : 'Primary Color'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {fullTheme
                ? 'Fine-tune every color used on your careers page.'
                : 'Used for buttons, links, and accents in your employer portal.'}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={fullTheme}
              onChange={(e) => setFullTheme(e.target.checked)}
              disabled={!canEdit}
              className="rounded border-gray-300"
            />
            Full Theme
          </label>
        </div>

        {!fullTheme ? (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colors.primary}
              onChange={(e) => updateColor('primary', e.target.value)}
              disabled={!canEdit}
              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={colors.primary}
              onChange={(e) => updateColor('primary', e.target.value)}
              disabled={!canEdit}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => updateColor(key, e.target.value)}
                    disabled={!canEdit}
                    className="w-10 h-9 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={colors[key]}
                    onChange={(e) => updateColor(key, e.target.value)}
                    disabled={!canEdit}
                    className="flex-1 min-w-0 px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Careers Page Preview</h2>
        <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ backgroundColor: colors.background }}>
          <div className="px-6 py-5 flex items-center gap-3" style={{ backgroundColor: colors.surface }}>
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="w-10 h-10 rounded object-contain bg-white" />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-200" />
            )}
            <div>
              <p className="font-bold" style={{ color: colors.heading }}>{employer.company_name}</p>
              <p className="text-xs" style={{ color: colors.text }}>Careers &amp; Internships</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.heading }}>Software Engineering Intern</h3>
            <p className="text-sm mb-4" style={{ color: colors.text }}>
              Join our team and gain hands-on experience building real products.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: colors.primary }}>
                Apply Now
              </span>
              <span className="text-sm font-medium" style={{ color: colors.accent }}>Learn more →</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Save Branding
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
