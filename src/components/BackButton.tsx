import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { ArrowLeftIcon } from '../assets/icons/ArrowLeftIcon';

interface Props {
  onPress: () => void;
  color?: string;
}

export function BackButton({ onPress, color = '#FF2D78' }: Props) {
  const offset = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(offset, { toValue: 4, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(offset, { toValue: 0, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={12}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.shadow, { backgroundColor: color + '60' }]} />
      <Animated.View style={[styles.button, { borderColor: color, shadowColor: color }, { transform: [{ translateY: offset }] }]}>
        <ArrowLeftIcon size={20} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  shadow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    top: 4,
  },
});
