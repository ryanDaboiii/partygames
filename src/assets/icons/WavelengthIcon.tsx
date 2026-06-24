import React from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";

export function WavelengthIcon({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Full gauge track: black outline */}
      <Path
        d="M14 68 A36 36 0 0 1 86 68"
        fill="none"
        stroke="#111111"
        strokeWidth={18}
        strokeLinecap="round"
      />
      {/* Full gauge track: sky blue */}
      <Path
        d="M14 68 A36 36 0 0 1 86 68"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Yellow zone: black outline */}
      <Path
        d="M14 68 A36 36 0 0 1 69 35"
        fill="none"
        stroke="#111111"
        strokeWidth={18}
        strokeLinecap="round"
      />
      {/* Yellow zone */}
      <Path
        d="M14 68 A36 36 0 0 1 69 35"
        fill="none"
        stroke="#FFD54F"
        strokeWidth={12}
        strokeLinecap="round"
      />
      {/* Needle: black outline */}
      <Line x1={50} y1={68} x2={69} y2={35} stroke="#111111" strokeWidth={11} strokeLinecap="round" />
      {/* Needle: hot pink */}
      <Line x1={50} y1={68} x2={69} y2={35} stroke="#FF2D78" strokeWidth={7} strokeLinecap="round" />
      {/* Center hub */}
      <Circle cx={50} cy={68} r={11} fill="#111111" />
      <Circle cx={50} cy={68} r={5} fill="white" />
    </Svg>
  );
}
