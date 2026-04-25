import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: '🚗',
    isLogoSlide: true,
    title: 'CarGo',
    titleFr: 'Bienvenue dans CarGo',
    subtitle: 'وسيلتك بنقرة واحدة — Votre voiture en un clic',
    subtitleFr: 'اكتشف أفضل السيارات وأجرها بكل سهولة وأمان',
    accent: Colors.primary,
  },
  {
    id: '2',
    emoji: '🚗',
    title: 'وسيلتك بنقرة واحدة',
    titleFr: 'Votre voiture en un clic',
    subtitle: 'اكتشف أفضل السيارات في ولايتك وأجرها بكل سهولة وأمان.',
    subtitleFr: 'Découvrez les meilleures voitures près de chez vous.',
    accent: Colors.primary,
  },
  {
    id: '3',
    emoji: '🔐',
    title: 'أمان وثقة تامة',
    titleFr: 'Sécurité & Confiance',
    subtitle: 'جميع المستخدمين موثّقون بالهوية الوطنية ورخصة القيادة.',
    subtitleFr: 'Tous les utilisateurs sont vérifiés — CNI + Permis.',
    accent: '#00D4FF',
  },
  {
    id: '4',
    emoji: '💰',
    title: 'أرباح بدون تعقيد',
    titleFr: 'Gagnez sans effort',
    subtitle: 'أضف سيارتك واستقبل الطلبات وتحكم في جدولك — أنت المسيّر.',
    subtitleFr: 'Ajoutez votre voiture et recevez des réservations.',
    accent: '#FF6B6B',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Slide list */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.isLogoSlide ? (
              <>
                {/* Logo */}
                <Image
                  source={require('../../assets/cargo2.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={[styles.titleAr, { marginTop: Spacing.lg }]}>{item.title}</Text>
              </>
            ) : (
              <>
                {/* Giant emoji */}
                <View style={[styles.emojiRing, { borderColor: item.accent + '40', shadowColor: item.accent }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
                <Text style={[styles.titleAr]}>{item.title}</Text>
              </>
            )}

            <Text style={[styles.titleFr, { color: item.accent }]}>{item.titleFr}</Text>
            <Text style={styles.subtitle}>{item.subtitleFr}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: slides[currentIndex].accent }]}
            />
          );
        })}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.85}
          style={[styles.ctaBtn, { shadowColor: slides[currentIndex].accent }]}
        >
          <LinearGradient
            colors={[slides[currentIndex].accent, slides[currentIndex].accent + 'CC']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {currentIndex === slides.length - 1 ? 'Commencer →' : 'Suivant →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
  },
  emojiRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  emoji: { fontSize: 72 },
  logo: {
    width: 300,
    height: 300,
    marginBottom: Spacing.xl,
  },
  titleAr: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  titleFr: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 48, gap: Spacing.sm },
  ctaBtn: {
    borderRadius: Radius.md,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  ctaGradient: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse, letterSpacing: 0.3 },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
});
