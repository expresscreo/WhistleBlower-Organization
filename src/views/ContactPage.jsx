'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FieldError, FieldSuccess } from '@/components/ui/form-feedback';
import { supabase } from '@/lib/customSupabaseClient';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '', honeypot: '' });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ error: '', success: '' });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ error: '', success: '' });
        setLoading(true);

        const { name, email, subject, message, honeypot } = formData;
        if (!name || !email || !subject || !message) {
            setFeedback({ error: 'Please fill out all required fields.', success: '' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('send-contact-email', {
                body: { name, email, subject, message, honeypot },
            });

            if (error) throw new Error(error.message);

            setFeedback({
                error: '',
                success: "Thank you for contacting us. We'll get back to you shortly.",
            });
            setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
        } catch (error) {
            setFeedback({
                error: 'Could not send message. Please try again later.',
                success: '',
            });
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        { icon: Mail, title: 'Email Us', content: 'support@whistleblower.ng', href: 'mailto:support@whistleblower.ng' },
        { icon: Phone, title: 'Call Us', content: '+234 800 WHISTLE', href: 'tel:+2348009447853' },
        { icon: MapPin, title: 'Our Office', content: 'Lagos, Nigeria', href: '#' },
    ];

    // Generate SEO metadata
    const seoMeta = generateSEOMeta({
        ...DEFAULT_SEO_PAGES.contact,
        url: '/contact',
        type: 'website'
    });

    return (
        <>
            <SEOHead {...seoMeta} />
            <div className="bg-background text-foreground py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We're here to help. Whether you have a question about our platform, our pricing, or anything else, our team is ready to answer all your questions.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 border">
                                <h2 className="text-2xl font-bold">Send us a Message</h2>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={formData.name} onChange={handleChange} required autoComplete="name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input type="email" id="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" value={formData.subject} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" value={formData.message} onChange={handleChange} required rows={5} />
                                </div>
                                <input type="hidden" id="honeypot" name="honeypot" value={formData.honeypot} onChange={handleChange} />
                                <FieldError message={feedback.error} />
                                <FieldSuccess message={feedback.success} />
                                <Button type="submit" className="w-full" loading={loading}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Message
                                </Button>
                            </form>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="space-y-8"
                        >
                            {contactInfo.map((info, index) => (
                                <div key={index} className="flex items-start space-x-4">
                                    <div className="bg-primary/10 p-3">
                                        <info.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{info.title}</h3>
                                        <a href={info.href} className="text-muted-foreground hover:text-primary transition-colors">{info.content}</a>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContactPage;