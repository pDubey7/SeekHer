export interface User {
  id: string;
  wallet_address: string;
  display_name: string;
  age: number;
  bio: string;
  photos: string[];
  country: string;
  looking_for: LookingFor[];
  pinned_nfts: NFT[];
  tokens: Token[];
  seeker_score: number;
  streak_days: number;
}

export type LookingFor = 'Romance' | 'Co-founder' | 'Trading Buddy' | 'IRL Meetup';

export interface NFT {
  mint: string;
  name: string;
  image: string;
  collection: string;
}

export interface Token {
  mint: string;
  symbol: string;
  amount: number;
  usdValue?: number;
}

export interface Match {
  id: string;
  matched_user: User;
  compatibility_score: number;
  shared_nfts: NFT[];
  shared_tokens: Token[];
  soulbound_mint?: string;
  created_at: string;
}

export interface SeekerScore {
  total: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  breakdown: {
    walletAge: number;
    nftScore: number;
    activityScore: number;
    communityScore: number;
    streakScore: number;
  }
}