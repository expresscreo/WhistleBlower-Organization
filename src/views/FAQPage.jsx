'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle, Shield, FileText, Gift, User, Server, Award, BookOpen } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});

  const faqData = [
    {
      category: 'General',
      icon: HelpCircle,
      questions: [
        { question: 'What is WhistleBlower.ng?', answer: 'WhistleBlower.ng is a secure, citizen-driven platform that empowers Nigerians to report crimes, misconduct, and illegal acts directly to appropriate government agencies or public organizations. It also allows users to place bounties for specific information. The platform ensures complete anonymity and security for all users.' },
        { question: 'How does the platform ensure my anonymity?', answer: 'We use end-to-end encryption, secure servers, and advanced privacy protocols. You can choose to report or place a bounty completely anonymously without providing any personal information. Even if you choose to provide contact details for rewards, your identity remains protected from the reported organization.' },
        { question: 'Is WhistleBlower.ng free to use for citizens?', answer: 'Yes, submitting reports as a citizen is completely free. Placing a bounty requires payment for the bounty amount, but our platform fees are covered by our partners. Our subscription plans are for organizations that want to receive and manage reports.' },
        { question: 'What types of incidents can I report?', answer: 'You can report various types of crimes and misconduct including theft, fraud, abuse, harassment, corruption, environmental violations, bribery, embezzlement, and other illegal activities involving public organizations or government agencies.' }
      ]
    },
    {
      category: 'Reporting Process',
      icon: FileText,
      questions: [
        { question: 'How do I submit a report?', answer: 'Simply visit our Submit Report page, fill out the form with incident details, choose your anonymity preference, and submit. You\'ll receive a unique Report ID and password to track your submission.' },
        { question: 'What information do I need to provide?', answer: 'You need to provide the organization name, incident category, description, location (state/LGA), date of incident, and urgency level. You can also upload evidence files and choose whether to remain anonymous or provide contact details.' },
        { question: 'Can I upload evidence with my report?', answer: 'Yes, you can upload various types of evidence including images, PDFs, videos, and audio files to support your report. All files are encrypted and securely stored.' },
        { question: 'How do I track my report or bounty?', answer: 'Use your unique ID (Report ID or Bounty ID) and the password you created on our Track page to view the current status, progress, and any updates on your submission.' }
      ]
    },
    {
      category: 'Public Bounties',
      icon: Award,
      questions: [
        { question: 'What is a public bounty?', answer: 'A public bounty is a reward offered by an individual or organization for specific information related to a crime, missing person, or other incident. It incentivizes the public to provide valuable intelligence.' },
        { question: 'How do I place a bounty?', answer: 'Go to the "Place a Bounty" page, fill in the details of the information you need, set a bounty amount, and create a password. Once approved, your bounty will be published on our News page.' },
        { question: 'Is the bounty amount refundable?', answer: 'Yes, the bounty amount is fully refundable if your bounty submission is not approved for publication by our team.' },
        { question: 'How do I submit information for an existing bounty?', answer: 'Find the bounty on our News page under the "Bounty" category. Click "View Bounty" and then "Give Information About This Person". This will take you to a pre-filled report form to submit your information securely.' }
      ]
    },
    {
      category: 'Rewards & Payments',
      icon: Gift,
      questions: [
        { question: 'How does the reward system work?', answer: 'For standard reports, verified information that leads to successful investigations may be eligible for rewards. For bounties, the person who provides the key information that resolves the case is awarded the bounty amount. All payments are processed through Monnify Paycode, ensuring secure and confidential payouts at Moniepoint POS agents without requiring bank details.' },
        { question: 'When am I eligible for rewards?', answer: 'You become eligible for rewards when you provide contact information during report submission and your report is verified and leads to actionable outcomes by the relevant authorities.' },
        { question: 'How are rewards calculated?', answer: 'For standard reports, reward amounts depend on the severity of the incident and the impact of the resolution. For bounties, the reward is the amount set by the person who placed the bounty.' },
        { question: 'How do I claim my reward?', answer: 'Once your report is marked as resolved and WhistleBlower.ng approves the reward, your Monnify Paycode appears on the report tracking page. Copy the code and redeem it at any Moniepoint POS or agent to receive your cash payment.' }
      ]
    },
    {
      category: 'Security & Privacy',
      icon: Shield,
      questions: [
        { question: 'How secure is my data?', answer: 'We use military-grade encryption, secure servers, and follow international data protection standards. Your data is encrypted both in transit and at rest, ensuring maximum security.' },
        { question: 'Can the reported organization identify me?', answer: 'No, the reported organization cannot identify you. We act as an intermediary, forwarding only the incident details while keeping your identity completely protected.' },
        { question: 'What happens to my data after the report is resolved?', answer: 'Personal data is handled according to our privacy policy. Anonymous reports contain no personal data, while contact information for reward-eligible reports is securely stored and only used for reward processing.' },
        { question: 'Can I delete my report or bounty?', answer: 'Once submitted, reports and bounties cannot be deleted by the user as they may be part of ongoing investigations. However, you can update your submission with additional information if needed.' }
      ]
    },
    {
      category: 'Organizations & Partners',
      icon: Server,
      questions: [
        { question: 'How can my organization join as a partner?', answer: 'Organizations can join our partner network by subscribing to one of our plans. This allows you to receive reports directly, manage investigations, and maintain transparency in your operations.' },
        { question: 'What are the benefits of being a partner organization?', answer: 'Partner organizations get direct access to reports, advanced dashboard features, analytics, case management tools, and the ability to communicate securely with reporters while maintaining their anonymity.' },
        { question: 'How much does it cost for organizations?', answer: 'We offer multiple plans starting from ₦150,000/month for basic features up to custom enterprise solutions. Visit our Pricing page for detailed information.' },
        { question: 'Can we customize the platform for our organization?', answer: 'Yes, our Enterprise and Enterprise Plus plans offer customization options including white-labeling, custom workflows, and specialized integrations to meet your organization\'s specific needs.' }
      ]
    }
  ];

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.faq,
    url: '/faq',
    type: 'website'
  });

  // Generate FAQ structured data
  const allFAQs = faqData.flatMap(category => category.questions);
  const structuredData = [
    STRUCTURED_DATA_TEMPLATES.faqPage(allFAQs)
  ];

  return (
    <>
      <SEOHead
        {...seoMeta}
        structuredData={structuredData}
      />
      <div className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl md:text-5xl font-bold mb-6">Frequently Asked <span className="gradient-text">Questions</span></h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Find answers to common questions about WhistleBlower.ng, our reporting process, security measures, and reward system.</p>
          </motion.div>
          <div className="space-y-8">
            {faqData.map((category, categoryIndex) => (
              <motion.div key={categoryIndex} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}>
                <h2 className="text-2xl font-bold mb-6 text-primary flex items-center">
                  <category.icon className="w-6 h-6 mr-3" />
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((item, questionIndex) => {
                    const key = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems[key];
                    return (
                      <div key={questionIndex} className="border border-border bg-card">
                        <button className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors" onClick={() => toggleItem(categoryIndex, questionIndex)}>
                          <span className="font-semibold pr-4">{item.question}</span>
                          {isOpen ? <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />}
                        </button>
                        {isOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="px-6 pb-4">
                            <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="mt-16 text-center bg-muted/30 p-8">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6">Can't find the answer you're looking for? Our support team is here to help.</p>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-semibold">Email:</span> support@whistleblower.ng</p>
              <p className="text-sm"><span className="font-semibold">Phone:</span> 08053834017</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;