
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const accordionItems = [
  {
    id: 1,
    title: 'Place a Bounty',
    description: 'Need specific information? Put a price on it. Create a public bounty to crowdsource the intelligence you need to resolve cases, find missing persons, or recover assets.',
    buttonText: 'PLACE A BOUNTY',
    link: '/place-bounty',
  },
  {
    id: 2,
    title: 'Track a Bounty',
    description: 'Already placed a bounty or submitted a report against one? Securely monitor its status, communicate with admins, and see the impact of your contribution in real-time.',
    buttonText: 'TRACK A SUBMISSION',
    link: '/track',
  },
  {
    id: 3,
    title: 'Search for Bounties',
    description: 'Explore all active and published bounties. See what information is being sought and contribute to ongoing investigations by submitting a report against a bounty.',
    buttonText: 'SEARCH BOUNTIES',
    link: '/news/bounty',
  },
  {
    id: 4,
    title: 'More Info About Bounties',
    description: 'Our bounty system is a proactive tool for justice. It empowers individuals and organizations to incentivize the public to provide crucial information, accelerating investigations and resolutions.',
    buttonText: 'LEARN MORE',
    link: '/faq',
  },
];

const AccordionItem = ({ item, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-6">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left"
      >
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">{item.title}</h3>
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
            <p className="text-muted-foreground mb-4">{item.description}</p>
            <Link to={item.link}>
              <Button variant="link" className="p-0 h-auto text-primary font-bold">
                {item.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BountyAccordion = () => {
  const [openId, setOpenId] = useState(1);

  return (
    <section className="py-20 bg-[#F9F5F0] dark:bg-[#121212]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-square md:aspect-[3/4] bg-[#FF5100] overflow-hidden">
            <img
              className="absolute inset-0 w-full h-full object-cover"
              alt="A person looking at a phone screen with a magnifying glass icon, symbolizing searching for information."
             src="https://images.unsplash.com/photo-1701783646331-10977357db92" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
              Take an Active Role with Public Bounties
            </h2>
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
  );
};

export default BountyAccordion;
