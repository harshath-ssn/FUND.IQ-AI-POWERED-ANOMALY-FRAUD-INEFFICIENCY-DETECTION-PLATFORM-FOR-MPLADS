import React, { useEffect, useRef } from 'react';

export default function ThreeDBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const numParticles = 45;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 600 + 100,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 1,
        color: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#6366f1' : '#0d9488'
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const fov = 400;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        if (p.z < 50) p.z = 600;
        if (p.z > 600) p.z = 50;

        const scale = fov / (fov + p.z);
        const projX = (p.x - width / 2) * scale + width / 2;
        const projY = (p.y - height / 2) * scale + height / 2;
        const projSize = p.size * scale * 1.5;

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.5, projSize), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.25 * scale;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dz = p.z - p2.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < 120) {
            const scale2 = fov / (fov + p2.z);
            const projX2 = (p2.x - width / 2) * scale2 + width / 2;
            const projY2 = (p2.y - height / 2) * scale2 + height / 2;

            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(projX2, projY2);
            const alpha = (1 - dist3D / 120) * 0.12 * scale;
            ctx.strokeStyle = `rgba(100, 116, 139, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}
