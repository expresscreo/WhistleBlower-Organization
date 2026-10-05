'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import {
  AlertTriangle,
  BookOpen,
  Shield,
  BarChart,
  Link as LinkIcon,
  Info,
  Award,
  Smartphone,
} from 'lucide-react';

const LAST_UPDATED = 'October 5, 2026';

const DisclaimerPage = () => {
  return (
    <>
      <SEOHead
        {...generateSEOMeta({
          ...DEFAULT_SEO_PAGES.disclaimer,
          url: '/disclaimer',
          type: 'website',
        })}
      />
      <div className="bg-background text-foreground py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <AlertTriangle className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Disclaimer</h1>
            <p className="text-lg text-muted-foreground">Please read this carefully before using our service.</p>
            <p className="text-sm text-muted-foreground mt-3">Last Updated: {LAST_UPDATED}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <BookOpen className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">No Legal Advice</h2>
                <p className="text-muted-foreground">
                  The information provided on WhistleBlower.ng and in the WhistleBlowerNG mobile apps is
                  for informational purposes only and does not constitute legal advice. We are not a
                  law firm and do not provide legal services. You should consult with a qualified legal
                  professional for advice on your specific situation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">Platform for Reporting Only</h2>
                <p className="text-muted-foreground">
                  WhistleBlower serves as a secure conduit for transmitting information from users to
                  relevant authorities or organizations. We do not conduct our own investigations, nor
                  do we have the authority to compel action from any third party. The responsibility for
                  investigating and acting on reports lies solely with the receiving organizations. This
                  is not a vigilante platform and does not authorize private enforcement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <BarChart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">Accuracy of Information</h2>
                <p className="text-muted-foreground">
                  While we encourage truthful and accurate reporting, we do not independently verify
                  every detail submitted by users. We are not liable for false, inaccurate, or
                  defamatory content submitted through our platform. Users are solely responsible for
                  the content of their reports and bounties. Public News, Bounty, and Wanted listings
                  are platform-managed and may be edited, withheld, or removed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">No Guarantee of Outcome or Reward</h2>
                <p className="text-muted-foreground">
                  Submitting a report or placing a bounty does not guarantee any specific outcome,
                  investigation, or action. Reward eligibility for reports is determined by the
                  receiving organization after verification. For bounties, payment is contingent on the
                  submission of verifiable, case-solving information and applicable review processes.
                  All reward decisions are final. Bounty amounts are refundable only if the bounty is
                  not approved for publication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">Security and Anonymity</h2>
                <p className="text-muted-foreground">
                  We take extensive measures to protect anonymity and secure data, including optional
                  voice anonymization tools in the mobile apps. However, no system is completely
                  infallible, and anonymity protections are not absolute in every circumstance. By using
                  our service, you acknowledge and accept the inherent risks of transmitting information
                  online and should avoid including unnecessary personal identifiers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">Mobile Features</h2>
                <p className="text-muted-foreground">
                  Camera, microphone, photos, location, biometrics, and notifications are used only
                  when you enable the related feature. Tracking passwords cannot be recovered if lost.
                  Push alerts are designed not to include sensitive report contents.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <LinkIcon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">Third-Party Links and Services</h2>
                <p className="text-muted-foreground">
                  Our service may contain links to third-party websites or rely on third-party services
                  (such as payments, analytics, hosting, or push delivery) that are not owned or
                  controlled by ExpressCreo Limited. We assume no responsibility for the content,
                  privacy policies, or practices of third-party sites or services beyond our contractual
                  and operational controls.
                </p>
              </div>
            </div>

            <p className="font-semibold pt-4 border-t border-border">
              By using WhistleBlower.ng or the WhistleBlowerNG mobile apps, you acknowledge that you
              have read, understood, and agree to this disclaimer.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DisclaimerPage;
