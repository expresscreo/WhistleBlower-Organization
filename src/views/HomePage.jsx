'use client';

import Link from 'next/link';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Shield, Eye, Award, Users, ArrowRight, FileText, Search, Gift, CheckCircle, Trophy, Zap } from 'lucide-react';
import StickySections from '@/components/StickySections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TrustedByCarousel from '@/components/home/TrustedByCarousel';
import HomeLatestNews from '@/components/home/HomeLatestNews';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { useCursorProximity } from '@/hooks/useCursorProximity';
import { FlipWords } from '@/components/ui/flip-words';

const HERO_FLIP_WORDS = ['Cash Out!', 'Get Paid!'];

const Counter = ({ initialValue, hourlyIncrease = 0, prefix = '', suffix = '', isDecimal = false }) => {
    const ref = useRef(null);
    const [currentValue, setCurrentValue] = useState(initialValue);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentValue(prev => prev + hourlyIncrease);
      }, 3600000); // every hour
      return () => clearInterval(interval);
    }, [hourlyIncrease]);
  
    useEffect(() => {
        const node = ref.current;
        if (node) {
            const controls = animate(parseFloat(node.textContent.replace(/[^0-9.]/g, '')) || initialValue, currentValue, {
                duration: 1,
                onUpdate(value) {
                    if (isDecimal) {
                        node.textContent = `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${suffix}`;
                    } else {
                        node.textContent = `${prefix}${Math.round(value).toLocaleString()}${suffix}`;
                    }
                }
            });
            return () => controls.stop();
        }
    }, [currentValue, prefix, suffix, initialValue, isDecimal]);
  
    if (isDecimal) {
       return <span ref={ref}>{`${prefix}${initialValue.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${suffix}`}</span>;
    }
    return <span ref={ref}>{`${prefix}${initialValue.toLocaleString()}${suffix}`}</span>;
};


const FeatureCard = ({ feature, index }) => {
  const cardRef = useCursorProximity(100); // 100px proximity radius

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="feature-card p-8 text-center rounded-lg"
    >
      <div className="flex justify-center mb-6">
        <feature.icon 
          className="h-12 w-12" 
          style={{ color: feature.color }}
          strokeWidth={2}
        />
      </div>
      <h3 className="text-xl font-bold text-[#171717] dark:text-white mb-4">{feature.title}</h3>
      <p className="text-[#707070] dark:text-[#A0A0A0] text-sm leading-relaxed">{feature.description}</p>
    </motion.div>
  );
};

const StatCard = ({ stat, index }) => {
  const cardRef = useCursorProximity(100); // 100px proximity radius

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
      viewport={{ once: true }}
      className="feature-card p-6 text-white text-center rounded-lg"
    >
      <stat.icon className="h-8 w-8 text-[#7f7f7f] mx-auto mb-4" />
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
        <Counter {...stat} />
      </div>
      <div className="text-sm text-gray-300">
        {stat.label}
      </div>
    </motion.div>
  );
};


const HERO_VIDEO_SRC = '/WBMedia/general/Animated%20Globe.mp4';
const SHOW_HERO_ANALYTICS = false;

const HomePage = () => {
  const heroVideoRef = useRef(null);
  // Mobile browsers (especially iOS) often ignore autoPlay on fixed background videos.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const tryPlay = () => video.play().catch(() => {});

    tryPlay();

    const unlock = () => {
      tryPlay();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock, { passive: true, once: true });
    document.addEventListener('click', unlock, { once: true });

    const resumeOnVisible = () => {
      if (!document.hidden) tryPlay();
    };

    document.addEventListener('visibilitychange', resumeOnVisible);

    const hero = document.getElementById('home-hero');
    const heroObserver =
      hero &&
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) tryPlay();
        },
        { threshold: 0.01 }
      );

    if (heroObserver && hero) heroObserver.observe(hero);

    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
      document.removeEventListener('visibilitychange', resumeOnVisible);
      heroObserver?.disconnect();
    };
  }, []);

  const features = [
    { icon: Shield, title: '100% Secure & Anonymous', description: 'Your identity is completely protected with end-to-end encryption.', color: '#4285F4' },
    { icon: Gift, title: 'Reward-Backed Reporting', description: 'Get rewarded for verified reports through our secure PayCode system.', color: '#00C853' },
    { icon: Users, title: 'Connected to Relevant Authorities', description: 'Reports are directly routed to appropriate government agencies and public organizations.', color: '#FFA000' },
    { icon: Eye, title: 'Transparent & Trackable System', description: 'Track your report progress in real-time with our secure tracking system.', color: '#FF0000' }
  ];

  const steps = [
    { icon: Eye, title: 'See Something', description: 'Witness a crime or illegal activity' },
    { icon: FileText, title: 'Submit Report', description: 'File your report anonymously or with contact details' },
    { icon: Search, title: 'Track Progress', description: 'Monitor the status of your report' },
    { icon: Gift, title: 'Get Reward', description: 'Receive rewards for verified reports' }
  ];

  const stats = [
    { initialValue: 15742, hourlyIncrease: 9, label: 'Reports Submitted', icon: FileText },
    { initialValue: 12389, hourlyIncrease: 9, label: 'Reports Resolved', icon: CheckCircle },
    { initialValue: 25.0, hourlyIncrease: 0.2, label: 'Stolen Funds Recovered', icon: Award, prefix: 'N', suffix: 'M', isDecimal: true },
    { initialValue: 10.0, hourlyIncrease: 0.1, label: 'Rewards Paid', icon: Trophy, prefix: 'N', suffix: 'M', isDecimal: true },
    { initialValue: 5640, hourlyIncrease: 9, label: 'Active Users', icon: Users }
  ];

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.home,
    url: '/',
    type: 'website'
  });

  // Generate structured data
  const structuredData = [
    STRUCTURED_DATA_TEMPLATES.organization(),
    STRUCTURED_DATA_TEMPLATES.website(),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Crime Reporting Service',
      description: 'Secure and anonymous crime reporting platform for Nigerian citizens',
      provider: {
        '@type': 'Organization',
        name: 'WhistleBlower.ng'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Nigeria'
      },
      serviceType: 'Crime Reporting'
    }
  ];

  return (
    <>
      <SEOHead
        {...seoMeta}
        structuredData={structuredData}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-black">
        <video
          ref={heroVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onLoadedData={(event) => {
            event.currentTarget.play().catch(() => {});
          }}
          onCanPlayThrough={(event) => {
            event.currentTarget.play().catch(() => {});
          }}
          className="fixed inset-0 h-full w-full object-cover opacity-65"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      <section
        id="home-hero"
        className={`relative z-10 flex flex-col justify-center overflow-hidden ${
          SHOW_HERO_ANALYTICS ? 'min-h-screen' : 'min-h-[calc(100dvh-4rem)]'
        }`}
      >
        <div
          className={`relative z-20 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 text-center${
            SHOW_HERO_ANALYTICS ? ' flex-grow flex flex-col justify-center' : ''
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col items-center justify-center${
              SHOW_HERO_ANALYTICS ? ' flex-grow' : ''
            }`}
            style={
              SHOW_HERO_ANALYTICS
                ? { marginTop: '9rem', marginBottom: '55px' }
                : undefined
            }
          >
            <h1 className="w-full max-w-6xl mx-auto text-[43px] md:text-6xl font-bold mb-6 text-white leading-tight flex flex-wrap items-baseline justify-center gap-x-[0.2em] text-center">
              <span>Report Crime Securely, And</span>
              <span className="relative inline-grid">
                <span aria-hidden className="invisible col-start-1 row-start-1 select-none">
                  Cash Out!
                </span>
                <span className="col-start-1 row-start-1 inline-flex justify-center">
                  <FlipWords
                    words={HERO_FLIP_WORDS}
                    duration={2000}
                    className="text-[#ff5100] text-center"
                  />
                </span>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Nigeria&apos;s premier platform for anonymous crime reporting, public bounties, and verified rewards. Stay protected, share what you know, and get paid for helping build a safer Nigeria.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md sm:max-w-none sm:w-auto mx-auto">
              <Link href="/submit-report" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-[1px] px-8 py-4 text-sm whitespace-nowrap group">
                  SUBMIT A REPORT
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/news/bounty" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full uppercase tracking-[1px] px-8 py-4 text-sm whitespace-nowrap bg-transparent text-white border-[#ffffff1a] hover:backdrop-blur-sm hover:text-white sm:w-[220px]" style={{'--hover-bg': 'rgba(59, 59, 59, 0.45)'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59, 59, 59, 0.45)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <Search className="mr-2 h-4 w-4" />
                  SEARCH FOR BOUNTIES
                </Button>
              </Link>
              {/* Test Sticky Scroll button removed as requested */}
            </div>
          </motion.div>
        </div>

        {SHOW_HERO_ANALYTICS && (
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:mt-auto sm:mb-10">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  stat={stat}
                  index={index}
                />
              ))}
            </div>
        </div>
        )}
      </section>

      <section className="relative z-10 py-20">
        <div className="absolute inset-0 bg-background" aria-hidden />
        <div className="absolute inset-0 bg-muted/30" aria-hidden />
        <div className="relative max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-[#707070] dark:text-muted-foreground">Why Choose </span>
                <span className="text-[#171717] dark:text-white">WhistleBlower.ng</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Our platform provides the most secure and effective way to report crimes and misconduct while protecting your identity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <TrustedByCarousel />
      </div>

      {/* Removed the 'What You Can Do On WhistleBlower.ng' section as requested */}

      {/* Full-bleed sticky sections */}
      <section className="relative z-10">
        <StickySections />
      </section>

      <HomeLatestNews />

      <section className="relative isolate z-[60] py-20 bg-[#ff5100] text-white">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-white/80">Partner </span>
            <span className="text-white">with Us</span>
          </h2>
          <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
            Are you a public organization or government agency interested in receiving reports directly? Join our partner network and enhance transparency in your operations.
          </p>
          <Link href="/partner-program">
            <Button size="lg" className="uppercase tracking-[1px] px-8 py-4 text-sm bg-[#171717] text-[#f6f6f6] hover:bg-[#f6f6f6] hover:text-[#171717] group">
              LEARN MORE ABOUT PARTNERSHIP
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
