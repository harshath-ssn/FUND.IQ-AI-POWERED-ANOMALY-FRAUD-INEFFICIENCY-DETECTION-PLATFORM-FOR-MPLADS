import React, { useState, useRef } from 'react';

export default function Hologram3DCard({
  children,
  className = "",
  glowType = "cyan", // 'cyan' | 'purple' | 'red' | 'green' | 'amber'
  interactive = true,
  onClick
}) {
  const cardRef = useRef(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -5;
    const rY = ((x - centerX) / centerX) * 5;

    setRotX(rX);
    setRotY(rY);
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    if (!interactive) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  const glowStyles = {
    cyan: "bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10",
    purple: "bg-white border-slate-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10",
    red: "bg-red-50/50 border-red-200 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/15",
    green: "bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/15",
    amber: "bg-amber-50/50 border-amber-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/15"
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 transition-transform duration-200 ease-out ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out'
        }}
        className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${glowStyles[glowType] || glowStyles.cyan} ${className}`}
      >
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-40 rounded-2xl"
            style={{
              background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.08), transparent 70%)`
            }}
          />
        )}

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
