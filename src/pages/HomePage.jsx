
import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Award, Users, ArrowRight, FileText, Search, Gift, CheckCircle, Trophy, Zap } from 'lucide-react';
import StickySections from '@/components/StickySections';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import TrustedByCarousel from '@/components/home/TrustedByCarousel';
import BountyAccordion from '@/components/home/BountyAccordion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { useCursorProximity } from '@/hooks/useCursorProximity';

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


const AnimatedText = () => {
    const words = ["CashOut!", "GetPaid!"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 1000);
        return () => clearInterval(interval);
    }, [words.length]);

    const wordWidths = {
        "GetPaid!": "170px",
        "CashOut!": "180px",
    };

    return (
        <span className="relative inline-block text-center transition-all duration-300 align-top" style={{ width: wordWidths[words[index]] }}>
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={words[index]}
                    initial={{ opacity: 0, y: -20, rotateX: 90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: 20, rotateX: -90 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                    className="absolute inset-0"
                    style={{ color: '#ff5100' }}
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
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


const HomePage = () => {
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
      <section 
        className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url('/WBMedia/general/Main WB Slider.jpg')`}}
      >
        <div className="absolute inset-0" style={{ backgroundColor: '#00000069' }} />
        
        <div className="relative z-10 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex-grow flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center flex-grow"
            style={{ marginTop: '9rem', marginBottom: '55px' }}
          >
            <div className="w-full max-w-6xl mx-auto md:-translate-x-12">
              <h1 className="text-[43px] md:text-6xl font-bold mb-6 text-white leading-tight text-center lg:whitespace-nowrap">
                Report Crime Securely, And <AnimatedText />
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Nigeria's premier platform for anonymous crime reporting. Your courage contributes to a safer society and is recognized. Stay anonymous, report the crime, and get rewarded—help build a safer Nigeria.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md sm:max-w-none sm:w-auto mx-auto">
              <Link to="/submit-report" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-[1px] px-8 py-4 text-sm whitespace-nowrap group">
                  SUBMIT A REPORT
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/news/bounty" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full uppercase tracking-[1px] px-8 py-4 text-sm whitespace-nowrap bg-transparent text-white border-[#ffffff1a] hover:backdrop-blur-sm hover:text-white sm:w-[220px]" style={{'--hover-bg': 'rgba(59, 59, 59, 0.45)'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59, 59, 59, 0.45)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <Search className="mr-2 h-4 w-4" />
                  SEARCH FOR BOUNTIES
                </Button>
              </Link>
              {/* Test Sticky Scroll button removed as requested */}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:mt-auto sm:mb-10">
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
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
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

      <TrustedByCarousel />

      {/* Removed the 'What You Can Do On WhistleBlower.ng' section as requested */}

      {/* Full-bleed sticky sections */}
      <section className="relative">
        <StickySections />
      </section>

      {/* BountyAccordion moved to Sticky Scroll Sample page on request */}
      {/* Partner with Us section moved to StickySections component */}
    </>
  );
};

export default HomePage;
