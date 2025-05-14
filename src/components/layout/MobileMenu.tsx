'use client'

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { NavigationItem } from '@/config/navigation'; // Assuming this type export exists
import { Logo } from '@/components/ui/Logo';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  // Optional: for focus return
  triggerRef?: React.RefObject<HTMLButtonElement>; 
}

export function MobileMenu({
  isOpen,
  onClose,
  navigationItems,
  triggerRef,
}: MobileMenuProps) {
  const router = useRouter();
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useClickOutside(menuPanelRef, () => {
    if (isOpen) {
      onClose();
    }
  });

  useEscapeKey(() => {
    if (isOpen) {
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen) {
      // Focus the menu panel when it opens
      menuPanelRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'auto';
      // Return focus to the trigger button if available
      triggerRef?.current?.focus();
    }
    // Cleanup function to restore scroll on unmount if menu was open
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, triggerRef]);
  
  const handleNavigation = (href: string) => {
    router.push(href);
    // Close menu with a short delay to ensure navigation starts
    // Also, reset dropdown state
    setTimeout(() => {
      onClose();
      setOpenDropdown(null);
    }, 50); // Adjusted delay slightly
  };

  const handleDropdownToggle = (itemName: string) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
      <div 
        className="fixed inset-0 bg-gray-900/80" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        ref={menuPanelRef}
        tabIndex={-1} // Make it focusable
        className="fixed inset-y-0 right-0 z-[101] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
      >
        <div className="flex items-center justify-between">
          <span id="mobile-menu-title" className="sr-only">Mobile Navigation Menu</span>
          <Link href="/" onClick={onClose}> {/* Logo click should also close */} 
            <Logo />
          </Link>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            onClick={onClose}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 flow-root">
          <div className="-my-6 divide-y divide-gray-500/10">
            <div className="space-y-2 py-6">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.subItems ? (
                    <div>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                        onClick={() => handleDropdownToggle(item.name)}
                        aria-expanded={openDropdown === item.name}
                        // Consider aria-controls if dropdown content has an ID
                      >
                        {item.name}
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                          openDropdown === item.name ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      {openDropdown === item.name && (
                        <div className="mt-2 space-y-2 pl-4">
                          {item.subItems.map((subItem) => (
                            <button
                              key={subItem.name}
                              className="block w-full text-left rounded-lg px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                              onClick={() => handleNavigation(subItem.href)}
                            >
                              <div className="font-semibold">{subItem.name}</div>
                              {subItem.description && <div className="text-xs text-gray-500">{subItem.description}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : item.external ? (
                    <a
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose} // Close menu on external link click
                    >
                      {item.name}
                    </a>
                  ) : (
                    <button
                      className={`-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                        item.highlight 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'text-gray-900 hover:bg-gray-50 hover:text-green-600'
                      } transition-colors duration-200`}
                      onClick={() => handleNavigation(item.href)}
                    >
                      {item.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 