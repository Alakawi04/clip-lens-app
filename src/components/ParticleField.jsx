import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// A light space-like neural field. Nodes drift on their own, then follow the
// pointer's wake and orbit it softly instead of snapping directly to it.
export default function ParticleField({ count = 70, size = 1.55 }) {
  const canvasRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return undefined;

    let width = 0;
    let height = 0;
    let ratio = 1;
    let nodes = [];
    let frame = 0;
    let lastFrame = 0;
    let stopped = false;
    const safeCount = Math.max(12, Math.min(360, Math.round(Number(count) || 120)));
    const sizeScale = Math.max(.45, Math.min(4.8, Number(size) || 1.55));
    const cursor = {
      x: -1000, y: -1000,
      targetX: -1000, targetY: -1000,
      velocityX: 0, velocityY: 0,
      active: 0, targetActive: 0,
      initialized: false,
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 1.15);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const areaScale = Math.max(.48, Math.min(1.45, Math.sqrt((width * height) / (1920 * 1080))));
      const nodeCount = Math.max(12, Math.round(safeCount * areaScale));
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - .5) * .18,
        vy: (Math.random() - .5) * .18,
        phase: Math.random() * Math.PI * 2,
        radius: (.52 + Math.random() * .55) * sizeScale,
      }));
      if (reduceMotion) draw();
      else if (!frame) frame = window.requestAnimationFrame(draw);
    };

    const draw = (timestamp = 0) => {
      if (stopped) return;
      if (!reduceMotion && timestamp - lastFrame < 30) {
        frame = window.requestAnimationFrame(draw);
        return;
      }
      const delta = lastFrame ? Math.min(2, (timestamp - lastFrame) / 16.67) : 1;
      lastFrame = timestamp;
      context.clearRect(0, 0, width, height);

      if (!reduceMotion) {
        const previousX = cursor.x;
        const previousY = cursor.y;
        cursor.x += (cursor.targetX - cursor.x) * .27;
        cursor.y += (cursor.targetY - cursor.y) * .27;
        cursor.velocityX = cursor.x - previousX;
        cursor.velocityY = cursor.y - previousY;
        cursor.active += (cursor.targetActive - cursor.active) * .12;
        for (const node of nodes) {
          node.x += node.vx * delta;
          node.y += node.vy * delta;
          if (node.x < -12 || node.x > width + 12) node.vx *= -1;
          if (node.y < -12 || node.y > height + 12) node.vy *= -1;
        }
      }

      const influenceRadius = Math.min(390, Math.max(250, width * .21));
      const speed = Math.min(14, Math.hypot(cursor.velocityX, cursor.velocityY));
      const visibleNodes = nodes.map((node) => {
        const dx = node.x - cursor.x;
        const dy = node.y - cursor.y;
        const distance = Math.hypot(dx, dy) || 1;
        const falloff = Math.max(0, 1 - distance / influenceRadius) ** 2 * cursor.active;
        const orbit = falloff * (7 + speed * .52);
        const tangentX = -dy / distance;
        const tangentY = dx / distance;
        const follow = falloff * 2.2;
        return {
          x: node.x + (dx / distance) * orbit + tangentX * follow + cursor.velocityX * falloff * .32,
          y: node.y + (dy / distance) * orbit + tangentY * follow + cursor.velocityY * falloff * .32,
          radius: node.radius,
          phase: node.phase,
        };
      });

      // A small spatial hash avoids testing every pair when the admin chooses
      // a dense network, keeping scroll and pointer interaction inexpensive.
      const densityScale = Math.max(.58, Math.sqrt(70 / safeCount));
      const maxDistance = Math.min(180, Math.max(95, width * .085 * densityScale));
      const cellSize = maxDistance;
      const cells = new Map();
      visibleNodes.forEach((node, index) => {
        const key = `${Math.floor(node.x / cellSize)}:${Math.floor(node.y / cellSize)}`;
        const cell = cells.get(key) || [];
        cell.push(index);
        cells.set(key, cell);
      });
      for (let a = 0; a < visibleNodes.length; a += 1) {
        const first = visibleNodes[a];
        const cellX = Math.floor(first.x / cellSize);
        const cellY = Math.floor(first.y / cellSize);
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const nearby = cells.get(`${cellX + offsetX}:${cellY + offsetY}`) || [];
            for (const b of nearby) {
              if (b <= a) continue;
              const second = visibleNodes[b];
              const distance = Math.hypot(first.x - second.x, first.y - second.y);
              if (distance >= maxDistance) continue;
              const midX = (first.x + second.x) * .5;
              const midY = (first.y + second.y) * .5;
              const nearCursor = Math.max(0, 1 - Math.hypot(cursor.x - midX, cursor.y - midY) / influenceRadius) * cursor.active;
              context.strokeStyle = `rgba(255, 30, 46, ${(0.025 + nearCursor * .065) * densityScale * (1 - distance / maxDistance)})`;
              context.lineWidth = .65 + nearCursor * .25;
              context.beginPath();
              context.moveTo(first.x, first.y);
              context.lineTo(second.x, second.y);
              context.stroke();
            }
          }
        }
      }

      visibleNodes.forEach((node) => {
        const nearCursor = Math.max(0, 1 - Math.hypot(cursor.x - node.x, cursor.y - node.y) / influenceRadius) * cursor.active;
        const twinkle = reduceMotion ? .5 : (Math.sin(timestamp * .0012 + node.phase) + 1) * .5;
        const alpha = (.12 + twinkle * .08 + nearCursor * .24) * Math.max(.62, densityScale);
        if (nearCursor > .08) {
          context.beginPath();
          context.moveTo(node.x - cursor.velocityX * 1.2, node.y - cursor.velocityY * 1.2);
          context.lineTo(node.x, node.y);
          context.strokeStyle = `rgba(255, 45, 58, ${nearCursor * .16})`;
          context.lineWidth = Math.max(.6, node.radius * .58);
          context.stroke();
        }
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 48, 62, ${alpha})`;
        context.fill();
      });

      if (cursor.active > .02 && cursor.x >= 0 && cursor.x <= width && cursor.y >= 0 && cursor.y <= height) {
        const nearest = visibleNodes
          .map((node) => ({ node, distance: Math.hypot(node.x - cursor.x, node.y - cursor.y) }))
          .filter((entry) => entry.distance < influenceRadius * .48)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 7);
        nearest.forEach(({ node, distance }) => {
          const glow = (1 - distance / (influenceRadius * .48)) * cursor.active;
          context.strokeStyle = `rgba(255, 49, 63, ${glow * .13})`;
          context.lineWidth = .7;
          context.beginPath();
          context.moveTo(cursor.x, cursor.y);
          context.lineTo(node.x, node.y);
          context.stroke();
        });
        context.beginPath();
        context.arc(cursor.x, cursor.y, 2 + speed * .12, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 72, 82, ${cursor.active * .42})`;
        context.fill();
      }

      if (!reduceMotion) frame = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event) => {
      if (event.pointerType === 'touch') return;
      if (!cursor.initialized || cursor.targetActive < .1) {
        cursor.x = event.clientX;
        cursor.y = event.clientY;
        cursor.initialized = true;
      }
      cursor.targetX = event.clientX;
      cursor.targetY = event.clientY;
      cursor.targetActive = 1;
      if (reduceMotion) {
        cursor.x = event.clientX;
        cursor.y = event.clientY;
        cursor.active = 1;
        draw();
      }
    };
    const onPointerLeave = () => {
      cursor.targetActive = 0;
      if (reduceMotion) {
        cursor.active = 0;
        draw();
      }
    };
    const onPointerOut = (event) => { if (event.relatedTarget === null) onPointerLeave(); };
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
      } else if (!reduceMotion && !frame) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    resize();
    if (!reduceMotion && !frame) frame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopped = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [count, reduceMotion, size]);

  return <canvas ref={canvasRef} className="neural-network-canvas" aria-hidden="true" />;
}
