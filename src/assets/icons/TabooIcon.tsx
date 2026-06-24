import React from "react";
import Svg, { Line, Polygon, Rect } from "react-native-svg";

export function TabooIcon({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="18,76 38,76 22,97" fill="#FFD54F" />
      <Rect x="8" y="8" width="84" height="68" rx="16" fill="#FFD54F" stroke="#111111" strokeWidth="5" />
      <Line x1="18" y1="75" x2="22" y2="97" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      <Line x1="38" y1="75" x2="22" y2="97" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      <Line x1="28" y1="24" x2="72" y2="60" stroke="#111111" strokeWidth="14" strokeLinecap="round" />
      <Line x1="72" y1="24" x2="28" y2="60" stroke="#111111" strokeWidth="14" strokeLinecap="round" />
      <Line x1="28" y1="24" x2="72" y2="60" stroke="#FF2D78" strokeWidth="9" strokeLinecap="round" />
      <Line x1="72" y1="24" x2="28" y2="60" stroke="#FF2D78" strokeWidth="9" strokeLinecap="round" />
    </Svg>
  );
}
