'use client'

import { useState, useRef } from 'react'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { mainNavigation } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { useDetectScroll } from '@/lib/hooks/useDetectScroll'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { MobileMenu } from './MobileMenu'
import { WelcomeModal } from '@/components/ui/WelcomeModal'
import { DropdownTrigger } from '@/components/ui/DropdownTrigger'
import { MultiColumnDropdown } from '@/components/ui/MultiColumnDropdown'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const isScrolled = useDetectScroll(20)

  useClickOutside(headerRef, () => {
    // Context handles dropdown closing
  })

  useEscapeKey(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false)
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
      <WelcomeModal />
      <header 
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1 items-center gap-4">
            <Link href="/">
              <Logo />
            </Link>
            {/* Experimental Site Banner in Swiss German */}
            <div className="hidden sm:flex items-center bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs text-amber-700">
              <div className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium">
                Experimentelli Site - 
                <a 
                  href="https://revampit.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:text-amber-900 underline ml-1 transition-colors"
                >
                  zur aktuelle Site
                </a>
              </span>
            </div>
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
          
          <div className="hidden lg:flex lg:gap-x-12">
            {mainNavigation.map((item) => {
              const hasDropdown = item.subItems && item.subItems.length > 0
              const isMultiColumn = hasDropdown && item.subItems!.some(subItem => subItem.isSection)
              
              return (
                <div key={item.name}>
                  <DropdownTrigger
                    id={item.name}
                    href={item.href}
                    hasDropdown={hasDropdown}
                    isMultiColumn={isMultiColumn}
                    className={item.highlight 
                      ? 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 hover:text-white' 
                      : ''
                    }
                  >
                    {item.name}
                  </DropdownTrigger>
                  
                  {hasDropdown && item.subItems && (
                    <MultiColumnDropdown
                      id={item.name}
                      items={item.subItems}
                    />
                  )}
                </div>
              )
            })}
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