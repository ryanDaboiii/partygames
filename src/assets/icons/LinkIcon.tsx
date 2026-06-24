import React from "react";
import Svg, { Circle } from "react-native-svg";

export function LinkIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={34} cy={50} r={22} fill="none" stroke="#111111" strokeWidth={10} />
      <Circle cx={34} cy={50} r={22} fill="none" stroke="#FFD54F" strokeWidth={6} />
      <Circle cx={66} cy={50} r={22} fill="none" stroke="#111111" strokeWidth={10} />
      <Circle cx={66} cy={50} r={22} fill="none" stroke="#FFD54F" strokeWidth={6} />
    </Svg>
  );
}
