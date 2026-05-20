'use client';

import { AnimatePresence, motion } from 'framer-motion';

export default function SubmitReportStepHero({ stepMeta, direction = 1 }) {
  const Icon = stepMeta?.icon;

  return (
    <div className="submit-report-hero text-center mb-6 md:mb-8 px-1">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={stepMeta?.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {Icon && (
            <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto" aria-hidden />
          )}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {stepMeta?.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {stepMeta?.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
