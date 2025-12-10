// Animation configuration for the entire application
// Centralized settings for consistent animations across all pages

export const COLORS = {
  neon: '#A3FF47',
  cyan: '#00C2CB',
  green: '#4ADE80',
  deepSpace: '#0F172A',
  techSlate: '#1E293B',
  pureLight: '#F8FAFF',
} as const;

// Device capability detection
export const getDeviceCapability = (): 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'medium';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const hasLowCores = navigator.hardwareConcurrency <= 4;
  const hasLowMemory = (navigator as { deviceMemory?: number }).deviceMemory !== undefined
    && (navigator as { deviceMemory?: number }).deviceMemory! <= 4;

  if (isMobile || (hasLowCores && hasLowMemory)) return 'low';
  if (hasLowCores || hasLowMemory) return 'medium';
  return 'high';
};

// Check for reduced motion preference
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if device supports touch
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Particle configuration based on device capability
export const getParticleConfig = () => {
  const capability = getDeviceCapability();
  const reduced = prefersReducedMotion();

  if (reduced) {
    return {
      count: 0,
      size: { min: 0, max: 0 },
      speed: { min: 0, max: 0 },
      opacity: { min: 0, max: 0 },
      connectionDistance: 0,
      connectionOpacity: 0,
    };
  }

  const configs = {
    high: {
      count: 50,
      size: { min: 2, max: 5 },
      speed: { min: 0.3, max: 1.2 },
      opacity: { min: 0.2, max: 0.6 },
      connectionDistance: 120,
      connectionOpacity: 0.15,
    },
    medium: {
      count: 30,
      size: { min: 2, max: 4 },
      speed: { min: 0.2, max: 0.8 },
      opacity: { min: 0.15, max: 0.5 },
      connectionDistance: 100,
      connectionOpacity: 0.1,
    },
    low: {
      count: 15,
      size: { min: 2, max: 3 },
      speed: { min: 0.1, max: 0.5 },
      opacity: { min: 0.1, max: 0.4 },
      connectionDistance: 80,
      connectionOpacity: 0.08,
    },
  };

  return configs[capability];
};

// Shape configuration based on device capability
export const getShapeConfig = () => {
  const capability = getDeviceCapability();
  const reduced = prefersReducedMotion();

  if (reduced) {
    return { count: 0, types: [] as string[] };
  }

  const configs = {
    high: {
      count: 8,
      types: ['triangle', 'hexagon', 'circle', 'square'],
    },
    medium: {
      count: 5,
      types: ['triangle', 'hexagon', 'circle'],
    },
    low: {
      count: 3,
      types: ['circle', 'triangle'],
    },
  };

  return configs[capability];
};

// Mouse glow configuration
export const MOUSE_CONFIG = {
  glowRadius: 200,
  glowOpacity: 0.15,
  smoothing: 0.15, // Lower = smoother but more lag
  rippleDuration: 0.8,
  rippleScale: 2,
};

// Easing presets for consistent feel
export const EASING = {
  smooth: 'power2.out',
  bounce: 'back.out(1.7)',
  elastic: 'elastic.out(1, 0.5)',
  snappy: 'power3.out',
  gentle: 'sine.inOut',
  linear: 'none',
} as const;

// Duration presets
export const DURATION = {
  fast: 0.3,
  normal: 0.6,
  slow: 1,
  verySlow: 2,
} as const;

// Stagger presets
export const STAGGER = {
  tight: 0.05,
  normal: 0.1,
  relaxed: 0.15,
  slow: 0.2,
} as const;

// Animation intensity levels for AnimatedBackground
export type AnimationIntensity = 'light' | 'moderate' | 'heavy';

export const getIntensityMultiplier = (intensity: AnimationIntensity): number => {
  const multipliers = {
    light: 0.5,
    moderate: 1,
    heavy: 1.5,
  };
  return multipliers[intensity];
};
