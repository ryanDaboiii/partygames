import React from "react";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

export function InfoIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} fill="#FF2D78" stroke="#111111" strokeWidth={7} />
      <SvgText
        x="50"
        y="72"
        textAnchor="middle"
        fontSize={64}
        fontWeight="900"
        fill="white"
      >
        ?
      </SvgText>
    </Svg>
  );
}
