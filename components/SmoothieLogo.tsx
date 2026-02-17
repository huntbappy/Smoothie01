import React from 'react';

const SmoothieLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 150 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Straw - Black */}
    <path d="M75 50 V20 L95 5" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Lid - Black */}
    <path d="M45 40 H105" stroke="#000000" strokeWidth="8" strokeLinecap="round" />
    
    {/* Cup Body Outline - Black */}
    <path d="M50 50 H100 L95 130 H55 Z" stroke="#000000" strokeWidth="4" fill="white" strokeLinejoin="round" />
    
    {/* Smoothie Liquid - Coffee Color */}
    <path d="M53 70 Q75 55 97 70 V127 H53 Z" fill="#6F4E37" />
    
    {/* Bubbles - Lemon Green */}
    <circle cx="62" cy="80" r="3" fill="#A4C639" opacity="0.8" />
    <circle cx="88" cy="90" r="3.5" fill="#A4C639" opacity="0.8" />
    <circle cx="75" cy="105" r="2.5" fill="#A4C639" opacity="0.8" />
    <circle cx="68" cy="120" r="2" fill="#A4C639" opacity="0.8" />
    <circle cx="82" cy="117" r="2.5" fill="#A4C639" opacity="0.8" />
    
    {/* Banner Ribbon - Lemon Green */}
    <path d="M15 90 H135 V115 H15 L20 102.5 L15 90" fill="#A4C639" stroke="#000000" strokeWidth="2.5" />
    <path d="M135 90 L140 102.5 L135 115" fill="#A4C639" stroke="#000000" strokeWidth="2.5" />
    
    {/* Banner Text - Black */}
    <text 
      x="75" 
      y="107" 
      fontSize="16" 
      fontWeight="900" 
      textAnchor="middle" 
      fill="#000000" 
      style={{ letterSpacing: '3px', fontFamily: 'Impact, "Arial Black", sans-serif' }}
    >
      SMOOTHIE
    </text>
    
    {/* Bottom BAR Section - Black */}
    <line x1="15" y1="150" x2="50" y2="150" stroke="#000000" strokeWidth="4" />
    <text 
      x="75" 
      y="163" 
      fontSize="36" 
      fontWeight="900" 
      textAnchor="middle" 
      fill="#000000" 
      style={{ letterSpacing: '4px', fontFamily: 'Impact, "Arial Black", sans-serif' }}
    >
      BAR
    </text>
    <line x1="100" y1="150" x2="135" y2="150" stroke="#000000" strokeWidth="4" />
  </svg>
);

export default SmoothieLogo;