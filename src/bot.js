import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { setUser, removeUser } from './state.js';
import { serializeMember } from './serialize.js';
import { primeAppIcons } from './appIcons.js';
import { primeProfile } from './profile.js';

function isTracked(member) {
  if (member.user.bot) return false;
  if (config.roleId && !member.roles.cache.has(config.roleId)) return false;
  if (config.channelId && !member.permissionsIn(config.channelId).has('ViewChannel')) {
    return false;
  }
  return true;
}

async function track(member, presence = member.presence) {
  if (!isTracked(member)) {
    removeUser(member.id);
    return false;
  }
  await primeProfile(member.user);
  await primeAppIcons(presence?.activities ?? []);
  setUser(member.id, serializeMember(member, presence));
  return true;
}

export async function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ],
  });

  client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(config.guildId);

    if (config.roleId && !guild.roles.cache.has(config.roleId)) {
      console.error(`ROLE_ID ${config.roleId} was not found in this server.`);
      process.exit(1);
    }
    if (config.channelId && !guild.channels.cache.has(config.channelId)) {
      console.error(`CHANNEL_ID ${config.channelId} was not found in this server.`);
      process.exit(1);
    }

    const members = await guild.members.fetch({ withPresences: true });
    let count = 0;
    for (const member of members.values()) {
      if (await track(member)) count++;
    }
  });

  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    const member =
      newPresence.member ?? (await newPresence.guild.members.fetch(newPresence.userId));
    await track(member, newPresence);
  });

  client.on('guildMemberUpdate', (oldMember, newMember) => track(newMember));
  client.on('guildMemberAdd', (member) => track(member));
  client.on('guildMemberRemove', (member) => removeUser(member.id));

  await client.login(config.token);
  return client;
}