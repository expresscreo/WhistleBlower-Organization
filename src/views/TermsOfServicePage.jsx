'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import {
  FileText,
  CheckSquare,
  Shield,
  Code,
  Server,
  AlertCircle,
  Edit,
  Mail,
  Target,
  Smartphone,
  Newspaper,
} from 'lucide-react';

const LAST_UPDATED = 'October 5, 2026';

const TermsOfServicePage = () => {
  return (
    <>
      <SEOHead
        {...generateSEOMeta({
          ...DEFAULT_SEO_PAGES.terms,
          url: '/terms-of-service',
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
            <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-muted-foreground">Last Updated: {LAST_UPDATED}</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
              These terms apply to WhistleBlower.ng and the WhistleBlowerNG mobile apps, published by
              ExpressCreo Limited.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <CheckSquare className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using WhistleBlower.ng or the WhistleBlowerNG mobile apps for
                  reporting, browsing public safety content, tracking submissions, or placing
                  bounties, you agree to be bound by these Terms of Service. If you disagree with any
                  part of the terms, you may not access the service.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Server className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  WhistleBlower is a moderated public-interest reporting and accountability platform.
                  It enables individuals to report crime or misconduct (including anonymously), track
                  submissions securely, browse platform-managed news/bounty/wanted information, and
                  optionally place public information bounties that are reviewed before publication.
                  Organizations may use related tools to manage submissions. The platform is a conduit
                  for information and is not a vigilante service, law firm, or law-enforcement agency.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">3. Mobile Apps</h2>
                <p className="text-muted-foreground">
                  The WhistleBlowerNG mobile apps provide citizen-facing features of the platform. Core
                  reporting and browsing do not require creating an account. Device permissions are used
                  only for the features you initiate. Tracking credentials you save on a device remain
                  your responsibility to protect.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">4. User Conduct</h2>
                <p className="text-muted-foreground">
                  You agree to use the service responsibly. Submitting false information, harassing
                  others, attempting to dox or endanger people, misusing rewards or bounties, or
                  attempting to compromise platform security is strictly prohibited. Bounty amounts are
                  refundable only if the bounty is not approved for publication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Target className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">5. Bounty Setters &amp; Accuracy of Information</h2>
                <p className="text-muted-foreground mb-3">
                  When you place a bounty on WhistleBlower.ng or in the mobile apps, you acknowledge and
                  agree that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    All information you provide—including case details, descriptions, locations, dates,
                    evidence, and reward terms—is accurate, complete, and truthful to the best of your
                    knowledge.
                  </li>
                  <li>
                    You have reviewed your submission and understand that you are placing it with full
                    knowledge that the information you provide is correct and reliable.
                  </li>
                  <li>
                    You are solely responsible for the content, claims, and materials you submit in
                    connection with a bounty.
                  </li>
                  <li>You will not knowingly submit false, misleading, defamatory, or fabricated information.</li>
                  <li>
                    You accept full responsibility for any harm, loss, legal claim, or liability arising
                    from inaccurate, incomplete, or misleading information you provide.
                  </li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  Bounties are reviewed before publication. We reserve the right to reject, suspend,
                  modify, or remove any bounty that appears inaccurate, incomplete, unlawful, or in
                  violation of these terms. Payment of any bounty reward is contingent on verifiable,
                  case-solving information and applicable review processes — not automatic payout for
                  unverified claims.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Newspaper className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">6. Public Content (News, Bounties, Wanted)</h2>
                <p className="text-muted-foreground">
                  Public listings shown in News, Bounties, and Wanted areas are platform-managed
                  editorial or public-interest content. Users may tip into listed cases through the
                  reporting tools, but the service is not an open unmoderated wall for publishing
                  accusations. We may edit, withhold, or remove public content at our discretion.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Code className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">7. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, logos, and software on this platform are owned by ExpressCreo Limited
                  and/or used under the WhistleBlower / WhistleBlower.ng product brand, and are protected
                  by intellectual property laws. Unauthorized use is prohibited.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">8. Disclaimers</h2>
                <p className="text-muted-foreground">
                  The service is provided &quot;as is&quot; without warranties. We do not guarantee
                  error-free operation and are not responsible for the outcomes of investigations or the
                  fulfillment of bounties based on submitted reports.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">9. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the fullest extent permitted by law, ExpressCreo Limited and the WhistleBlower
                  platform shall not be liable for any indirect, incidental, or consequential damages
                  arising from your use of the service, including any financial loss related to
                  bounties or rewards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Edit className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">10. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Significant changes will be
                  communicated by updating this page, and continued use constitutes acceptance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">11. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about these terms, contact us at{' '}
                  <a href="mailto:legal@whistleblower.ng" className="text-primary hover:underline">
                    legal@whistleblower.ng
                  </a>
                  .
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
