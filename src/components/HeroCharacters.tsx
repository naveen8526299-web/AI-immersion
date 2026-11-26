import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Flame, ShieldAlert, Smile, Sparkles } from 'lucide-react';
import { HeroId, HeroMood } from '../types';
import { assetUrl } from '../utils/assetUrl';

interface HeroAvatarProps {
  heroId: HeroId;
  mood?: HeroMood;
  size?: number;
  auraId?: string;
  animateFloat?: boolean;
}

const HERO_IMAGES: Record<HeroId, string> = {
  'captain-campus': assetUrl('assets/characters/captain-campus.jpg'),
  'iron-scholar': assetUrl('assets/characters/iron-scholar.jpg'),
  'doctor-deadline': assetUrl('assets/characters/doctor-deadline.jpg'),
  'spider-coder': assetUrl('assets/characters/spider-coder.jpg'),
};

const AURA_STYLES: Record<string, { border: string; ring: string; glow: string }> = {
  'default-spark': {
    border: 'border-[#00D9FF]/80',
    ring: 'ring-[#8138F5]/35',
    glow: 'shadow-[0_0_24px_rgba(0,217,255,0.4)]',
  },
  'vibranium-shield': {
    border: 'border-[#00D9FF]',
    ring: 'ring-[#1677FF]/50',
    glow: 'shadow-[0_0_32px_rgba(0,217,255,0.65)]',
  },
  'arc-reactor': {
    border: 'border-[#FFC857]',
    ring: 'ring-[#FFC857]/45',
    glow: 'shadow-[0_0_32px_rgba(255,200,87,0.65)]',
  },
  'chrono-nexus': {
    border: 'border-[#22C55E]',
    ring: 'ring-[#00D9FF]/45',
    glow: 'shadow-[0_0_30px_rgba(34,197,94,0.6)]',
  },
};

const MOOD_BADGES: Record<HeroMood, { icon: React.ReactNode; bg: string; label: string }> = {
  happy: { icon: <Smile className="h-3 w-3" />, bg: 'bg-[#22C55E] text-slate-950', label: 'Happy' },
  celebration: { icon: <Sparkles className="h-3 w-3" />, bg: 'bg-[#FFC857] text-slate-950', label: '100%!' },
  worried: { icon: <AlertTriangle className="h-3 w-3" />, bg: 'bg-[#FF9F43] text-slate-950', label: 'Watch' },
  warning: { icon: <ShieldAlert className="h-3 w-3" />, bg: 'bg-[#FF3155] text-white', label: 'Alert' },
  sad: { icon: <AlertTriangle className="h-3 w-3" />, bg: 'bg-[#8138F5] text-white', label: 'Recover' },
  angry: { icon: <Flame className="h-3 w-3" />, bg: 'bg-[#FF3155] text-white', label: 'Urgent' },
  idle: { icon: <Sparkles className="h-3 w-3" />, bg: 'bg-[#00D9FF] text-slate-950', label: 'Ready' },
};

export const HeroAvatarSVG: React.FC<HeroAvatarProps> = ({
  heroId,
  mood = 'idle',
  size = 110,
  auraId = 'default-spark',
  animateFloat = true,
}) => {
  const aura = AURA_STYLES[auraId] || AURA_STYLES['default-spark'];
  const moodInfo = MOOD_BADGES[mood] || MOOD_BADGES.idle;
  const imgSrc = HERO_IMAGES[heroId] || HERO_IMAGES['captain-campus'];

  const floatVariants = animateFloat
    ? mood === 'celebration'
      ? { y: [0, -10, 0], rotate: [0, -3, 3, 0], scale: [1, 1.05, 1] }
      : mood === 'warning' || mood === 'angry'
      ? { x: [0, -3, 3, -2, 2, 0], y: [0, -4, 0] }
      : { y: [0, -7, 0], rotate: [-1.5, 1.5, -1.5] }
    : {};

  const transition =
    mood === 'celebration'
      ? { duration: 1.7, repeat: Infinity, ease: 'easeInOut' as const }
      : mood === 'warning' || mood === 'angry'
      ? { duration: 1.35, repeat: Infinity, ease: 'easeInOut' as const }
      : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <motion.div
      animate={floatVariants}
      transition={transition}
      whileHover={{ scale: 1.07, rotateY: 8 }}
      style={{ width: size, height: size, perspective: 600 }}
      className={`relative inline-flex items-center justify-center select-none ${animateFloat ? 'floating-hero' : ''}`}
    >
      {/* Spinning outer dashed aura when upgraded aura is equipped */}
      {auraId !== 'default-spark' && (
        <div className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-dashed border-[#00D9FF]/65 animate-shield-spin" />
      )}

      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 ring-4 bg-[#17152D] ${aura.border} ${aura.ring} ${aura.glow}`}
      >
        <img
          src={imgSrc}
          alt={heroId}
          className={`w-full h-full object-cover object-top transition-transform duration-300 ${
            mood === 'sad' ? 'saturate-75 brightness-90' : mood === 'celebration' ? 'saturate-125 brightness-105' : ''
          }`}
        />

        {/* Subtle animated eye-blink & cosmic sheen SVG overlay */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 w-full h-full">
          <g className="animate-blink">
            <ellipse cx="42" cy="36" rx="8" ry="3.2" fill="#080817" />
            <ellipse cx="62" cy="36" rx="8" ry="3.2" fill="#080817" />
          </g>
        </svg>

        {/* Expression lighting tint */}
        {(mood === 'warning' || mood === 'angry') && (
          <div className="pointer-events-none absolute inset-0 bg-[#FF3155]/25 animate-pulse" />
        )}
        {mood === 'celebration' && (
          <div className="pointer-events-none absolute inset-0 ring-inset ring-2 ring-[#FFC857]/60" />
        )}
      </div>

      {/* Mood indicator pill */}
      {size >= 72 && (
        <span
          className={`absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold shadow-md ${moodInfo.bg}`}
        >
          {moodInfo.icon}
          {size >= 96 && <span>{moodInfo.label}</span>}
        </span>
      )}
    </motion.div>
  );
};

export const ThanosAdminArtwork: React.FC<{ size?: number }> = ({ size = 180 }) => (
  <motion.div
    animate={{ y: [0, -6, 0], scale: [1, 1.025, 1] }}
    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    style={{ width: Math.round(size * 1.45), height: size }}
    className="relative inline-flex items-center justify-center select-none rounded-2xl overflow-hidden border-2 border-[#FF3155]/75 shadow-[0_0_40px_rgba(129,56,245,0.75),0_0_24px_rgba(255,49,85,0.45)]"
  >
    <img
      src={assetUrl('assets/characters/thanos-admin.jpg')}
      alt="Thanos – College Administration"
      className="w-full h-full object-cover object-center"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080817]/70 via-transparent to-[#FF3155]/10" />
  </motion.div>
);

export const CoinMascotArtwork: React.FC<{ size?: number }> = ({ size = 112 }) => (
  <motion.div
    animate={{ y: [0, -6, 0] }}
    whileHover={{ scale: 1.06, rotateY: 10 }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    style={{ width: size, height: size, perspective: 600 }}
    className="relative inline-flex items-center justify-center select-none rounded-2xl overflow-hidden border-2 border-[#FFC857]/75 shadow-[0_0_28px_rgba(255,200,87,0.45)]"
  >
    <img
      src={assetUrl('assets/characters/coin-mascot.jpg')}
      alt="AttendanceGuard Coin Guardian"
      className="w-full h-full object-cover object-center"
    />
  </motion.div>
);
