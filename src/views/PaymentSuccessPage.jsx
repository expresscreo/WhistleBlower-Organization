import Link from 'next/link';
import React from 'react';
import PageHead from '@/components/PageHead';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const PaymentSuccessPage = () => {
  return (
    <>
      <PageHead title="Payment Successful! - WhistleBlower.ng" description="Your payment was successful. Your account has been activated. Proceed to login." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center"
      >
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold text-green-500 mb-6"
        >
          🎉 Payment Successful!
        </motion.h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-md">
          Thank you for your payment. Your account has been activated.
        </p>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md">
          You can now proceed to log in and access your dashboard.
        </p>
        <Link href="/login">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-3 uppercase tracking-wide"
          >
            Go to Login
          </Button>
        </Link>
      </motion.div>
    </>
  );
};

export default PaymentSuccessPage;