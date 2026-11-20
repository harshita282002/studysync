import React, { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Palette, Sparkles, Upload, X } from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import {
  cropAndCompressImage,
  CURATED_AVATARS,
  getInitials,
  GRADIENT_AVATAR_THEMES,
} from '../utils/avatar';
import { Avatar } from './Avatar';

interface ProfilePhotoModalProps {
  open: boolean;
  onClose: () => void;
}

type StudioTab = 'upload' | 'gallery' | 'monogram';

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ open, onClose }) => {
  const { currentUser, updateUserPhoto } = useStudySync();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<StudioTab>('upload');
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string>(CURATED_AVATARS[0].url);
  const [selectedGradientToken, setSelectedGradientToken] = useState<string>(
    GRADIENT_AVATAR_THEMES[0].token
  );

  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedBytes, setCroppedBytes] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab('upload');
    setError(null);
    setCroppedDataUrl(null);
    setCroppedBlob(null);
    setCroppedBytes(0);

    if (currentUser?.photoURL) {
      if (currentUser.photoURL.startsWith('gradient:')) {
        setSelectedGradientToken(currentUser.photoURL);
      } else if (CURATED_AVATARS.some((a) => a.url === currentUser.photoURL)) {
        setSelectedGalleryUrl(currentUser.photoURL);
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, currentUser?.photoURL, onClose]);

  if (!open || !currentUser) return null;

  const previewUrl =
    activeTab === 'upload'
      ? croppedDataUrl || currentUser.photoURL
      : activeTab === 'gallery'
        ? selectedGalleryUrl
        : selectedGradientToken;

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const result = await cropAndCompressImage(file, 256, 0.85);
      setCroppedDataUrl(result.dataUrl);
      setCroppedBlob(result.blob);
      setCroppedBytes(result.sizeBytes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process image file.');
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (activeTab === 'upload') {
        if (!croppedDataUrl || !croppedBlob) {
          setError('Choose or drop an image file first.');
          setSaving(false);
          return;
        }
        await updateUserPhoto({ blob: croppedBlob, dataUrl: croppedDataUrl });
      } else if (activeTab === 'gallery') {
        await updateUserPhoto({ photoURL: selectedGalleryUrl });
      } else {
        await updateUserPhoto({ photoURL: selectedGradientToken });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile photo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-photo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="profile-photo-modal-title" className="text-base font-bold text-slate-900">
              Change Profile Photo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Synced across Top Navbar, Peer Directory, Noticeboard & Team Workspaces
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Change Profile Photo modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Strip */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar
              name={currentUser.name}
              photoURL={previewUrl}
              size="xl"
              isProMember={currentUser.isProMember}
              availabilityStatus={currentUser.availabilityStatus}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {currentUser.program} · {currentUser.campusCluster}
              </p>
              <p className="text-xs font-medium text-indigo-600 mt-1">
                {activeTab === 'upload'
                  ? croppedDataUrl
                    ? `256×256 Square Crop Ready (${Math.max(1, Math.round(croppedBytes / 1024))} KB JPEG)`
                    : 'Live square crop preview'
                  : activeTab === 'gallery'
                    ? 'Illustrated Portrait Preset'
                    : 'Gradient Monogram Avatar'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div
            role="tablist"
            aria-label="Profile photo options"
            className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'upload'}
              onClick={() => {
                setActiveTab('upload');
                setError(null);
              }}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'gallery'}
              onClick={() => {
                setActiveTab('gallery');
                setError(null);
              }}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Avatar Gallery</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'monogram'}
              onClick={() => {
                setActiveTab('monogram');
                setError(null);
              }}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'monogram'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span>Monogram</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/70'
                    : 'border-slate-300 bg-slate-50/60 hover:border-indigo-300'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Drag & drop a headshot or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  PNG, JPG, or WebP · Automatically center-cropped to 256×256 JPEG (0.85 quality)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  aria-label="Upload profile photo from device"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Choose Image File
                </button>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pick from 12 curated illustrated student portraits (Notionists, Micah & Lorelei):
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {CURATED_AVATARS.map((preset) => {
                  const selected = selectedGalleryUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedGalleryUrl(preset.url)}
                      aria-label={`Select ${preset.label} (${preset.style}) avatar`}
                      aria-pressed={selected}
                      className={`group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/25'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border border-slate-200 bg-white object-cover"
                      />
                      <span className="text-[11px] font-medium text-slate-700 truncate max-w-full">
                        {preset.label}
                      </span>
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'monogram' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Generate a crisp monogram avatar with your initials ({getInitials(currentUser.name)}):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GRADIENT_AVATAR_THEMES.map((theme) => {
                  const selected = selectedGradientToken === theme.token;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedGradientToken(theme.token)}
                      aria-label={`Select ${theme.label} gradient monogram`}
                      aria-pressed={selected}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/25'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-xs ${theme.gradientClass}`}
                      >
                        {getInitials(currentUser.name)}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {theme.label}
                      </span>
                      {selected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-600 mt-3 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || (activeTab === 'upload' && !croppedDataUrl)}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            {saving
              ? 'Saving Photo...'
              : activeTab === 'upload'
                ? 'Save Uploaded Photo'
                : activeTab === 'gallery'
                  ? 'Save Selected Avatar'
                  : 'Save Monogram'}
          </button>
        </div>
      </div>
    </div>
  );
};
