import React from "react";
import Svg, { Path, Line } from "react-native-svg";

export function SpeakerMutedIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Megaphone body (same as SpeakerIcon) */}
      <Path d="M10 38 L10 62 L34 62 L62 82 L62 18 L34 38 Z" fill="#FF2D78" stroke="#111111" strokeWidth={6} strokeLinejoin="round" />
      {/* Mute X — black outline then colored fill */}
      <Line x1={68} y1={30} x2={96} y2={70} stroke="#111111" strokeWidth={9} strokeLinecap="round" />
      <Line x1={96} y1={30} x2={68} y2={70} stroke="#111111" strokeWidth={9} strokeLinecap="round" />
      <Line x1={68} y1={30} x2={96} y2={70} stroke="#FFD54F" strokeWidth={5} strokeLinecap="round" />
      <Line x1={96} y1={30} x2={68} y2={70} stroke="#FFD54F" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
