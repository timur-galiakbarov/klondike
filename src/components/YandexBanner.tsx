import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ComponentType } from 'react';
import type { BannerProps } from 'yandex-mobile-ads';
import yandexMobileAds from 'yandex-mobile-ads';

const BANNER_HEIGHT = 90;

const resolveBanner = (): ComponentType<BannerProps> | null => {
  if (!yandexMobileAds) return null;
  if (typeof yandexMobileAds === 'function') return yandexMobileAds;
  if ('Banner' in yandexMobileAds && yandexMobileAds.Banner) {
    return yandexMobileAds.Banner;
  }
  return null;
};

export const YandexBanner = () => {
  const BannerComponent = useMemo(resolveBanner, []);
  if (!BannerComponent) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.fallbackText}>Реклама недоступна</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <BannerComponent
        blockId="R-M-18709051-1"
        size="SMART_BANNER"
        style={styles.banner}
        onAdFailedToLoad={(error) => {
          console.warn('Yandex banner failed to load', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#040404',
    justifyContent: 'center',
    alignItems: 'center'
  },
  banner: {
    flex: 1,
    width: '100%'
  },
  fallbackText: {
    color: '#fff',
    fontWeight: '600'
  }
});
