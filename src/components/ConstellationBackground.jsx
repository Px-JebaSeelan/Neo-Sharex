import React, { useRef, useEffect } from 'react';

// Star density: much lower for mobile, higher for desktop
function getStarCount(width, height) {
  const isMobile = width <= 700;
  if (isMobile) {
    // For mobile, use a much lower density and lower min/max
    return Math.max(12, Math.min(32, Math.round((width * height) / 25000)));
  }
  // Desktop/tablet
  return Math.max(28, Math.min(110, Math.round((width * height) / 13000)));
}

const STAR_COLOR = '#00e5ff';
const LINE_COLOR = 'rgba(0,229,255,0.18)';
const STAR_RADIUS = 1.7;
const LINE_DISTANCE = 120;
const MOUSE_RADIUS = 180;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createStars(width, height, count) {
  // Reduced velocity range for slightly slower animation
  return Array.from({ length: count }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    vx: randomBetween(-0.18, 0.18),
    vy: randomBetween(-0.18, 0.18),
  }));
}

const ConstellationBackground = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

  let width = window.innerWidth;
  let height = window.innerHeight;
  let starCount = getStarCount(width, height);
  canvas.width = width;
  canvas.height = height;
  starsRef.current = createStars(width, height, starCount);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      starCount = getStarCount(width, height);
      canvas.width = width;
      canvas.height = height;
      starsRef.current = createStars(width, height, starCount);
    }
    window.addEventListener('resize', resize);

    function animate() {
      ctx.clearRect(0, 0, width, height);
      // Move and draw stars
      for (let star of starsRef.current) {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0 || star.x > width) star.vx *= -1;
        if (star.y < 0 || star.y > height) star.vy *= -1;
        ctx.beginPath();
        ctx.arc(star.x, star.y, STAR_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = STAR_COLOR;
        ctx.shadowColor = STAR_COLOR;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // Draw lines
      for (let i = 0; i < starsRef.current.length; i++) {
        for (let j = i + 1; j < starsRef.current.length; j++) {
          const a = starsRef.current[i];
          const b = starsRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = LINE_COLOR;
            ctx.lineWidth = 1.1;
            ctx.globalAlpha = 1 - dist / LINE_DISTANCE;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      // Mouse interaction
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        for (let star of starsRef.current) {
          const dx = star.x - mouseRef.current.x;
          const dy = star.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.strokeStyle = STAR_COLOR;
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = 1 - dist / MOUSE_RADIUS;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
    // Mouse events
    function onMouseMove(e) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    function onMouseLeave() {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'auto',
        background: 'transparent',
      }}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
};

export default ConstellationBackground;
