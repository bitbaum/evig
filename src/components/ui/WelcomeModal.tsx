import { Fragment, useEffect, useState } from 'react'
import { X, Wrench } from 'lucide-react'
import { Transition } from '@headlessui/react'
import { Button } from './button'

export function WelcomeModal() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true)
    }
  }, [])

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false)
    localStorage.setItem('hasSeenWelcome', 'true')
  }

  return (
    <>
      <Transition
        show={showWelcomeModal}
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]" />
      </Transition>

      <Transition
        show={showWelcomeModal}
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="fixed inset-0 z-[81] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  onClick={handleCloseWelcomeModal}
                >
                  <span className="sr-only">Schliessen</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Wrench className="h-6 w-6 text-green-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Willkomme uf üserer neue Website!
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Mir schaffed grad a de neue Version vo RevampIt. Du chasch entweder üsi aktuelli Website bsueche oder die neui Version erkunde.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <a
                  href="https://revamp-it.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                >
                  Aktuelli Website bsueche
                </a>
                <Button
                  variant="outline"
                  onClick={handleCloseWelcomeModal}
                  className="mt-3 sm:mt-0 sm:w-auto"
                >
                  Neui Version erkunde
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </>
  )
} 