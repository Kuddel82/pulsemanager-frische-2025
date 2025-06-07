import { useState } from 'react';

// STUB: Simplified toast system to replace Radix-UI Toast for DOM stability
export const useToast = () => {
  console.log('🔧 Using STUB useToast - Radix-UI disabled for DOM stability');
  
  const [toasts, setToasts] = useState([]);
  
  const toast = (options) => {
    const { title, description, variant = "default" } = options;
    
    // Log to console instead of DOM manipulation
    const logPrefix = variant === "destructive" ? "❌" : "✅";
    console.log(`${logPrefix} TOAST:`, title, description);
    
    // Simple state management without DOM portals
    const newToast = {
      id: Date.now(),
      title,
      description,
      variant,
      timestamp: new Date().toISOString()
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 3000);
    
    return newToast;
  };
  
  return { toast, toasts };
};

export const toast = (options) => {
  console.log('🔧 Direct toast call - Logging instead of DOM manipulation');
  const logPrefix = options.variant === "destructive" ? "❌" : "✅";
  console.log(`${logPrefix} TOAST:`, options.title, options.description);
};
