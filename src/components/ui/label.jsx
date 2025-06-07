import React from 'react';

// STUB: Native HTML label to replace Radix-UI Label
export const Label = ({ children, className, htmlFor, ...props }) => {
  console.log('🔧 Using STUB Label - Radix-UI disabled for DOM stability');
  
  const baseClasses = "block text-sm font-medium text-white mb-2";
  
  return (
    <label
      htmlFor={htmlFor}
      className={`${baseClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;
  