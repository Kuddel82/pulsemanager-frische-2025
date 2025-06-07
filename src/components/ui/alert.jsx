import React from 'react';

// STUB: Native HTML alert to replace Radix-UI Alert
export const Alert = ({ children, className, variant = "default", ...props }) => {
  console.log('🔧 Using STUB Alert - Radix-UI disabled for DOM stability');
  
  const baseClasses = "relative w-full rounded-lg border p-4";
  
  const variantClasses = {
    default: "bg-blue-500/10 border-blue-500/20 text-blue-100",
    destructive: "bg-red-500/10 border-red-500/20 text-red-100"
  };
  
  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;
  
  return (
    <div className={finalClasses} {...props}>
      {children}
    </div>
  );
};

export const AlertTitle = ({ children, className, ...props }) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className || ''}`} {...props}>
      {children}
    </h5>
  );
};

export const AlertDescription = ({ children, className, ...props }) => {
  return (
    <div className={`text-sm opacity-90 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export default Alert;