import React, { useState } from 'react';

// STUB: Native HTML alert dialog to replace Radix-UI AlertDialog
export const AlertDialog = ({ children, open, onOpenChange, ...props }) => {
  console.log('🔧 Using STUB AlertDialog - Radix-UI disabled for DOM stability');
  return <div {...props}>{children}</div>;
};

export const AlertDialogTrigger = ({ children, asChild, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const AlertDialogPortal = ({ children }) => {
  return <>{children}</>;
};

export const AlertDialogOverlay = ({ className, ...props }) => {
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 ${className || ''}`}
      {...props}
    />
  );
};

export const AlertDialogContent = ({ children, className, ...props }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <AlertDialogOverlay />
      <div
        className={`relative z-51 w-full max-w-lg bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg p-6 shadow-lg ${className || ''}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export const AlertDialogHeader = ({ children, className, ...props }) => {
  return (
    <div className={`flex flex-col space-y-2 text-center sm:text-left ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDialogFooter = ({ children, className, ...props }) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDialogTitle = ({ children, className, ...props }) => {
  return (
    <h2 className={`text-lg font-semibold text-white ${className || ''}`} {...props}>
      {children}
    </h2>
  );
};

export const AlertDialogDescription = ({ children, className, ...props }) => {
  return (
    <p className={`text-sm text-gray-400 mt-2 ${className || ''}`} {...props}>
      {children}
    </p>
  );
};

export const AlertDialogAction = ({ children, className, onClick, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 transition-colors ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const AlertDialogCancel = ({ children, className, onClick, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors mr-2 ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
