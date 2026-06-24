import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';

interface Props {
  visible: boolean;
  onKeepScores: () => void;
  onVoidPoints: () => void;
  onCancel: () => void;
}

export function ExitGameDialog({ visible, onKeepScores, onVoidPoints, onCancel }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Leave this game?</Text>
          <Text style={styles.subtitle}>Choose what to do with points from this round.</Text>
          <Pressable style={[styles.btn, styles.btnKeep]} onPress={onKeepScores}>
            <Text style={styles.btnText}>Keep scores (partial round)</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnVoid]} onPress={onVoidPoints}>
            <Text style={styles.btnText}>Void all points this game</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
            <Text style={styles.btnTextDark}>Cancel — stay in game</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#1a0010', borderRadius: 16, padding: 24, width: '100%', borderWidth: 2, borderColor: '#FF2D78' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#FFB3CC', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  btn: { borderRadius: 12, padding: 14, marginBottom: 12, alignItems: 'center' },
  btnKeep: { backgroundColor: '#FF2D78' },
  btnVoid: { backgroundColor: '#4a0020', borderWidth: 1.5, borderColor: '#FF2D78' },
  btnCancel: { backgroundColor: '#FFD54F' },
  btnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  btnTextDark: { color: '#111111', fontWeight: 'bold', fontSize: 16 },
});
