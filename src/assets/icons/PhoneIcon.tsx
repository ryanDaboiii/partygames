import React from "react";
import Svg, { Rect } from "react-native-svg";

export function PhoneIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Rect x={22} y={6} width={56} height={88} rx={12} ry={12} fill="white" stroke="#111111" strokeWidth={6} />
      <Rect x={28} y={18} width={44} height={60} rx={5} ry={5} fill="#111111" />
      <Rect x={38} y={82} width={24} height={5} rx={2.5} fill="#111111" />
    </Svg>
  );
}
