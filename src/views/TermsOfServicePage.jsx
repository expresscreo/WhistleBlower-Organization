import React from 'react';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { FileText, CheckSquare, Shield, Code, Server, AlertCircle, Edit, Mail } from 'lucide-react';

const TermsOfServicePage = () => {
    return (
        <>
            <SEOHead 
                {...generateSEOMeta({
                    ...DEFAULT_SEO_PAGES.terms,
                    url: '/terms-of-service',
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
                        <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
                        <p className="text-lg text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-start gap-4">
                          <CheckSquare className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground">By accessing or using WhistleBlower.ng for reporting or placing bounties, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Server className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">2. Description of Service</h2>
                            <p className="text-muted-foreground">Our platform enables individuals to report illegal activities, place public bounties for information, and provides organizations with tools to manage these submissions securely and anonymously.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">3. User Conduct</h2>
                            <p className="text-muted-foreground">You agree to use the service responsibly. Submitting false information, harassing others, or attempting to compromise platform security is strictly prohibited. Bounty amounts are refundable only if the bounty is not approved for publication.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Code className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">4. Intellectual Property</h2>
                            <p className="text-muted-foreground">All content, logos, and software on this platform are the property of WhistleBlower.ng and are protected by intellectual property laws. Unauthorized use is prohibited.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">5. Disclaimers</h2>
                            <p className="text-muted-foreground">The service is provided "as is" without warranties. We do not guarantee error-free operation and are not responsible for the outcomes of investigations or the fulfillment of bounties based on submitted reports.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">6. Limitation of Liability</h2>
                            <p className="text-muted-foreground">WhistleBlower.ng shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including any financial loss related to bounties.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Edit className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">7. Changes to Terms</h2>
                            <p className="text-muted-foreground">We reserve the right to modify these terms at any time. Significant changes will be communicated, and continued use constitutes acceptance.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">8. Contact Us</h2>
                            <p className="text-muted-foreground">If you have questions about these terms, contact us at <a href="mailto:legal@whistleblower.ng" className="text-primary hover:underline">legal@whistleblower.ng</a>.</p>
                          </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default TermsOfServicePage;