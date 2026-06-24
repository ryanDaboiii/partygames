import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { useSoundStore } from '../store/soundStore';
import { SpeakerIcon } from '../assets/icons/SpeakerIcon';
import { SpeakerMutedIcon } from '../assets/icons/SpeakerMutedIcon';

export function MuteButton() {
  const { isMuted, toggleMute } = useSoundStore();
  const offset = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(offset, {
      toValue: 4,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(offset, {
      toValue: 0,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={toggleMute}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={12}
      style={styles.wrapper}
    >
      {/* Static bottom shadow layer for 3D depth */}
      <Animated.View style={styles.shadow} />
      {/* Top face — moves on press */}
      <Animated.View style={[styles.button, { transform: [{ translateY: offset }] }]}>
        {isMuted
          ? <SpeakerMutedIcon size={22} />
          : <SpeakerIcon size={22} />
        }
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 52,
    right: 16,
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
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderWidth: 2.5,
    borderColor: '#FF2D78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2D78',
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
    backgroundColor: '#8B0033',
    top: 4,
  },
});
