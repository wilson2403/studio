import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      role="img" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
      className={cn("h-4 w-4", props.className)}
      fill="currentColor"
    >
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.73 1.9-3.87 0-7-3.13-7-7s3.13-7 7-7c1.94 0 3.36.78 4.34 1.7l2.45-2.45C18.27.75 15.75 0 12.48 0 5.88 0 .49 5.39.49 12s5.39 12 11.99 12c3.41 0 5.92-1.15 7.84-3.08 2.01-2.01 2.62-4.91 2.62-7.37 0-.54-.05-.99-.12-1.42H12.48z"/>
    </svg>
  );
}
