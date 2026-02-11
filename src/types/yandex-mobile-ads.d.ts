declare module 'yandex-mobile-ads' {
  import type { ComponentType } from 'react';
  import type { ViewStyle } from 'react-native';

  export interface BannerProps {
    blockId: string;
    size?: 'SMART_BANNER' | 'BANNER_320x50' | 'BANNER_300x250' | string;
    style?: ViewStyle;
    onAdLoaded?: () => void;
    onAdFailedToLoad?: (error: { message: string }) => void;
    onAdClicked?: () => void;
  }

  export type BannerComponent = ComponentType<BannerProps>;

  type YandexMobileAdsModule = BannerComponent & {
    Banner?: BannerComponent;
  };

  const yandexMobileAds: YandexMobileAdsModule;
  export default yandexMobileAds;
}
