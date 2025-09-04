// src/components/ChidoriEffect.jsx
import React, { useEffect } from 'react';

const createChidori = (x, y) => {
  const container = document.createElement('div');
  container.className = 'chidori-container';
  container.style.left = `${x - 32}px`;
  container.style.top = `${y - 32}px`;

  // Main blue core
  const core = document.createElement('div');
  core.className = 'chidori-core';
  container.appendChild(core);

  // Lightning bolts
  for (let i = 0; i < 7; i++) {
    const bolt = document.createElement('div');
    bolt.className = 'chidori-bolt';
    bolt.style.transform = `rotate(${Math.random() * 360}deg) scaleX(${0.7 + Math.random() * 0.7})`;
    bolt.style.animationDelay = `${Math.random() * 0.15}s`;
    container.appendChild(bolt);
  }

  document.body.appendChild(container);
  setTimeout(() => {
    container.remove();
  }, 700);
};

const ChidoriEffect = () => {
  useEffect(() => {
    const handleClick = (e) => {
      if (e.button !== 0) return;
      createChidori(e.clientX, e.clientY);
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, []);
  return null;
};

export default ChidoriEffect;
