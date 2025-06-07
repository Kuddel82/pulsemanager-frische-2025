import React, { useState } from 'react';

// STUB: Native HTML dropdown menu to replace Radix-UI DropdownMenu
export const DropdownMenu = ({ children, ...props }) => {
  console.log('🔧 Using STUB DropdownMenu - Radix-UI disabled for DOM stability');
  return <div {...props}>{children}</div>;
};

export const DropdownMenuTrigger = ({ children, asChild, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const DropdownMenuContent = ({ children, className, align = "end", ...props }) => {
  return (
    <div
      className={`absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg shadow-lg py-1 z-50 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const DropdownMenuItem = ({ children, className, onClick, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = ({ className, ...props }) => {
  return <div className={`my-1 h-px bg-white/20 ${className || ''}`} {...props} />;
};

export default DropdownMenu;
  