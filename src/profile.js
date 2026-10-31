const cache = new Map();
const TTL = 60 * 60 * 1000;

export function getProfile(id) {
  return cache.get(id) ?? { banner_url: null };
}

export async function primeProfile(user) {
  const cached = cache.get(user.id);
  if (cached && Date.now() - cached.fetchedAt < TTL) return;

  cache.set(user.id, {
    banner_url: cached?.banner_url ?? null,
    fetchedAt: Date.now(),
  });

  try {
    const fresh = await user.fetch(true);
    cache.set(user.id, {
      banner_url: fresh.bannerURL({ size: 600 }) ?? null,
      fetchedAt: Date.now(),
    });
  } catch {}
}