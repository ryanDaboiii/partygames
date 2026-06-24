import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  style?: object;
}

export default function LockIcon({ size = 24, style }: Props) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size} style={style}>
      <Path
        d="M30,48 L30,32 Q30,12 50,12 Q70,12 70,32 L70,48"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <Rect x="16" y="45" width="68" height="48" rx="10" fill="#FFD60A" stroke="#FFFFFF" strokeWidth="4"/>
      <Circle cx="50" cy="63" r="8" fill="#1A1A2E"/>
      <Rect x="46" y="68" width="8" height="12" rx="2" fill="#1A1A2E"/>
    </Svg>
  );
}
