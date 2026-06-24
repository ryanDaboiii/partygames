import React from "react";
import Svg, { Path } from "react-native-svg";

export function CheckIcon({ size = 24, style, color = "#69F0AE" }: { size?: number; style?: any; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Path d="M12 52 L38 78 L88 20" fill="none" stroke="#111111" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 52 L38 78 L88 20" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
