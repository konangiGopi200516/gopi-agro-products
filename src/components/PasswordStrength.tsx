import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

export const getPasswordScore = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0 to 4
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const score = getPasswordScore(password);
  
  // 0-1 = Weak (red), 2 = Fair (amber), 3 = Good (green), 4 = Strong (green+)
  const bars = [1, 2, 3, 4];
  
  const getBarColor = (index: number) => {
    if (index > score) return 'bg-gray-200';
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-green-500';
    return 'bg-emerald-600'; // 4
  };

  const getLabel = () => {
    if (!password) return '';
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  };

  const getLabelColor = () => {
    if (score <= 1) return 'text-red-600';
    if (score === 2) return 'text-amber-600';
    if (score === 3) return 'text-green-600';
    return 'text-emerald-700';
  };

  return (
    <div className="mt-2">
      <div className="flex space-x-1.5 h-1.5">
        {bars.map((bar) => (
          <div
            key={bar}
            className={`flex-1 rounded-full transition-all duration-300 ${getBarColor(bar)}`}
          />
        ))}
      </div>
      {password && (
        <div className={`mt-1 text-xs font-medium text-right ${getLabelColor()}`}>
          {getLabel()}
        </div>
      )}
    </div>
  );
};
