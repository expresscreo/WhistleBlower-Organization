import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Lightbulb, 
  Zap, 
  Globe, 
  Smartphone, 
  Code, 
  Palette,
  Rocket,
  Shield,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const StickyScrollSamplePage = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const sections = [
    {
      category: "Website Builder",
      title: "From idea to online, quicker and slicker",
      description: "Transform your creative ideas into stunning websites with our intuitive platform. No coding required, just pure creativity.",
      actionText: "Start building now",
      actionLink: "/submit-report",
      imagePlaceholder: "🌐",
      backgroundColor: "bg-gradient-to-br from-green-400 to-emerald-600"
    },
    {
      category: "Performance",
      title: "Lightning-fast loading times",
      description: "Experience blazing-fast performance that keeps your visitors engaged and boosts your conversion rates significantly.",
      actionText: "See performance metrics",
      actionLink: "/track",
      imagePlaceholder: "⚡",
      backgroundColor: "bg-gradient-to-br from-blue-400 to-cyan-600"
    },
    {
      category: "Global Network",
      title: "Reach customers worldwide",
      description: "Connect with your audience globally while maintaining local relevance through our worldwide infrastructure.",
      actionText: "Explore global reach",
      actionLink: "/news",
      imagePlaceholder: "🌍",
      backgroundColor: "bg-gradient-to-br from-purple-400 to-indigo-600"
    },
    {
      category: "Mobile Ready",
      title: "Perfect on every device",
      description: "Your website will look and perform flawlessly on smartphones, tablets, and desktops with our responsive design.",
      actionText: "Test mobile experience",
      actionLink: "/pricing",
      imagePlaceholder: "📱",
      backgroundColor: "bg-gradient-to-br from-pink-400 to-rose-600"
    },
    {
      category: "Developer Tools",
      title: "Advanced development platform",
      description: "Powerful tools and APIs that give developers the flexibility and control they need to build amazing things.",
      actionText: "View developer docs",
      actionLink: "/faq",
      imagePlaceholder: "💻",
      backgroundColor: "bg-gradient-to-br from-orange-400 to-red-600"
    }
  ];


  return (
    <div className="min-h-screen">
      {/* Moved from homepage: Public Bounties promo */}
      <section className="py-20 bg-[#F9F5F0] dark:bg-[#121212]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square md:aspect-[3/4] bg-[#FF5100] overflow-hidden">
              <img
                className="absolute inset-0 w-full h-full object-cover"
                alt="A person looking at a phone screen with a magnifying glass icon, symbolizing searching for information."
                src="/WBMedia/general/bounty-accordion-image.jpg" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                Take an Active Role with Public Bounties
              </h2>
            </div>
          </div>
        </div>
      </section>
      {/* Header */}
      <div className="relative z-[999] bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sticky Scroll Effect Sample
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Sections that become sticky and overlap as you scroll
          </p>
        </div>
      </div>

      {/* Sticky Scroll Container */}
      <div ref={containerRef} className="relative">
        {/* First Section - Sticky at top */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#121212] z-20 px-8 pt-20 lg:pt-8">
          <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Orange Box */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <div className="w-[300px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=640&h=640&fit=crop" 
                  alt="Anonymous Reporting" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#ff5100' }}>
                  Anonymous Reporting
                </span>
              </div>

              {/* Main Title */}
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Report Crimes Securely And Anonymously
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-800 dark:text-white/90 leading-relaxed mb-8">
                Submit reports anonymously using our encrypted platform. Your identity is protected while your voice is heard by the right authorities.
              </p>

              {/* Call to Action with line and arrow */}
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex-1 h-px bg-gray-900/30 dark:bg-white/30 mr-4 max-w-xs"></div>
                <Link 
                  to="/submit-report"
                  className="group flex items-center text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300 whitespace-nowrap"
                >
                  <span className="mr-2">Submit a report</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Second Section - Sticky and overlaps first */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-white dark:bg-background z-30 px-8 pt-20 lg:pt-8">
          <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Orange Box */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <div className="w-[300px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=640&fit=crop" 
                  alt="Real-time Tracking" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#00C853' }}>
                  Real-time Tracking
                </span>
              </div>

              {/* Main Title */}
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Track Your Report Progress Instantly
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-800 dark:text-white leading-relaxed mb-8">
                Monitor your report status in real-time with our secure tracking system. Get updates on investigation progress and see your impact.
              </p>

              {/* Call to Action with line and arrow */}
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex-1 h-px bg-gray-900/30 dark:bg-white/30 mr-4 max-w-xs"></div>
                <Link 
                  to="/track"
                  className="group flex items-center text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300 whitespace-nowrap"
                >
                  <span className="mr-2">Track your report</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Third Section - Purple */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#121212] z-40 px-8 pt-20 lg:pt-8">
          <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Orange Box */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <div className="w-[300px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=640&h=640&fit=crop" 
                  alt="Bounty System" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#FFA000' }}>
                  Bounty System
                </span>
              </div>

              {/* Main Title */}
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Place Bounties For Information
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-800 dark:text-white/90 leading-relaxed mb-8">
                Need specific information? Put a price on it. Create public bounties to crowdsource intelligence for investigations and asset recovery.
              </p>

              {/* Call to Action with line and arrow */}
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex-1 h-px bg-gray-900/30 dark:bg-white/30 mr-4 max-w-xs"></div>
                <Link 
                  to="/place-bounty"
                  className="group flex items-center text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300 whitespace-nowrap"
                >
                  <span className="mr-2">Place a bounty</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Fourth Section - Pink */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-white dark:bg-background z-40 px-8 pt-20 lg:pt-8">
          <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Orange Box */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <div className="w-[300px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=640&fit=crop" 
                  alt="Rewards & Payments" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#FF0000' }}>
                  Rewards & Payments
                </span>
              </div>

              {/* Main Title */}
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Get Paid For Verified Reports
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-800 dark:text-white/90 leading-relaxed mb-8">
                Earn rewards for valuable information through our secure PayCode system. Your contribution to justice doesn't go unnoticed.
              </p>

              {/* Call to Action with line and arrow */}
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex-1 h-px bg-gray-900/30 dark:bg-white/30 mr-4 max-w-xs"></div>
                <Link 
                  to="/rewards-for-information"
                  className="group flex items-center text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300 whitespace-nowrap"
                >
                  <span className="mr-2">Learn about rewards</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Fifth Section - Bright Red */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#121212] z-50 px-8 pt-20 lg:pt-8">
          <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
            {/* Left Side - Orange Box */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <div className="w-[300px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1504711331083-9c895941bf81?w=640&h=640&fit=crop" 
                  alt="News & Updates" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Category Badge */}
              <div className="mb-6">
                <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#4285F4' }}>
                  News & Updates
                </span>
              </div>

              {/* Main Title */}
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Stay Informed With Latest News
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-800 dark:text-white/90 leading-relaxed mb-8">
                Get the latest updates on investigations, successful reports, and important announcements from our platform and authorities.
              </p>

              {/* Call to Action with line and arrow */}
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex-1 h-px bg-gray-900/30 dark:bg-white/30 mr-4 max-w-xs"></div>
                <Link 
                  to="/news"
                  className="group flex items-center text-gray-900 dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300 whitespace-nowrap"
                >
                  <span className="mr-2">Read latest news</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky and overlaps red section */}
        <div className="sticky top-0 w-full bg-gray-50 dark:bg-gray-800 z-[9999] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to implement this on your homepage?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This sticky scroll effect can be easily integrated into your main homepage with your own content.
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300">
            Get Started
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyScrollSamplePage;
