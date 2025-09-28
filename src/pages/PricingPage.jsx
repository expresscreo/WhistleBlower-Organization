import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const PricingCard = ({ plan, isAnnual, onGetStarted }) => {
  const annualDiscount = 0.20;
  const price = plan.price.replace(/[^0-9]/g, '');
  const monthlyPrice = parseInt(price, 10);
  const annualPriceMonthly = Math.round(monthlyPrice * (1 - annualDiscount));
  const totalAnnualPrice = annualPriceMonthly * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative p-8 border border-border bg-card hover:shadow-lg transition-all duration-300 flex flex-col ${
        plan.popular ? 'border-primary shadow-lg scale-105' : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-primary-foreground px-4 py-1 text-sm font-medium flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>Most Popular</span>
          </div>
        </div>
      )}

      <div className="text-center mb-8 flex-grow">
        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
        {plan.price !== 'Custom' ? (
          <div className="mb-4">
            <div className="relative h-12">
              <span className={`text-4xl font-bold text-primary transition-all duration-300 ${isAnnual ? 'opacity-0' : 'opacity-100'}`}>
                ₦{monthlyPrice.toLocaleString()}
              </span>
              <span className={`absolute left-0 right-0 top-0 text-4xl font-bold text-primary transition-all duration-300 ${isAnnual ? 'opacity-100' : 'opacity-0'}`}>
                ₦{annualPriceMonthly.toLocaleString()}
              </span>
            </div>
            <span className="text-muted-foreground">{isAnnual ? `/month (billed as ₦${totalAnnualPrice.toLocaleString()}/year)` : '/month'}</span>
            {isAnnual && (
              <p className="text-primary text-sm font-semibold mt-1">
                Save 20% with annual billing!
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4 h-12 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">{plan.price}</span>
          </div>
        )}
        <p className="text-muted-foreground text-sm">{plan.description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-start space-x-3">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`w-full mt-auto group ${
          plan.popular 
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
        }`}
        onClick={() => onGetStarted(plan.planId)}
      >
        {plan.planId === 'enterprise-plus' ? 'CONTACT SALES' : 'GET STARTED'}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Button>
    </motion.div>
  );
};

const FAQItem = ({ question, answer, align = 'left' }) => (
  <div className={`text-${align}`}>
    <h3 className="font-semibold mb-2">{question}</h3>
    <p className="text-muted-foreground text-sm">{answer}</p>
  </div>
);

const PricingPage = () => {
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    { name: 'Basic', price: '₦150,000', description: 'For small organizations.', features: ['Up to 50 reports/month', 'Basic dashboard', 'Email notifications', 'Standard support'], popular: false, planId: 'basic' },
    { name: 'Professional', price: '₦400,000', description: 'For medium-sized orgs.', features: ['Up to 200 reports/month', 'Advanced dashboard', 'Real-time notifications', 'Priority support', 'API access'], popular: true, planId: 'professional' },
    { name: 'Enterprise', price: '₦800,000', description: 'For large organizations.', features: ['Unlimited reports', 'Full dashboard suite', '24/7 dedicated support', 'Advanced integrations', 'Complete white-labeling'], popular: false, planId: 'enterprise' },
    { name: 'Enterprise Plus', price: 'Custom', description: 'Tailored solutions.', features: ['Everything in Enterprise', 'Custom development', 'On-premise deployment', 'Dedicated account manager'], popular: false, planId: 'enterprise-plus' }
  ];
  
  const faqs = [
    { question: 'What payment methods do you accept?', answer: 'We accept bank transfers, cards, and other Nigerian payment methods.', align: 'right' },
    { question: 'Do you offer custom solutions?', answer: 'Yes, our Enterprise Plus plan includes custom development and integrations.', align: 'left' },
    { question: 'Is there a setup fee?', answer: 'No setup fees for any plan. You only pay the monthly subscription fee.', align: 'right' },
    { question: 'Can I change plans anytime?', answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.', align: 'left' },
  ];

  const handleGetStarted = (planId) => {
    if (planId === 'enterprise-plus') {
      toast({ title: "🚧 Custom Pricing Available!", description: "Contact our sales team for custom Enterprise Plus pricing and features!" });
    } else {
      window.location.href = `/register?plan=${planId}`;
    }
  };

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.pricing,
    url: '/pricing',
    type: 'website'
  });

  return (
    <>
      <SEOHead {...seoMeta} />
      <div className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">Choose Your <span className="gradient-text">Plan</span></h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">Transparent pricing with no hidden fees. All plans include secure reporting, analytics, and dedicated support.</p>
            <div className="flex items-center justify-center space-x-4">
              <Label htmlFor="pricing-toggle" className="text-muted-foreground">Monthly</Label>
              <Switch id="pricing-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} />
              <Label htmlFor="pricing-toggle" className="text-muted-foreground">
                Annual <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold">Save 20%</span>
              </Label>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {plans.map((plan, index) => <PricingCard key={index} plan={plan} isAnnual={isAnnual} onGetStarted={handleGetStarted} />)}
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="mt-20 text-center">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked <span className="gradient-text">Questions</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-w-5xl mx-auto">
              {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
            </div>
            <div className="mt-12">
              <p className="text-muted-foreground mb-4">Need help choosing the right plan?</p>
              <Link to="/contact">
                  <Button variant="outline" size="lg" className="uppercase">Contact Our Sales Team</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;