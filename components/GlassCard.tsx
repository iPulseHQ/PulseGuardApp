import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export default function GlassCard({ 
  children, 
  style, 
  intensity = 80,
  tint = 'light'
}: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView 
        intensity={intensity} 
        tint={tint}
        style={styles.blurContainer}
      >
        <View style={styles.innerContainer}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});