import React, { useId } from 'react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => {
  const gradId = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradId})`} />
      <path
        d="M10.5 19.5C8.567 19.5 7 17.933 7 16C7 14.067 8.567 12.5 10.5 12.5H14.5C16.433 12.5 18 14.067 18 16"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M21.5 12.5C23.433 12.5 25 14.067 25 16C25 17.933 23.433 19.5 21.5 19.5H17.5C15.567 19.5 14 17.933 14 16"
        stroke="#C7D2FE"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="16" r="1.6" fill="#34D399" />
      <circle cx="21.5" cy="16" r="1.6" fill="white" />
    </svg>
  );
};
