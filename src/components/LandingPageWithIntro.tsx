import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { IntroScreen } from './IntroScreen';
import LandingPage from '@/pages/LandingPage';

const INTRO_SEEN_KEY = 'farmsquare_seen_intro';

/**
 * Wrapper component that shows intro screen before landing page
 * Intro shows once per browser session (stored in sessionStorage)
 * Testing override: Add ?intro=1 to URL to force show intro
 */
export const LandingPageWithIntro = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Only show intro on the exact "/" route
    if (location.pathname === '/') {
      // Check for testing override: ?intro=1 forces intro to show
      const forceIntro = searchParams.get('intro') === '1';
      
      if (forceIntro) {
        // Testing override - always show intro
        setShowIntro(true);
      } else {
        // Normal behavior - check sessionStorage
        const introSeen = sessionStorage.getItem(INTRO_SEEN_KEY) === 'true';
        // Only show intro if it hasn't been seen in this session
        setShowIntro(!introSeen);
      }
    } else {
      setShowIntro(false);
    }
    setIsChecking(false);
  }, [location.pathname, searchParams]);

  const handleIntroComplete = () => {
    // Mark intro as seen in sessionStorage (per session, not persistent)
    sessionStorage.setItem(INTRO_SEEN_KEY, 'true');
    setShowIntro(false);
  };

  // Don't render anything while checking (prevents flash)
  if (isChecking) {
    return null;
  }

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return <LandingPage />;
};
