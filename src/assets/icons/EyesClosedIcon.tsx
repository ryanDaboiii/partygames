import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export function EyesClosedIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={50} cy={50} r={42} fill="#FFD54F" stroke="#111111" strokeWidth={6} />
      <Path d="M22 46 Q30 36 38 46" fill="none" stroke="#111111" strokeWidth={6} strokeLinecap="round" />
      <Path d="M62 46 Q70 36 78 46" fill="none" stroke="#111111" strokeWidth={6} strokeLinecap="round" />
      <Path d="M32 66 Q50 78 68 66" fill="none" stroke="#111111" strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}
