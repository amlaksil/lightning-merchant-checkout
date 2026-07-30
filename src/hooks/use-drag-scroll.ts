import { useRef, useEffect } from 'react';

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const slider = ref.current;
    if (!slider) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      slider.style.cursor = 'grabbing';
      startX.current = e.pageX - slider.offsetLeft;
      scrollLeft.current = slider.scrollLeft;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      slider.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      slider.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX.current) * 2;
      slider.scrollLeft = scrollLeft.current - walk;
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      startX.current = e.touches[0].pageX - slider.offsetLeft;
      scrollLeft.current = slider.scrollLeft;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const x = e.touches[0].pageX - slider.offsetLeft;
      const walk = (x - startX.current) * 2;
      slider.scrollLeft = scrollLeft.current - walk;
    };

    slider.style.cursor = 'grab';
    
    // Mouse events
    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mousemove', handleMouseMove);
    slider.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch events
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchmove', handleTouchMove);
    slider.addEventListener('touchend', handleMouseUp);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mousemove', handleMouseMove);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseup', handleMouseUp);
      
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchmove', handleTouchMove);
      slider.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return ref;
} 