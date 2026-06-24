import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export function WaitingDotsIcon({ size = 24, style }: { size?: number; style?: any }) {
  const anim1 = useRef(new Animated.Value(0.3)).current;
  const anim2 = useRef(new Animated.Value(0.3)).current;
  const anim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const makeDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(Math.max(0, 800 - delay)),
        ])
      );

    const a1 = makeDot(anim1, 0);
    const a2 = makeDot(anim2, 267);
    const a3 = makeDot(anim3, 534);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotSize = Math.max(4, Math.round(size * 0.28));
  const gap = Math.max(2, Math.round(size * 0.12));

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>
      {[anim1, anim2, anim3].map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: "#FF2D78",
            opacity: anim,
          }}
        />
      ))}
    </View>
  );
}
