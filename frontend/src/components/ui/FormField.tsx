import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold text-[#0F172A]">
        {label}
        {required && <span className="text-[#B91C1C] ml-1">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[#B91C1C] font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#64748B] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
