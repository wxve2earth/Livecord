import { ActivityType } from 'discord.js';
import { getAppIcon } from './appIcons.js';
import { getProfile } from './profile.js';

const toMs = (date) => (date ? date.getTime() : null);

function serializeActivity(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type, // 0 playing, 1 streaming, 2 listening, 3 watching, 4 custom, 5 competing
    url: a.url ?? null, // stream link
    details: a.details,
    state: a.state,
    application_id: a.applicationId,
    app_icon: a.applicationId ? getAppIcon(a.applicationId) : null,
    created_at: a.createdTimestamp,
    flags: a.flags?.bitfield ?? 0,
    buttons: a.buttons ?? [], // button labels
    party: a.party ? { id: a.party.id ?? null, size: a.party.size ?? null } : null,
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
    sync_id: a.syncId,
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
      accent_color: profile.accent_color,
      accent_color_hex:
        profile.accent_color != null
          ? '#' + profile.accent_color.toString(16).padStart(6, '0')
          : null,
      server_tag: user.primaryGuild?.tag
        ? { tag: user.primaryGuild.tag, guild_id: user.primaryGuild.identityGuildId }
        : null,
      bot: user.bot,
      badges: user.flags?.toArray() ?? [],
      created_at: user.createdAt.toISOString(),
    },
    discord_status: presence?.status ?? 'offline',
    client_status: clientStatus, // e.g. { desktop: "idle", mobile: "online" }
    platforms: Object.keys(clientStatus),
    active_on_discord_desktop: Boolean(clientStatus.desktop),
    active_on_discord_mobile: Boolean(clientStatus.mobile),
    active_on_discord_web: Boolean(clientStatus.web),
    listening_to_spotify: Boolean(spotifyActivity),
    spotify: spotifyActivity
      ? {
          track_id: spotifyActivity.syncId,
          song: spotifyActivity.details,
          artist: spotifyActivity.state,
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