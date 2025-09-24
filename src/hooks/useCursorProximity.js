import { useRef, useEffect, useCallback } from 'react';

export const useCursorProximity = (proximityRadius = 100) => {
  const cardRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const isInsideCard = useRef(false);
  const isActive = useRef(false);

  // Calculate distance from cursor to card border
  const getDistanceToBorder = useCallback((cursorX, cursorY, rect) => {
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const cardHalfWidth = rect.width / 2;
    const cardHalfHeight = rect.height / 2;

    // Check if cursor is inside the card
    const isInside = cursorX >= rect.left && 
                    cursorX <= rect.right && 
                    cursorY >= rect.top && 
                    cursorY <= rect.bottom;

    if (isInside) {
      return 0; // Inside the card
    }

    // Calculate distance to the nearest edge
    const dx = Math.max(rect.left - cursorX, 0, cursorX - rect.right);
    const dy = Math.max(rect.top - cursorY, 0, cursorY - rect.bottom);
    
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Convert global coordinates to relative card coordinates
  const getRelativePosition = useCallback((globalX, globalY, rect) => {
    const relativeX = ((globalX - rect.left) / rect.width) * 100;
    const relativeY = ((globalY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, relativeX)), y: Math.max(0, Math.min(100, relativeY)) };
  }, []);

  // Apply localized gradient at cursor position
  const applyLocalizedGradientAtCursor = useCallback((card, mousePos) => {
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const relativePos = getRelativePosition(mousePos.x, mousePos.y, rect);
    
    card.style.setProperty('--gradient-x', `${relativePos.x}%`);
    card.style.setProperty('--gradient-y', `${relativePos.y}%`);
    card.style.setProperty('--gradient-radius', `${proximityRadius}px`);
    card.style.setProperty('--full-border', '0');
    card.classList.add('gradient-active');
    isActive.current = true;
  }, [getRelativePosition, proximityRadius]);

  // Apply full border gradient
  const applyFullBorderGradient = useCallback((card) => {
    if (!card) return;
    
    card.style.setProperty('--full-border', '1');
    card.style.removeProperty('--gradient-x');
    card.style.removeProperty('--gradient-y');
    card.style.removeProperty('--gradient-radius');
    card.classList.add('gradient-active');
    isActive.current = true;
  }, []);

  // Remove gradient effect
  const removeGradientEffect = useCallback((card) => {
    if (!card) return;
    
    card.classList.remove('gradient-active');
    card.style.removeProperty('--gradient-x');
    card.style.removeProperty('--gradient-y');
    card.style.removeProperty('--gradient-radius');
    card.style.setProperty('--full-border', '0');
    isActive.current = false;
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;

    mousePosition.current = { x: e.clientX, y: e.clientY };
    const rect = cardRef.current.getBoundingClientRect();
    const distance = getDistanceToBorder(e.clientX, e.clientY, rect);
    
    // Check if cursor is inside card
    const isInside = e.clientX >= rect.left && 
                    e.clientX <= rect.right && 
                    e.clientY >= rect.top && 
                    e.clientY <= rect.bottom;

    isInsideCard.current = isInside;

    if (distance <= proximityRadius) {
      if (isInside) {
        applyFullBorderGradient(cardRef.current);
      } else {
        applyLocalizedGradientAtCursor(cardRef.current, mousePosition.current);
      }
    } else {
      removeGradientEffect(cardRef.current);
    }
  }, [getDistanceToBorder, proximityRadius, applyLocalizedGradientAtCursor, applyFullBorderGradient, removeGradientEffect]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      removeGradientEffect(cardRef.current);
    }
  }, [removeGradientEffect]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Set up card-specific mouse leave listener
  useEffect(() => {
    const card = cardRef.current;
    if (card) {
      card.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [handleMouseLeave]);

  return cardRef;
};
