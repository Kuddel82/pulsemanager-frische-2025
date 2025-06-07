import React, { useState } from 'react';

// STUB: Native HTML accordion to replace Radix-UI Accordion
export const Accordion = ({ children, type = "single", collapsible = true, className, ...props }) => {
  console.log('🔧 Using STUB Accordion - Radix-UI disabled for DOM stability');
  
  return (
    <div className={`w-full ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const AccordionItem = ({ children, value, className, ...props }) => {
  return (
    <div className={`border-b border-white/20 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const AccordionTrigger = ({ children, className, ...props }) => {
  return (
    <button
      className={`flex flex-1 items-center justify-between py-4 font-medium text-white hover:text-green-400 transition-colors text-left w-full ${className || ''}`}
      {...props}
    >
      {children}
      <svg
        className="h-4 w-4 shrink-0 transition-transform duration-200"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const AccordionContent = ({ children, className, ...props }) => {
  return (
    <div className={`pb-4 pt-0 text-gray-300 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export default Accordion;