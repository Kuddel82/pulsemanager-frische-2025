import React, { useState } from 'react';

// STUB: Native HTML dialog to replace Radix-UI Dialog
export const Dialog = ({ children, open, onOpenChange, ...props }) => {
  console.log('🔧 Using STUB Dialog - Radix-UI disabled for DOM stability');
  return <div {...props}>{children}</div>;
};

export const DialogTrigger = ({ children, asChild, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const DialogContent = ({ children, className, ...props }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" />
      <div
        className={`relative z-51 w-full max-w-lg bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg p-6 shadow-lg ${className || ''}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ children, className, ...props }) => {
  return (
    <div className={`flex flex-col space-y-2 text-center sm:text-left ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const DialogFooter = ({ children, className, ...props }) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const DialogTitle = ({ children, className, ...props }) => {
  return (
    <h2 className={`text-lg font-semibold text-white ${className || ''}`} {...props}>
      {children}
    </h2>
  );
};

export const DialogDescription = ({ children, className, ...props }) => {
  return (
    <p className={`text-sm text-gray-400 mt-2 ${className || ''}`} {...props}>
      {children}
    </p>
  );
};

export const DialogClose = ({ children, className, ...props }) => {
  return (
    <button
      className={`absolute top-2 right-2 text-gray-400 hover:text-white ${className || ''}`}
      {...props}
    >
      {children || '×'}
    </button>
  );
}; 