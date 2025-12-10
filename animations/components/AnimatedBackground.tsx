import React, { useRef } from 'react';
import ParticleField from './ParticleField';
import FloatingShapes from './FloatingShapes';
import MouseGlow from './MouseGlow';
import { COLORS, prefersReducedMotion, type AnimationIntensity } from '../config/animationConfig';

interface AnimatedBackgroundProps {
  /** Animation intensity level */
  intensity?: AnimationIntensity;
  /** Show particle field */
  showParticles?: boolean;
  /** Show floating shapes */
  showShapes?: boolean;
  /** Show mouse glow effect */
  showMouseGlow?: boolean;
  /** Show particle connections */
  showConnections?: boolean;
  /** Enable parallax on shapes */
  enableParallax?: boolean;
  /** Primary color for animations */
  primaryColor?: string;
  /** Secondary color for animations */
  secondaryColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Children to render above the background */
  children?: React.ReactNode;
}

export function AnimatedBackground({
  intensity = 'moderate',
  showParticles = true,
  showShapes = true,
  showMouseGlow = true,
  showConnections = true,
  enableParallax = true,
  primaryColor = COLORS.neon,
  secondaryColor = COLORS.cyan,
  className = '',
  children,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Don't render animations if user prefers reduced motion
  const reducedMotion = prefersReducedMotion();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Animated layers */}
      {!reducedMotion && (
        <>
          {/* Layer 1: Particle field (bottom layer) */}
          {showParticles && (
            <ParticleField
              intensity={intensity}
              showConnections={showConnections}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}

          {/* Layer 2: Floating shapes */}
          {showShapes && (
            <FloatingShapes
              intensity={intensity}
              enableParallax={enableParallax}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}

          {/* Layer 3: Mouse glow (top layer, fixed position) */}
          {showMouseGlow && (
            <MouseGlow
              containerRef={containerRef}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              enableRipple={true}
            />
          )}
        </>
      )}

      {/* Content layer */}
      {children && (
        <div className="relative" style={{ zIndex: 10 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Preset configurations for common use cases
export const BackgroundPresets = {
  hero: {
    intensity: 'moderate' as AnimationIntensity,
    showParticles: true,
    showShapes: true,
    showMouseGlow: true,
    showConnections: true,
    enableParallax: true,
  },
  section: {
    intensity: 'light' as AnimationIntensity,
    showParticles: true,
    showShapes: false,
    showMouseGlow: false,
    showConnections: false,
    enableParallax: false,
  },
  auth: {
    intensity: 'light' as AnimationIntensity,
    showParticles: true,
    showShapes: true,
    showMouseGlow: true,
    showConnections: false,
    enableParallax: false,
  },
  minimal: {
    intensity: 'light' as AnimationIntensity,
    showParticles: true,
    showShapes: false,
    showMouseGlow: false,
    showConnections: false,
    enableParallax: false,
  },
};

export default AnimatedBackground;
