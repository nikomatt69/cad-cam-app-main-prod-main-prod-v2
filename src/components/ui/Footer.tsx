import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import urlcat from 'urlcat';
import Image from 'next/image';

const Footer: FC = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 px-4 py-6 text-sm">
      <div className="container mx-auto flex flex-col items-center gap-y-4 sm:flex-row sm:justify-between">

        {/* Left Side: Logo & Copyright */}
        <div className="flex flex-col items-center gap-y-2 sm:flex-row sm:items-center sm:gap-x-3">
    
            {/* Wrap Image in a span to potentially fix prop issue */}
            <span> 
              <Image
                src="/logo.png"
                alt="CAD/CAM FUN Logo"
                width={100}
                height={100} // Adjust base aspect ratio if needed
                className="h-6 w-auto sm:h-8" // Responsive height
              />
            </span>

          <span className="text-gray-500 dark:text-gray-400 text-center sm:text-left">
            © {currentYear || '...'} CAD/CAM FUN. All Rights Reserved.
          </span>
        </div>

        {/* Right Side: Links & Vercel */}
        <div className="flex flex-col items-center gap-y-2 sm:flex-row sm:items-center sm:gap-x-4">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/legal/terms" className="hover:underline">Terms</Link>
            <Link href="/legal/privacy-policy" className="hover:underline">Privacy</Link>
            <Link href="/legal/third-party-licenses" className="hover:underline">Licenses</Link>
          </div>
          <Link
            className="flex items-center gap-x-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
            href={urlcat('https://vercel.com', { utm_campaign: 'oss' })}
            target="_blank"
            rel="noreferrer noopener"
          >
            <span className="text-lg">▲</span> {/* Using text triangle */}
            <span>Powered by Vercel</span>
          </Link>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
