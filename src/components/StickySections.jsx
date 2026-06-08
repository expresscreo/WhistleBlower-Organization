import Link from 'next/link';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const StickySections = () => {
  const containerRef = useRef(null);
  const firstSectionRef = useRef(null);
  const secondSectionRef = useRef(null);
  const thirdSectionRef = useRef(null);
  const fourthSectionRef = useRef(null);
  const fifthSectionRef = useRef(null);

  // Fade out the headline as the first sticky section reaches the top of the viewport
  const { scrollYProgress: firstSectionScroll } = useScroll({
    target: firstSectionRef,
    offset: ['start end', 'start start'],
  });
  const headingOpacity = useTransform(firstSectionScroll, [0, 1], [1, 0]);

  // Overlay opacities for each section as the NEXT section scrolls in
  const { scrollYProgress } = useScroll({
    target: secondSectionRef,
    offset: ['start 90%', 'start 50%'],
  });
  const overlay1 = useTransform(scrollYProgress, [0, 1], [0, 0.5]);
  const { scrollYProgress: p2 } = useScroll({ target: thirdSectionRef, offset: ["start 90%", "start 50%"] });
  const overlay2 = useTransform(p2, [0, 1], [0, 0.5]);
  const { scrollYProgress: p3 } = useScroll({ target: fourthSectionRef, offset: ["start 90%", "start 50%"] });
  const overlay3 = useTransform(p3, [0, 1], [0, 0.5]);
  const { scrollYProgress: p4 } = useScroll({ target: fifthSectionRef, offset: ["start 90%", "start 50%"] });
  const overlay4 = useTransform(p4, [0, 1], [0, 0.5]);

  return (
    <div ref={containerRef} className="relative">
      {/* First Section */}
      <div
        ref={firstSectionRef}
        className="sticky top-0 h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#121212] z-20 px-8 pt-4 lg:pt-4 relative"
      >
        {/* Fade overlay for first section as second approaches */}
        <motion.div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlay1 }} />
        {/* Global headline inside first sticky section */}
        <motion.div className="hidden sm:block absolute top-24 left-0 right-0 px-8 pointer-events-none" style={{ opacity: headingOpacity }}>
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0 leading-tight">
              <span style={{ color: '#707070' }} className="dark:text-muted-foreground">What You Can </span>
              <span className="text-[#171717] dark:text-white">Do On </span>
              <span className="text-[#171717] dark:text-white">WhistleBlower.ng</span>
            </h3>
          </div>
        </motion.div>
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12 -mt-8 lg:-mt-12">
          {/* Mobile inline headline above content */}
          <motion.div className="w-full text-center mb-0 sm:hidden" style={{ opacity: headingOpacity }}>
            <h3 className="text-2xl font-bold leading-tight">
              <span style={{ color: '#707070' }} className="dark:text-muted-foreground">What You Can </span>
              <span className="text-[#171717] dark:text-white">Do On </span>
              <span className="block text-[#171717] dark:text-white">WhistleBlower.ng</span>
            </h3>
          </motion.div>
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-[348px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
              <img src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=640&h=640&fit=crop" alt="Anonymous Reporting" className="w-full h-full object-cover" />
              {/* Mobile category tag overlapping image */}
              <span className="absolute top-4 left-4 lg:hidden px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#ff5100' }}>Anonymous Reporting</span>
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
            <div className="mb-6 hidden lg:block">
              <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#ff5100' }}>Anonymous Reporting</span>
            </div>
            <h2 className="text-[28px] lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">Report Crimes Securely And Anonymously</h2>
            <p className="text-sm text-black dark:text-[#a0a0a0] leading-relaxed mb-12">Submit reports anonymously using our encrypted platform. Your identity is protected while your voice is heard by the right authorities.</p>
            <div className="w-full">
              <Link href="/submit-report" className="group flex items-center justify-between text-black dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300">
                <span className="text-lg">Submit A Report</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12h18m-8-7l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <div className="w-full h-[1.5px] bg-black dark:bg-white/30 mt-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Section */}
      <div ref={secondSectionRef} className="sticky top-0 h-screen w-full flex items-center justify-center bg-white dark:bg-background z-30 px-8 pt-8 lg:pt-4 relative">
        {/* Fade overlay for second section as third approaches */}
        <motion.div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlay2 }} />
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-[348px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=640&fit=crop" alt="Real-time Tracking" className="w-full h-full object-cover" />
              {/* Mobile category tag overlapping image */}
              <span className="absolute top-4 left-4 lg:hidden px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#00C853' }}>Real-time Tracking</span>
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
            <div className="mb-6 hidden lg:block">
              <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#00C853' }}>Real-time Tracking</span>
            </div>
            <h2 className="text-[28px] lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">Track Your Report Progress Instantly</h2>
            <p className="text-sm text-black dark:text-[#a0a0a0] leading-relaxed mb-12">Monitor your report status in real-time with our secure tracking system. Get updates on investigation progress and see your impact.</p>
            <div className="w-full">
              <Link href="/track" className="group flex items-center justify-between text-black dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300">
                <span className="text-lg">Track Your Report</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12h18m-8-7l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <div className="w-full h-[1.5px] bg-black dark:bg-white/30 mt-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Section (Rewards & Payments) */}
      <div ref={thirdSectionRef} className="sticky top-0 h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#121212] z-40 px-8 pt-8 lg:pt-4 relative">
        {/* Fade overlay for third section as fourth approaches */}
        <motion.div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlay3 }} />
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-[348px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
              <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=640&fit=crop" alt="Rewards & Payments" className="w-full h-full object-cover" />
              {/* Mobile category tag overlapping image */}
              <span className="absolute top-4 left-4 lg:hidden px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#FF0000' }}>Rewards & Payments</span>
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
            <div className="mb-6 hidden lg:block">
              <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#FF0000' }}>Rewards & Payments</span>
            </div>
            <h2 className="text-[28px] lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">Earn Money For Information</h2>
            <p className="text-sm text-black dark:text-[#a0a0a0] leading-relaxed mb-12">Earn money for valuable information through our secure PayCode system. Your contribution to justice doesn't go unnoticed.</p>
            <div className="w-full">
              <Link href="/rewards-for-information" className="group flex items-center justify-between text-black dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300">
                <span className="text-lg">Learn About Money</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12h18m-8-7l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <div className="w-full h-[1.5px] bg-black dark:bg-white/30 mt-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Fourth Section (Bounty System) */}
      <div ref={fourthSectionRef} className="sticky top-0 h-screen w-full flex items-center justify-center bg-white dark:bg-background z-40 px-8 pt-8 lg:pt-4 relative">
        {/* Fade overlay for fourth section as fifth approaches */}
        <motion.div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlay4 }} />
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-[348px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
              <img src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=640&h=640&fit=crop" alt="Bounty System" className="w-full h-full object-cover" />
              {/* Mobile category tag overlapping image */}
              <span className="absolute top-4 left-4 lg:hidden px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#FFA000' }}>Bounty System</span>
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
            <div className="mb-6 hidden lg:block">
              <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#FFA000' }}>Bounty System</span>
            </div>
            <h2 className="text-[28px] lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">Place Bounties For Information</h2>
            <p className="text-sm text-black dark:text-[#a0a0a0] leading-relaxed mb-12">Need specific information? Put a price on it. Create public bounties to crowdsource intelligence for investigations and asset recovery.</p>
            <div className="w-full">
              <Link href="/place-bounty" className="group flex items-center justify-between text-black dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300">
                <span className="text-lg">Place A Bounty</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12h18m-8-7l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <div className="w-full h-[1.5px] bg-black dark:bg-white/30 mt-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Fifth Section (News & Updates) */}
      <div ref={fifthSectionRef} className="sticky top-0 h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#121212] z-50 px-8 pt-8 lg:pt-4 relative">
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="relative w-[348px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
              <img src="https://images.unsplash.com/photo-1504711331083-9c895941bf81?w=640&h=640&fit=crop" alt="News & Updates" className="w-full h-full object-cover" />
              {/* Mobile category tag overlapping image */}
              <span className="absolute top-4 left-4 lg:hidden px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#4285F4' }}>News & Updates</span>
            </div>
          </div>
          <div className="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
            <div className="mb-6 hidden lg:block">
              <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" style={{ backgroundColor: '#4285F4' }}>News & Updates</span>
            </div>
            <h2 className="text-[28px] lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">Stay Informed With Latest News</h2>
            <p className="text-sm text-black dark:text-[#a0a0a0] leading-relaxed mb-12">Get the latest updates on investigations, successful reports, and important announcements from our platform and authorities.</p>
            <div className="w-full">
              <Link href="/news" className="group flex items-center justify-between text-black dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300">
                <span className="text-lg">Read Latest News</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12h18m-8-7l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <div className="w-full h-[1.5px] bg-black dark:bg-white/30 mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickySections;


