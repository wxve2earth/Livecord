const cache = new Map(); // userId -> { banner_url, accent_color, fetchedAt }
const TTL = 60 * 60 * 1000; // refresh at most once an hour

export function getProfile(id) {
  return cache.get(id) ?? { banner_url: null, accent_color: null };
}

export async function primeProfile(user) {
  const cached = cache.get(user.id);
  if (cached && Date.now() - cached.fetchedAt < TTL) return;

  // mark as fetched first so simultaneous events don't trigger duplicate requests
  cache.set(user.id, {
    banner_url: cached?.banner_url ?? null,
    accent_color: cached?.accent_color ?? null,
    fetchedAt: Date.now(),
  });

  try {
    const fresh = await user.fetch(true); // force: ask Discord, not the cache
    cache.set(user.id, {
      banner_url: fresh.bannerURL({ size: 600 }) ?? null,
      accent_color: fresh.accentColor || null,
      fetchedAt: Date.now(),
    });
  } catch {
    // keep whatever we had, and try again after the TTL
  }
}