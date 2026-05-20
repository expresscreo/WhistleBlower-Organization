import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Mail, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const ComingSoonPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const videoRef = useRef(null);

  useEffect(() => {
    // Set launch date to 7 days from now
    const launchDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime();
    
    // Initialize immediately
    const now = new Date().getTime();
    const distance = launchDate - now;
    
    if (distance > 0) {
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty dependency array - run once on mount

  // Try to ensure autoplay on mount and on first interaction (mobile-safe)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure required attributes are set for mobile autoplay
    video.muted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    video.setAttribute('playsinline', '');

    const tryPlay = () => {
      return video.play().catch(() => {});
    };

    // Attempt immediately
    tryPlay();

    // Fallback: unlock on first user interaction
    const unlock = () => {
      tryPlay();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true, once: true });
    document.addEventListener('click', unlock, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically send the email to your backend
      console.log('Email submitted:', email);
    }
  };

  const TimeUnit = ({ value, label }) => {
    return (
      <div className="text-center">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-lg p-2 sm:p-3 md:p-4 w-[100px] sm:w-[110px]">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{value}</div>
          <div className="text-xs sm:text-xs md:text-sm opacity-90 uppercase tracking-wide">{label}</div>
        </div>
      </div>
    );
  };

  const features = [
    {
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Advanced encryption and anonymity features'
    },
    {
      icon: Zap,
      title: 'Faster Processing',
      description: 'Streamlined report submission and tracking'
    },
    {
      icon: Mail,
      title: 'Better Notifications',
      description: 'Real-time updates on your report status'
    }
  ];

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.home,
    title: 'Coming Soon - WhistleBlower.ng',
    description: 'WhistleBlower.ng is getting even better. Stay tuned for our enhanced platform with improved security, faster processing, and better user experience.',
    url: '/',
    type: 'website'
  });

  return (
    <>
      <SEOHead {...seoMeta} />
      
      {/* Background */}
      <div className="min-h-screen relative overflow-hidden bg-black">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          ref={videoRef}
          onLoadedData={() => setVideoLoaded(true)}
          onError={(e) => {
            console.log('Video error:', e);
            setVideoError('Video failed to load');
            setVideoLoaded(false);
          }}
          onCanPlayThrough={(e) => {
            setVideoLoaded(true);
            const video = e.target;
            // Force play immediately
            video.play().catch(() => {
              // If autoplay fails, try on any user interaction
              const playVideo = () => {
                video.play().catch(() => {});
                document.removeEventListener('touchstart', playVideo);
                document.removeEventListener('click', playVideo);
              };
              document.addEventListener('touchstart', playVideo, { passive: true });
              document.addEventListener('click', playVideo);
            });
          }}
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            backgroundColor: '#000',
            filter: 'grayscale(100%)'
          }}
        >
          <source src="/WBMedia/general/World Video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-30 bg-black/80 text-white p-2 rounded text-xs max-w-[200px] sm:max-w-none">
            Video loaded: {videoLoaded ? 'Yes' : 'No'}<br/>
            Video error: {videoError || 'None'}<br/>
            Time: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10" />
        
        {/* Content */}
        <div className="relative z-20 min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-0">
          <div className="max-w-4xl mx-auto text-center">

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 px-4 sm:px-0">
                Something Amazing is
                <span className="block text-primary">Coming Soon</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
                We're working hard to bring you an enhanced platform with better security, 
                faster processing, and an improved user experience. Stay tuned!
              </p>
            </motion.div>

            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8 sm:mb-12"
            >
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 px-4 sm:px-0">
                <TimeUnit value={timeLeft.days} label="Days" />
                <TimeUnit value={timeLeft.hours} label="Hours" />
                <TimeUnit value={timeLeft.minutes} label="Minutes" />
                <TimeUnit value={timeLeft.seconds} label="Seconds" />
              </div>
            </motion.div>

            {/* Email Signup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-8 sm:mb-12"
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md mx-auto mx-4 sm:mx-auto">
                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-xl font-semibold text-white mb-4">
                        Get Notified When We Launch
                      </h3>
                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:border-primary"
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90 text-white"
                        >
                          Notify Me
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Thank You!
                      </h3>
                      <p className="text-gray-300">
                        We'll notify you as soon as we launch.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-8 sm:mb-12"
            >
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 sm:mb-8 px-4 sm:px-0">
                What's Coming
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto px-4 sm:px-0">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-300 text-xs sm:text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-4 h-4 bg-primary/30 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-40 right-20 w-6 h-6 bg-primary/20 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-40 left-20 w-3 h-3 bg-primary/40 rounded-full"
          />
        </div>
      </div>
    </>
  );
};

export default ComingSoonPage;
