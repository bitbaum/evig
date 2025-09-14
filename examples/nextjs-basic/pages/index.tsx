import { useState } from 'react'
import { SuggestionWidget, AINativeCMSProvider } from '@ai-native-cms/react'
import { createDefaultConfig } from '@ai-native-cms/core'
import '@ai-native-cms/react/styles'

// Configure AI-Native CMS
const cmsConfig = createDefaultConfig({
  name: 'My Next.js Website',
  domain: 'localhost:3000',
  framework: 'nextjs',
  aiProvider: 'template'
})

// Override with production settings
cmsConfig.storage = {
  adapter: 'postgres', // Use PostgreSQL in production
  config: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ai_cms',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  }
}

cmsConfig.notifications = {
  providers: [
    {
      name: 'console',
      config: { verbose: true },
      enabled: process.env.NODE_ENV === 'development'
    },
    {
      name: 'email',
      config: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM || 'AI CMS <noreply@example.com>',
        to: process.env.EMAIL_TO?.split(',') || ['admin@example.com']
      },
      enabled: !!process.env.EMAIL_USER
    }
  ]
}

export default function HomePage() {
  const [feedback, setFeedback] = useState<string>('')

  return (
    <AINativeCMSProvider 
      config={cmsConfig}
      onInitialized={(cms) => {
        console.log('AI-Native CMS initialized!', cms)
      }}
      onError={(error) => {
        console.error('CMS initialization failed:', error)
        setFeedback('CMS initialization failed. Using fallback mode.')
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  My Next.js Website
                </h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-500 hover:text-gray-900">Home</a>
                <a href="#about" className="text-gray-500 hover:text-gray-900">About</a>
                <a href="#services" className="text-gray-500 hover:text-gray-900">Services</a>
                <a href="#contact" className="text-gray-500 hover:text-gray-900">Contact</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to AI-Native CMS
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              This website is powered by AI-Native CMS. Click the suggestion button to propose changes,
              and our AI will generate implementation instructions for developers!
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a
                  href="#demo"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  Try It Out
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* About Section */}
        <section id="about" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
                About Us
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Revolutionary Content Management
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                AI-Native CMS transforms how websites are maintained. Instead of complex admin panels,
                users suggest changes in plain English, and AI generates technical implementation steps.
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      🤖
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      AI-Powered Instructions
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Convert user suggestions into detailed, actionable instructions for AI agents like Claude Code or Cursor.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      ⚡
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      Lightning Fast
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Modular architecture with pluggable storage adapters and notification providers for maximum performance.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      🎯
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      Framework Agnostic
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Works with Next.js, React, Vue, or any web framework. Smart templates adapt to your tech stack.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      🔒
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      Enterprise Ready
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Built-in rate limiting, multiple notification channels, and robust error handling for production use.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
                Services
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                What We Offer
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Web Development</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Modern, responsive websites built with the latest technologies and best practices.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">AI Integration</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Seamlessly integrate AI capabilities into your existing workflow and applications.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">CMS Solutions</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Revolutionary content management systems that work with AI agents for effortless updates.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Consultation</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Expert advice on technology choices, architecture, and implementation strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-12 bg-indigo-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white">
                Try AI-Native CMS
              </h2>
              <p className="mt-4 text-xl text-indigo-200">
                Click the floating suggestion button to propose a change to this page!
              </p>
              <div className="mt-8">
                <div className="inline-flex rounded-md shadow">
                  <button 
                    onClick={() => {
                      const widget = document.querySelector('.ai-cms-suggestion-button') as HTMLElement
                      if (widget) widget.click()
                    }}
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                  >
                    Open Suggestion Widget
                  </button>
                </div>
              </div>

              {feedback && (
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                  {feedback}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
                Contact
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Get In Touch
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Ready to make your website AI-native? Contact us to learn more!
              </p>
            </div>

            <div className="mt-10 max-w-lg mx-auto">
              <form className="grid grid-cols-1 gap-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-400">
              <p>&copy; 2024 AI-Native CMS Example. All rights reserved.</p>
              <p className="mt-2 text-sm">
                Powered by{' '}
                <a href="https://github.com/your-org/ai-native-cms" className="text-indigo-400 hover:text-indigo-300">
                  AI-Native CMS
                </a>
              </p>
            </div>
          </div>
        </footer>

        {/* AI-Native CMS Suggestion Widget */}
        <SuggestionWidget
          config={cmsConfig}
          onSubmit={async (suggestion) => {
            console.log('Suggestion submitted:', suggestion)
            setFeedback('Thank you! Your suggestion has been submitted.')
            setTimeout(() => setFeedback(''), 5000)
          }}
          onError={(error) => {
            console.error('Suggestion failed:', error)
            setFeedback('Sorry, there was an error submitting your suggestion.')
            setTimeout(() => setFeedback(''), 5000)
          }}
          placeholder="What would you like to change on this page? E.g., 'Make the header bigger', 'Add a blog section', 'Change the color scheme'..."
        />
      </div>
    </AINativeCMSProvider>
  )
}