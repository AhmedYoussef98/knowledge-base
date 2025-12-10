import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useMouseTracker, useClickTracker } from '../hooks/useMouseTracker';
import {
  COLORS,
  MOUSE_CONFIG,
  prefersReducedMotion,
  isTouchDevice,
} from '../config/animationConfig';

interface MouseGlowProps {
  /** Container ref to track mouse relative to */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Primary glow color */
  primaryColor?: string;
  /** Secondary glow color (for color interpolation) */
  secondaryColor?: string;
  /** Glow radius in pixels */
  radius?: number;
  /** Glow opacity (0-1) */
  opacity?: number;
  /** Enable click ripple effect */
  enableRipple?: boolean;
  /** Custom class name */
  className?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function MouseGlow({
  containerRef,
  primaryColor = COLORS.neon,
  secondaryColor = COLORS.cyan,
  radius = MOUSE_CONFIG.glowRadius,
  opacity = MOUSE_CONFIG.glowOpacity,
  enableRipple = true,
  className = '',
}: MouseGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  const { x, y, isActive, isDisabled } = useMouseTracker({
    containerRef,
    enabled: !prefersReducedMotion() && !isTouchDevice(),
  });

  const { clickPosition, isClicking } = useClickTracker(containerRef);

  // Animate glow position
  useEffect(() => {
    if (!glowRef.current || isDisabled) return;

    gsap.to(glowRef.current, {
      x: x - radius,
      y: y - radius,
      duration: 0.15,
      ease: 'power2.out',
    });
  }, [x, y, radius, isDisabled]);

  // Handle opacity based on activity
  useEffect(() => {
    if (!glowRef.current || isDisabled) return;

    gsap.to(glowRef.current, {
      opacity: isActive ? opacity : 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  }, [isActive, opacity, isDisabled]);

  // Create ripple on click
  useEffect(() => {
    if (!enableRipple || !clickPosition || !isClicking || isDisabled) return;

    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x: clickPosition.x,
      y: clickPosition.y,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, MOUSE_CONFIG.rippleDuration * 1000);
  }, [clickPosition, isClicking, enableRipple, isDisabled]);

  if (isDisabled || prefersReducedMotion() || isTouchDevice()) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 9999 }}
    >
      {/* Main glow */}
      <div
        ref={glowRef}
        className="absolute rounded-full"
        style={{
          width: radius * 2,
          height: radius * 2,
          background: `radial-gradient(circle at center, ${primaryColor}40 0%, ${secondaryColor}20 40%, transparent 70%)`,
          opacity: 0,
          filter: 'blur(40px)',
          willChange: 'transform, opacity',
          mixBlendMode: 'screen',
        }}
      />

      {/* Ripples */}
      {ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          color={primaryColor}
        />
      ))}
    </div>
  );
}

// Ripple effect component
function RippleEffect({ x, y, color }: { x: number; y: number; color: string }) {
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rippleRef.current) return;

    gsap.fromTo(
      rippleRef.current,
      {
        scale: 0,
        opacity: 0.5,
      },
      {
        scale: MOUSE_CONFIG.rippleScale,
        opacity: 0,
        duration: MOUSE_CONFIG.rippleDuration,
        ease: 'power2.out',
      }
    );
  }, []);

  return (
    <div
      ref={rippleRef}
      className="absolute rounded-full"
      style={{
        left: x - 50,
        top: y - 50,
        width: 100,
        height: 100,
        border: `2px solid ${color}`,
        willChange: 'transform, opacity',
      }}
    />
  );
}

export default MouseGlow;
