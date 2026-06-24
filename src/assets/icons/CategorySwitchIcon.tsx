import React from "react";
import Svg, { Path, Polygon } from "react-native-svg";

export function CategorySwitchIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Top arrow pointing left */}
      <Path d="M72 30 L28 30" fill="none" stroke="#111111" strokeWidth={14} strokeLinecap="round" />
      <Path d="M72 30 L28 30" fill="none" stroke="#FFD54F" strokeWidth={8} strokeLinecap="round" />
      <Polygon points="8,30 30,18 30,42" fill="#FFD54F" stroke="#111111" strokeWidth={4} strokeLinejoin="round" />
      {/* Bottom arrow pointing right */}
      <Path d="M28 70 L72 70" fill="none" stroke="#111111" strokeWidth={14} strokeLinecap="round" />
      <Path d="M28 70 L72 70" fill="none" stroke="#FFD54F" strokeWidth={8} strokeLinecap="round" />
      <Polygon points="92,70 70,58 70,82" fill="#FFD54F" stroke="#111111" strokeWidth={4} strokeLinejoin="round" />
    </Svg>
  );
}
