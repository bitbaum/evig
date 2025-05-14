'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { mainNavigation } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { createPortal } from 'react-dom'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const handleDropdownEnter = (itemName: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    setOpenDropdown(itemName)
  }

  const handleDropdownLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 200) // Small delay to prevent accidental closures
  }

  const MobileMenu = () => {
    if (!mounted) return null

    return createPortal(
      <div className="fixed inset-0 z-[100] lg:hidden">
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 right-0 z-[101] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Logo />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {mainNavigation.map((item) => (
                  <div key={item.name}>
                    {item.subItems ? (
                      <div>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                          onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                        >
                          {item.name}
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                            openDropdown === item.name ? 'rotate-180' : ''
                          }`} />
                        </button>
                        {openDropdown === item.name && (
                          <div className="mt-2 space-y-2 pl-4">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className="block rounded-lg px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                                onClick={() => {
                                  setMobileMenuOpen(false)
                                  setOpenDropdown(null)
                                }}
                              >
                                <div className="font-semibold">{subItem.name}</div>
                                <div className="text-xs text-gray-500">{subItem.description}</div>
                              </Link>
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
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${
                          item.highlight 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'text-gray-900 hover:bg-gray-50 hover:text-green-600'
                        } transition-colors duration-200`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
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
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div ref={dropdownRef} className="hidden lg:flex lg:gap-x-12">
            {mainNavigation.map((item) => (
              <div key={item.name} className="relative">
                {item.subItems ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(item.name)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-green-600 transition-colors duration-200"
                      aria-expanded={openDropdown === item.name}
                    >
                      {item.name}
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        openDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </Link>
                    {openDropdown === item.name && (
                      <div className="absolute right-0 top-full z-10 mt-3 w-56 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-900/5">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block rounded-lg px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                          >
                            <div className="font-semibold">{subItem.name}</div>
                            <div className="text-xs text-gray-500">{subItem.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  item.external ? (
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
                  )
                )}
              </div>
            ))}
          </div>
        </nav>
      </header>
      {mobileMenuOpen && <MobileMenu />}
    </>
  )
} 