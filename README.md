# Launch3001

Launch3001 is a mobile-first 3D browser landing game. Hold the screen to thrust, tilt the phone to steer, avoid terrain and hazards, then land slowly and upright on the target pad.

## Technology

- HTML, CSS, vanilla JavaScript
- Three.js
- Vite
- Custom arcade physics
- localStorage for settings and progress

No backend, React, TypeScript, heavy physics engine, or external game engine is required.

## Install

```bash
npm install
```

## Development

```bash
npm run dev -- --host
```

Open the printed local or network URL on a desktop browser or phone. For phone testing, keep the computer and phone on the same network.

## VR Headset Testing

For a headset such as Meta Quest, do not open `127.0.0.1` or `localhost` in the headset. Those addresses point back to the headset itself.

Start the HTTPS LAN server:

```bash
npm run dev:vr
```

Find your computer's local IPv4 address, then open this in the headset browser:

```text
https://YOUR_PC_IP:5173
```

On this machine the detected LAN address was:

```text
https://192.168.0.114:5173
```

The headset may show a certificate warning because the dev certificate is self-signed. Accept/proceed for local testing. If the page still does not load, check that the headset and PC are on the same Wi-Fi/LAN and allow Node/Vite through Windows Firewall.

WebXR requires a secure origin. `http://192.168.x.x:5173` may load the flat page but usually will not allow immersive VR.

## Production Build

```bash
npm run build
```

Preview the built app:

```bash
npm run preview -- --host
```

## Mobile Testing

- The page uses `viewport-fit=cover` and safe-area CSS variables for notches, Dynamic Island, and gesture bars.
- Rotate the device during play; the renderer and camera resize without restarting the current level.
- iOS requires a user gesture before motion sensors can be enabled. Tap **Enable Tilt** in the flight console.
- If tilt feels wrong after changing grip or orientation, tap **Calibrate**.

## Controls

Mobile:

- Hold gameplay screen: thrust
- Release: stop thrust
- Tilt left/right: lateral steering
- Tilt forward/backward: depth steering
- Enable Tilt: request motion permission
- Calibrate: set current device angle as neutral

Desktop development:

- Space: thrust
- A / Left Arrow: steer left
- D / Right Arrow: steer right
- W / Up Arrow: steer forward
- S / Down Arrow: steer backward
- R: restart level
- C: change camera across Chase, Far, Side, and Cockpit
- Escape: pause/resume

Camera options:

- Chase: close behind the rocket.
- Far: pulled back for a wider read of terrain and landing zones.
- Side: offset side-follow camera for route reading.
- Cockpit: near-first-person view.
- Settings includes camera distance, camera height, and side-camera flip.

VR:

- Use a WebXR-capable browser and headset.
- Click **Enter VR** when available.
- Entering VR starts the highest unlocked level automatically if you are on a menu.
- Right trigger: boost/thrust.
- Tilt the right controller like a flight stick to steer.
- Right squeeze: open/close the in-headset VR settings panel.
- In VR settings, use right stick up/down to choose a row and left/right to adjust it.
- In VR settings, right trigger selects/toggles the highlighted setting.
- After a crash, pull the right trigger to retry.
- VR camera modes include VR Cockpit, VR Chase, and VR Side.
- VR settings include camera distance, camera height, panel distance, panel height, comfort scale, side camera side, and stick centering.

## Project Structure

```text
public/
  audio/
  models/
  textures/
src/
  main.js
  styles/main.css
  game/
    Game.js
    GameState.js
    Renderer.js
    CameraController.js
    InputController.js
    PhysicsController.js
    Rocket.js
    World.js
    LevelBuilder.js
    LevelManager.js
    CollisionSystem.js
    ScoreSystem.js
    SaveSystem.js
    AudioSystem.js
    EffectsSystem.js
    UIController.js
    constants.js
    utils.js
  levels/
    level01.js ... level07.js
```

## Adding a Level

Create a new file in `src/levels/` that exports a structured level object with launch pad, landing pad, physics tuning, terrain settings, world bounds, obstacles, roofs, walls, score multiplier, and visual theme. Then import it in `src/game/LevelManager.js` and add it to the `levels` array.
