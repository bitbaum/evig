"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ShopLogoProps {
  href?: string;
  className?: string;
}

/**
 * ShopLogo - Responsive logo for the shop header
 * Shows only the yellow chip icon on mobile, full logo on desktop
 */
export function ShopLogo({ href = "/shop/medusa", className }: ShopLogoProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "group flex-shrink-0 transition-transform hover:scale-105",
        className
      )}
    >
      {/* Mobile: Icon only */}
      <Image
        src="/images/logo/revampit-favicon.png"
        alt="RevampIT"
        width={40}
        height={40}
        className="h-9 w-9 sm:hidden object-contain"
        priority
      />
      
      {/* Desktop: Full logo */}
      <Image
        src="/images/logo/revampit-logo.png"
        alt="RevampIT"
        width={200}
        height={48}
        className="hidden sm:block h-10 w-auto object-contain"
        priority
      />
    </Link>
  );
}




