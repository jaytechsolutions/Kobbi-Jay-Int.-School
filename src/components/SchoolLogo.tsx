import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]}`}>
        <img
          src="/my final logo kbj.jpeg"
          alt="Kobbi Jay School Logo"
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base leading-tight uppercase font-sans">
            Kobbi Jay International
          </span>
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-amber-600 uppercase">
            School Management System
          </span>
        </div>
      )}
    </div>
  );
};
