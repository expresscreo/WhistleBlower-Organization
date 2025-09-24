import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Target, Eye, Lock, TrendingUp, HeartHandshake as Handshake, CheckSquare, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { useCursorProximity } from '@/hooks/useCursorProximity';

const StatCard = ({ icon, value, label, index }) => {
  const cardRef = useCursorProximity(100); // 100px proximity radius

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="feature-card p-6 text-center rounded-lg"
    >
      <div className="mb-4">
        {icon}
      </div>
      <p className="text-4xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground uppercase tracking-wider mt-2">{label}</p>
    </motion.div>
  );
};

const PrincipleCard = ({ icon: Icon, title, description, index, color }) => {
  const cardRef = useCursorProximity(100); // 100px proximity radius

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="feature-card p-6 text-center rounded-lg"
    >
      <div className="flex justify-center mb-4">
        <Icon className="h-10 w-10" style={{ color }} strokeWidth={2.5} />
      </div>
      <h3 className="text-xl font-bold text-[#171717] dark:text-white mb-2">{title}</h3>
      <p className="text-[#707070] dark:text-[#A0A0A0] text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

const AboutUsPageV2 = () => {
    const stats = [
        { value: '15K+', label: 'Reports Filed', icon: <TrendingUp className="h-8 w-8 text-primary" /> },
        { value: '95%', label: 'Case Resolution Rate', icon: <ShieldCheck className="h-8 w-8 text-primary" /> },
        { value: '100%', label: 'Anonymity Guaranteed', icon: <Lock className="h-8 w-8 text-primary" /> },
        { value: '50+', label: 'Partner Agencies', icon: <Handshake className="h-8 w-8 text-primary" /> },
    ];

    const timeline = [
        {
            year: '2023',
            title: 'The Spark of an Idea',
            description: 'Founded with the belief that every Nigerian deserves a voice against injustice, WhistleBlower.ng was born to create a secure and anonymous reporting channel.',
            align: 'right'
        },
        {
            year: '2024',
            title: 'Platform Launch & First Impact',
            description: 'We officially launched, onboarding our first government agencies and successfully resolving our first hundred cases, proving the power of citizen-led accountability.',
            align: 'left'
        },
        {
            year: '2025',
            title: 'Expanding Our Reach',
            description: 'Introduced new features like real-time tracking, a rewards system, and a public bounty board, significantly increasing user engagement and report submissions nationwide.',
            align: 'right'
        },
        {
            year: 'Future',
            title: 'A Transparent Nigeria',
            description: 'Our vision is to become the cornerstone of transparency in Nigeria, fostering a culture where accountability is the norm, not the exception.',
            align: 'left'
        },
    ];

    // Generate SEO metadata
    const seoMeta = generateSEOMeta({
        ...DEFAULT_SEO_PAGES.about,
        url: '/about-us',
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

            <div className="bg-background text-foreground">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background pt-20 pb-10">
                    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-center md:text-left"
                            >
                                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                                    The Courage to <span className="text-primary">Speak.</span>
                                    <br />
                                    The Power to <span className="text-primary">Change.</span>
                                </h1>
                                <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto md:mx-0">
                                    WhistleBlower.ng is Nigeria’s premier platform for secure crime reporting and public bounties. We give citizens a safe and confidential way to report crimes, corruption, and illegal activities, or to place bounties for specific information—all while ensuring their voice is heard without fear of retaliation.
                                </p>
                                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                    <Link to="/submit-report" className="w-full sm:w-auto">
                                        <Button size="lg" className="uppercase tracking-wider w-full sm:w-auto">
                                            Join The Movement
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link to="/faq" className="w-full sm:w-auto">
                                        <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                            How It Works
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative h-80 md:h-full min-h-[400px]"
                            >
                                <img
                                    className="absolute inset-0 w-full h-full object-cover"
                                    alt="A diverse group of determined Nigerian citizens looking towards the future"
                                    src="/WBMedia/general/about-us-team.jpg" />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 bg-muted/30">
                    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <StatCard key={index} {...stat} index={index} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission and Vision Section */}
                <section className="py-20">
                    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <div className="flex items-center text-primary mb-2">
                                <Target className="h-6 w-6 mr-2" />
                                <h2 className="text-sm uppercase font-bold tracking-wider">Our Mission</h2>
                            </div>
                            <p className="text-3xl font-bold mb-4">To Make Reporting Safe, Simple, and Rewarding.</p>
                            <p className="text-muted-foreground">
                                We exist to dismantle the barriers of fear and complexity that prevent citizens from reporting wrongdoing. By providing a technologically advanced, 100% anonymous platform for both reports and bounties, we empower you to become an active participant in building a more just and accountable society.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            <div className="flex items-center text-primary mb-2">
                                <Eye className="h-6 w-6 mr-2" />
                                <h2 className="text-sm uppercase font-bold tracking-wider">Our Vision</h2>
                            </div>
                            <p className="text-3xl font-bold mb-4">A Nigeria Where Transparency is the Standard.</p>
                            <p className="text-muted-foreground">
                                We envision a future where corruption and crime cannot hide in the shadows. A Nigeria where every citizen feels safe to speak up, where institutions are responsive and accountable, and where integrity is the foundation of our communities.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Timeline Section */}
                <section className="py-20 bg-muted/30">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Our Journey</h2>
                            <p className="mt-4 text-lg text-muted-foreground">From a simple idea to a nationwide movement.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-full w-0.5 bg-border" aria-hidden="true"></div>
                            <div className="space-y-16">
                                {timeline.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1 }}
                                        className="relative flex items-start"
                                    >
                                        <div className={cn(
                                            'w-full md:w-1/2',
                                            item.align === 'right' ? 'md:ml-auto md:pl-8 text-left pl-12' : 'md:pr-8 md:text-right pl-12 md:pl-0 text-left'
                                        )}>
                                            <p className="text-2xl font-bold text-primary">{item.year}</p>
                                            <h3 className="text-xl font-semibold mt-1">{item.title}</h3>
                                            <p className="text-muted-foreground mt-2">{item.description}</p>
                                        </div>
                                        <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-primary border-4 border-background"></div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Principles */}
                <section className="py-20">
                    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Our Core Principles</h2>
                            <p className="mt-4 text-lg text-muted-foreground">The values that guide every decision we make.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <PrincipleCard
                                icon={Lock}
                                title="Unyielding Security"
                                description="Your identity is sacred. We use end-to-end encryption and advanced security protocols to ensure your anonymity is absolute."
                                index={0}
                                color="#EF4444"
                            />
                            <PrincipleCard
                                icon={CheckSquare}
                                title="Verified Impact"
                                description="We don't just collect reports; we ensure they reach the right authorities and track them to drive real, measurable outcomes."
                                index={1}
                                color="#10B981"
                            />
                            <PrincipleCard
                                icon={Gift}
                                title="Rewarding Courage"
                                description="We believe courage should be recognized. Our system offers rewards for verified, impactful reports and bounties, incentivizing citizen action."
                                index={2}
                                color="#F59E0B"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-primary text-primary-foreground">
                    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <h2 className="text-3xl font-bold">Ready to Make a Difference?</h2>
                            <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
                                Your report could be the one that sparks change. Join thousands of Nigerians in building a safer, more accountable nation.
                            </p>
                            <Link to="/submit-report" className="mt-8 inline-block">
                                <Button size="lg" variant="secondary" className="uppercase tracking-wider px-8 py-6">
                                    Submit a Report Securely
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default AboutUsPageV2;