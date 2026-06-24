import React from "react";
import Svg, { Circle } from "react-native-svg";

export function TargetIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={50} cy={50} r={44} fill="#FF2D78" stroke="#111111" strokeWidth={5} />
      <Circle cx={50} cy={50} r={30} fill="white" stroke="#111111" strokeWidth={5} />
      <Circle cx={50} cy={50} r={15} fill="#FF2D78" stroke="#111111" strokeWidth={5} />
    </Svg>
  );
}
