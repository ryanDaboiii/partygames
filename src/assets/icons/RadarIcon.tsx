import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export function RadarIcon({ size = 24, style }: { size?: number; style?: any }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      {/* Base post */}
      <Rect x="45" y="72" width="10" height="16" rx="3" fill="#FFD54F" stroke="#111" strokeWidth="3"/>
      {/* Base stand */}
      <Rect x="30" y="84" width="40" height="9" rx="4" fill="#FFD54F" stroke="#111" strokeWidth="3"/>
      {/* Dish bowl */}
      <Path d="M12,70 Q30,10 80,30" fill="#4FC3F7" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
      <Path d="M12,70 Q20,58 45,72" fill="#4FC3F7" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
      {/* Signal arc 1 */}
      <Path d="M60,38 Q72,22 80,42" fill="none" stroke="#FF2D78" strokeWidth="4" strokeLinecap="round"/>
      {/* Signal arc 2 */}
      <Path d="M68,46 Q84,24 92,50" fill="none" stroke="#FF2D78" strokeWidth="4" strokeLinecap="round"/>
      {/* Signal dot */}
      <Circle cx="54" cy="30" r="6" fill="#FF2D78" stroke="#111" strokeWidth="2.5"/>
    </Svg>
  );
}
