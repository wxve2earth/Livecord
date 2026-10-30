const cache = new Map(); // applicationId -> icon URL (or null)

export function getAppIcon(applicationId) {
  return cache.get(applicationId) ?? null;
}

// Looks up icons for any new games in the list, before we serialize
export async function primeAppIcons(activities) {
  for (const a of activities) {
    const id = a.applicationId;
    if (!id || cache.has(id)) continue;
    cache.set(id, null); // marks it as looked up so we don't ask twice
    try {
      const res = await fetch(`https://discord.com/api/v10/applications/${id}/rpc`);
      if (!res.ok) continue;
      const app = await res.json();
      if (app.icon) {
        cache.set(id, `https://cdn.discordapp.com/app-icons/${id}/${app.icon}.png?size=256`);
      }
    } catch {
      // no icon, that's fine
    }
  }
}