import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E2E8F0] bg-white ${className}`}>
      <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#0F172A] tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] shadow-sm transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
