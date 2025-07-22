
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader } from 'lucide-react';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onPageLoad = () => {
        setLoading(false);
        setTimeout(() => {
            setVisible(false);
        }, 500); // duration of the fade-out animation
    };

    // Check if the page is already loaded
    if (document.readyState === 'complete') {
        onPageLoad();
    } else {
        window.addEventListener('load', onPageLoad);
        // Fallback in case load event doesn't fire
        const fallback_timer = setTimeout(onPageLoad, 5000); 
        return () => {
            window.removeEventListener('load', onPageLoad);
            clearTimeout(fallback_timer);
        }
    }
  }, []);
  
  if (!visible) {
    return null;
  }

  return (
    <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm transition-opacity duration-500",
        loading ? "opacity-100" : "opacity-0"
    )}>
      <Loader className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
