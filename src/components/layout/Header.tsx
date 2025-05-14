'use client'

import { useState, useRef } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { mainNavigation, NavigationItem } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { useDetectScroll } from '@/lib/hooks/useDetectScroll'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { MobileMenu } from './MobileMenu'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null)
  
  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null)

  const isScrolled = useDetectScroll(20)

  useClickOutside(desktopDropdownRef, () => setOpenDesktopDropdown(null))
  
  useEscapeKey(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false)
    } else if (openDesktopDropdown) {
      setOpenDesktopDropdown(null)
    }
  })

  const handleOpenMobileMenu = () => {
    setMobileMenuOpen(true)
  }

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              ref={mobileMenuTriggerRef}
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={handleOpenMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-panel"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div ref={desktopDropdownRef} className="hidden lg:flex lg:gap-x-12">
            {mainNavigation.map((item) => (
              <div key={item.name} className="relative">
                {item.subItems ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setOpenDesktopDropdown(item.name)}
                    onMouseLeave={() => setOpenDesktopDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-green-600 transition-colors duration-200"
                      aria-expanded={openDesktopDropdown === item.name}
                    >
                      {item.name}
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                        openDesktopDropdown === item.name ? 'rotate-180' : ''
                        }`} 
                      />
                    </Link>
                    {openDesktopDropdown === item.name && (
                      <div className="absolute right-0 top-full z-10 mt-3 w-56 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block rounded-lg px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                            onClick={() => setOpenDesktopDropdown(null)}
                          >
                            <div className="font-semibold">{subItem.name}</div>
                            {subItem.description && <div className="text-xs text-gray-500">{subItem.description}</div>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : item.external ? (
                  <a
                    href={item.href}
                    className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600 transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`text-sm font-semibold leading-6 ${
                      item.highlight 
                        ? 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700' 
                        : 'text-gray-900 hover:text-green-600'
                    } transition-colors duration-200`}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      </header>
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={handleCloseMobileMenu} 
        navigationItems={mainNavigation}
        triggerRef={mobileMenuTriggerRef}
      />
    </>
  )
} 