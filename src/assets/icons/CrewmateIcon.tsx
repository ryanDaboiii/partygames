import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export function CrewmateIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={38} cy={30} r={16} fill="#4FC3F7" stroke="#111111" strokeWidth={5} />
      <Path d="M12 78 Q12 54 38 54 Q50 54 57 61" fill="#4FC3F7" stroke="#111111" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={62} cy={32} r={16} fill="#4FC3F7" stroke="#111111" strokeWidth={5} />
      <Path d="M38 82 Q38 58 62 58 Q86 58 86 82" fill="#4FC3F7" stroke="#111111" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
