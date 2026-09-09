import React from 'react';
import UrbanTadkaLogo from '../assets/urban-tadka-hotel-logo.jpg';

const UrbanTadkaHotelLogo = ({ size = 'normal', showStars = true, className = '', variant = 'auto' }) => {
  const isLarge = size === 'large';
  const isGoldVariant = variant === 'gold';

  // Size mappings for the circular logo image
  const logoSize = isLarge ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-11 h-11';

  return (
    <div className={`flex items-center gap-3.5 group select-none cursor-pointer ${className}`}>
      {/* 👑 Royal Logo Emblem with Premium Glow */}
      <div className="relative flex items-center justify-center shrink-0">
        {/* Ambient Gold Glow */}
        <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/40 via-yellow-400/30 to-amber-600/40 rounded-full blur-md opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none" />

        {/* Gold Ring Border */}
        <div className={`${logoSize} relative rounded-full group-hover:scale-105 transition-transform duration-300 shrink-0`}>
          {/* Outer gold ring */}
          <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
          
          {/* Logo Image */}
          <img 
            src={UrbanTadkaLogo} 
            alt="Urban Tadka Logo" 
            className="relative w-full h-full rounded-full object-cover shadow-lg ring-1 ring-amber-400/30"
            draggable={false}
          />
        </div>
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <h1 className={`font-black tracking-[0.14em] font-serif ${isLarge ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'} ${
            isGoldVariant 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFF1C5] via-[#F5CB68] to-[#E2A638] drop-shadow-[0_2px_14px_rgba(226,166,56,0.6)]'
              : 'text-[#221008] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#FFF1C5] dark:via-[#F5CB68] dark:to-[#E2A638] dark:drop-shadow-[0_2px_14px_rgba(226,166,56,0.6)]'
          } uppercase leading-none`}>
            Urban Tadka
          </h1>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[10px] font-black tracking-[0.22em] uppercase ${
            isGoldVariant 
              ? 'text-[#F5CB68] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]' 
              : 'text-[#9A6216] dark:text-[#F5CB68] dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
          }`}>
            5-STAR LUXURY HOTEL
          </span>
          {showStars && (
            <div className={`flex items-center text-[11px] gap-0.5 font-black shrink-0 ${
              isGoldVariant 
                ? 'text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]' 
                : 'text-[#C99436] dark:text-[#FFD700] dark:drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]'
            }`}>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GrandHorizonLogo = UrbanTadkaHotelLogo;
export { UrbanTadkaHotelLogo };
export default UrbanTadkaHotelLogo;
