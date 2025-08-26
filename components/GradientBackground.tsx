import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  locations?: number[];
}

export default function GradientBackground({ 
  children, 
  colors = [
    '#1e40af',
    '#1e3a8a',
    '#1d4ed8',
    '#2563eb',
    '#3b82f6',
    '#60a5fa'
  ],
  locations = [0, 0.2, 0.4, 0.6, 0.8, 1]
}: GradientBackgroundProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        locations={locations}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});