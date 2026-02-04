import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Leaf, Sprout } from 'lucide-react';
import logo from '@/assets/logo.png';

interface IntroScreenProps {
  onComplete: () => void;
}

/**
 * Beautiful farm produce-themed intro screen with sequential letter animations
 * Shows FarmSquare logo first, then letters appear sequentially from F to E
 */
export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const brandNameRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current || !logoRef.current || !brandNameRef.current) return;

    // Create main timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        // Small delay before transitioning
        setTimeout(() => {
          handleComplete();
        }, 800);
      },
    });

    timelineRef.current = tl;

    // Set initial states
    gsap.set(logoRef.current, {
      scale: 0,
      opacity: 0,
      rotation: -180,
    });

    gsap.set(brandNameRef.current.querySelectorAll('.letter'), {
      opacity: 0,
      scale: 0,
      y: 50,
      rotationY: 90,
      transformOrigin: 'center bottom',
    });

    // Skip button should be visible immediately
    gsap.set(skipButtonRef.current, {
      opacity: 1,
      scale: 1,
    });

    // Create floating particles (farm produce elements)
    const particles = particlesRef.current?.querySelectorAll('.particle');
    if (particles) {
      gsap.set(particles, {
        opacity: 0,
        scale: 0,
        y: 'random(-100, 100)',
        x: 'random(-100, 100)',
      });
    }

    // Step 1: Logo entrance with dramatic spin and scale
    tl.to(logoRef.current, {
      scale: 1.2,
      opacity: 1,
      rotation: 0,
      duration: 1,
      ease: 'back.out(1.7)',
    })
      // Bounce effect
      .to(logoRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
      // Gentle floating animation (reduced duration)
      .to(logoRef.current, {
        y: -15,
        duration: 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      })
      // Return to center
      .to(logoRef.current, {
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      });

    // Step 2: Animate floating farm produce particles
    if (particles && particles.length > 0) {
      tl.to(
        particles,
        {
          opacity: 0.6,
          scale: 1,
          duration: 0.8,
          stagger: {
            amount: 1,
            from: 'random',
          },
          ease: 'power2.out',
        },
        '-=1.5'
      );

      // Continuous floating animation for particles
      particles.forEach((particle, index) => {
        gsap.to(particle, {
          y: `+=${Math.random() * 40 + 20}`,
          x: `+=${Math.random() * 30 - 15}`,
          rotation: Math.random() * 360,
          duration: 3 + Math.random() * 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.2,
        });
      });
    }

    // Step 3: Sequential letter animation (F -> A -> R -> M -> S -> Q -> U -> A -> R -> E)
    // Each letter appears one after another beautifully
    const letters = brandNameRef.current.querySelectorAll('.letter');
    letters.forEach((letter, index) => {
      // Each letter appears sequentially with a delay
      // Start letters right after logo bounce completes (much earlier)
      tl.to(
        letter,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotationY: 0,
          duration: 0.5,
          ease: 'back.out(1.6)',
        },
        index === 0 ? '-=1.8' : '+=0.1' // First letter starts right after logo bounce, then each letter follows quickly
      );

      // Add a beautiful bounce effect for each letter as it appears
      tl.to(
        letter,
        {
          scale: 1.2,
          duration: 0.2,
          ease: 'power2.out',
        },
        '<'
      )
        .to(
          letter,
          {
            scale: 1,
            duration: 0.25,
            ease: 'power2.in',
          },
          '<0.05'
        );
    });

    // Step 4: Final flourish - all letters pulse together
    tl.to(letters, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out',
      stagger: 0.05,
    }).to(letters, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.in',
    });

    // Skip button is already visible, no animation needed

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      // Cleanup particle animations
      if (particles) {
        particles.forEach((particle) => {
          gsap.killTweensOf(particle);
        });
      }
    };
  }, []);

  const handleSkip = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    setIsAnimating(false);
    handleComplete();
  };

  const handleComplete = () => {
    // Create unique farm-themed exit animation
    const exitTimeline = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // Step 1: Skip button fades out first
    if (skipButtonRef.current) {
      exitTimeline.to(skipButtonRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in',
      });
    }

    // Step 2: Logo rises like the sun (upward fade with glow effect)
    if (logoRef.current) {
      exitTimeline.to(
        logoRef.current,
        {
          y: -150,
          opacity: 0,
          scale: 1.3,
          rotation: 15,
          duration: 1.2,
          ease: 'power2.in',
        },
        '-=0.1'
      );
    }

    // Step 3: Letters scatter outward like seeds being planted (each in different direction)
    const letters = brandNameRef.current?.querySelectorAll('.letter');
    if (letters) {
      letters.forEach((letter, index) => {
        // Calculate random scatter directions
        const angle = (index * 360) / letters.length + Math.random() * 30 - 15; // Distribute evenly with slight randomness
        const distance = 200 + Math.random() * 100; // Random distance between 200-300px
        const radians = (angle * Math.PI) / 180;
        const x = Math.cos(radians) * distance;
        const y = Math.sin(radians) * distance;

        exitTimeline.to(
          letter,
          {
            x: x,
            y: y,
            opacity: 0,
            scale: 0.3,
            rotation: angle + Math.random() * 60 - 30,
            duration: 1,
            ease: 'power2.out',
          },
          index === 0 ? '-=0.8' : '-=0.95' // Start slightly before logo finishes
        );
      });
    }

    // Step 4: Particles fade away gracefully
    const particles = particlesRef.current?.querySelectorAll('.particle');
    if (particles) {
      exitTimeline.to(
        particles,
        {
          opacity: 0,
          scale: 0,
          duration: 0.8,
          stagger: {
            amount: 0.5,
            from: 'random',
          },
          ease: 'power2.in',
        },
        '-=0.5'
      );
    }

    // Step 5: Background fades out with blur effect to reveal landing page
    if (containerRef.current) {
      exitTimeline.to(
        containerRef.current,
        {
          opacity: 0,
          filter: 'blur(20px)',
          duration: 0.8,
          ease: 'power2.in',
        },
        '-=0.3'
      );
    }
  };

  // Split brand name into letters for sequential animation
  const brandName = 'FarmSquare';
  const letters = brandName.split('');

  // Generate random positions for floating particles
  const generateParticles = () => {
    const particleCount = 12;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      size: Math.random() * 20 + 15,
    }));
  };

  const particles = generateParticles();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ willChange: 'opacity, transform' }}
    >
      {/* Beautiful farm-themed gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f0f7ed] via-[#e8f5e3] to-[#d4edda]">
        {/* Animated background patterns */}
        <div className="absolute inset-0">
          {/* Large organic shapes */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#c3e6cb]/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#a8d5ba]/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#90c695]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Floating farm produce particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute"
            style={{
              top: particle.top,
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          >
            {/* Farm produce icons - alternating between leaf and sprout */}
            {particle.id % 2 === 0 ? (
              <Leaf className="w-full h-full text-[#22c55e]/40" />
            ) : (
              <Sprout className="w-full h-full text-[#16a34a]/40" />
            )}
          </div>
        ))}
      </div>

      {/* Logo container with beautiful design */}
      <div
        ref={logoRef}
        className="relative z-10 mb-12"
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Outer glow effect */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-40 transition-opacity duration-1000">
          <div className="w-full h-full bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d] rounded-full" />
        </div>
        
        {/* Beautiful circular container with gradient border */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto">
          {/* Gradient border ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d] p-1">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-[#f0fdf4] to-white flex items-center justify-center shadow-2xl">
              {/* Inner glow */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#22c55e]/10 via-transparent to-[#16a34a]/10 blur-sm" />
              {/* Logo */}
              <img
                src={logo}
                alt="FarmSquare Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-xl relative z-10"
                style={{ willChange: 'transform, opacity' }}
              />
            </div>
          </div>
          
          {/* Decorative elements - small leaves around the circle */}
          <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#22c55e]/30">
            <Leaf className="w-full h-full" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#16a34a]/30">
            <Sprout className="w-full h-full" />
          </div>
          <div className="absolute -top-2 -left-2 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-[#15803d]/20">
            <Leaf className="w-full h-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-[#22c55e]/20">
            <Sprout className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Brand name with sequential letter animation */}
      <div
        ref={brandNameRef}
        className="relative z-10 flex flex-col items-center justify-center gap-1 sm:gap-2"
        style={{ willChange: 'transform, opacity' }}
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="letter inline-block relative"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity',
                color: index < 4 ? '#16a34a' : '#22c55e', // "Farm" in darker green, "Square" in lighter green
                textShadow: '0 2px 8px rgba(34, 197, 94, 0.2)',
                transformOrigin: 'center center',
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </h1>
        
        {/* Skip Intro button - positioned immediately below brand name */}
        <button
          ref={skipButtonRef}
          onClick={handleSkip}
          className="mt-8 z-30 px-6 py-3 bg-white/90 backdrop-blur-sm text-[#16a34a] hover:text-[#22c55e] hover:bg-white rounded-full text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border border-[#22c55e]/20 hover:border-[#22c55e]/40 flex items-center gap-2 cursor-pointer active:scale-95"
          aria-label="Skip intro"
          style={{ pointerEvents: 'auto' }}
        >
          <span>Skip Intro</span>
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-20 left-10 opacity-20 hidden md:block">
        <Leaf className="w-16 h-16 text-[#22c55e] rotate-12" />
      </div>
      <div className="absolute top-20 right-10 opacity-20 hidden md:block">
        <Sprout className="w-20 h-20 text-[#16a34a] -rotate-12" />
      </div>
    </div>
  );
};
