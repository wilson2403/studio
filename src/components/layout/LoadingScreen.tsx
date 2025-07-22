'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 100;
        }
        // Simulate loading progress
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 100);
    
    const onPageLoad = () => {
        clearInterval(timer);
        setProgress(100);
        setTimeout(() => {
            setVisible(false);
        }, 500); // duration of progress animation
    };

    // Check if the page is already loaded
    if (document.readyState === 'complete') {
        onPageLoad();
    } else {
        window.addEventListener('load', onPageLoad);
        // Fallback in case load event doesn't fire
        const fallback_timer = setTimeout(onPageLoad, 3000); 
        return () => {
            window.removeEventListener('load', onPageLoad);
            clearTimeout(fallback_timer);
        }
    }
    return () => clearInterval(timer);
  }, []);
  
  if (!visible) {
    return null;
  }

  return (
    <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm transition-opacity duration-500",
        progress === 100 ? "opacity-0" : "opacity-100"
    )}>
      <div className="w-1/3">
        <Progress value={progress} className="w-full" />
      </div>
    </div>
  );
}
