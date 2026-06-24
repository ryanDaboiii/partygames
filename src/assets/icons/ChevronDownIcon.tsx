import React from "react";
import Svg, { Path } from "react-native-svg";

export function ChevronDownIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Path d="M16 28 L50 72 L84 28" fill="none" stroke="#111111" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 28 L50 72 L84 28" fill="none" stroke="white" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
