import React from 'react';

export type BadgeVariant = 
  | 'emergency' 
  | 'high' 
  | 'normal' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className = '',
  icon: Icon,
}) => {
  // Infer variant if not explicitly provided
  let computedVariant = variant;
  if (!computedVariant) {
    const s = status.toUpperCase();
    if (s.includes('EMERGENCY')) computedVariant = 'emergency';
    else if (s.includes('HIGH')) computedVariant = 'warning';
    else if (s.includes('COMPLETED') || s.includes('VERIFIED') || s.includes('ACTIVE') || s.includes('ONLINE') || s.includes('GRANTED')) computedVariant = 'success';
    else if (s.includes('WAITING') || s.includes('PENDING') || s.includes('IN_CONSULTATION')) computedVariant = 'info';
    else if (s.includes('INACTIVE') || s.includes('DEACTIVATED') || s.includes('REJECTED')) computedVariant = 'danger';
    else computedVariant = 'neutral';
  }

  const variantStyles = {
    emergency: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] font-semibold',
    high: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-semibold',
    normal: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
    success: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    info: 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  }[computedVariant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{status}</span>
    </span>
  );
};
