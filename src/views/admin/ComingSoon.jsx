import React from 'react';
import { Helmet } from 'react-helmet';
import { Construction } from 'lucide-react';

const ComingSoon = ({ pageName }) => {
  return (
    <>
      <Helmet>
        <title>{pageName} - Coming Soon</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Construction className="h-24 w-24 text-primary mb-6" />
        <h1 className="text-4xl font-bold mb-2">{pageName}</h1>
        <p className="text-2xl font-semibold text-muted-foreground mb-4">Coming Soon!</p>
        <p className="max-w-md text-muted-foreground">
          We're working hard to bring you this feature. Stay tuned for updates!
        </p>
      </div>
    </>
  );
};

export default ComingSoon;