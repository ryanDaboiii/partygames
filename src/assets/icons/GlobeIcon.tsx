import React from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";

export function GlobeIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={50} cy={50} r={38} fill="#4FC3F7" stroke="#111111" strokeWidth={6} />
      <Path d="M50 12 Q72 28 72 50 Q72 72 50 88" fill="none" stroke="#111111" strokeWidth={4} />
      <Path d="M50 12 Q28 28 28 50 Q28 72 50 88" fill="none" stroke="#111111" strokeWidth={4} />
      <Line x1={12} y1={50} x2={88} y2={50} stroke="#111111" strokeWidth={4} />
      <Path d="M22 30 Q50 22 78 30" fill="none" stroke="#111111" strokeWidth={3} />
      <Path d="M22 70 Q50 78 78 70" fill="none" stroke="#111111" strokeWidth={3} />
    </Svg>
  );
}
