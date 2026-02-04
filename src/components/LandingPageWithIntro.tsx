import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IntroScreen } from './IntroScreen';
import LandingPage from '@/pages/LandingPage';

const INTRO_SEEN_KEY = 'farmsquare_intro_seen';

/**
 * Wrapper component that shows intro screen before landing page
 * Intro shows only once for new users (stored in localStorage)
 */
export const LandingPageWithIntro = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Only show intro on the exact "/" route
    if (location.pathname === '/') {
      // Always show intro on homepage (removed localStorage check for refresh)
      setShowIntro(true);
    } else {
      setShowIntro(false);
    }
    setIsChecking(false);
  }, [location.pathname]);

  const handleIntroComplete = () => {
    // Mark intro as seen in localStorage
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
    setShowIntro(false);
  };

  // Don't render anything while checking (prevents flash)
  if (isChecking) {
    return null;
  }

  return (
    <>
      {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      <LandingPage />
    </>
  );
};

