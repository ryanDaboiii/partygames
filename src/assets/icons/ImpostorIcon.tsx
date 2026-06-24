import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export function ImpostorIcon({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Cloak body */}
      <Path
        d="M22 62 Q16 78 16 94 L84 94 Q84 78 78 62 Z"
        fill="#FF2D78"
        stroke="#111111"
        strokeWidth={5}
        strokeLinejoin="round"
      />
      {/* Round head */}
      <Circle cx={50} cy={36} r={24} fill="#FF2D78" stroke="#111111" strokeWidth={5} />
      {/* Left eyebrow — outer high, inner low (menacing inward slant) */}
      <Path d="M31 24 L46 29" fill="none" stroke="#111111" strokeWidth={6} strokeLinecap="round" />
      {/* Right eyebrow — mirror */}
      <Path d="M54 29 L69 24" fill="none" stroke="#111111" strokeWidth={6} strokeLinecap="round" />
      {/* Left eye */}
      <Circle cx={41} cy={34} r={5} fill="white" />
      <Circle cx={41.5} cy={35} r={2.5} fill="#111111" />
      {/* Right eye */}
      <Circle cx={59} cy={34} r={5} fill="white" />
      <Circle cx={59.5} cy={35} r={2.5} fill="#111111" />
    </Svg>
  );
}
