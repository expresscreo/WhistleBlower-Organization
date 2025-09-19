
    import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();

  const quickLinks = [
    { name: 'Submit a Report', href: '/submit-report' },
    { name: 'Track a Report', href: '/track-report' },
    { name: 'News & Bounties', href: '/news' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Register', href: '/register' },
    { name: 'Login', href: '/login' },
  ];

  const companyLinks = [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Disclaimer', href: '/disclaimer' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/hiwhistleblower' },
    { icon: Twitter, href: 'https://twitter.com/hiwhistleblower' },
    { icon: Instagram, href: 'https://instagram.com/hiwhistleblower' },
    { icon: Linkedin, href: 'https://linkedin.com/company/hiwhistleblower' }
  ];
  
  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f090466-6ac5-4c98-9b96-8cfeb2ebf340/064fb39032844b545b5bc953f870bc69.png";

  return (
    <footer className="bg-[#0f0f0f] text-[#b4b4b4] border-t border-gray-800">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={logoUrl}
                alt="WhistleBlower.ng Logo" 
                style={{ width: '220.38px', height: '32px' }}
              />
            </div>
            <p className="text-[#b4b4b4] mb-4 max-w-md">
              Empowering Nigerian citizens to safely report crimes and illegal activities to appropriate public agencies. Stay anonymous, protect your identity, and help build a safer Nigeria.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#b4b4b4]">Follow us:</span>
              <div className="flex space-x-2">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#b4b4b4] hover:text-[#ff5100]"
                    onClick={() => window.open(social.href, '_blank')}
                  >
                    <social.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <span className="text-sm font-semibold text-white mb-4 block uppercase tracking-[1px]">Quick Links</span>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#b4b4b4] hover:text-[#ff5100] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <span className="text-sm font-semibold text-white mb-4 block uppercase tracking-[1px]">Company</span>
            <ul className="space-y-2">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#b4b4b4] hover:text-[#ff5100] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-[#b4b4b4]">
            © {new Date().getFullYear()} WhistleBlower.ng. All rights reserved.
          </p>
          
          {/* Theme Toggle */}
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-sm text-[#b4b4b4]">Theme:</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-[#b4b4b4] hover:text-[#ff5100]"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
  