import React, { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import type { AvailabilityStatus } from '../types/studysync';
import {
  getFallbackGradientTheme,
  getGradientThemeByToken,
  getInitials,
  isImagePhotoUrl,
} from '../utils/avatar';

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isProMember?: boolean;
  availabilityStatus?: AvailabilityStatus;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  photoURL,
  size = 'md',
  isProMember = false,
  availabilityStatus,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [photoURL]);

  const sizeClass =
    size === 'xs'
      ? 'w-7 h-7 text-[11px]'
      : size === 'sm'
        ? 'w-8 h-8 text-xs'
        : size === 'lg'
          ? 'w-14 h-14 text-lg'
          : size === 'xl'
            ? 'w-20 h-20 text-xl'
            : 'w-10 h-10 text-sm';

  const showImage = isImagePhotoUrl(photoURL) && !imgFailed;
  const gradientTheme = getGradientThemeByToken(photoURL) || getFallbackGradientTheme(name);

  const dotSizeClass =
    size === 'xl'
      ? 'w-4 h-4 border-2'
      : size === 'lg'
        ? 'w-3.5 h-3.5 border-2'
        : 'w-2.5 h-2.5 border-2';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {showImage ? (
        <div
          className={`${sizeClass} rounded-full overflow-hidden border border-slate-200 bg-white shadow-xs select-none`}
        >
          <img
            src={photoURL}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`${sizeClass} ${gradientTheme.gradientClass} rounded-full font-semibold flex items-center justify-center select-none shadow-xs ring-1 ring-black/5`}
          aria-hidden="true"
        >
          {getInitials(name)}
        </div>
      )}

      {isProMember && (
        <span
          title="StudySync Pro Verified"
          className={`absolute ${
            availabilityStatus ? '-top-1 -right-1' : '-bottom-0.5 -right-0.5'
          } bg-white rounded-full p-0.5 border border-slate-200 text-indigo-600 shadow-xs`}
        >
          <BadgeCheck className={size === 'xl' || size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
        </span>
      )}

      {availabilityStatus && (
        <span
          title={`Status: ${availabilityStatus}`}
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center"
        >
          {availabilityStatus === 'Available Now' && (
            <span
              aria-hidden="true"
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"
            />
          )}
          <span
            className={`relative block ${dotSizeClass} rounded-full border-white ${
              availabilityStatus === 'Available Now'
                ? 'bg-emerald-500'
                : availabilityStatus === 'Open for Weekends'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
            }`}
          />
        </span>
      )}
    </div>
  );
};
