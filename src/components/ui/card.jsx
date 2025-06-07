import React from 'react';
import { cn } from '@/lib/utils';

// STUB: Native HTML cards to replace Radix-UI Card
export const Card = ({ children, className, ...props }) => {
  console.log('🔧 Using STUB Card - Radix-UI disabled for DOM stability');
  const baseClasses = "bg-gray-900/80 backdrop-blur border border-white/20 rounded-lg shadow-lg";
  return (
    <div className={`${baseClasses} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={`p-6 pb-3 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, ...props }) => {
  return (
    <h3 className={`text-xl font-semibold text-white ${className || ''}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className, ...props }) => {
  return (
    <p className={`text-gray-400 mt-1 ${className || ''}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div className={`p-6 pt-0 flex items-center ${className || ''}`} {...props}>
      {children}
    </div>
  );
};