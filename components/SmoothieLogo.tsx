import React from 'react';

const SmoothieLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 150 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Straw - White with glow */}
    <path d="M75 50 V20 L95 5" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
    
    {/* Lid - White */}
    <path d="M45 40 H105" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" filter="url(#glow)" />
    
    {/* Cup Body Outline - White */}
    <path d="M50 50 H100 L95 130 H55 Z" stroke="#FFFFFF" strokeWidth="4" fill="rgba(255,255,255,0.05)" strokeLinejoin="round" filter="url(#glow)" />
    
    {/* Smoothie Liquid - Coffee Color */}
    <path d="M53 70 Q75 55 97 70 V127 H53 Z" fill="#D97706" opacity="0.8" />
    
    {/* Bubbles - Emerald */}
    <circle cx="62" cy="80" r="3" fill="#34D399" opacity="0.9" />
    <circle cx="88" cy="90" r="3.5" fill="#34D399" opacity="0.9" />
    <circle cx="75" cy="105" r="2.5" fill="#34D399" opacity="0.9" />
    <circle cx="68" cy="120" r="2" fill="#34D399" opacity="0.9" />
    <circle cx="82" cy="117" r="2.5" fill="#34D399" opacity="0.9" />
    
    {/* Banner Ribbon - Emerald */}
    <path d="M15 90 H135 V115 H15 L20 102.5 L15 90" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" filter="url(#glow)" />
    
    {/* Banner Text - White */}
    <text 
      x="75" 
      y="107" 
      fontSize="16" 
      fontWeight="900" 
      textAnchor="middle" 
      fill="#FFFFFF" 
      style={{ letterSpacing: '3px', fontFamily: 'Impact, "Arial Black", sans-serif' }}
      filter="url(#glow)"
    >
      SMOOTHIE
    </text>
    
    {/* Bottom BAR Section - White */}
    <line x1="15" y1="150" x2="50" y2="150" stroke="#FFFFFF" strokeWidth="4" filter="url(#glow)" />
    <text 
      x="75" 
      y="163" 
      fontSize="36" 
      fontWeight="900" 
      textAnchor="middle" 
      fill="#FFFFFF" 
      style={{ letterSpacing: '4px', fontFamily: 'Impact, "Arial Black", sans-serif' }}
      filter="url(#glow)"
    >
      BAR
    </text>
    <line x1="100" y1="150" x2="135" y2="150" stroke="#FFFFFF" strokeWidth="4" filter="url(#glow)" />
  </svg>
);

export default SmoothieLogo;