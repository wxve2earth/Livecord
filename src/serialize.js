import { ActivityType } from 'discord.js';
import { getAppIcon } from './appIcons.js';
import { getProfile } from './profile.js';

const toMs = (date) => (date ? date.getTime() : null);

function serializeActivity(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    details: a.details,
    state: a.state,
    application_id: a.applicationId,
    app_icon: a.applicationId ? getAppIcon(a.applicationId) : null,
    created_at: a.createdTimestamp,
    timestamps: {
      start: toMs(a.timestamps?.start),
      end: toMs(a.timestamps?.end),
    },
    assets: a.assets
      ? {
          large_image: a.assets.largeImageURL?.() ?? null,
          large_text: a.assets.largeText ?? null,
          small_image: a.assets.smallImageURL?.() ?? null,
          small_text: a.assets.smallText ?? null,
        }
      : null,
    emoji: a.emoji
      ? { name: a.emoji.name, id: a.emoji.id, animated: a.emoji.animated }
      : null,
  };
}

export function serializeMember(member, presence = member.presence) {
  const user = member.user;
  const profile = getProfile(user.id);
  const activities = presence?.activities ?? [];
  const clientStatus = presence?.clientStatus ?? {};

  const spotifyActivity = activities.find(
    (a) => a.type === ActivityType.Listening && a.name === 'Spotify'
  );

  return {
    discord_user: {
      id: user.id,
      username: user.username,
      global_name: user.globalName,
      display_name: member.displayName,
      avatar_url: user.displayAvatarURL({ size: 256 }),
      avatar_decoration_url: user.avatarDecorationURL?.() ?? null,
      banner_url: profile.banner_url,
      server_tag: user.primaryGuild?.tag
        ? { tag: user.primaryGuild.tag, guild_id: user.primaryGuild.identityGuildId }
        : null,
      bot: user.bot,
      badges: user.flags?.toArray() ?? [],
      created_at: user.createdAt.toISOString(),
    },
    discord_status: presence?.status ?? 'offline',
    client_status: clientStatus,
    platforms: Object.keys(clientStatus),
    listening_to_spotify: Boolean(spotifyActivity),
    spotify: spotifyActivity
      ? {
          track_id: spotifyActivity.syncId,
          track_url: `https://open.spotify.com/track/${spotifyActivity.syncId}`,
          song: spotifyActivity.details,
          artist: spotifyActivity.state?.split('; ').join(', ') ?? null,
          artists: spotifyActivity.state?.split('; ') ?? [],
          album: spotifyActivity.assets?.largeText ?? null,
          album_art_url: spotifyActivity.assets?.largeImageURL?.() ?? null,
          timestamps: {
            start: toMs(spotifyActivity.timestamps?.start),
            end: toMs(spotifyActivity.timestamps?.end),
          },
        }
      : null,
    activities: activities.map(serializeActivity),
  };
}