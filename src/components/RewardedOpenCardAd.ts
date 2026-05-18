import { AdRequestConfiguration, RewardedAdLoader } from 'yandex-mobile-ads';

const OPEN_CARD_REWARDED_AD_UNIT_ID = 'R-M-19297232-2';

export const showRewardedOpenCardAd = async () => {
  const loader = await RewardedAdLoader.create();
  const rewardedAd = await loader.loadAd(
    new AdRequestConfiguration({
      adUnitId: OPEN_CARD_REWARDED_AD_UNIT_ID,
      parameters: new Map([['placement', 'open_card']]),
    })
  );

  return await new Promise<boolean>((resolve, reject) => {
    let settled = false;

    const finishResolve = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const finishReject = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    rewardedAd.onRewarded = () => {
      finishResolve(true);
    };
    rewardedAd.onAdDismissed = () => {
      finishResolve(false);
    };
    rewardedAd.onAdFailedToShow = (error) => {
      finishReject(error);
    };
    rewardedAd.show().catch(finishReject);
  });
};
