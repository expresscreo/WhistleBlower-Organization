import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Lock, Zap, HeartHandshake as Handshake, CheckCircle } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const AboutPage = () => {
  const values = [
    { icon: ShieldCheck, title: 'Integrity', description: 'Always act with honesty and transparency.' },
    { icon: Lock, title: 'Security', description: 'Protect every report and reporter’s identity.' },
    { icon: Zap, title: 'Empowerment', description: 'Give citizens the tools to create change.' },
    { icon: Handshake, title: 'Collaboration', description: 'Work with agencies and communities for impact.' },
  ];

  const whatWeDo = [
    'Provide a secure, anonymous crime reporting platform.',
    'Direct reports to the right government agencies for quick action.',
    'Offer incentives for verified reports that lead to results.',
    'Protect reporters’ identities using advanced security measures.',
  ];

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.about,
    url: '/about',
    type: 'website'
  });

  // Generate structured data
  const structuredData = [
    STRUCTURED_DATA_TEMPLATES.organization(),
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About WhistleBlower.ng',
      description: 'Learn about WhistleBlower.ng\'s mission to empower Nigerian citizens with secure crime reporting and transparency.',
      mainEntity: {
        '@type': 'Organization',
        name: 'WhistleBlower.ng',
        foundingDate: '2023',
        description: 'Nigeria\'s premier platform for secure crime reporting and public bounties'
      }
    }
  ];

  return (
    <>
      <SEOHead
        {...seoMeta}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section
        className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{ backgroundImage: `url('/WBMedia/general/hero-background.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto px-4"
        >
          <h1 className="text-4xl md:text-6xl font-bold">About Us</h1>
          <p className="mt-4 text-lg md:text-xl text-gray-200">
            Empowering Nigerians to speak up against crime and illegalities.
          </p>
        </motion.div>
      </section>

      <div className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Who We Are */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Who We Are</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              WhistleBlower.ng is Nigeria’s premier anonymous crime reporting platform. We give citizens a safe, secure, and confidential way to report crimes, corruption, and illegal activities directly to the relevant government agencies. Whether it’s environmental violations, electricity theft, or fraud, our platform ensures your voice is heard — without fear of retaliation.
            </p>
          </motion.section>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-12">
            <motion.section
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                To encourage active citizenship by making it simple, safe, and rewarding for Nigerians to report crimes and illegal activities anonymously.
              </p>
            </motion.section>
            <motion.section
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-lg text-muted-foreground">
                A Nigeria where illegalities go unignored, citizens speak up without fear, and communities thrive in safety and transparency.
              </p>
            </motion.section>
          </div>

          {/* What We Do */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-center">What We Do</h2>
            <ul className="space-y-4 max-w-2xl mx-auto">
              {whatWeDo.map((item, index) => (
                <li key={index} className="flex items-start text-lg">
                  <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Our Values */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="text-center p-6 h-full">
                    <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Call to Action */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center bg-muted/50 p-12"
          >
            <h2 className="text-3xl font-bold mb-4">Be Part of the Change</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Together, we can make Nigeria safer, cleaner, and fairer. Start by reporting what you see today.
            </p>
            <Link href="/submit-report">
              <Button size="lg" className="uppercase tracking-[1px] px-8 py-4 text-sm group">
                SUBMIT A REPORT
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;