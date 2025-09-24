import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Shield, Clock, Phone, FileText, ArrowRight, CheckCircle, MapPin, CreditCard, Users, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { useCursorProximity } from '@/hooks/useCursorProximity';

const RewardsForInformationPage = () => {
  const [openId, setOpenId] = useState(1);

  const accordionItems = [
    {
      id: 1,
      title: 'Submit Your Report',
      description: 'File your report anonymously through our secure platform. Include "REWARD REQUEST" in your report details if you wish to claim a reward.',
      icon: FileText,
    },
    {
      id: 2,
      title: 'Track Your Report',
      description: 'Monitor your report status on our tracking page. When your report is verified with solid evidence and the criminal is caught, it will show as "resolved".',
      icon: CheckCircle,
    },
    {
      id: 3,
      title: 'Request Your Reward',
      description: 'Once your report is resolved, the "Request Reward" button becomes active. Click it to request your PayCode for the verified information.',
      icon: Award,
    },
    {
      id: 4,
      title: 'Reveal Your PayCode',
      description: 'We generate a unique PayCode for your reward. Click "Reveal PayCode" to see your secure withdrawal code.',
      icon: CreditCard,
    },
    {
      id: 5,
      title: 'Withdraw at ATM/POS',
      description: 'Copy your PayCode and visit any ATM or POS agent with PayCode features. Withdraw your cash reward instantly - no account details required.',
      icon: MapPin,
    },
  ];

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

  const AccordionItem = ({ item, isOpen, onToggle }) => {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 py-6">
        <button
          onClick={onToggle}
          className="w-full flex justify-between items-center text-left"
        >
          <div className="flex items-center">
            <item.icon className="h-5 w-5 text-primary mr-3" />
            <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">{item.title}</h3>
          </div>
          <div className="text-primary">
            {isOpen ? <Minus size={24} /> : <Plus size={24} />}
          </div>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: 'auto', marginTop: '16px' },
                collapsed: { opacity: 0, height: 0, marginTop: '0px' },
              }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const features = [
    {
      icon: Shield,
      title: '100% Anonymous',
      description: 'Your identity remains completely protected throughout the entire process. No personal information is required to collect rewards.',
      color: '#4285F4'
    },
    {
      icon: Award,
      title: 'Up to ₦500,000',
      description: 'Rewards vary from ₦50,000 to ₦500,000 depending on the significance of information and successful outcomes.',
      color: '#FFA000'
    },
    {
      icon: MapPin,
      title: 'Instant ATM/POS Withdrawal',
      description: 'Withdraw your reward instantly at any ATM or POS agent with PayCode features across Nigeria. No bank visits required.',
      color: '#00C853'
    },
    {
      icon: Users,
      title: 'Partner Network',
      description: 'We work with trusted law enforcement agencies and organizations to ensure your information reaches the right authorities.',
      color: '#FF0000'
    }
  ];

  const eligibility = [
    'Your report must be verified with solid evidence',
    'The criminal/most wanted/bounty target must be caught',
    'Your report status must show as "resolved" on the tracking page',
    'You must request the reward using the "Request Reward" button',
    'PayCode must be revealed and used at ATM/POS for withdrawal'
  ];

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    title: 'Rewards for Information - Get Paid for Crime Reports',
    description: 'Earn cash rewards up to ₦500,000 for providing information that leads to arrests and prosecutions. 100% anonymous reporting with secure PayCode collection system.',
    keywords: 'crime rewards, whistleblower rewards, anonymous reporting, PayCode, crime information, Nigeria rewards',
    url: '/rewards-for-information',
    type: 'website'
  });

  // Generate structured data
  const structuredData = [
    STRUCTURED_DATA_TEMPLATES.organization(),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Rewards for Information Service',
      description: 'Anonymous crime reporting with cash rewards for verified information leading to arrests',
      provider: {
        '@type': 'Organization',
        name: 'WhistleBlower.ng'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Nigeria'
      },
      serviceType: 'Crime Reporting Rewards',
      offers: {
        '@type': 'Offer',
        price: '50000',
        priceCurrency: 'NGN',
        description: 'Cash rewards from ₦50,000 to ₦500,000'
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
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Award className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-muted-foreground">Rewards for </span>
              <span className="text-primary">Information</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
              Get rewarded for providing information that leads to arrests and prosecutions. 
              Our secure PayCode system ensures you receive cash rewards while maintaining complete anonymity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit-report">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Submit Information
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/news/bounty">
                <Button size="lg" variant="outline">
                  View Active Bounties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reward Details Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-[#707070] dark:text-muted-foreground">How Our </span>
                <span className="text-[#171717] dark:text-white">Reward System</span>
                <span className="text-[#707070] dark:text-muted-foreground"> Works</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">We pay cash rewards if the information you provide leads to one or more people being arrested and charged. Rewards range from ₦50,000 to ₦500,000, determined on a case-by-case basis.</p>
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

          <Card className="mt-16 p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">PayCode Withdrawal Network</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Your PayCode can be used at any ATM or POS agent with PayCode features across Nigeria. 
                Withdraw your reward instantly and anonymously - no account details or personal information required.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-background/50 p-4 rounded-lg">
                  <strong>ATM Withdrawal:</strong> Use your PayCode at any ATM with PayCode features
                </div>
                <div className="bg-background/50 p-4 rounded-lg">
                  <strong>POS Agents:</strong> Visit any POS agent with PayCode withdrawal capability
                </div>
                <div className="bg-background/50 p-4 rounded-lg">
                  <strong>Untraceable:</strong> No bank account or personal details required
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How to Claim Section */}
      <section className="py-20 bg-[#F9F5F0] dark:bg-[#121212]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                How Do I Claim a Reward?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Once your report is verified and the criminal is caught, you can claim your reward instantly. 
                The process is simple and completely anonymous.
              </p>
              
              {/* Image - shows after description on mobile, hidden on desktop */}
              <div className="relative aspect-square bg-[#FF5100] overflow-hidden mb-8 md:hidden">
                <img
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="A person using their phone to track a report and receive rewards through the PayCode system."
                  src="/WBMedia/general/rewards-process-image.jpg" />
              </div>
              
              <div>
                {accordionItems.map((item) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openId === item.id}
                    onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                  />
                ))}
              </div>

              <Card className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-bold mb-3 text-amber-800 dark:text-amber-200">
                  Complete Anonymity Guaranteed
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your PayCode withdrawal is completely untraceable. No bank account details, personal information, 
                  or contact details are required. Simply copy your PayCode and withdraw at any ATM or POS agent 
                  with PayCode features - your identity remains completely protected.
                </p>
              </Card>
            </div>
            
            {/* Desktop image - shows on right side */}
            <div className="relative aspect-square md:aspect-[3/4] bg-[#FF5100] overflow-hidden md:order-2 hidden md:block">
              <img
                className="absolute inset-0 w-full h-full object-cover"
                alt="A person using their phone to track a report and receive rewards through the PayCode system."
                src="/WBMedia/general/rewards-process-image.jpg" />
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-muted-foreground">Reward </span>
                <span className="text-primary">Eligibility</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                To qualify for a reward, your information must meet specific criteria and lead to successful law enforcement action.
              </p>
              <ul className="space-y-4">
                {eligibility.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="text-center">
                  <Award className="h-16 w-16 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Ready to Report?</h3>
                  <p className="text-muted-foreground mb-6">
                    Your information is always 100% anonymous and secure. Start your report today and potentially earn a reward.
                  </p>
                  <div className="space-y-4">
                    <Link to="/submit-report" className="block">
                      <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                        Submit Information Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/news/bounty" className="block">
                      <Button size="lg" variant="outline" className="w-full">
                        View Active Bounties
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-muted-foreground">Frequently Asked </span>
              <span className="text-primary">Questions</span>
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">What if my report is still being investigated?</h3>
              <p className="text-muted-foreground">
                Continue monitoring your report status on the tracking page. The "Request Reward" button will only become active 
                once your report shows as "resolved" - meaning the criminal has been caught and your information has been verified with solid evidence.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">How is the reward amount determined?</h3>
              <p className="text-muted-foreground">
                For bounty reports, you receive the exact predetermined amount that was set for that specific bounty. 
                For other reports, the amount is determined on a case-by-case basis depending on the information you provide 
                and the results achieved. Factors include the severity of the crime, quality of information, and successful 
                prosecution outcomes. All rewards range from ₦50,000 to ₦500,000.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">What happens if my information is shared with partner organizations?</h3>
              <p className="text-muted-foreground">
                There may be times when information received is passed on to our trusted partner organizations. 
                We only share this information to help keep communities and workplaces safe, and your anonymity is always maintained.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">How does the PayCode system work?</h3>
              <p className="text-muted-foreground">
                Once your report is resolved, you can request a reward which generates a unique PayCode. 
                Click "Reveal PayCode" to see your code, then copy it and use it at any ATM or POS agent with PayCode features 
                to withdraw your cash reward instantly and anonymously.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Do I need to provide identification when withdrawing my reward?</h3>
              <p className="text-muted-foreground">
                No. Your PayCode withdrawal is completely untraceable. No bank account details, personal information, 
                or identification is required. Simply copy your PayCode and use it at any ATM or POS agent with PayCode features 
                to withdraw your cash reward anonymously.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to <span className="text-white/80">Make a Difference?</span>
            </h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto opacity-90">
              Help build a safer Nigeria by reporting crimes and misconduct. Your courage contributes to justice 
              and you can be rewarded for valuable information.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit-report">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Submit Information Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/how-we-secure-your-data">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Learn About Security
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default RewardsForInformationPage;
