import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image 
        src="/__ps-images__/e0775d71-50e5-4f46-817c-0b3f87309995.png" 
        alt="El Arte de Sanar Logo" 
        width={100}
        height={100}
        className="object-contain"
        priority
      />
    </div>
  );
}
