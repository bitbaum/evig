import { Metadata } from 'next'
import { Calendar, Clock, Users, ArrowRight, Sparkles, CheckCircle2, Briefcase, Rocket } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { WorkshopCard, Workshop } from '@/components/workshops/WorkshopCard'

export const metadata: Metadata = {
  title: 'Our Workshops | RevampIT',
  description: 'Join our expert-led workshops on Linux, Open Source Software, and Computer Repair. More workshops coming soon!'
}

const workshops: Workshop[] = [
  {
    title: 'Linux Workshop',
    description: 'Master the Linux operating system from basics to advanced topics. Learn about system administration, command line tools, and open-source software management.',
    icon: '🐧',
    duration: '2 days',
    level: 'Beginner to Intermediate',
    category: 'Operating Systems',
    isAvailable: true,
    outcomes: [
      'Set up and manage Linux servers with confidence',
      'Automate system tasks with powerful shell scripting',
      'Troubleshoot common Linux issues like a pro',
      'Secure your Linux environment effectively'
    ]
  },
  {
    title: 'Open Source Software',
    description: 'Explore the world of open-source software development. Learn about contributing to open-source projects, licensing, and community collaboration.',
    icon: '🔓',
    duration: '1 day',
    level: 'All Levels',
    category: 'Development',
    isAvailable: true,
    outcomes: [
      'Make your first open-source contribution',
      'Navigate licensing and compliance confidently',
      'Build a strong developer portfolio',
      'Join and thrive in open-source communities'
    ]
  },
  {
    title: 'Computer Repair',
    description: 'Learn essential hardware repair and maintenance skills. From basic troubleshooting to component replacement, become confident in fixing computer issues.',
    icon: '🔧',
    duration: '2 days',
    level: 'Beginner',
    category: 'Hardware',
    isAvailable: true,
    outcomes: [
      'Diagnose and fix common hardware issues confidently',
      'Upgrade and maintain computers professionally',
      'Build custom PC configurations from scratch',
      'Start your own computer repair business'
    ]
  },
  {
    title: 'Bitcoin & Blockchain',
    description: 'Understand the fundamentals of Bitcoin, blockchain technology, and cryptocurrency. Learn about wallets, transactions, and the future of digital currencies.',
    icon: '₿',
    duration: '1 day',
    level: 'Beginner',
    category: 'Blockchain',
    isAvailable: false,
    comingSoon: true
  },
  {
    title: 'Artificial Intelligence',
    description: 'Dive into the world of AI and machine learning. Learn about neural networks, data processing, and practical applications of AI technology.',
    icon: '🤖',
    duration: '2 days',
    level: 'Intermediate',
    category: 'AI & ML',
    isAvailable: false,
    comingSoon: true
  },
  {
    title: 'Vibe Coding',
    description: 'Transform ideas into shipping prototypes using AI-powered coding workflows and modern tech stack. Build a complete Next.js + Supabase MVP through hands-on sessions.',
    icon: '🎨',
    duration: '4 sessions',
    level: 'Beginner to Intermediate',
    category: 'Creative',
    isAvailable: false,
    comingSoon: true
  }
]

const benefits = [
  {
    title: 'Hands-on Learning',
    description: 'Get practical experience with real-world examples and guided practice sessions',
    icon: Rocket
  },
  {
    title: 'Learn at Your Pace',
    description: 'Comfortable learning environment with patient, experienced instructors who adapt to your needs',
    icon: Briefcase
  },
  {
    title: 'Explore New Tech',
    description: 'Discover and master different areas of technology that interest you most',
    icon: Users
  }
]

const WorkshopsPage: React.FC = () => {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Master Tech Skills, Build Your Future</h1>
            <p className="text-xl text-green-100 mb-8">
              Transform your curiosity into practical expertise with our hands-on workshops. From Linux mastery to computer repair, learn directly from industry experts in a supportive environment. No prior experience needed - just bring your enthusiasm!
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Users className="w-5 h-5 mr-2" />
                <span>Expert-Led Sessions</span>
              </div>
              <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Clock className="w-5 h-5 mr-2" />
                <span>Hands-on Practice</span>
              </div>
              <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Flexible Learning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Why Choose Our Workshops?</h2>
            <p className="text-lg text-gray-600">
              Our workshops are designed to give you real-world skills that you can use immediately. Whether you're looking to advance your career, start a new one, or simply understand technology better, we provide the practical knowledge and hands-on experience you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors duration-300">
                <benefit.icon className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Workshops */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Currently Available Workshops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workshops.filter(w => w.isAvailable).map((workshop, index) => (
              <WorkshopCard key={index} workshop={workshop} variant="available" />
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Workshops */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Coming Soon</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're constantly expanding our workshop offerings. Here's what we're working on next. Stay tuned for announcements!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workshops.filter(w => w.comingSoon).map((workshop, index) => (
              <WorkshopCard key={index} workshop={workshop} variant="coming-soon" />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">What Our Participants Say</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl">
              <p className="text-gray-600 mb-4">"The Linux workshop was a great introduction to the operating system. The hands-on approach and patient instructors made it easy to understand the basics and build confidence with the command line."</p>
              <div className="font-semibold">- G.B., Workshop Participant</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Explore Tech?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Join our workshops and discover the practical side of technology. Learn at your own pace in a supportive environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Register for a Workshop
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default WorkshopsPage 