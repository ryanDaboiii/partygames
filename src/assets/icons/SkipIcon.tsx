import React from "react";
import Svg, { Polygon, Rect } from "react-native-svg";

export function SkipIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Polygon points="10,18 10,82 60,50" fill="#4FC3F7" stroke="#111111" strokeWidth={5} strokeLinejoin="round" />
      <Rect x={68} y={18} width={22} height={64} rx={5} fill="#4FC3F7" stroke="#111111" strokeWidth={4} />
    </Svg>
  );
}
