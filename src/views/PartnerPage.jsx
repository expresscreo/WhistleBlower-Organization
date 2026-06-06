'use client';

import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { Building, ShieldCheck, BarChart2, ArrowRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCursorProximity } from '@/hooks/useCursorProximity';

const BenefitCard = ({ benefit, index }) => {
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
        <benefit.icon 
          className="h-12 w-12" 
          style={{ color: benefit.color }}
          strokeWidth={2}
        />
      </div>
      <h3 className="text-xl font-bold text-[#171717] dark:text-white mb-4">{benefit.title}</h3>
      <p className="text-[#707070] dark:text-[#A0A0A0] text-sm leading-relaxed">{benefit.description}</p>
    </motion.div>
  );
};

const PartnerPage = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Enhanced Transparency',
      description: 'Build public trust by providing a secure and transparent channel for stakeholders to voice concerns and report misconduct.',
      color: '#10b981',
    },
    {
      icon: BarChart2,
      title: 'Actionable Insights',
      description: 'Receive structured, verified reports directly through our platform, allowing you to identify trends and address systemic issues proactively.',
      color: '#3b82f6',
    },
    {
      icon: Building,
      title: 'Streamlined Case Management',
      description: 'Utilize our intuitive dashboard to manage, track, and resolve submitted reports efficiently, all in one place.',
      color: '#9333ea',
    },
  ];

  return (
    <>
      <SEOHead 
        {...generateSEOMeta({
          ...DEFAULT_SEO_PAGES.partner,
          url: '/partner-program',
          type: 'website'
        })}
      />
      <div className="bg-background text-foreground">
        <section className="relative py-20 md:py-32 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          {/* Desktop Background Image */}
          <div 
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage: 'url(/WBMedia/general/Bannerxx-WhistleBlower.webp)',
              backgroundAttachment: 'fixed',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover'
            }}
          ></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-black">
                Become a <span className="gradient-text">WhistleBlower.ng Partner</span>
              </h1>
              <p className="text-lg md:text-xl text-black max-w-3xl mx-auto mb-8">
                Join a growing network of public organizations and government agencies committed to fostering accountability and transparency in Nigeria.
              </p>
              <a href="mailto:business@whistleblower.ng">
                <Button size="lg" className="px-8 py-4 text-base group uppercase">
                  Contact Us <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-[#707070] dark:text-muted-foreground">Why Partner </span>
                <span className="text-[#171717] dark:text-white">with Us?</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Our platform empowers your organization to handle reports with integrity and efficiency.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <BenefitCard
                  key={index}
                  benefit={benefit}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-[#707070] dark:text-muted-foreground">Ready to Make a </span>
                <span className="text-[#171717] dark:text-white">Difference?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start receiving and managing reports today. Our team is here to support you every step of the way.
              </p>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-8 py-4 text-base uppercase">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PartnerPage;