
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { Helmet } from 'react-helmet';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Helmet>
      <title>WhistleBlower.ng — Report Crime Securely, And Get Paid!</title>
      <meta name="description" content="Nigeria's premier platform for anonymous crime reporting and public bounties. Your courage contributes to a safer society and is recognized. Stay anonymous, report crime, and get rewarded." />
      <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    </Helmet>
    <App />
  </React.StrictMode>
);
