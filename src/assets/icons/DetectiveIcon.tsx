import React from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";

export function DetectiveIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Magnifying glass lens */}
      <Circle cx={38} cy={38} r={28} fill="#FF2D78" stroke="#111111" strokeWidth={8} />
      <Circle cx={38} cy={38} r={18} fill="white" />
      {/* Face inside lens */}
      <Circle cx={32} cy={36} r={4} fill="#111111" />
      <Circle cx={44} cy={36} r={4} fill="#111111" />
      <Path d="M30 46 Q38 52 46 46" fill="none" stroke="#111111" strokeWidth={3.5} strokeLinecap="round" />
      {/* Handle */}
      <Line x1={60} y1={60} x2={92} y2={92} stroke="#111111" strokeWidth={18} strokeLinecap="round" />
      <Line x1={60} y1={60} x2={92} y2={92} stroke="#FFD54F" strokeWidth={10} strokeLinecap="round" />
    </Svg>
  );
}
