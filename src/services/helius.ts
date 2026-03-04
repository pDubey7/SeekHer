const HELIUS_KEY = process.env.HELIUS_API_KEY;
const BASE = `https://api.helius.xyz/v0`;

export const fetchWalletNFTs = async (wallet: string): Promise<NFT[]> => {
  const res = await fetch(`${BASE}/addresses/${wallet}/nfts?api-key=${HELIUS_KEY}`);
  const data = await res.json();
  return data.map((nft: any) => ({
    mint: nft.mint,
    name: nft.content?.metadata?.name || 'Unknown',
    image: nft.content?.links?.image || '',
    collection: nft.grouping?.[0]?.group_value || 'Unknown',
  }));
};

export const fetchWalletTokens = async (wallet: string): Promise<Token[]> => {
  const res = await fetch(`${BASE}/addresses/${wallet}/balances?api-key=${HELIUS_KEY}`);
  const data = await res.json();
  return data.tokens
    .filter((t: any) => t.amount > 0)
    .map((t: any) => ({
      mint: t.mint,
      symbol: t.tokenInfo?.symbol || t.mint.slice(0,4),
      amount: t.amount / Math.pow(10, t.decimals || 0),
    }));
};

export const fetchWalletAge = async (wallet: string): Promise<number> => {
  const res = await fetch(`${BASE}/addresses/${wallet}/transactions?api-key=${HELIUS_KEY}&limit=1&type=TRANSFER`);
  const data = await res.json();
  if (!data.length) return 0;
  const firstTx = data[data.length - 1];
  const ageMs = Date.now() - (firstTx.timestamp * 1000);
  return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // days
};