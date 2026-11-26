import React from 'react';
import { motion } from 'framer-motion';

export const SpinningGoldCoin: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <span
    style={{ width: size, height: size }}
    className="relative inline-flex items-center justify-center coin-3d-spin select-none shrink-0"
    aria-hidden="true"
  >
    <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,200,87,0.75)]">
      <defs>
        <radialGradient id="goldCoinGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="45%" stopColor="#FFC857" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#goldCoinGrad)" stroke="#FDE68A" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="10.2" fill="none" stroke="#92400E" strokeWidth="1.2" opacity="0.55" />
      <polygon
        points="16,8.5 18.1,13.1 23,13.7 19.4,17.1 20.3,22 16,19.6 11.7,22 12.6,17.1 9,13.7 13.9,13.1"
        fill="#FFFBEB"
      />
    </svg>
  </span>
);

export const RotatingGoldenShield: React.FC<{ size?: number; active?: boolean }> = ({ size = 112, active = true }) => (
  <div
    style={{ width: size, height: size }}
    className="relative inline-flex items-center justify-center select-none"
  >
    {/* Orbiting star particles */}
    {active && (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute inset-0"
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#FFC857] shadow-[0_0_10px_#FFC857]" />
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_10px_#00D9FF]" />
        <span className="absolute top-1/2 -left-1 h-1.5 w-1.5 rounded-full bg-[#FDE68A] shadow-[0_0_8px_#FFC857]" />
      </motion.div>
    )}

    <motion.div
      animate={active ? { rotate: 360 } : {}}
      transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      className={`w-[86%] h-[86%] ${active ? 'shield-glow' : 'opacity-65 grayscale'}`}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <radialGradient id="goldShieldRing" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#FFF7D6" />
            <stop offset="45%" stopColor="#FFC857" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
          <radialGradient id="shieldCore" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#1677FF" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="url(#goldShieldRing)" stroke="#FEF08A" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="41" fill="#17152D" stroke="#FFC857" strokeWidth="2" />
        <circle cx="60" cy="60" r="29" fill="url(#goldShieldRing)" />
        <circle cx="60" cy="60" r="18" fill="url(#shieldCore)" />
        <polygon
          points="60,44 64.5,54.5 75.8,55.5 67.2,62.8 69.8,73.8 60,68 50.2,73.8 52.8,62.8 44.2,55.5 55.5,54.5"
          fill="#FFFBEB"
        />
      </svg>
    </motion.div>
  </div>
);
