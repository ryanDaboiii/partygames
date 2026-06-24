import React from "react";
import Svg, { Path } from "react-native-svg";

export function SpeakerIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {/* Megaphone body */}
      <Path d="M10 38 L10 62 L34 62 L62 82 L62 18 L34 38 Z" fill="#FF2D78" stroke="#111111" strokeWidth={6} strokeLinejoin="round" />
      {/* Sound wave 1 */}
      <Path d="M70 38 Q82 50 70 62" fill="none" stroke="#111111" strokeWidth={9} strokeLinecap="round" />
      <Path d="M70 38 Q82 50 70 62" fill="none" stroke="#FFD54F" strokeWidth={5} strokeLinecap="round" />
      {/* Sound wave 2 */}
      <Path d="M80 28 Q98 50 80 72" fill="none" stroke="#111111" strokeWidth={9} strokeLinecap="round" />
      <Path d="M80 28 Q98 50 80 72" fill="none" stroke="#FFD54F" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
