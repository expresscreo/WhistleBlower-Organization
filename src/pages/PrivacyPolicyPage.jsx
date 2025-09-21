import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Database, Lock, Share2, UserCheck, Edit, Mail } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const PrivacyPolicyPage = () => {
    return (
        <>
            <SEOHead 
                {...generateSEOMeta({
                    ...DEFAULT_SEO_PAGES.privacy,
                    url: '/privacy-policy',
                    type: 'website'
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
                        <p className="text-lg text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="space-y-8"
                    >
                         <div className="flex items-start gap-4">
                            <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">1. Information We Collect</h2>
                                <p className="text-muted-foreground">We collect information you provide when submitting a report or placing a bounty (e.g., incident details, contact info for rewards) and non-personal data (e.g., browser type) to improve our service.</p>
                            </div>
                        </div>

                         <div className="flex items-start gap-4">
                            <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">2. How We Use Your Information</h2>
                                <p className="text-muted-foreground">Your information is used to process reports and bounties, enable tracking, process rewards and payments, manage partner accounts, and enhance platform security and functionality.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">3. Data Security</h2>
                                <p className="text-muted-foreground">We use end-to-end encryption and secure servers to protect your data. We ensure your identity remains confidential from the reported organization and the public.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Share2 className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">4. Data Sharing and Disclosure</h2>
                                <p className="text-muted-foreground">We do not sell your data. Information is shared only with your consent, with relevant authorities for investigation, or when required by law. Bounty details are published, but the identity of the placer remains anonymous.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <UserCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">5. Your Rights</h2>
                                <p className="text-muted-foreground">You can track your submission using the credentials you created. For integrity reasons, anonymous reports and bounties cannot be modified or deleted by users after submission, but they can be updated with new information.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Edit className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">6. Changes to This Policy</h2>
                                <p className="text-muted-foreground">We may update this policy periodically. We will notify you of any changes by posting the new policy on this page.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-bold">7. Contact Us</h2>
                                <p className="text-muted-foreground">If you have any questions, please contact us at <a href="mailto:privacy@whistleblower.ng" className="text-primary hover:underline">privacy@whistleblower.ng</a>.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicyPage;