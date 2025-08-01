
'use client';

import { cn } from "@/lib/utils";
import type { SVGProps } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useEditable } from "../home/EditableProvider";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const { content, fetchContent } = useEditable();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const fallbackUrl = 'https://i.postimg.cc/HkWJLSsK/IMG-20250101-WA0004.jpg';

  useEffect(() => {
    fetchContent('logoUrl', fallbackUrl);
  }, [fetchContent]);

  useEffect(() => {
    const value = content['logoUrl'];
    let newUrl = fallbackUrl;
    if (typeof value === 'object' && value !== null) {
      newUrl = (value as any).es || fallbackUrl;
    } else if (typeof value === 'string' && value) {
      newUrl = value;
    }
    
    if (logoUrl !== newUrl) {
      setLogoUrl(newUrl);
    }
  }, [content, fallbackUrl, logoUrl]);

  return (
    <div className={cn("relative h-10 w-10", className)}>
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="El Arte de Sanar Logo"
          fill
          unoptimized
          className={cn("object-contain transition-opacity duration-300 rounded-full", isLoaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}
