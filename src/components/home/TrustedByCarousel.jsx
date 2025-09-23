import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowRight } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";

const slides = [
    {
        industry: "Financial Institutions",
        description: "Enhancing transparency and accountability in banking by providing a secure channel for reporting fraud and misconduct.",
        imageSrc: "/WBMedia/general/Financial-Institutions.webp",
        alt: "Financial institutions and banking sector representation."
    },
    {
        industry: "Government Agencies",
        description: "Empowering civil servants and the public to report corruption and inefficiency, fostering better governance.",
        imageSrc: "/WBMedia/general/Government-Agencies.webp",
        alt: "Government agencies and public sector representation."
    },
    {
        industry: "Healthcare Sector",
        description: "Ensuring patient safety and ethical practices by enabling anonymous reporting of malpractice and negligence.",
        imageSrc: "/WBMedia/general/Healthcare-Sector.webp",
        alt: "Healthcare sector and medical services representation."
    },
    {
        industry: "Educational Institutions",
        description: "Promoting a safe and fair learning environment by addressing issues like bullying, harassment, and academic fraud.",
        imageSrc: "/WBMedia/general/Educational-Institutions.webp",
        alt: "Educational institutions and academic sector representation."
    },
    {
        industry: "Corporate & Private Sector",
        description: "Upholding corporate integrity through a confidential system for employees to report unethical behavior and compliance breaches.",
        imageSrc: "/WBMedia/general/Corporate-Private-Sector.webp",
        alt: "Corporate and private sector business representation."
    }
];

const TrustedByCarousel = () => {
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    return (
        <section className="py-20 bg-background">
            <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl md:text-4xl font-bold">
                        <span style={{ color: '#707070' }}>Trusted Across</span> Organizations And Agencies
                    </h2>
                </motion.div>

                <Carousel
                    plugins={[plugin.current]}
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <div className="relative">
                        <CarouselContent>
                            {slides.map((slide, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-1">
                                        <Card className="bg-[#f8fafc] dark:bg-card overflow-hidden">
                                            <CardContent className="flex flex-col md:flex-row items-center gap-8 p-8">
                                                <div className="w-full md:w-1/2 h-64 md:h-80 flex-shrink-0">
                                                    <img 
                                                        className="w-full h-full object-cover"
                                                        alt={slide.alt}
                                                        src={slide.imageSrc} 
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-center text-left w-full md:w-1/2">
                                                    <h3 className="text-3xl font-bold mb-4">{slide.industry}</h3>
                                                    <p className="text-lg text-[#828997] mb-6">{slide.description}</p>
                                                    <Link to="/about-us">
                                                        <Button
                                                            variant="ghost"
                                                            className="p-0 h-auto justify-start text-primary hover:text-primary/80"
                                                        >
                                                            <div className="flex items-center">
                                                                <div className="border border-primary p-2 mr-3 transition-colors hover:bg-primary/10">
                                                                    <ArrowRight className="h-5 w-5" />
                                                                </div>
                                                                <span className="font-semibold uppercase tracking-[1px]">Read More</span>
                                                            </div>
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="hidden md:block absolute top-4 right-4">
                            <CarouselPrevious className="static translate-y-0 w-10 h-10" />
                            <CarouselNext className="static translate-y-0 w-10 h-10 ml-2" />
                        </div>
                    </div>
                    <div className="md:hidden flex justify-center mt-4">
                        <CarouselPrevious className="static translate-y-0 w-10 h-10" />
                        <CarouselNext className="static translate-y-0 w-10 h-10 ml-2" />
                    </div>
                </Carousel>
            </div>
        </section>
    );
};

export default TrustedByCarousel;