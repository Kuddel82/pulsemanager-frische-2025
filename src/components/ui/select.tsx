import React from 'react';

// STUB: Native HTML select to replace Radix-UI Select for DOM stability
console.log('🔧 Using STUB Select - Radix-UI disabled for DOM stability');

export const Select = ({ children, onValueChange, defaultValue, value, ...props }) => {
  return (
    <div className="relative" {...props}>
      {children}
    </div>
  );
};

export const SelectGroup = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

export const SelectValue = ({ placeholder, ...props }) => {
  return <span className="text-gray-400" {...props}>{placeholder}</span>;
};

export const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-gray-800/50 px-3 py-2 text-sm text-white hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
});

export const SelectContent = ({ children, className, ...props }) => {
  return (
    <div className={`absolute top-full left-0 right-0 mt-1 bg-gray-900/95 border border-white/20 rounded-lg shadow-lg z-50 ${className || ''}`} {...props}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

export const SelectLabel = ({ children, className, ...props }) => {
  return (
    <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold text-white ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const SelectItem = ({ children, className, value, ...props }) => {
  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-white hover:bg-white/10 ${className || ''}`}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {children}
    </div>
  );
};

export const SelectSeparator = ({ className, ...props }) => {
  return <hr className={`my-1 border-white/20 ${className || ''}`} {...props} />;
}; 