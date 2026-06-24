import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

export function BallotIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Box */}
      <Rect x={6} y={46} width={88} height={48} rx={12} fill="#4FC3F7" stroke="#111111" strokeWidth={6} />
      {/* Slot */}
      <Rect x={30} y={40} width={40} height={14} rx={7} fill="#111111" />
      {/* Paper */}
      <Rect x={26} y={4} width={48} height={50} rx={8} fill="white" stroke="#111111" strokeWidth={6} />
      {/* Large checkmark on paper */}
      <Path d="M36 28 L46 40 L66 18" fill="none" stroke="#69F0AE" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
