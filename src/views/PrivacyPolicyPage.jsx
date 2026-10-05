'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  Database,
  Lock,
  Share2,
  UserCheck,
  Edit,
  Mail,
  Smartphone,
  Bell,
  BarChart3,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const LAST_UPDATED = 'October 5, 2026';

const PrivacyPolicyPage = () => {
  return (
    <>
      <SEOHead
        {...generateSEOMeta({
          ...DEFAULT_SEO_PAGES.privacy,
          url: '/privacy-policy',
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
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">Last Updated: {LAST_UPDATED}</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
              This policy applies to WhistleBlower.ng and the WhistleBlowerNG mobile apps, published by
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
              <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-3">
                  We collect information you choose to provide when using our website or mobile apps,
                  including when you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    Submit a report or tip (incident details, optional evidence such as photos, videos,
                    documents, or voice notes, and optional contact details for rewards).
                  </li>
                  <li>
                    Place a bounty (case details, reward amount, and related materials you upload).
                  </li>
                  <li>
                    Create tracking credentials (a tracking ID and password you set so you can follow
                    your submission later).
                  </li>
                  <li>Contact support or use partner/organization accounts where applicable.</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  We may also collect limited technical and device information needed to operate and
                  improve the service (for example browser or app type, device platform, approximate
                  diagnostics, and push notification device tokens when you opt in).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">2. Mobile App Permissions</h2>
                <p className="text-muted-foreground mb-3">
                  On WhistleBlowerNG, device permissions are requested only when you start a relevant
                  action:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Camera, microphone, and photo library — to attach evidence or record a voice report.</li>
                  <li>Location — only for optional emergency-state contact lookup.</li>
                  <li>
                    Face ID / biometrics — only to unlock tracking credentials saved locally on your
                    device.
                  </li>
                  <li>
                    Notifications — only if you enable public alerts or tracker updates on that device.
                  </li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  Optional voice anonymization tools are designed to help reduce the risk of voice-based
                  identification; they do not guarantee absolute anonymity in all circumstances.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">3. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  Your information is used to process reports and bounties, route submissions to the
                  relevant receiving organizations or authorities, enable secure tracking and
                  follow-up messaging, process verified rewards and payments, send the push or in-app
                  alerts you opt into, manage partner accounts, maintain platform security, and improve
                  product reliability and public-safety features.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <BarChart3 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">4. Analytics</h2>
                <p className="text-muted-foreground">
                  We use privacy-conscious analytics (including Google Analytics / Firebase Analytics)
                  to understand aggregate product usage, such as public screen views and content
                  engagement. We design analytics to avoid logging sensitive report contents, tracking
                  passwords, chat messages, evidence details, or similar confidential submission data.
                  Analytics helps us improve performance and public features; it is not used to
                  identify anonymous reporters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">5. Push Notifications</h2>
                <p className="text-muted-foreground">
                  If you enable notifications, we store a device push token and your alert preferences
                  so we can deliver public alerts or tracker-status notices. Notification payloads are
                  designed not to include sensitive report content, passwords, paycodes, evidence
                  names, or private chat text. You can disable notifications in device settings or
                  in-app preferences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">6. Data Security</h2>
                <p className="text-muted-foreground">
                  We use industry-standard encryption in transit, access controls, and secure
                  infrastructure to protect data. We design the platform so reporter identity is kept
                  confidential from the public and from reported parties, except where you choose to
                  share contact details (for example for rewards) or where disclosure is required by
                  law. No online system is perfectly secure, and you should avoid including unnecessary
                  personal identifiers in submissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Share2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">7. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal data. Information may be shared with relevant receiving
                  organizations or authorities for review and investigation, with service providers who
                  help us operate the platform (for example hosting, payments, analytics, and push
                  delivery) under appropriate safeguards, or when required by law. Public bounty
                  details may be published after review, but the identity of the bounty placer remains
                  anonymous by design. News, bounty, and wanted listings shown publicly are
                  platform-managed editorial or public-interest content.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <UserCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">8. Your Rights and Tracking Credentials</h2>
                <p className="text-muted-foreground">
                  You can track your submission using the ID and password you created. Passwords cannot
                  be recovered if lost. For integrity reasons, anonymous reports and bounties generally
                  cannot be deleted or rewritten by users after submission, but you may be able to add
                  updates through the secure tracker. Optional credentials saved on a mobile device stay
                  on that device and can be removed from the app.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Edit className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this policy periodically. We will post the updated policy on this page
                  with a revised “Last Updated” date. Continued use of the website or mobile apps after
                  changes means you accept the updated policy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  WhistleBlower.ng / WhistleBlowerNG is operated by ExpressCreo Limited. If you have
                  any questions, please contact us at{' '}
                  <a href="mailto:privacy@whistleblower.ng" className="text-primary hover:underline">
                    privacy@whistleblower.ng
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

export default PrivacyPolicyPage;
