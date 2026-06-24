import React from "react";
import Svg, { Line } from "react-native-svg";

export function XIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Line x1={16} y1={16} x2={84} y2={84} stroke="#111111" strokeWidth={24} strokeLinecap="round" />
      <Line x1={84} y1={16} x2={16} y2={84} stroke="#111111" strokeWidth={24} strokeLinecap="round" />
      <Line x1={16} y1={16} x2={84} y2={84} stroke="#FF2D78" strokeWidth={15} strokeLinecap="round" />
      <Line x1={84} y1={16} x2={16} y2={84} stroke="#FF2D78" strokeWidth={15} strokeLinecap="round" />
    </Svg>
  );
}
