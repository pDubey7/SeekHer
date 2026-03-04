import { User } from '../types';

export const calculateCompatibility = (userA: User, userB: User) => {
  let score = 0;
  const reasons: string[] = [];

  // Shared NFT collections
  const collectionsA = new Set(userA.pinned_nfts.map(n => n.collection));
  const collectionsB = new Set(userB.pinned_nfts.map(n => n.collection));
  const sharedCollections = [...collectionsA].filter(c => collectionsB.has(c));
  score += sharedCollections.length * 20;
  if (sharedCollections.length) reasons.push(`Both hold ${sharedCollections[0]}`);

  // Shared tokens
  const tokensA = new Set(userA.tokens.map(t => t.symbol));
  const tokensB = new Set(userB.tokens.map(t => t.symbol));
  const sharedTokens = [...tokensA].filter(t => tokensB.has(t));
  score += sharedTokens.length * 10;
  if (sharedTokens.length) reasons.push(`Both hold $${sharedTokens[0]}`);

  // Same country
  if (userA.country === userB.country) {
    score += 30;
    reasons.push(`Both from ${userA.country}`);
  }

  // Same "looking for"
  const sharedGoals = userA.looking_for.filter(g => userB.looking_for.includes(g));
  score += sharedGoals.length * 15;

  // Normalize to 100
  const normalized = Math.min(Math.round(score / 2), 100);
  
  return { score: normalized, reasons };
};