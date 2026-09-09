import React from 'react';
import { User, Phone, ShieldCheck, Heart, AlertCircle, Edit2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface PatientHeaderProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string;
    abha_id?: string;
    abha_address?: string;
    has_consented?: boolean;
  };
  triagePriority?: string;
  encounterStatus?: string;
  onEditPatient?: () => void;
  className?: string;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  triagePriority = 'NORMAL',
  encounterStatus,
  onEditPatient,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Avatar & Demographics */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#F1F5F9] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">{patient.name}</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {patient.age}y • {patient.gender}
              </span>
              <StatusBadge status={triagePriority} />
              {encounterStatus && (
                <StatusBadge status={encounterStatus} variant="neutral" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
              <span className="font-mono text-[#0F172A]">ID: {patient.id}</span>
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#64748B]" />
                  <span>{patient.phone}</span>
                </span>
              )}
              {patient.abha_id && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                  <span className="font-mono text-[#15803D] font-medium">ABHA: {patient.abha_id}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {onEditPatient && (
            <button
              onClick={onEditPatient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-[8px] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
