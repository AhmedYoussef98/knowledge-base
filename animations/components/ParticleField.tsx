import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import {
  COLORS,
  getParticleConfig,
  prefersReducedMotion,
  getIntensityMultiplier,
  type AnimationIntensity,
} from '../config/animationConfig';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  speedMultiplier: number;
}

interface ParticleFieldProps {
  /** Animation intensity level */
  intensity?: AnimationIntensity;
  /** Custom class name */
  className?: string;
  /** Show connection lines between particles */
  showConnections?: boolean;
  /** Primary color override */
  primaryColor?: string;
  /** Secondary color override */
  secondaryColor?: string;
}

// Generate random number in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Calculate distance between two points
const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export function ParticleField({
  intensity = 'moderate',
  className = '',
  showConnections = true,
  primaryColor = COLORS.neon,
  secondaryColor = COLORS.cyan,
}: ParticleFieldProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const particlesRef = useRef<(SVGCircleElement | null)[]>([]);
  const connectionsRef = useRef<SVGGElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const positionsRef = useRef<{ x: number; y: number }[]>([]);

  const config = useMemo(() => getParticleConfig(), []);
  const intensityMultiplier = getIntensityMultiplier(intensity);

  // Generate particles data
  const particles = useMemo<Particle[]>(() => {
    if (prefersReducedMotion()) return [];

    const count = Math.round(config.count * intensityMultiplier);
    const colors = [primaryColor, secondaryColor, COLORS.green];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: random(5, 95), // percentage
      y: random(5, 95),
      size: random(config.size.min, config.size.max),
      color: colors[i % colors.length],
      opacity: random(config.opacity.min, config.opacity.max),
      speedMultiplier: random(0.5, 1.5),
    }));
  }, [config, intensityMultiplier, primaryColor, secondaryColor]);

  // Initialize particle positions
  useEffect(() => {
    positionsRef.current = particles.map(p => ({ x: p.x, y: p.y }));
  }, [particles]);

  // Animate particles
  useEffect(() => {
    if (!svgRef.current || particles.length === 0 || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Create master timeline
      animationRef.current = gsap.timeline();

      // Animate each particle with unique motion
      particles.forEach((particle, index) => {
        const element = particlesRef.current[index];
        if (!element) return;

        const duration = random(15, 25) / particle.speedMultiplier;
        const xRange = random(3, 8);
        const yRange = random(5, 12);

        // Floating animation
        gsap.to(element, {
          attr: {
            cx: `${particle.x + random(-xRange, xRange)}%`,
            cy: `${Math.max(2, particle.y - yRange)}%`, // Float upward
          },
          duration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: random(0, 3),
          onUpdate: function() {
            // Update position ref for connection lines
            const cx = parseFloat(element.getAttribute('cx') || '0');
            const cy = parseFloat(element.getAttribute('cy') || '0');
            positionsRef.current[index] = { x: cx, y: cy };
          },
        });

        // Subtle opacity pulsing
        gsap.to(element, {
          opacity: random(config.opacity.min, config.opacity.max),
          duration: random(2, 4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: random(0, 2),
        });
      });

      // Update connections periodically
      if (showConnections && connectionsRef.current) {
        const updateConnections = () => {
          if (!connectionsRef.current || !svgRef.current) return;

          const svg = svgRef.current;
          const width = svg.clientWidth || 1000;
          const height = svg.clientHeight || 800;
          const maxDist = config.connectionDistance * intensityMultiplier;

          // Clear existing connections
          connectionsRef.current.innerHTML = '';

          // Draw connections between nearby particles
          for (let i = 0; i < positionsRef.current.length; i++) {
            for (let j = i + 1; j < positionsRef.current.length; j++) {
              const p1 = positionsRef.current[i];
              const p2 = positionsRef.current[j];

              // Convert percentages to pixels for distance calculation
              const x1 = (p1.x / 100) * width;
              const y1 = (p1.y / 100) * height;
              const x2 = (p2.x / 100) * width;
              const y2 = (p2.y / 100) * height;

              const dist = distance(x1, y1, x2, y2);

              if (dist < maxDist) {
                const opacity = (1 - dist / maxDist) * config.connectionOpacity;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', `${p1.x}%`);
                line.setAttribute('y1', `${p1.y}%`);
                line.setAttribute('x2', `${p2.x}%`);
                line.setAttribute('y2', `${p2.y}%`);
                line.setAttribute('stroke', primaryColor);
                line.setAttribute('stroke-opacity', opacity.toString());
                line.setAttribute('stroke-width', '0.5');
                connectionsRef.current.appendChild(line);
              }
            }
          }
        };

        // Update connections every 100ms
        const connectionInterval = setInterval(updateConnections, 100);

        return () => clearInterval(connectionInterval);
      }
    }, svgRef);

    return () => {
      ctx.revert();
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [particles, config, showConnections, primaryColor, intensityMultiplier]);

  if (prefersReducedMotion() || particles.length === 0) {
    return null;
  }

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Connection lines layer */}
      {showConnections && <g ref={connectionsRef} className="connections-layer" />}

      {/* Particles layer */}
      <g className="particles-layer">
        {particles.map((particle, index) => (
          <circle
            key={particle.id}
            ref={el => { particlesRef.current[index] = el; }}
            cx={`${particle.x}%`}
            cy={`${particle.y}%`}
            r={particle.size}
            fill={particle.color}
            opacity={particle.opacity}
            className="particle"
          />
        ))}
      </g>
    </svg>
  );
}

export default ParticleField;
