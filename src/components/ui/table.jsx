import React from 'react';
import { cn } from '@/lib/utils';

// STUB: Native HTML table to replace Radix-UI Table
export const Table = ({ children, className, ...props }) => {
  console.log('🔧 Using STUB Table - Radix-UI disabled for DOM stability');
  
  const baseClasses = "w-full caption-bottom text-sm";
  
  return (
    <div className="relative w-full overflow-auto">
      <table className={`${baseClasses} ${className || ''}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className, ...props }) => {
  return (
    <thead className={`border-b border-white/20 ${className || ''}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className, ...props }) => {
  return (
    <tbody className={`divide-y divide-white/10 ${className || ''}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className, ...props }) => {
  return (
    <tr className={`hover:bg-white/5 transition-colors ${className || ''}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className, ...props }) => {
  return (
    <th className={`h-12 px-4 text-left align-middle font-medium text-gray-300 ${className || ''}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className, ...props }) => {
  return (
    <td className={`p-4 align-middle text-white ${className || ''}`} {...props}>
      {children}
    </td>
  );
};

export default Table;