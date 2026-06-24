import React from "react";
import Svg, { Circle, Line } from "react-native-svg";

export function BanIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={50} cy={50} r={40} fill="#FF2D78" stroke="#111111" strokeWidth={7} />
      <Line x1={20} y1={20} x2={80} y2={80} stroke="#111111" strokeWidth={18} strokeLinecap="round" />
    </Svg>
  );
}
