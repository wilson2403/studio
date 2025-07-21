
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { SVGProps } from "react";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <Image
        src="/logo.png"
        alt="El Arte de Sanar Logo"
        width={100}
        height={100}
        className={cn("h-12 w-12", className)}
        priority
    />
  );
}
