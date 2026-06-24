import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export function HourglassIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      {/* Top bar */}
      <Rect x="18" y="10" width="64" height="10" rx="5" fill="#FFD54F" stroke="#111" strokeWidth="3.5"/>
      {/* Bottom bar */}
      <Rect x="18" y="80" width="64" height="10" rx="5" fill="#FFD54F" stroke="#111" strokeWidth="3.5"/>
      {/* Top triangle (sky blue sand) */}
      <Path d="M22,20 L78,20 L54,50 L46,50 Z" fill="#4FC3F7" stroke="#111" strokeWidth="3" strokeLinejoin="round"/>
      {/* Bottom triangle (pink sand) */}
      <Path d="M46,50 L54,50 L78,80 L22,80 Z" fill="#FF2D78" stroke="#111" strokeWidth="3" strokeLinejoin="round"/>
      {/* Sand grain in neck */}
      <Circle cx="50" cy="50" r="5" fill="#FFD54F" stroke="#111" strokeWidth="2.5"/>
    </Svg>
  );
}
