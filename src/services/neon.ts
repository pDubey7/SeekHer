import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

// ─── USERS ───────────────────────────────────────────

export const createUser = async (wallet: string) => {
  const result = await sql`
    INSERT INTO users (wallet_address)
    VALUES (${wallet})
    ON CONFLICT (wallet_address) DO NOTHING
    RETURNING *
  `;
  return result[0];
};

export const getUser = async (wallet: string) => {
  const result = await sql`
    SELECT * FROM users WHERE wallet_address = ${wallet}
  `;
  return result[0] || null;
};

export const updateUser = async (wallet: string, updates: Partial<User>) => {
  const result = await sql`
    UPDATE users SET
      display_name = COALESCE(${updates.display_name}, display_name),
      age = COALESCE(${updates.age}, age),
      bio = COALESCE(${updates.bio}, bio),
      photos = COALESCE(${updates.photos}, photos),
      country = COALESCE(${updates.country}, country),
      looking_for = COALESCE(${updates.looking_for}, looking_for),
      pinned_nfts = COALESCE(${JSON.stringify(updates.pinned_nfts)}, pinned_nfts),
      tokens = COALESCE(${JSON.stringify(updates.tokens)}, tokens),
      seeker_score = COALESCE(${updates.seeker_score}, seeker_score),
      last_active = NOW()
    WHERE wallet_address = ${wallet}
    RETURNING *
  `;
  return result[0];
};

// ─── SWIPE FEED ──────────────────────────────────────

export const getFeedProfiles = async (wallet: string, country?: string) => {
  // Get profiles user hasn't swiped yet
  const result = await sql`
    SELECT u.* FROM users u
    WHERE u.wallet_address != ${wallet}
    AND u.wallet_address NOT IN (
      SELECT swiped FROM swipes WHERE swiper = ${wallet}
    )
    AND u.display_name IS NOT NULL
    ${country ? sql`AND u.country = ${country}` : sql``}
    ORDER BY u.seeker_score DESC, u.last_active DESC
    LIMIT 20
  `;
  return result;
};

// ─── SWIPES ──────────────────────────────────────────

export const recordSwipe = async (
  swiper: string,
  swiped: string,
  direction: 'bullish' | 'bearish'
) => {
  await sql`
    INSERT INTO swipes (swiper, swiped, direction)
    VALUES (${swiper}, ${swiped}, ${direction})
    ON CONFLICT (swiper, swiped) DO NOTHING
  `;

  // Check for mutual bullish → match!
  if (direction === 'bullish') {
    const mutual = await sql`
      SELECT 1 FROM swipes
      WHERE swiper = ${swiped}
      AND swiped = ${swiper}
      AND direction = 'bullish'
    `;
    return mutual.length > 0 ? 'match' : 'swiped';
  }
  return 'swiped';
};

// ─── MATCHES ─────────────────────────────────────────

export const createMatch = async (
  user1: string,
  user2: string,
  compatibilityScore: number,
  sharedNfts: any[],
  sharedTokens: any[]
) => {
  const result = await sql`
    INSERT INTO matches (user1, user2, compatibility_score, shared_nfts, shared_tokens)
    VALUES (
      ${user1}, ${user2}, ${compatibilityScore},
      ${JSON.stringify(sharedNfts)}, ${JSON.stringify(sharedTokens)}
    )
    RETURNING *
  `;
  return result[0];
};

export const getMatches = async (wallet: string) => {
  const result = await sql`
    SELECT 
      m.*,
      CASE WHEN m.user1 = ${wallet} THEN u2.* ELSE u1.* END as matched_user
    FROM matches m
    JOIN users u1 ON m.user1 = u1.wallet_address
    JOIN users u2 ON m.user2 = u2.wallet_address
    WHERE m.user1 = ${wallet} OR m.user2 = ${wallet}
    ORDER BY m.created_at DESC
  `;
  return result;
};

export const updateSoulboundMint = async (matchId: string, mintAddress: string) => {
  await sql`
    UPDATE matches SET soulbound_mint = ${mintAddress}
    WHERE id = ${matchId}
  `;
};

// ─── MESSAGES ────────────────────────────────────────

export const getMessages = async (matchId: string) => {
  const result = await sql`
    SELECT * FROM messages
    WHERE match_id = ${matchId}
    ORDER BY created_at ASC
  `;
  return result;
};

export const sendMessage = async (
  matchId: string,
  sender: string,
  content: string,
  solTip: number = 0,
  txSignature?: string
) => {
  const result = await sql`
    INSERT INTO messages (match_id, sender, content, sol_tip, tx_signature)
    VALUES (${matchId}, ${sender}, ${content}, ${solTip}, ${txSignature})
    RETURNING *
  `;
  return result[0];
};

// ─── STREAK ──────────────────────────────────────────

export const updateStreak = async (wallet: string) => {
  const user = await getUser(wallet);
  if (!user) return;

  const lastActive = new Date(user.last_active);
  const now = new Date();
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  // If last active was 20-48 hours ago, increment streak
  // If more than 48 hours, reset streak
  const newStreak = diffHours > 48 
    ? 1 
    : diffHours > 20 
      ? user.streak_days + 1 
      : user.streak_days;

  await sql`
    UPDATE users 
    SET streak_days = ${newStreak}, last_active = NOW()
    WHERE wallet_address = ${wallet}
  `;

  return newStreak;
};