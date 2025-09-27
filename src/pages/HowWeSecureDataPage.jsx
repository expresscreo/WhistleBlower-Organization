import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { Lock, ShieldCheck, Database, Server, Fingerprint, KeyRound, Globe, Route, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';

const AccordionItem = ({ item, isOpen, onToggle }) => {
    return (
        <div className="border-b border-gray-200 dark:border-[#2e2e2e] py-6">
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

const FaqItem = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border bg-card">
            <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold pr-4">{q}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />}
            </button>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4"
                >
                    <p className="text-muted-foreground leading-relaxed">{a}</p>
                </motion.div>
            )}
        </div>
    );
};

const HowWeSecureDataPage = () => {
    const [openId, setOpenId] = useState(1);

    const accordionItems = [
        {
            id: 1,
            title: 'End-to-End Encryption (E2EE)',
            description: "From the moment you start typing your report or bounty, your data is encrypted. It remains encrypted while in transit and at rest on our servers, meaning only authorized personnel can access it.",
            icon: Lock,
        },
        {
            id: 2,
            title: 'Anonymous by Design',
            description: "Our platform is built to protect your identity. We don't log IP addresses for submissions, and we strip all metadata from uploaded files to ensure your anonymity is preserved.",
            icon: Fingerprint,
        },
        {
            id: 3,
            title: 'Secure Password Protocols',
            description: "For tracking reports and bounties, we use Web Crypto API with PBKDF2 and SHA-256 to protect your password. We never store your password in plain text.",
            icon: KeyRound,
        },
        {
            id: 4,
            title: 'Regular Security Audits',
            description: "Our systems undergo frequent, independent security audits and penetration testing to identify and patch potential vulnerabilities before they can be exploited.",
            icon: ShieldCheck,
        },
        {
            id: 5,
            title: 'Data Isolation',
            description: "Report and bounty data is stored in isolated, secure databases with strict access controls. This prevents unauthorized access between different organizations and user accounts.",
            icon: Database,
        },
        {
            id: 6,
            title: 'Secure Infrastructure',
            description: "We partner with leading cloud providers that comply with top-tier international security standards like ISO 27001 and SOC 2, ensuring our physical and network infrastructure is robust and secure.",
            icon: Server,
        },
        {
            id: 7,
            title: 'Secure Communication Channels',
            description: "All communication between you and our platform, and between admins and users, happens over secure, encrypted channels (TLS 1.2+).",
            icon: Route,
        },
        {
            id: 8,
            title: 'DDoS Protection',
            description: "Our infrastructure is protected against Distributed Denial of Service (DDoS) attacks, ensuring the platform remains available and responsive when you need it most.",
            icon: Globe,
        },
    ];

    const faqs = [
        {
            q: 'How is my organization’s data protected from unauthorized access?',
            a: 'We use a multi-tenant architecture with strict data isolation. Your organization\'s data is logically separated and only accessible by authorized users from your organization with the correct permissions. We enforce role-based access control (RBAC) to ensure users can only see what they are supposed to.'
        },
        {
            q: 'Can employees of Whistleblower.ng access our confidential reports?',
            a: 'Access to production data is highly restricted to a small number of senior engineers for maintenance and troubleshooting purposes only. All access is logged and audited. We cannot view encrypted report content without proper authorization keys, which are managed securely.'
        },
        {
            q: 'How do you handle data backups and disaster recovery?',
            a: 'All data is backed up automatically on a daily basis to a secure, geographically separate location. Our disaster recovery plan is regularly tested to ensure we can restore service quickly in the event of a major outage, with minimal data loss.'
        },
        {
            q: 'Are your systems compliant with international standards?',
            a: 'Yes. Our infrastructure is hosted with providers who are certified for top-tier international standards like ISO 27001, SOC 2 Type II, and PCI DSS. Furthermore, our data hosting within the EU ensures compliance with GDPR, one of the strictest data protection regulations in the world.'
        }
    ];

    return (
        <>
            <SEOHead 
                {...generateSEOMeta({
                    ...DEFAULT_SEO_PAGES.secureData,
                    url: '/how-we-secure-your-data',
                    type: 'website'
                })}
            />
            <div className="bg-background text-foreground">
                <section className="pt-20 pb-16 bg-muted/40 relative">
                    {/* Mobile Background Image */}
                    <div 
                        className="absolute inset-0 md:hidden"
                        style={{
                            backgroundImage: 'url(/WBMedia/general/Mobile-Bannerxx-WhistleBlower.webp)',
                            backgroundAttachment: 'fixed',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover'
                        }}
                    ></div>
                    {/* Desktop Background Image */}
                    <div 
                        className="absolute inset-0 hidden md:block"
                        style={{
                            backgroundImage: 'url(/WBMedia/general/Bannerxx-WhistleBlower.webp)',
                            backgroundAttachment: 'fixed',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover'
                        }}
                    ></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                            <h1 className="text-4xl font-bold tracking-tight text-black" style={{ fontSize: '36px' }}>Your Security is Our Priority</h1>
                            <p className="mt-4 text-lg text-black max-w-3xl mx-auto">
                                We've engineered our platform from the ground up with one goal in mind: to provide a fortress for your information. Your trust is our most valuable asset, and we are committed to protecting it with state-of-the-art security.
                            </p>
                        </motion.div>
                    </div>
                </section>
                
                <section className="py-20 bg-gray-50 dark:bg-[#121212]">
                    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-start">
                            {/* Desktop image - shows on left side */}
                            <div className="relative aspect-square md:aspect-[3/4] bg-[#FF5100] overflow-hidden md:order-1 hidden md:block">
                                <img
                                    className="absolute inset-0 w-full h-full object-cover"
                                    alt="Our Security Framework - Multi-layered approach to data protection and anonymity."
                                    src="/WBMedia/general/Our Security Framework.webp" />
                            </div>
                            
                            <div className="md:order-2">
                                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                                    Our Security Framework
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8">
                                    Here's a look at the multi-layered approach we take to safeguard your data and guarantee your anonymity. 
                                    Each layer works together to create an impenetrable fortress for your information.
                                </p>
                                
                                {/* Image - shows after description on mobile, hidden on desktop */}
                                <div className="relative aspect-square bg-[#FF5100] overflow-hidden mb-8 md:hidden">
                                    <img
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt="Our Security Framework - Multi-layered approach to data protection and anonymity."
                                        src="/WBMedia/general/Our Security Framework.webp" />
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
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-muted/40">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">Compliance and Standards</h2>
                            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">We adhere to global standards to ensure your data is handled with the utmost care and in compliance with the strictest regulations.</p>
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                                <img src="/WBMedia/general/gdpr-compliant-badge.webp" alt="GDPR Compliant Badge" className="h-32 object-contain" />
                            </motion.div>
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                                <img src="/WBMedia/general/ndpc-logo.webp" alt="NDPC Nigeria Data Protection Commission Logo" className="h-20 object-contain" />
                            </motion.div>
                             <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                                <img src="/WBMedia/general/cyber-threat-defense-badge.webp" alt="Cyber Threat Defense Penetration Tested Badge" className="h-28 object-contain" />
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
                            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Answers to common questions about how we protect organizational data.</p>
                        </div>
                        <div className="max-w-3xl mx-auto space-y-4">
                            {faqs.map((faq, index) => (
                                <FaqItem key={index} q={faq.q} a={faq.a} />
                            ))}
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7 }}
                            >
                                <h2 className="text-3xl font-bold">Hosted in the European Union</h2>
                                <p className="mt-4 text-lg text-primary-foreground/90">
                                    As a Nigerian owned company, Whistleblower.ng hosts all its servers in the EU. By storing data in the EU, we guarantee compliance with the GDPR and all data relating to the whistleblower stays within the European Economic Area (EEA).
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default HowWeSecureDataPage;