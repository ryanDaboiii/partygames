import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

export function TrophyIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Path d="M28 10 L28 54 Q28 74 50 74 Q72 74 72 54 L72 10 Z" fill="#FFD54F" stroke="#111111" strokeWidth={6} strokeLinejoin="round" />
      <Path d="M28 22 Q10 22 10 38 Q10 54 28 50" fill="none" stroke="#111111" strokeWidth={8} strokeLinecap="round" />
      <Path d="M28 22 Q10 22 10 38 Q10 54 28 50" fill="none" stroke="#FFD54F" strokeWidth={5} strokeLinecap="round" />
      <Path d="M72 22 Q90 22 90 38 Q90 54 72 50" fill="none" stroke="#111111" strokeWidth={8} strokeLinecap="round" />
      <Path d="M72 22 Q90 22 90 38 Q90 54 72 50" fill="none" stroke="#FFD54F" strokeWidth={5} strokeLinecap="round" />
      <Rect x={44} y={74} width={12} height={10} rx={2} fill="#FFD54F" stroke="#111111" strokeWidth={4} />
      <Rect x={30} y={84} width={40} height={8} rx={4} fill="#FFD54F" stroke="#111111" strokeWidth={4} />
    </Svg>
  );
}
