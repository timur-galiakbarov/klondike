import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
  type AppStateStatus
} from 'react-native';
import {
  BannerAdSize,
  BannerView
} from 'yandex-mobile-ads';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useAnalytics } from '../hooks/useAnalytics';
import { t } from '../i18n';

const getBannerSize = async (
  width: number,
  maxHeight: number,
  setAdSize: (data: BannerAdSize | undefined) => void,
  setIsBannerShowing: any,
) => {
  if (width && maxHeight) {
    await BannerAdSize.inlineSize(width, maxHeight)
      .then((adSize) => {
        setAdSize(adSize);
        setIsBannerShowing(true);
      })
      .catch((error) => {
        setAdSize(undefined);
      });
  }
};

interface BannerProps {
  maxHeight?: number;
  margins?: number;
  style?: StyleProp<ViewStyle>;
  canClose?: boolean;
  id?: string;
  refreshIntervalMs?: number;
  dismissCooldownMs?: number;
  closeDelayMs?: number;
  onHeightChange?: (height: number) => void;
}

export const YandexBanner: React.FC<BannerProps> = ({
  maxHeight = 75,
  margins = 32,
  canClose = false,
  refreshIntervalMs = 60_000,
  dismissCooldownMs = 180_000,
  closeDelayMs = 5_000,
  style,
  onHeightChange
}) => {
  const [adSize, setAdSize] = useState<BannerAdSize>();
  const [isBannerShowing, setIsBannerShowing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { sendAnalytics } = useAnalytics();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [failedToLoad, setFailedToLoad] = useState<boolean>(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isCloseVisible, setIsCloseVisible] = useState(false);
  const [impressionToken, setImpressionToken] = useState(0);
  const closeOpacity = useRef(new Animated.Value(0)).current;
  const adUnitId = Platform.OS === 'ios' ? 'R-M-19297232-1' : 'R-M-18709051-1';

  useEffect(() => {
    const width = Dimensions.get('window').width - margins;
    getBannerSize(
      width,
      maxHeight,
      setAdSize,
      setIsBannerShowing,
    );
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isAppActive) {
      // Сразу обновляем баннер для первой загрузки рекламы
      setRefreshKey(prev => prev + 1);

      // Затем запускаем таймер для регулярных обновлений
      intervalId = setInterval(() => {
        setRefreshKey((prev) => prev + 1);
      }, refreshIntervalMs);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAppActive, refreshIntervalMs]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setIsAppActive(nextState === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setFailedToLoad(false);
    setIsCloseVisible(false);
    setImpressionToken(0);
    closeOpacity.setValue(0);
  }, [closeOpacity, refreshKey]);

  useEffect(() => {
    if (!dismissedUntil) return;
    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [dismissedUntil]);

  useEffect(() => {
    if (dismissedUntil !== null && dismissedUntil <= now) {
      setDismissedUntil(null);
      setRefreshKey((prev) => prev + 1);
    }
  }, [dismissedUntil, now]);

  useEffect(() => {
    const isVisible = !!isBannerShowing && !!adSize && dismissedUntil === null;
    onHeightChange?.(isVisible ? undefinedHeightFallback(adSize?.height) : 0);
  }, [adSize, dismissedUntil, isBannerShowing, onHeightChange]);

  useEffect(() => {
    if (!canClose || impressionToken === 0 || dismissedUntil !== null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsCloseVisible(true);
    }, closeDelayMs);

    return () => clearTimeout(timeoutId);
  }, [canClose, closeDelayMs, dismissedUntil, impressionToken]);

  useEffect(() => {
    Animated.timing(closeOpacity, {
      toValue: isCloseVisible ? 1 : 0,
      duration: isCloseVisible ? 180 : 100,
      useNativeDriver: true
    }).start();
  }, [closeOpacity, isCloseVisible]);

  // eslint-disable-next-line no-unused-vars
  const handleAdImpression = (event: any) => {
    sendAnalytics('YandexAdvImpression', {
      ad_unit_id: adUnitId,
      platform: Platform.OS
    });
    setIsCloseVisible(false);
    setImpressionToken((prev) => prev + 1);

    // console.log(`Did track impression: ${JSON.stringify(event.nativeEvent.impressionData)}`);
  };

  // eslint-disable-next-line no-unused-vars
  const handleFailedToLoadAdv = (event: any) => {
    // console.log(event.nativeEvent);
    setFailedToLoad(true);
  };

  const closeSessionAdv = () => {
    const nextDismissedUntil = Date.now() + dismissCooldownMs;
    setDismissedUntil(nextDismissedUntil);
    setIsCloseVisible(false);
    onHeightChange?.(0);
    sendAnalytics('bottom_banner_close_pressed');
    sendAnalytics('yandex_banner_closed', {
      placement: 'game_banner',
      cooldown_ms: dismissCooldownMs,
      close_delay_ms: closeDelayMs
    });
  };

  if (!isBannerShowing || !adSize) {
    return null;
  }

  const isDismissed = dismissedUntil !== null && dismissedUntil > now;

  if (isDismissed) {
    return null;
  }

  return (
    <View
      style={[styles.testAdv, style]}
      onLayout={(event: LayoutChangeEvent) => {
        onHeightChange?.(event.nativeEvent.layout.height);
      }}
    >
      {!failedToLoad ? (
        <BannerView
          key={`banner-${refreshKey}`}
          size={adSize}
          adUnitId={adUnitId} // or 'demo-banner-yandex'
          style={[styles.yandexBanner]}
          onAdFailedToLoad={handleFailedToLoadAdv}
          onAdImpression={handleAdImpression}
        />
      ) : (
        <Text style={[styles.noAdvText, adSize && { height: adSize.height }]}>
          {t('adLoadFallback')}
        </Text>
      )}

      {canClose && isCloseVisible && !failedToLoad && (
        <Animated.View style={[styles.closeBannerBtnWrap, { opacity: closeOpacity }]}>
          <Pressable
            style={styles.closeBannerBtn}
            onPress={closeSessionAdv}
            hitSlop={8}
          >
            <View style={styles.closeBannerBtnVisual}>
              <AntDesign name="close" size={12} color="rgba(0,0,0,0.92)" />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  yandexBanner: {
    // marginTop: 8,
  },
  testAdv: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 6,
    position: 'relative',
    marginTop: 8,
    overflow: 'hidden',
  },
  closeBannerBtnWrap: {
    position: 'absolute',
    top: -8,
    right: -6
  },
  closeBannerBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBannerBtnVisual: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  noAdvText: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    textAlign: 'center',
  },
});

const undefinedHeightFallback = (adHeight?: number) => (adHeight ? adHeight + 20 : 90);
