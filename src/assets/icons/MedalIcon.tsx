import React from "react";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "#FFD54F",
  2: "#4FC3F7",
  3: "#69F0AE",
};

export function MedalIcon({ size = 24, style, rank }: { size?: number; style?: any; rank: 1 | 2 | 3 }) {
  const color = MEDAL_COLORS[rank];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Path d="M38 55 L26 82" fill="none" stroke="#111111" strokeWidth={10} strokeLinecap="round" />
      <Path d="M38 55 L26 82" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <Path d="M62 55 L74 82" fill="none" stroke="#111111" strokeWidth={10} strokeLinecap="round" />
      <Path d="M62 55 L74 82" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={50} cy={40} r={32} fill={color} stroke="#111111" strokeWidth={6} />
      <SvgText
        x="50"
        y="52"
        textAnchor="middle"
        fill="#111111"
        fontSize="36"
        fontWeight="900"
      >
        {rank}
      </SvgText>
    </Svg>
  );
}
