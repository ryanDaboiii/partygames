import React from "react";
import Svg, { Line, Rect } from "react-native-svg";

export function ChartIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Rect x={8} y={58} width={22} height={32} rx={4} fill="#FF2D78" stroke="#111111" strokeWidth={4} />
      <Rect x={39} y={36} width={22} height={54} rx={4} fill="#FF2D78" stroke="#111111" strokeWidth={4} />
      <Rect x={70} y={12} width={22} height={78} rx={4} fill="#FF2D78" stroke="#111111" strokeWidth={4} />
      <Line x1={4} y1={92} x2={96} y2={92} stroke="#111111" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
