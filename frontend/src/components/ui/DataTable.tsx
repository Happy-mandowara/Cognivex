import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  selectedKey?: string;
  isLoading?: boolean;
  emptyText?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  isLoading = false,
  emptyText = 'No clinical records found.',
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-[#64748B] flex items-center justify-center space-x-2">
        <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <span>Loading clinical records...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#64748B] bg-white rounded-[12px] border border-[#E2E8F0]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto border border-[#E2E8F0] rounded-[12px] bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] ${className}`}>
      <table className="min-w-full divide-y divide-[#E2E8F0] text-xs">
        <thead className="bg-[#F8FAFC] text-[#475569] font-semibold">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold ${
                  col.align === 'right' 
                    ? 'text-right' 
                    : col.align === 'center' 
                    ? 'text-center' 
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] bg-white">
          {data.map((item, index) => {
            const key = keyExtractor(item, index);
            const isSelected = selectedKey === key;
            return (
              <tr
                key={key}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-[#F1F5F9]' : ''
                } ${isSelected ? 'bg-[#EFF6FF] font-medium' : ''}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-xs text-[#0F172A] ${
                      col.align === 'right' 
                        ? 'text-right' 
                        : col.align === 'center' 
                        ? 'text-center' 
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.render ? col.render(item, index) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
