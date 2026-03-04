import { Token, NFT } from '../types';

const COMMUNITY_TOKENS = ['BONK', 'WIF', 'JUP', 'PYTH', 'MTNDDAO'];

export const calculateSeekerScore = (
  walletAgeDays: number,
  nfts: NFT[],
  tokens: Token[],
  streakDays: number,
  txCount: number
) => {
  const walletAgeScore = Math.min(walletAgeDays * 0.3, 30);     // max 30
  const nftScore = Math.min(nfts.length * 5, 20);               // max 20  
  const activityScore = Math.min(txCount * 0.01, 20);           // max 20
  const communityScore = tokens
    .filter(t => COMMUNITY_TOKENS.includes(t.symbol))
    .length * 5;                                                  // max 20 (4 tokens)
  const streakScore = Math.min(streakDays * 2, 10);             // max 10

  const total = Math.round(
    walletAgeScore + nftScore + activityScore + communityScore + streakScore
  );

  const tier = total >= 80 ? 'Diamond'
    : total >= 60 ? 'Gold'
    : total >= 40 ? 'Silver'
    : 'Bronze';

  return { total, tier, breakdown: { walletAgeScore, nftScore, activityScore, communityScore, streakScore }};
};