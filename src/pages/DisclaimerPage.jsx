import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Shield, BarChart, Link as LinkIcon, Info, Award } from 'lucide-react';

const DisclaimerPage = () => {
    return (
        <>
            <Helmet>
                <title>Disclaimer - WhistleBlower.ng</title>
                <meta name="description" content="Important disclaimers regarding the use of the WhistleBlower.ng platform." />
            </Helmet>
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
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-start gap-4">
                          <BookOpen className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">No Legal Advice</h2>
                            <p className="text-muted-foreground">The information provided on WhistleBlower.ng is for informational purposes only and does not constitute legal advice. We are not a law firm and do not provide legal services. You should consult with a qualified legal professional for advice on your specific situation.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">Platform for Reporting Only</h2>
                            <p className="text-muted-foreground">WhistleBlower.ng serves as a secure conduit for transmitting information from users to relevant authorities or organizations. We do not conduct our own investigations, nor do we have the authority to compel action from any third party. The responsibility for investigating and acting on reports lies solely with the receiving organizations.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <BarChart className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">Accuracy of Information</h2>
                            <p className="text-muted-foreground">While we encourage truthful and accurate reporting, we do not verify the information submitted by users. We are not liable for any false, inaccurate, or defamatory content submitted through our platform. Users are solely responsible for the content of their reports and bounties.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">No Guarantee of Outcome or Reward</h2>
                            <p className="text-muted-foreground">Submitting a report or placing a bounty does not guarantee any specific outcome, investigation, or action. Reward eligibility for reports is determined by the receiving organization. For bounties, payment is contingent on the submission of verifiable, case-solving information. All reward decisions are final. Bounty amounts are refundable only if the bounty is not approved for publication.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">Security and Anonymity</h2>
                            <p className="text-muted-foreground">We take extensive measures to protect your anonymity and secure your data. However, no system is completely infallible. By using our service, you acknowledge and accept the inherent risks of transmitting information online.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <LinkIcon className="h-6 w-6 text-primary flex-shrink-0 mt-1"/>
                          <div>
                            <h2 className="text-xl font-bold">Third-Party Links</h2>
                            <p className="text-muted-foreground">Our service may contain links to third-party websites or services that are not owned or controlled by WhistleBlower.ng. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>
                          </div>
                        </div>
                        
                        <p className="font-semibold pt-4 border-t border-border">By using WhistleBlower.ng, you acknowledge that you have read, understood, and agree to this disclaimer.</p>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default DisclaimerPage;