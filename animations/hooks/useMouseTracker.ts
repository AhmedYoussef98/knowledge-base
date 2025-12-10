import { useState, useEffect, useCallback, useRef } from 'react';
import { isTouchDevice, prefersReducedMotion, MOUSE_CONFIG } from '../config/animationConfig';

export interface MouseState {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  velocityX: number;
  velocityY: number;
  isMoving: boolean;
  isActive: boolean;
}

const initialState: MouseState = {
  x: 0,
  y: 0,
  clientX: 0,
  clientY: 0,
  velocityX: 0,
  velocityY: 0,
  isMoving: false,
  isActive: false,
};

interface UseMouseTrackerOptions {
  /** Element to track mouse relative to. If not provided, tracks relative to viewport */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Smoothing factor (0-1). Lower = smoother but more lag */
  smoothing?: number;
  /** Whether to track mouse (can be used to disable on certain pages) */
  enabled?: boolean;
}

export function useMouseTracker(options: UseMouseTrackerOptions = {}) {
  const {
    containerRef,
    smoothing = MOUSE_CONFIG.smoothing,
    enabled = true,
  } = options;

  const [mouseState, setMouseState] = useState<MouseState>(initialState);
  const rafRef = useRef<number | null>(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(Date.now());
  const smoothedPositionRef = useRef({ x: 0, y: 0 });
  const movingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we should disable mouse tracking
  const shouldDisable = !enabled || isTouchDevice() || prefersReducedMotion();

  const updateMouseState = useCallback((clientX: number, clientY: number) => {
    if (shouldDisable) return;

    const now = Date.now();
    const dt = Math.max(now - lastTimeRef.current, 1);

    // Calculate position relative to container or viewport
    let x = clientX;
    let y = clientY;

    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      x = clientX - rect.left;
      y = clientY - rect.top;
    }

    // Calculate velocity
    const velocityX = (x - lastPositionRef.current.x) / dt * 16; // Normalize to ~60fps
    const velocityY = (y - lastPositionRef.current.y) / dt * 16;

    // Apply smoothing using lerp
    smoothedPositionRef.current.x += (x - smoothedPositionRef.current.x) * smoothing;
    smoothedPositionRef.current.y += (y - smoothedPositionRef.current.y) * smoothing;

    // Update refs
    lastPositionRef.current = { x, y };
    lastTimeRef.current = now;

    // Clear previous moving timeout
    if (movingTimeoutRef.current) {
      clearTimeout(movingTimeoutRef.current);
    }

    // Set moving to false after 100ms of no movement
    movingTimeoutRef.current = setTimeout(() => {
      setMouseState(prev => ({ ...prev, isMoving: false }));
    }, 100);

    setMouseState({
      x: smoothedPositionRef.current.x,
      y: smoothedPositionRef.current.y,
      clientX,
      clientY,
      velocityX,
      velocityY,
      isMoving: true,
      isActive: true,
    });
  }, [shouldDisable, containerRef, smoothing]);

  useEffect(() => {
    if (shouldDisable) {
      setMouseState(prev => ({ ...prev, isActive: false }));
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Use RAF for smooth updates
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        updateMouseState(e.clientX, e.clientY);
      });
    };

    const handleMouseEnter = () => {
      setMouseState(prev => ({ ...prev, isActive: true }));
    };

    const handleMouseLeave = () => {
      setMouseState(prev => ({ ...prev, isActive: false, isMoving: false }));
    };

    const target = containerRef?.current || window;

    target.addEventListener('mousemove', handleMouseMove as EventListener);
    if (containerRef?.current) {
      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      target.removeEventListener('mousemove', handleMouseMove as EventListener);
      if (containerRef?.current) {
        containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (movingTimeoutRef.current) {
        clearTimeout(movingTimeoutRef.current);
      }
    };
  }, [shouldDisable, containerRef, updateMouseState]);

  return {
    ...mouseState,
    isDisabled: shouldDisable,
  };
}

// Hook for tracking click positions (for ripple effects)
export function useClickTracker(containerRef?: React.RefObject<HTMLElement | null>) {
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const handleClick = (e: MouseEvent) => {
      let x = e.clientX;
      let y = e.clientY;

      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      setClickPosition({ x, y });
      setIsClicking(true);

      // Reset after animation
      setTimeout(() => {
        setIsClicking(false);
        setClickPosition(null);
      }, 800);
    };

    const target = containerRef?.current || window;
    target.addEventListener('click', handleClick as EventListener);

    return () => {
      target.removeEventListener('click', handleClick as EventListener);
    };
  }, [containerRef]);

  return { clickPosition, isClicking };
}

export default useMouseTracker;
