import React from "react";
import Svg, { Rect } from "react-native-svg";

export function PauseIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Rect x={16} y={14} width={28} height={72} rx={7} fill="white" stroke="#111111" strokeWidth={4} />
      <Rect x={56} y={14} width={28} height={72} rx={7} fill="white" stroke="#111111" strokeWidth={4} />
    </Svg>
  );
}
