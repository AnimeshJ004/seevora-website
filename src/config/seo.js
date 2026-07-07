/**
 * Centralized SEO Configuration for Seevora
 * 
 * This file contains all SEO-related configuration including:
 * - Default meta tags
 * - Business information (NAP - Name, Address, Phone)
 * - Social media profiles
 * - Target keywords
 * - Geographic targeting
 */

export const seoConfig = {
  // Site Information
  siteName: 'Seevora',
  siteUrl: 'https://seevora.in',
  defaultTitle: 'Seevora - Custom AI SaaS for B2B Operations',
  titleTemplate: '%s | Seevora',
  
  // Default Meta Tags
  defaultDescription: 'Seevora builds custom AI SaaS solutions designed to solve real business problems. Turn your business processes into profit centers with enterprise AI automation for healthcare, education, wellness, and more.',
  defaultKeywords: [
    'B2B sales automation',
    'multi-agent AI integration',
    'business model research AI',
    'software merging AI',
    'custom AI ecosystem',
    'AI automation India',
    'WhatsApp business automation',
    'AI receptionist India',
    'custom AI SaaS solutions',
    'Hindi AI voice assistant',
    'healthcare automation India',
    'education academy automation',
    'business process automation',
    'AI for small business India',
    'enterprise AI solutions',
    'Indore AI company',
    'bilingual AI chatbot'
  ],
  
  // Business Information (NAP)
  business: {
    name: 'Seevora',
    legalName: 'Seevora Technologies',
    description: 'Custom AI SaaS solutions for B2B operations across healthcare, education, wellness, diagnostics, fitness, legal, and real estate sectors.',
    email: 'hello@seevora.in',
    phone: '+91-XXXXXXXXXX', // TODO: Add real phone number
    address: {
      streetAddress: 'XXX Business District', // TODO: Add real address
      addressLocality: 'Indore',
      addressRegion: 'Madhya Pradesh',
      postalCode: 'XXXXXX', // TODO: Add postal code
      addressCountry: 'IN'
    },
    // Geographic Service Areas
    serviceAreas: [
      'India',
      'Indore',
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Hyderabad',
      'Chennai',
      'Pune',
      'Ahmedabad'
    ],
    languages: ['English', 'Hindi', 'Hinglish'],
    priceRange: '$$$',
    foundingDate: '2024', // TODO: Update with actual founding date
    numberOfEmployees: '10-50' // TODO: Update with actual range
  },
  
  // Social Media Profiles
  socialProfiles: {
    linkedin: 'https://linkedin.com/company/seevora', // TODO: Add real URL
    twitter: 'https://twitter.com/seevora', // TODO: Add real URL
    facebook: 'https://facebook.com/seevora', // TODO: Add real URL
    instagram: 'https://instagram.com/seevora', // TODO: Add real URL
  },
  
  // Default Open Graph Image
  defaultImage: {
    url: 'https://seevora.in/og-image.png', // TODO: Create and add OG image (1200x630px)
    width: 1200,
    height: 630,
    alt: 'Seevora - AI Automation for Indian Businesses'
  },
  
  // Logo for structured data
  logo: 'https://seevora.in/logo-icon-clean.png',
  
  // Language & Region Targeting
  language: 'en',
  region: 'IN',
  alternateLanguages: [
    { lang: 'en-IN', url: 'https://seevora.in' },
    // Future: Add Hindi version
    // { lang: 'hi-IN', url: 'https://seevora.in/hi' }
  ],
  
  // Business Hours (for LocalBusiness schema)
  openingHours: [
    'Mo-Fr 09:00-18:00',
    'Sa 10:00-16:00'
  ],
  
  // Services Offered (for schema markup)
  services: [
    {
      name: 'Healthcare AI Automation',
      description: '24/7 AI receptionist for clinics, hospitals, and medical practices with Hindi support',
      keywords: ['healthcare AI India', 'clinic automation', 'medical receptionist AI']
    },
    {
      name: 'Education Academy Automation',
      description: 'Automated admission enquiries, demo class booking, and fee reminders for educational institutes',
      keywords: ['education automation India', 'academy management AI', 'admission automation']
    },
    {
      name: 'Personal Care & Wellness Automation',
      description: 'Appointment booking, reminders, and review management for salons, spas, and wellness centers',
      keywords: ['salon automation', 'spa booking AI', 'wellness automation India']
    },
    {
      name: 'Diagnostic & Pathology Automation',
      description: 'Test booking, sample collection scheduling, and automated report delivery for diagnostic labs',
      keywords: ['pathology automation', 'diagnostic lab AI', 'lab management system India']
    },
    {
      name: 'Fitness & Gym Automation',
      description: 'Membership management, class scheduling, and payment reminders for fitness centers',
      keywords: ['gym automation India', 'fitness center AI', 'membership management']
    },
    {
      name: 'Legal & Financial Advisory AI',
      description: 'Document management, appointment scheduling, and client communication for CA and legal firms',
      keywords: ['CA automation India', 'legal practice management', 'financial advisory AI']
    },
    {
      name: 'Real Estate Automation',
      description: 'Property inquiry management, site visit scheduling, and lead nurturing for real estate businesses',
      keywords: ['real estate AI India', 'property management automation', 'real estate CRM']
    }
  ],
  
  // Target Keywords by Priority
  primaryKeywords: [
    'AI automation India',
    'WhatsApp business automation India',
    'AI receptionist for small business'
  ],
  
  secondaryKeywords: [
    'custom AI SaaS',
    'enterprise AI automation',
    'Hindi AI assistant',
    'bilingual chatbot India',
    'voice AI India'
  ],
  
  localKeywords: [
    'AI company Indore',
    'business automation Indore',
    'AI solutions India'
  ]
};

// Page-specific SEO data
export const pagesSEO = {
  home: {
    title: 'Seevora - AI Automation for Indian Businesses | WhatsApp & Voice AI',
    description: 'Deploy custom AI automation in 5 days. 24/7 AI receptionist, WhatsApp automation, and booking systems for healthcare, education, wellness & more. Built for India, speaks Hindi.',
    keywords: [
      'AI automation India',
      'WhatsApp business automation',
      'AI receptionist India',
      'Hindi AI assistant',
      'business process automation India',
      '24/7 AI receptionist',
      'AI for small business India'
    ],
    path: '/',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  services: {
    title: 'AI Automation Services for 7+ Industries',
    description: 'Custom AI solutions for Healthcare, Education, Wellness, Diagnostics, Fitness, Legal & Real Estate. 24/7 voice receptionist, WhatsApp automation, appointment booking. Deployed in 5 days.',
    keywords: [
      'healthcare AI automation India',
      'education automation',
      'wellness automation',
      'diagnostic lab automation',
      'AI services India'
    ],
    path: '/services',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  modules: {
    title: 'AI Automation Modules & Features',
    description: 'Complete AI automation platform with voice receptionist, WhatsApp chat, appointment booking, CRM, analytics & more. All modules integrate seamlessly for maximum efficiency.',
    keywords: [
      'AI modules',
      'automation features',
      'voice receptionist',
      'WhatsApp automation',
      'booking system India'
    ],
    path: '/modules',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  impact: {
    title: 'Real Results from AI Automation',
    description: 'See how businesses achieve 92% reduction in missed calls, 40% fewer no-shows, and 8+ hours saved weekly with Seevora AI automation. Measurable ROI in 90 days.',
    keywords: [
      'AI automation ROI',
      'business automation results',
      'AI impact India',
      'automation case studies'
    ],
    path: '/impact',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  about: {
    title: 'About Seevora - AI Automation Experts in India',
    description: 'Indore-based AI automation company serving businesses across India. We build custom AI solutions that solve real problems for healthcare, education, and service businesses.',
    keywords: [
      'AI company India',
      'AI automation company Indore',
      'about Seevora',
      'AI experts India'
    ],
    path: '/about',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  contact: {
    title: 'Book a Free AI Audit | Contact Seevora',
    description: 'Get a free AI workflow audit from our Indore-based engineering team. Discover how to automate your business processes and reduce costs. Book your call now.',
    keywords: [
      'AI audit free',
      'contact Seevora',
      'book AI consultation',
      'AI automation quote India'
    ],
    path: '/book-a-call',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  faq: {
    title: 'Frequently Asked Questions About AI Automation',
    description: 'Common questions about Seevora AI automation: pricing, setup time, Hindi support, data security, technical requirements & more. Get answers from our AI experts.',
    keywords: [
      'AI automation FAQ',
      'AI receptionist questions',
      'WhatsApp automation help',
      'AI setup India'
    ],
    path: '/faqs',
    image: seoConfig.defaultImage.url,
    type: 'website'
  },
  
  privacy: {
    title: 'Privacy Policy',
    description: 'Seevora privacy policy and data protection practices. Learn how we handle your business and customer data with industry-leading security standards.',
    keywords: ['privacy policy', 'data protection', 'Seevora privacy'],
    path: '/privacy-policy',
    image: seoConfig.defaultImage.url,
    type: 'website',
    noindex: true // Privacy pages typically shouldn't be indexed
  },
  
  terms: {
    title: 'Terms and Conditions',
    description: 'Seevora terms of service and usage conditions. Review our service agreements and policies.',
    keywords: ['terms and conditions', 'terms of service', 'Seevora terms'],
    path: '/terms-and-conditions',
    image: seoConfig.defaultImage.url,
    type: 'website',
    noindex: true // Terms pages typically shouldn't be indexed
  }
};

export default seoConfig;
