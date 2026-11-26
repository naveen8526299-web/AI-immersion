import React from 'react';

export const CosmicBackdrop: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden no-print" aria-hidden="true">
    {/* Animated Nebula Glows */}
    <div className="cosmic-glow absolute -top-28 -left-24 h-[460px] w-[460px] rounded-full bg-[#8138F5]/20 dark:bg-[#8138F5]/25 blur-[120px]" />
    <div className="cosmic-glow absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-[#1677FF]/15 dark:bg-[#00D9FF]/15 blur-[120px]" />
    <div className="cosmic-glow absolute -bottom-32 left-1/3 h-[380px] w-[380px] rounded-full bg-[#8138F5]/10 dark:bg-[#8138F5]/20 blur-[120px]" />

    {/* Moving Star Particles (visible in Dark Cosmic Mode) */}
    <div className="hidden dark:block starfield-layer starfield-1 opacity-70" />
    <div className="hidden dark:block starfield-layer starfield-2 opacity-50" />
  </div>
);
