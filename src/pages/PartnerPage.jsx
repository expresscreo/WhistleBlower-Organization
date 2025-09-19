import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building, ShieldCheck, BarChart2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PartnerPage = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Enhanced Transparency',
      description: 'Build public trust by providing a secure and transparent channel for stakeholders to voice concerns and report misconduct.',
    },
    {
      icon: BarChart2,
      title: 'Actionable Insights',
      description: 'Receive structured, verified reports directly through our platform, allowing you to identify trends and address systemic issues proactively.',
    },
    {
      icon: Building,
      title: 'Streamlined Case Management',
      description: 'Utilize our intuitive dashboard to manage, track, and resolve submitted reports efficiently, all in one place.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Partner Program - WhistleBlower.ng</title>
        <meta name="description" content="Join the WhistleBlower.ng network. Partner with us to receive direct reports, enhance transparency, and manage cases efficiently." />
      </Helmet>
      <div className="bg-background text-foreground">
        <section className="relative py-20 md:py-32 hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Become a <span className="gradient-text">WhistleBlower.ng Partner</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Join a growing network of public organizations and government agencies committed to fostering accountability and transparency in Nigeria.
              </p>
              <Link to="/register">
                <Button size="lg" className="px-8 py-4 text-base">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">Why Partner with Us?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Our platform empowers your organization to handle reports with integrity and efficiency.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center mb-4">
                        <benefit.icon className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle>{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start receiving and managing reports today. Our team is here to support you every step of the way.
              </p>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="px-8 py-4 text-base">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PartnerPage;