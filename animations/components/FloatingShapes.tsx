import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  COLORS,
  getShapeConfig,
  prefersReducedMotion,
  getIntensityMultiplier,
  type AnimationIntensity,
} from '../config/animationConfig';

gsap.registerPlugin(ScrollTrigger);

type ShapeType = 'triangle' | 'hexagon' | 'circle' | 'square';

interface Shape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
}

interface FloatingShapesProps {
  /** Animation intensity level */
  intensity?: AnimationIntensity;
  /** Custom class name */
  className?: string;
  /** Enable parallax effect on scroll */
  enableParallax?: boolean;
  /** Primary color override */
  primaryColor?: string;
  /** Secondary color override */
  secondaryColor?: string;
}

// Generate random number in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Shape path generators
const getShapePath = (type: ShapeType, size: number): string => {
  const half = size / 2;

  switch (type) {
    case 'triangle':
      return `M${half},0 L${size},${size} L0,${size} Z`;
    case 'hexagon': {
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = half + half * Math.cos(angle);
        const y = half + half * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return `M${points.join(' L')} Z`;
    }
    case 'square':
      return `M0,0 L${size},0 L${size},${size} L0,${size} Z`;
    case 'circle':
    default:
      return ''; // Use <circle> element instead
  }
};

export function FloatingShapes({
  intensity = 'moderate',
  className = '',
  enableParallax = true,
  primaryColor = COLORS.neon,
  secondaryColor = COLORS.cyan,
}: FloatingShapesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<(HTMLDivElement | null)[]>([]);

  const config = useMemo(() => getShapeConfig(), []);
  const intensityMultiplier = getIntensityMultiplier(intensity);

  // Generate shapes data
  const shapes = useMemo<Shape[]>(() => {
    if (prefersReducedMotion() || config.types.length === 0) return [];

    const count = Math.round(config.count * intensityMultiplier);
    const colors = [primaryColor, secondaryColor, COLORS.green];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type: config.types[i % config.types.length] as ShapeType,
      x: random(5, 90),
      y: random(10, 85),
      size: random(40, 80),
      rotation: random(0, 360),
      color: colors[i % colors.length],
      opacity: random(0.03, 0.08),
    }));
  }, [config, intensityMultiplier, primaryColor, secondaryColor]);

  // Animate shapes
  useEffect(() => {
    if (!containerRef.current || shapes.length === 0 || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      shapes.forEach((shape, index) => {
        const element = shapesRef.current[index];
        if (!element) return;

        const duration = random(20, 35);
        const rotationDirection = Math.random() > 0.5 ? 360 : -360;

        // Floating animation
        gsap.to(element, {
          y: random(-30, -60),
          x: random(-20, 20),
          duration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: random(0, 5),
        });

        // Slow rotation
        gsap.to(element, {
          rotation: `+=${rotationDirection}`,
          duration: random(40, 80),
          repeat: -1,
          ease: 'none',
        });

        // Subtle scale breathing
        gsap.to(element, {
          scale: random(0.9, 1.1),
          duration: random(8, 15),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: random(0, 3),
        });
      });

      // Parallax effect on scroll
      if (enableParallax) {
        shapes.forEach((_, index) => {
          const element = shapesRef.current[index];
          if (!element) return;

          const parallaxSpeed = random(0.1, 0.4);

          gsap.to(element, {
            yPercent: -50 * parallaxSpeed,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          });
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [shapes, enableParallax]);

  if (prefersReducedMotion() || shapes.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    >
      {shapes.map((shape, index) => (
        <div
          key={shape.id}
          ref={el => { shapesRef.current[index] = el; }}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            transform: `rotate(${shape.rotation}deg)`,
            willChange: 'transform',
          }}
        >
          {shape.type === 'circle' ? (
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: shape.color,
                opacity: shape.opacity,
              }}
            />
          ) : (
            <svg
              viewBox={`0 0 ${shape.size} ${shape.size}`}
              className="w-full h-full"
            >
              <path
                d={getShapePath(shape.type, shape.size)}
                fill={shape.color}
                opacity={shape.opacity}
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

export default FloatingShapes;
