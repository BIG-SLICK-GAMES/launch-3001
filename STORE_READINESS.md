# Launch3001 Meta Horizon Store Readiness

## Current Technical State

- WebXR game built with Vite and Three.js.
- Local progress and settings use browser localStorage.
- PWA manifest and basic install metadata are present.
- Privacy and support pages are present as starter copy.
- Build number is visible in flat and VR HUDs.
- Demo mode gates players after checkpoint 2 unless the profile has a `launch3001` purchase tick.

## Demo And Full Access

Current demo rule:

- Players must have a logged-in BSG profile before Play or Load Checkpoint will launch.
- Demo players can play through checkpoint 2.
- Landing on checkpoint 2 shows the demo completion shop prompt.
- Full-access players continue past checkpoint 2.

Current local test entitlement:

```js
localStorage.setItem('launch3001.profile', JSON.stringify({ purchases: { launch3001: true } }))
```

Production requirement:

- The BSG website must pass the logged-in profile into the game with `purchases.launch3001 === true` after the $1.99 AUD purchase.
- The profile must include a non-guest `id`; otherwise the game treats the user as logged out and sends `BSG_LOGIN_REQUEST`.
- Supported profile sources in the game are `window.BSG_PROFILE`, `window.launch3001Profile`, `window.launch3001SetProfile(profile)`, or a hub `postMessage`.
- The game now sends `BSG_GAME_READY` and `BSG_PROFILE_REQUEST` to the parent/opener window when it loads.
- The BSG hub should reply with `postMessage({ type: 'BSG_PROFILE', profile }, gameOrigin)`.
- The profile can unlock the game with either `purchases: { launch3001: true }`, `purchases: ['launch3001']`, `entitlements: { launch3001: true }`, or `entitlements: ['launch3001']`.
- Store clicks send `BSG_SHOP_REQUEST` to the hub and open `https://bigslickgames.com/shop.html?product=launch3001&currency=AUD&return=<game-url>`.
- Login clicks send `BSG_LOGIN_REQUEST` to the hub with the current game URL as `returnUrl`.

Example hub response:

```js
gameFrame.contentWindow.postMessage({
  type: 'BSG_PROFILE',
  profile: {
    id: 'bsg-user-id',
    name: 'Pilot Name',
    email: 'pilot@example.com',
    purchases: { launch3001: true }
  }
}, gameOrigin);
```

## Access Needed From Brent

- Meta Horizon Developer Dashboard access for BIG SLICK GAMES.
- Netlify team/site access or a Netlify auth token for production deploys.
- Final support email and privacy-policy domain.
- Final app price, countries, age target, and content declarations.
- Business/tax/payout details must be completed by the owner in Meta; do not share those in chat.

## Store Assets To Produce

- App icon: final 1024x1024 PNG.
- Key art/hero image: 1920x1080 minimum working master.
- At least 4 store screenshots from Quest gameplay.
- Trailer: 30 to 45 seconds, gameplay-first.
- Short description: 1 to 2 lines.
- Full description: core loop, VR controls, endless progression, scoring.
- Feature bullets.
- Comfort rating notes.

## Draft Store Copy

Short description:

Launch3001 is an endless VR rocket run where every checkpoint demands fuel control, clean flying, and a safe landing.

Feature bullets:

- Pilot a tilt-controlled rocket through neon gates, tunnels, caves, and moving hazards.
- Manage fuel by collecting drops and refueling on numbered checkpoint pads.
- Chase faster checkpoint times for higher scores and leaderboard placement.
- Load saved checkpoint markers and push deeper into a harder endless route.
- Built for Meta Quest VR with mobile and desktop test controls.

## QA Before Submission

- Quest 2, Quest 3, Quest 3S smoke test.
- First launch reaches visible content quickly.
- Enter VR works from packaged production build.
- Controllers open settings/audio correctly.
- Reset keeps the same route.
- Load Checkpoint starts at the selected checkpoint.
- No impossible gates/caves across at least 20 checkpoints.
- Fuel pickups and pad refuel work.
- Audio can be muted and volume adjusted.
- Performance holds target frame rate in VR.
- No dev IPs or self-signed cert requirements in production.

## Trailer Plan

Target length: 30 to 45 seconds.

1. 0-4s: Launch pad, rocket ignition, title.
2. 4-10s: First-person/VR chase flying through numbered checkpoint route.
3. 10-17s: Fuel drop collection and fuel gauge pressure.
4. 17-26s: Wall gates with low, mid, and high openings.
5. 26-34s: Cave roof section with hanging spikes and moving hazards.
6. 34-40s: Touchdown on checkpoint, score popup, leaderboard shot.
7. 40-45s: Launch3001 logo and Meta Quest callout.

Capture notes:

- Capture in headset if possible for authentic VR framing.
- Also capture desktop chase-camera shots for clean trailer inserts.
- Hide build badge only for final trailer if Meta/store art requires clean footage.

## Meta Submission Path

1. Deploy production web build.
2. Package as immersive WebXR PWA APK.
3. Upload to Meta alpha channel.
4. Run Quest device QA from alpha build.
5. Fix VRC failures.
6. Prepare store listing and media.
7. Submit for review.
