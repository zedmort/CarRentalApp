import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function SplashScreenComponent() {
  const { session, loading } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const navigationDone = useRef(false);
  const animationDone = useRef(false);
  // Keep latest values accessible in callbacks without stale closures
  const sessionRef = useRef(session);
  const loadingRef = useRef(loading);
  sessionRef.current = session;
  loadingRef.current = loading;

  const maybeNavigate = () => {
    if (navigationDone.current || loadingRef.current) return;
    navigationDone.current = true;
    router.replace(sessionRef.current ? '/(tabs)' : '/onboarding');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      animationDone.current = true;
      maybeNavigate();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // If auth finishes loading after the animation already ended, navigate now
  useEffect(() => {
    if (!loading && animationDone.current) {
      maybeNavigate();
    }
  }, [loading]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={require('../assets/cargo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
