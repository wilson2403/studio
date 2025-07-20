import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image 
        src="/images/logo.png" 
        alt="El Arte de Sanar Logo" 
        width={100}
        height={100}
        className="object-contain"
        priority
      />
    </div>
  );
}
