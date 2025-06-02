import { Metadata } from 'next'
import { 
  Brain, 
  Shield, 
  Server, 
  Database, 
  Lock, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  FileText,
  Search,
  BarChart3,
  Globe,
  AlertTriangle,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Building,
  Scale,
  Briefcase,
  Leaf,
  Code,
  Heart
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sustainable Enterprise AI Solutions | RevampIT',
  description: 'Open-source, sovereign AI systems for professional firms. Sustainable, private, and GDPR-compliant AI that keeps your data secure and supports digital sovereignty.',
  openGraph: {
    title: 'Sustainable Enterprise AI Solutions | RevampIT',
    description: 'Open-source, sovereign AI systems for professional firms. Sustainable, private, and GDPR-compliant AI that keeps your data secure and supports digital sovereignty.',
    type: 'website',
    url: 'https://revampit.org/services/enterprise-ai-solutions',
  },
}

const coreValues = [
  {
    title: 'Digital Sovereignty',
    description: 'Complete control over your AI infrastructure and data. No dependency on foreign tech giants.',
    icon: Shield,
    color: 'green'
  },
  {
    title: 'Open Source Foundation',
    description: 'Built on transparent, auditable open-source technologies. No vendor lock-in, full transparency.',
    icon: Code,
    color: 'green'
  },
  {
    title: 'Sustainable Computing',
    description: 'Energy-efficient AI that scales responsibly. Optimized for minimal environmental impact.',
    icon: Leaf,
    color: 'green'
  }
]

const painPoints = [
  {
    pain: 'Sensitive data can\'t leave your organization\'s secure environment',
    solution: '100% self-hosted open-source AI stack with complete data sovereignty',
    benefit: 'Zero external AI service dependencies ✓ Full GDPR/compliance control',
    icon: Shield
  },
  {
    pain: 'Teams waste hours searching through institutional knowledge',
    solution: 'RAG-powered intelligent search across all your documents and data',
    benefit: 'Expert-grade answers from your own data in seconds',
    icon: Search
  },
  {
    pain: 'No internal AI expertise or resources to deploy enterprise solutions',
    solution: 'Complete "done-for-you" deployment, training, and ongoing support',
    benefit: 'Focus on your core mission while we handle the AI infrastructure',
    icon: Users
  }
]

const technicalStack = [
  {
    component: 'AI Model',
    technology: 'Open Source Large Language Models',
    description: 'State-of-the-art open models like Llama 3, optimized for commercial deployment with full sovereignty',
    icon: Brain,
    features: ['No proprietary dependencies', 'Commercial licensing included', 'Efficient quantization techniques']
  },
  {
    component: 'Compute Infrastructure',
    technology: 'Flexible Cloud or On-Premises',
    description: 'Scalable GPU infrastructure that adapts to your needs and compliance requirements',
    icon: Cpu,
    features: ['On-demand scaling', 'Cost-optimized deployment', 'Client-controlled environment']
  },
  {
    component: 'Vector Database',
    technology: 'Open Source Vector Store',
    description: 'Transparent, license-free vector database solutions with no vendor dependencies',
    icon: Database,
    features: ['No vendor lock-in', 'Auditable source code', 'Scalable architecture']
  },
  {
    component: 'RAG Framework',
    technology: 'Open Source Retrieval System',
    description: 'Advanced document processing and retrieval using transparent, open-source frameworks',
    icon: FileText,
    features: ['Intelligent document processing', 'Contextual understanding', 'Full source transparency']
  },
  {
    component: 'Automation',
    technology: 'Open Workflow Orchestration',
    description: 'Transparent workflow automation with full visibility into processing logic',
    icon: Network,
    features: ['Open-source workflows', 'Auditable processes', 'Custom integrations']
  },
  {
    component: 'User Interface',
    technology: 'Secure Open Web Stack',
    description: 'Modern, secure web interface built on open standards with complete transparency',
    icon: Eye,
    features: ['Open web standards', 'Transparent security', 'Full audit trails']
  }
]

const pricingTiers = [
  {
    name: 'Starter Setup',
    duration: '2-3 weeks',
    description: 'Perfect for small teams and proof of concept',
    price: 'CHF 12,000 - 18,000',
    features: [
      'RTX 4090 workstation or small server setup',
      'Llama 3.1 8B model with basic fine-tuning',
      'Basic document processing (up to 5,000 docs)',
      'Simple web interface',
      'Basic training and documentation'
    ],
    highlight: 'Great entry point',
    note: 'Ongoing: CHF 450-800/month depending on hosting'
  },
  {
    name: 'Professional Deployment',
    duration: '4-6 weeks',
    description: 'Full-featured AI system for growing businesses',
    price: 'CHF 30,000 - 45,000',
    features: [
      'Professional server with RTX 4090 Ti or dual GPUs',
      'Llama 3.1 13B-70B models',
      'Advanced document processing (up to 25,000 docs)',
      'Custom integrations and API access',
      'Comprehensive training & support'
    ],
    highlight: 'Most popular',
    popular: true,
    note: 'Ongoing: CHF 1,200-2,800/month'
  },
  {
    name: 'Enterprise Solution',
    duration: '6-10 weeks',
    description: 'Large-scale deployment with enterprise features',
    price: 'CHF 60,000 - 100,000',
    features: [
      'Enterprise-grade A100/H100 infrastructure',
      'Custom fine-tuned Llama 3.1 70B+ models',
      'Unlimited document processing',
      'Advanced security and compliance features',
      'Dedicated support and SLA'
    ],
    highlight: 'Maximum performance',
    note: 'Ongoing: CHF 4,200-8,000/month'
  }
]

const industries = [
  {
    name: 'Legal Firms',
    description: 'Contract analysis, precedent search, and legal document summarization',
    icon: Scale,
    useCases: [
      'Contract clause analysis',
      'Legal precedent search',
      'Document summarization',
      'Compliance checking'
    ]
  },
  {
    name: 'Financial Services',
    description: 'Risk analysis, regulatory compliance, and financial document processing',
    icon: BarChart3,
    useCases: [
      'Risk assessment reports',
      'Regulatory compliance',
      'Financial document analysis',
      'Investment research'
    ]
  },
  {
    name: 'Pharmaceutical & Life Sciences',
    description: 'Research acceleration, drug discovery support, and regulatory documentation',
    icon: Building,
    useCases: [
      'Scientific literature analysis',
      'Clinical trial documentation',
      'Regulatory submission support',
      'Research synthesis and insights'
    ]
  },
  {
    name: 'Healthcare Institutions',
    description: 'Medical record analysis, research summarization, and clinical decision support',
    icon: Heart,
    useCases: [
      'Medical record analysis',
      'Research paper summarization',
      'Clinical documentation',
      'Treatment protocol search'
    ]
  },
  {
    name: 'Non-Profit Organizations',
    description: 'Grant research, impact documentation, and knowledge management',
    icon: Users,
    useCases: [
      'Grant opportunity research',
      'Impact measurement reporting',
      'Donor communication',
      'Policy analysis and advocacy'
    ]
  },
  {
    name: 'Research Institutions',
    description: 'Academic research acceleration, literature review, and knowledge synthesis',
    icon: Brain,
    useCases: [
      'Literature review automation',
      'Research proposal development',
      'Academic collaboration',
      'Knowledge discovery'
    ]
  },
  {
    name: 'Manufacturing & Engineering',
    description: 'Technical documentation, quality assurance, and process optimization',
    icon: Briefcase,
    useCases: [
      'Technical manual search',
      'Quality control documentation',
      'Process optimization insights',
      'Regulatory compliance'
    ]
  },
  {
    name: 'Consulting Firms',
    description: 'Knowledge management, proposal generation, and client research',
    icon: Briefcase,
    useCases: [
      'Knowledge base search',
      'Proposal automation',
      'Client research',
      'Best practice identification'
    ]
  }
]

const timeline = [
  { week: 1, milestone: 'Infrastructure assessment, security setup, and environment preparation' },
  { week: 2, milestone: 'Open-source AI model deployment and performance optimization' },
  { week: 3, milestone: 'Vector database setup and document ingestion pipeline' },
  { week: 4, milestone: 'Secure web interface deployment and authentication integration' },
  { week: 5, milestone: 'Workflow automation and system integration setup' },
  { week: 6, milestone: 'User acceptance testing, training, and knowledge transfer' }
]

const riskMitigation = [
  {
    risk: 'AI Hallucinations',
    mitigation: 'JSON output guardrails + reference snippets, show sources. Users verify all outputs.',
    icon: AlertTriangle
  },
  {
    risk: 'Regulatory Changes',
    mitigation: 'Stick to on-premises/client-chosen cloud, sign DPA with no sub-processors.',
    icon: Shield
  },
  {
    risk: 'Cost Overruns',
    mitigation: 'Auto-scale GPU pods off at night; vLLM KV-cache reuse keeps cold-start cheap.',
    icon: BarChart3
  },
  {
    risk: 'Competition (In-house)',
    mitigation: 'Offer source-code escrow; still cheaper than hiring 2 AI engineers.',
    icon: Users
  }
]

// Add case study section
const deploymentExamples = [
  {
    title: 'Small Consulting Firm',
    description: 'Document search and basic analysis',
    scale: '2-5 employees',
    documents: '1,000-5,000',
    responseTime: '8-15 seconds',
    infrastructure: 'RTX 4090 24GB workstation',
    model: 'Llama 3.1 8B (4-bit quantization)',
    cost: 'CHF 450/month',
    deployment: 'Local workstation setup'
  },
  {
    title: 'Mid-Size Law Firm',
    description: 'Contract analysis and legal research',
    scale: '10-25 employees',
    documents: '10,000-25,000',
    responseTime: '5-10 seconds',
    infrastructure: 'RTX 4090 Ti 24GB server',
    model: 'Llama 3.1 13B (INT8 quantization)',
    cost: 'CHF 1,200/month',
    deployment: 'Dedicated server on-premises'
  },
  {
    title: 'Research Institution',
    description: 'Scientific literature analysis',
    scale: '50+ employees',
    documents: '25,000+',
    responseTime: '3-8 seconds',
    infrastructure: '2× RTX 4090 or 1× A100 80GB',
    model: 'Llama 3.1 70B (INT8 quantization)',
    cost: 'CHF 2,800/month',
    deployment: 'High-performance server or cloud'
  },
  {
    title: 'Large Enterprise',
    description: 'Complex document processing and analysis',
    scale: '100+ employees',
    documents: '50,000+',
    responseTime: '2-5 seconds',
    infrastructure: '2× A100 80GB or H100',
    model: 'Llama 3.1 70B + specialized fine-tuning',
    cost: 'CHF 4,200/month',
    deployment: 'Enterprise cloud or on-premises'
  }
]

const technicalImplementation = {
  title: 'How Our Sustainable AI Infrastructure Works',
  description: 'A complete technical overview of our sovereign AI deployment process and technology choices',
  steps: [
    {
      phase: 'Infrastructure Setup',
      duration: '2-3 weeks',
      description: 'We deploy GPU infrastructure in your chosen environment with proper security and networking configuration',
      technical: 'NVIDIA A100/H100 GPUs, containerized deployment via Docker/Kubernetes, network security setup',
      sustainability: 'Efficient quantization and optimized inference reduce computational requirements vs. unoptimized deployments'
    },
    {
      phase: 'Open Source AI Stack',
      duration: '1-2 weeks',
      description: 'Deploy and optimize open-source large language models with no proprietary dependencies',
      technical: 'Llama 3.1 (8B-70B), vLLM inference engine, INT8 quantization, model optimization',
      sustainability: 'Open source ensures longevity, transparency, and no vendor lock-in'
    },
    {
      phase: 'Data Processing Pipeline',
      duration: '2-3 weeks',
      description: 'Implement secure document processing and vector storage with complete data control',
      technical: 'ChromaDB vector database, LlamaIndex RAG pipeline, document preprocessing, embedding generation',
      sustainability: 'Self-hosted ensures data never leaves Switzerland, reducing regulatory compliance complexity'
    },
    {
      phase: 'Integration & Training',
      duration: '3-4 weeks',
      description: 'Custom integrations with your existing systems and comprehensive team training',
      technical: 'RESTful APIs, authentication integration, monitoring setup, comprehensive documentation',
      sustainability: 'Open standards ensure future flexibility and prevent vendor lock-in'
    }
  ]
}

export default function EnterpriseAIPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Sustainable Enterprise AI Solutions',
            'description': 'Open-source, sovereign AI systems for professional firms with complete data privacy, digital sovereignty, and sustainable computing practices.',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'Sustainable Enterprise AI Solutions',
            'areaServed': {
              '@type': 'Country',
              'name': 'Switzerland'
            }
          })
        }}
      />
      <main className="min-h-screen bg-gray-50">
        {/* Coming Soon Banner */}
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-semibold">This service is coming soon. Contact us to express interest and get notified when available.</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl">
              <div className="flex items-center mb-6">
                <Brain className="w-16 h-16 mr-4 text-green-300" />
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-2 leading-tight">Sustainable Enterprise AI</h1>
                  <p className="text-2xl md:text-3xl font-semibold text-green-200">Sovereign • Open Source • Sustainable</p>
                </div>
              </div>
              <p className="text-xl text-green-100 mb-8">
                The future of AI is sustainable sovereign compute. Deploy advanced AI systems that respect your data sovereignty, embrace open-source transparency, and minimize environmental impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg text-center"
                >
                  Express Interest
                </Link>
                <Link
                  href="#case-study"
                  className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg text-center"
                >
                  View Future Plans
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Our Ethos: The Future of Computing</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Sustainable sovereign compute represents a fundamental shift towards responsible AI that respects data sovereignty, embraces transparency, and minimizes environmental impact.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {coreValues.map((value, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 bg-${value.color}-100 rounded-full flex items-center justify-center`}>
                    <value.icon className={`w-10 h-10 text-${value.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Why Sustainable Sovereign AI?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transform your document workflows with AI that aligns with Swiss values of privacy, sustainability, and independence.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {painPoints.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">Challenge</h3>
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">{item.pain}</p>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-green-600 mb-2">Sovereign Solution</h4>
                    <p className="text-gray-700 mb-3">{item.solution}</p>
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span>{item.benefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Open Source Technical Foundation</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Built entirely on transparent, auditable open-source technologies. No proprietary dependencies, no vendor lock-in, complete digital sovereignty.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {technicalStack.map((component, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <component.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{component.component}</h3>
                      <p className="text-green-600 font-medium">{component.technology}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{component.description}</p>
                  <ul className="space-y-2">
                    {component.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section id="case-study" className="py-20 bg-green-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Deployment Examples by Business Size</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Scalable AI solutions from small startups to large enterprises - we have options for every budget and scale.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {deploymentExamples.map((example, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-green-600 mb-2">{example.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{example.scale}</p>
                  <p className="text-gray-600 mb-4">{example.description}</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Documents:</span> {example.documents}</div>
                    <div><span className="font-semibold">Response Time:</span> {example.responseTime}</div>
                    <div><span className="font-semibold">Hardware:</span> {example.infrastructure}</div>
                    <div><span className="font-semibold">Model:</span> {example.model}</div>
                    <div><span className="font-semibold">Deployment:</span> {example.deployment}</div>
                    <div className="text-lg font-bold text-green-600 mt-3">{example.cost}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Hardware Options & Technology Stack</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Hardware Tiers</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Entry Level:</strong> RTX 4090 24GB (excellent price/performance)</li>
                    <li>• <strong>Professional:</strong> RTX 4090 Ti or dual RTX 4090 setups</li>
                    <li>• <strong>Enterprise:</strong> NVIDIA A100 80GB (maximum performance)</li>
                    <li>• <strong>Cutting Edge:</strong> NVIDIA H100 (latest generation)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Software & AI Models</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Small:</strong> Llama 3.1 8B (fast, efficient, budget-friendly)</li>
                    <li>• <strong>Medium:</strong> Llama 3.1 13B (balanced performance)</li>
                    <li>• <strong>Large:</strong> Llama 3.1 70B (maximum capability)</li>
                    <li>• <strong>Deployment:</strong> vLLM, ChromaDB, LlamaIndex</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Start Small, Scale Smart</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-semibold text-green-700">Entry Point</h5>
                    <p className="text-sm text-gray-700">Begin with RTX 4090 setup for CHF 450/month. Perfect for small teams to test and learn.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700">Gradual Scaling</h5>
                    <p className="text-sm text-gray-700">Upgrade hardware and models as your needs grow. No need to start with enterprise-grade equipment.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700">Future-Proof</h5>
                    <p className="text-sm text-gray-700">Open architecture allows seamless upgrades without vendor lock-in or data migration.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industry Applications */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Industry Applications</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our sovereign AI solutions adapt to your industry's specific needs while maintaining complete data sovereignty and compliance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <industry.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{industry.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{industry.description}</p>
                  <div className="space-y-2">
                    {industry.useCases.map((useCase, i) => (
                      <div key={i} className="flex items-center text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Sustainable Investment in Digital Sovereignty</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transparent pricing that reflects our commitment to sustainable, sovereign AI. Scale from proof-of-concept to full production with complete cost visibility.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <div key={index} className={`rounded-xl shadow-lg overflow-hidden ${tier.popular ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'}`}>
                  <div className="p-8">
                    {tier.popular && (
                      <div className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-green-600">{tier.price}</span>
                      <span className="text-gray-500 ml-2">({tier.duration})</span>
                    </div>
                    <div className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block">
                        {tier.highlight}
                      </div>
                      {tier.note && (
                        <p className="text-xs text-gray-500 mt-2">{tier.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <div className="bg-green-50 rounded-xl p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <Leaf className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-2xl font-bold text-green-800">Sustainability Commitment</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Our pricing reflects the true cost of sustainable AI. By choosing energy-efficient models, optimized infrastructure, and transparent open-source technologies, we deliver superior value while minimizing environmental impact. Every deployment contributes to a more sustainable digital future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">8-12 Week Implementation Timeline</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Structured deployment process with clear milestones and deliverables. Timeline varies based on complexity and requirements.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-center bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-2xl font-bold text-green-600">W{item.week}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-2">Week {item.week}</h3>
                      <p className="text-gray-600">{item.milestone}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Risk Mitigation */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Risk Management</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We've identified and mitigated the key risks in enterprise AI deployment.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {riskMitigation.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 mr-4 flex-shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-red-700">Risk: {item.risk}</h3>
                      <p className="text-gray-700">{item.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Implementation */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Technical Implementation Overview</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A complete technical overview of our sovereign AI deployment process and technology choices.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {technicalImplementation.steps.map((step, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{step.phase}</h3>
                        <p className="text-green-600 font-medium">{step.duration}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>{step.technical}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-green-600 font-semibold">Sustainability Impact:</span>
                      <p className="text-gray-700">{step.sustainability}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-12 h-12 mr-4 text-green-300" />
              <Heart className="w-8 h-8 mr-4 text-green-300" />
              <Leaf className="w-10 h-10 text-green-300" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Ready for Sustainable Sovereign AI?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-green-100">
              Join the movement towards digital sovereignty. Deploy AI that respects your data, embraces transparency, and builds a sustainable digital future for Switzerland and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Start Your Sovereign AI Journey
              </Link>
              <Link
                href="/services"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Explore All Services
              </Link>
            </div>
            
            <div className="mt-12 max-w-2xl mx-auto">
              <p className="text-green-200 text-lg italic">
                "Sustainable sovereign compute is not just the future—it's the responsible choice for today."
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
} 