const cache = new Map();

export function getAppIcon(applicationId) {
  return cache.get(applicationId) ?? null;
}

export async function primeAppIcons(activities) {
  for (const a of activities) {
    const id = a.applicationId;
    if (!id || cache.has(id)) continue;
    cache.set(id, null);
    try {
      const res = await fetch(`https://discord.com/api/v10/applications/${id}/rpc`);
      if (!res.ok) continue;
      const app = await res.json();
      if (app.icon) {
        cache.set(id, `https://cdn.discordapp.com/app-icons/${id}/${app.icon}.png?size=256`);
      }
    } catch (err) {
      console.error('icon lookup failed:', err.message);
    }
  }
}