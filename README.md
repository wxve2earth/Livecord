# Livecord

> Your Discord profile and live activity as JSON, ready to use on your website.

Livecord is a Discord bot and API that exposes the profile, status, Spotify, and game activity of everyone in the Livecord server.

## Website
Visit the [Livecord](https://vassy.dev/livecord) website to learn more about the API and how to use it.

## Quick start

1. **Join the Discord server:** [Join Livecord](https://discord.com/invite/TE8tZVcv85)
2. **Open your link:**

```text
https://vassy.dev/livecord/v1/users/YOUR_DISCORD_ID
```

The JSON updates by itself whenever your status or activity changes.

> **Privacy:** Being in the server makes your profile and activity public through this API. Leave the server and your data stops being served right away.

---

## REST API

### `GET /livecord/v1/users/:id`

```js
fetch('https://vassy.dev/livecord/v1/users/YOUR_DISCORD_ID')
  .then((res) => res.json())
  .then((json) => console.log(json.data));
```

CORS is enabled, so it works from any website. Each request returns the data once, so to keep a page fresh, ask again every 5 to 10 seconds (not recommended), or use the [WebSocket](#websocket).

**Errors** use the same shape as successful responses:

| Status | `error.code`         | Meaning                                         |
| ------ | -------------------- | ----------------------------------------------- |
| `404`  | `user_not_monitored` | The user isn't in the server                    |
| `429`  | `rate_limited`       | Too many requests (limit: 60 per minute per IP) |

```json
{
  "success": false,
  "error": { "code": "user_not_monitored", "message": "This user is not being monitored." }
}
```

---

## Example response

```json
{
  "success": true,
  "data": {
    "discord_user": {
      "id": "1263841243839070229",
      "username": "m4nsion",
      "global_name": "4m",
      "display_name": "4m",
      "avatar_url": "https://cdn.discordapp.com/avatars/1263841243839070229/a7cd2b93d09c10c0fc2af450598a9550.webp?size=256",
      "avatar_decoration_url": null,
      "banner_url": null,
      "server_tag": null,
      "bot": false,
      "badges": [],
      "created_at": "2024-07-19T12:53:53.566Z"
    },
    "discord_status": "idle",
    "client_status": {
      "desktop": "idle"
    },
    "platforms": [
      "desktop"
    ],
    "listening_to_spotify": true,
    "spotify": {
      "track_id": "6Rvi7T8vQkkIYQcp1DWm3u",
      "track_url": "https://open.spotify.com/track/6Rvi7T8vQkkIYQcp1DWm3u",
      "song": "vintage vuitton",
      "artist": "earfzilla",
      "artists": [
        "earfzilla"
      ],
      "album": "vintage vuitton",
      "album_art_url": "https://i.scdn.co/image/ab67616d0000b27312d3b2c865fe98d50162f097",
      "timestamps": {
        "start": 1793456966270,
        "end": 1793457053234
      }
    },
    "activities": [
      {
        "name": "Spotify",
        "type": 2,
        "details": "vintage vuitton",
        "state": "earfzilla",
        "application_id": null,
        "app_icon": null,
        "created_at": 1793456965995,
        "timestamps": {
          "start": 1793456966270,
          "end": 1793457053234
        },
        "assets": {
          "large_image": "https://i.scdn.co/image/ab67616d0000b27312d3b2c865fe98d50162f097",
          "large_text": "vintage vuitton",
          "small_image": null,
          "small_text": null
        },
        "emoji": null
      }
    ]
  }
}
```

### Main fields

| Field | Description |
| ----- | ----------- |
| `discord_user` | Profile: `id`, `username`, `display_name`, `avatar_url`, `banner_url`, `badges`, `created_at` (fields are `null` if not set on the account) |
| `discord_status` | `online`, `idle`, `dnd`, or `offline` |
| `platforms` | Where the user is active: `desktop`, `mobile`, `web` (`client_status` has the status for each) |
| `listening_to_spotify` | `true` while a Spotify track is playing |
| `spotify` | `song`, `artist` (all artists as one text), `artists` (list), `album`, `album_art_url`, `track_url`, `timestamps`. `null` when not listening |
| `activities` | Everything else the user is doing: games, apps, custom status |

Timestamps are Unix time in **milliseconds**, so `new Date(timestamp)` works directly.

### Activities

`type` tells you what an activity is: `0` playing, `1` streaming, `2` listening, `3` watching, `4` custom status, `5` competing. `details` and `state` are the two lines of text shown on the profile.

```js
// custom status (text and emoji)
const custom = data.activities.find((a) => a.type === 4);
console.log(custom?.state, custom?.emoji?.name);

// a game and its image
const game = data.activities.find((a) => a.type === 0);
const image = game?.assets?.large_image ?? game?.app_icon;
```

---

## WebSocket

Use the WebSocket for instant updates without asking again and again. Connect once, and the server sends a message every time something changes.

```js
const ws = new WebSocket('wss://vassy.dev/livecord/socket');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.op === 1) {
    // hello: say who you want to follow, then keep the connection alive
    ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: 'YOUR_DISCORD_ID' } }));
    setInterval(() => ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
  }

  if (msg.op === 0) {
    // msg.t is INIT_STATE first, then PRESENCE_UPDATE on every change
    console.log(msg.t, msg.d);
  }
};
```

| Op | Direction | Meaning |
| -- | --------- | ------- |
| `0` | Server → you | Event: `INIT_STATE` (current data), then `PRESENCE_UPDATE` on every change, or `USER_REMOVED` if the user leaves the server |
| `1` | Server → you | Hello, with `heartbeat_interval` in ms |
| `2` | You → server | Pick who to follow |
| `3` | You → server | Heartbeat. Send one every interval, or the connection closes after about 40 seconds |

To follow several users, send `{ "op": 2, "d": { "subscribe_to_ids": ["123...", "456..."] } }` (max 10). In that case, `INIT_STATE` is an object keyed by user ID.
