import React, { useEffect, useState } from 'react';
import {
  Dimensions, StyleSheet, TouchableHighlight, View, Text,
  type StyleProp, type ViewStyle,
} from 'react-native';
import {
  BannerAdSize, BannerView,
} from 'yandex-mobile-ads';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useAnalytics } from '../hooks/useAnalytics';

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
}

export const YandexBanner: React.FC<BannerProps> = ({
  maxHeight = 75,
  margins = 32,
  canClose = false,
}) => {
  const [adSize, setAdSize] = useState<BannerAdSize>();
  const [isBannerShowing, setIsBannerShowing] = useState();
  const [refreshKey, setRefreshKey] = useState(0);
  const { sendAnalytics } = useAnalytics();

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
    const intervalId = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30_000);

    return () => clearInterval(intervalId);
  }, []);

  const [failedToLoad, setFailedToLoad] = useState<boolean>(false);

  // eslint-disable-next-line no-unused-vars
  const handleAdImpression = (event: any) => {
    sendAnalytics('YandexAdvImpression');

    // console.log(`Did track impression: ${JSON.stringify(event.nativeEvent.impressionData)}`);
  };

  // eslint-disable-next-line no-unused-vars
  const handleFailedToLoadAdv = (event: any) => {
    // console.log(event.nativeEvent);
    setFailedToLoad(true);
  };

  const closeSessionAdv = () => {
    sendAnalytics('yandex_banner_closed');
  };

  if (!isBannerShowing || !adSize) {
    return null;
  }

  let adUnitId = 'R-M-18709051-1';

  return (
    <View style={styles.testAdv}>
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
          Тут должна была быть реклама, но мы не смогли ее загрузить =(
        </Text>
      )}

      {canClose && (
        <TouchableHighlight
          style={styles.closeBannerBtn}
          activeOpacity={0.9}
          underlayColor="#eeeeee"
          onPress={closeSessionAdv}
        >
          <AntDesign name="close" size={16} color="black" />
        </TouchableHighlight>
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
  },
  closeBannerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dddddd',
    position: 'absolute',
    top: -8,
    right: -6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
