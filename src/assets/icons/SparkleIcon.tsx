import React from "react";
import Svg, { Polygon } from "react-native-svg";

export function SparkleIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Polygon
        points="50,6 58,42 94,50 58,58 50,94 42,58 6,50 42,42"
        fill="#FFD54F"
        stroke="#111111"
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
