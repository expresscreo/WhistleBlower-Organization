
import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Award, Users, ArrowRight, FileText, Search, Gift, CheckCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import TrustedByCarousel from '@/components/home/TrustedByCarousel';
import BountyAccordion from '@/components/home/BountyAccordion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

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


const HomePage = () => {
  const features = [
    { icon: Shield, title: '100% Secure & Anonymous', description: 'Your identity is completely protected with end-to-end encryption and anonymous reporting options.' },
    { icon: Award, title: 'Reward-Backed Reporting', description: 'Get rewarded for verified reports through our secure Interswitch PayCode system.' },
    { icon: Users, title: 'Connected to Relevant Authorities', description: 'Reports are directly routed to appropriate government agencies and public organizations.' },
    { icon: Eye, title: 'Transparent & Trackable', description: 'Track your report progress in real-time with our secure tracking system.' }
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
        style={{ backgroundImage: `url('/WBMedia/general/hero-section-background.jpg')`}}
      >
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex-grow flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center flex-grow"
            style={{ marginTop: '9rem', marginBottom: '55px' }}
          >
            <h1 className="text-[43px] md:text-6xl font-bold mb-6 text-white leading-tight max-w-5xl mx-auto">
              Report Crime Securely, And <AnimatedText />
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Nigeria's premier platform for anonymous crime reporting. Your courage contributes to a safer society and is recognized. Stay anonymous, report the crime, and get rewarded—help build a safer Nigeria.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md sm:max-w-none sm:w-auto mx-auto">
              <Link to="/submit-report" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-[1px] px-8 py-4 text-sm whitespace-nowrap">
                  Submit a Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/news/bounty" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full uppercase tracking-[1px] px-8 py-4 text-sm whitespace-nowrap bg-transparent text-white border-[#ffffff1a] hover:bg-[#43d08c]/20 hover:backdrop-blur-sm hover:text-white sm:w-[220px]">
                  <Search className="mr-2 h-4 w-4" />
                  Search For Bounties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:mt-auto sm:mb-10">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-[#0f0f0f80] dark:bg-black/50 backdrop-blur-sm p-6 text-white border border-[#ffffff1a] text-center"
                >
                  <stat.icon className="h-8 w-8 text-[#7f7f7f] mx-auto mb-4" />
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    <Counter {...stat} />
                  </div>
                  <div className="text-sm text-gray-300">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
                <span style={{ color: '#707070' }} className="dark:text-muted-foreground">Why Choose </span>
                <span className="text-[#171717] dark:text-white">WhistleBlower.ng</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Our platform provides the most secure and effective way to report crimes and misconduct while protecting your identity.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              {features.slice(0, 2).map((feature) => (
                <Card key={feature.title} className="p-6 flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f6f6f6] dark:bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[#171717] dark:text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="space-y-8">
              {features.slice(2, 4).map((feature) => (
                <Card key={feature.title} className="p-6 flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f6f6f6] dark:bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[#171717] dark:text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrustedByCarousel />

      <section className="py-20">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span style={{ color: '#707070' }} className="dark:text-muted-foreground">How It </span>
              <span className="text-[#171717] dark:text-white">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Simple 4-step process to make your report and help build a safer Nigeria.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <div className={cn("w-20 h-20 flex items-center justify-center mx-auto mb-4 relative bg-[#f6f6f6] dark:bg-primary/10")}>
                  <step.icon className="h-10 w-10 text-[#171717] dark:text-primary" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#ff5100] text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BountyAccordion />

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-white/80 dark:text-white/80">Partner </span>
              <span className="text-white dark:text-white">with Us</span>
            </h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
              Are you a public organization or government agency interested in receiving reports directly? Join our partner network and enhance transparency in your operations.
            </p>
            <Link to="/partner-program">
              <Button size="lg" className="uppercase tracking-[1px] px-8 py-4 text-sm bg-[#171717] text-[#f6f6f6] hover:bg-[#f6f6f6] hover:text-[#171717] dark:bg-white dark:text-black dark:hover:bg-gray-200">
                Learn More About Partnership
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
