import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';

function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const inIndex = segments.length === 0;
    const inPending = segments[0] === 'pending';
    const inVerify = segments[0] === 'profile' && segments[1] === 'verify';

    if (inIndex) return;

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (session && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
      return;
    }

    // Admin: only access admin panel
    if (profile?.role === 'admin') {
      const inAdmin = segments[0] === '(admin)';
      if (!inAdmin) router.replace('/(admin)');
      return;
    }

    // All unverified users (renter + owner) are gated to /pending
    if (session && profile && !profile.is_verified) {
      if (!inPending && !inVerify) {
        router.replace('/pending');
      }
      return;
    }

    // Verified user who lands on /pending: send to main app
    if (session && profile?.is_verified && inPending) {
      router.replace('/(tabs)');
    }
  }, [session, loading, profile, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cars/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cars/add" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/verify" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pending" options={{ animation: 'fade' }} />
        <Stack.Screen name="(admin)" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
