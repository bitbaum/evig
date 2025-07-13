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
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Header() {
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <Logo />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {mainNavigation.map((item) => (
                <div key={item.name} className="relative">
                                  <DropdownTrigger
                    id={item.name.toLowerCase()}
                    href={item.href}
                    hasDropdown={!!item.subItems}
                    isMultiColumn={item.isMultiColumn}
                    className={cn(
                      // Special styling for highlight items (Contact)
                      item.highlight && [
                        "bg-gradient-to-r from-green-600 to-green-700",
                        "text-white hover:text-white",
                        "shadow-lg hover:shadow-xl",
                        "hover:from-green-700 hover:to-green-800",
                        "transform hover:scale-105"
                      ],
                      // External link styling
                      item.external && [
                        "text-blue-600 hover:text-blue-700",
                        "hover:bg-blue-50/80"
                      ]
                    )}
                  >
                    <span className="relative z-10">
                      {item.name}
                    </span>
                  </DropdownTrigger>
                  
                  {/* Dropdown Menu */}
                  {item.subItems && (
                    <MultiColumnDropdown
                      id={item.name.toLowerCase()}
                      items={item.subItems}
                      isMultiColumn={item.isMultiColumn}
                      dropdownAlignment={item.dropdownAlignment}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <Button
              ref={mobileMenuTriggerRef}
              variant="ghost"
              className="md:hidden"
              onClick={handleOpenMobileMenu}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </nav>
        </div>
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