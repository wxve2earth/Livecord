import 'dotenv/config';

function required(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing ${name} in your .env file`);
        process.exit(1);
    }
    return value;
}

const port = Number(process.env.PORT) || 5000;

export const config = {
    token: required('DISCORD_TOKEN'),
    guildId: required('GUILD_ID'),
    port,
    publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
    roleId: process.env.ROLE_ID || null,
    channelId: process.env.CHANNEL_ID || null,
    rateLimit: Number(process.env.RATE_LIMIT) || 60,
    rateWindow: Number(process.env.RATE_WINDOW) || 60,
};