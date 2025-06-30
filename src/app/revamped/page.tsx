import { Metadata } from 'next'
import { 
  Award,
  Shield,
  Sparkles,
  Recycle,
  Star,
  CheckCircle2,
  Leaf,
  ArrowRight,
  Globe,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'REVAMPED Certification | Sustainable Computer Builds | RevampIT',
  description: 'Learn about our exclusive REVAMPED certification - guaranteeing sustainability, quality, and performance in every computer we build.',
  keywords: [
    'revamped certification',
    'sustainable computer certification',
    'green computing label',
    'eco-friendly computer build',
    'computer sustainability score',
    'circular economy computing',
    'refurbished computer certification',
    'used computer parts quality',
    'environmental computer standards',
    'sustainable technology certification'
  ],
  openGraph: {
    title: 'REVAMPED Certification | Sustainable Computer Builds | RevampIT',
    description: 'Discover our exclusive REVAMPED certification - a guarantee of sustainability, quality, and performance that sets a new standard in the computer industry.',
    type: 'website',
    url: 'https://revampit.org/revamped',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REVAMPED Certification | Sustainable Computer Builds',
    description: 'The new standard in sustainable computing - REVAMPED certified computers.',
  }
}

export default function RevampedPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-green-600/30 px-6 py-3 rounded-full mb-6">
              <Award className="w-8 h-8 text-green-200 mr-3" />
              <span className="text-2xl font-bold text-white">REVAMPED</span>
              <Sparkles className="w-6 h-6 text-green-200 ml-2" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              The REVAMPED Certification
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Every computer we build receives our exclusive "REVAMPED" label - a guarantee of sustainability, quality, and performance that sets a new standard in the industry.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Recycle className="w-4 h-4 mr-2" />
                Sustainability Focus
              </div>
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 mr-2" />
                Quality Warranty
              </div>
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Star className="w-4 h-4 mr-2" />
                AI-Optimized Builds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image with Real Revamped Laptop */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Real REVAMPED Computers in Action
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Sustainable technology that people love to use. Our REVAMPED certification isn't just a promise—it's a visible commitment to quality and environmental responsibility.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Primarily used and refurbished components</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Significant environmental impact reduction</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Quality warranty on every build</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Physical certification sticker included</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/services/build-your-computer"
                    className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Build Your Computer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <a
                    href="#certificate"
                    className="inline-block border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                  >
                    Learn About Certification
                  </a>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/images/certification/revamped-laptop-user.jpg" 
                    alt="Woman with pink hair using a laptop with REVAMPED certification sticker"
                    className="w-full h-auto object-cover"
                  />
                  {/* Small badge in top corner - away from sticker area */}
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      REVAMPED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Revamped Means */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">What "REVAMPED" Means</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our certification isn't just a label - it's a comprehensive standard that ensures every computer meets our strict criteria for sustainability, quality, and performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <Recycle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Sustainability First</h3>
                <p className="text-gray-600 leading-relaxed">
                  We prioritize used and refurbished components wherever possible, dramatically reducing environmental impact while maintaining peak performance. We follow circular economy principles in every build.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Quality Guaranteed</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every component is thoroughly tested, cleaned, and verified to meet our strict performance and reliability standards. Quality is never compromised for sustainability.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
                  <Star className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI-Optimized</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our AI ensures perfect component compatibility and optimal performance matching for your specific use case. Every build is intelligently designed for your needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate of Authenticity */}
      <section id="certificate" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Certificate of Authenticity</h2>
                <p className="text-xl text-gray-600 mb-8">
                  Each REVAMPED computer comes with a detailed certificate that provides complete transparency about your sustainable build.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Component sustainability scores</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">CO₂ emissions saved vs new build</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Component origin and condition</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Performance benchmarks</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Warranty coverage details</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-12 rounded-2xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-6">
                    <div className="text-center">
                      <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-green-800">REVAMPED</div>
                      <div className="text-xs text-gray-600">CERTIFIED</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Digital & Physical</h3>
                  <p className="text-gray-600">
                    Your certificate includes both a physical sticker and a digital QR code for instant verification and detailed component information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticker Gallery */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">The REVAMPED Label Collection</h2>
              <p className="text-xl text-gray-600">
                Each design represents our commitment to sustainable computing and quality assurance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white p-12 rounded-2xl shadow-lg mb-6">
                  <img 
                    src="/images/certification/sticker-1.png" 
                    alt="REVAMPED certification sticker design"
                    className="w-40 h-40 mx-auto object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Original Design</h3>
                <p className="text-gray-600">Clean, professional certification mark that emphasizes our laptop-focused sustainability approach</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-12 rounded-2xl shadow-lg mb-6">
                  <img 
                    src="/images/certification/sticker-2.png" 
                    alt="REVAMPED certification sticker variant"
                    className="w-40 h-40 mx-auto object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Eco Variant</h3>
                <p className="text-gray-600">Enhanced design emphasizing our environmental focus and circular economy principles</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-100 to-blue-100 p-12 rounded-2xl shadow-lg mb-6 relative">
                  <div className="w-40 h-40 mx-auto flex items-center justify-center bg-white rounded-xl shadow-sm">
                    <div className="text-center">
                      <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-green-800">REVAMPED</div>
                      <div className="text-xs text-gray-600">CERTIFIED</div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">NEW</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Digital Certificate</h3>
                <p className="text-gray-600">QR code linked verification system with blockchain-backed authenticity records</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Join the REVAMPED Revolution</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              When you choose a REVAMPED computer, you're not just getting a great machine - you're making a statement about the future of technology. Sustainable, powerful, and built with purpose.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/build-your-computer"
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
              >
                Start Your REVAMPED Build
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="inline-block border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Learn More About Certification
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 