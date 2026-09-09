import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  ...props 
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  return (
    <div 
      className={`bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] overflow-hidden ${className}`}
      {...props}
    >
      <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center space-x-2.5">
          {Icon && <Icon className="w-4 h-4 text-[#2563EB]" />}
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A] tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] flex items-start justify-between ${className}`}>
      <div className="space-y-1">
        <span className="text-xs font-medium text-[#64748B] block">{label}</span>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-semibold text-[#0F172A] tracking-tight">{value}</span>
          {trend && (
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-[10px] bg-[#F1F5F9] text-[#2563EB] shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

interface ClinicalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: React.ReactNode;
  title: string;
  doctorAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ClinicalCard: React.FC<ClinicalCardProps> = ({
  badge,
  title,
  doctorAction,
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`bg-white border border-[#E2E8F0] rounded-[12px] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] overflow-hidden ${className}`}
      {...props}
    >
      <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
        <div className="flex items-center space-x-2.5">
          <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">{title}</h3>
          {badge}
        </div>
        {doctorAction && <div>{doctorAction}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};
