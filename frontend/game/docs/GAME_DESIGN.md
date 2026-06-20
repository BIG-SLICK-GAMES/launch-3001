# Launch 3001 Game Design

Launch 3001 is a pure skill rocket landing game. The player controls a small rocket in a side-on 2D canyon scene using rotation and thrust only. There is no fuel drain in this prototype.

## Core Loop

1. Launch into the canyon approach.
2. Rotate with left/right controls.
3. Apply thrust to manage momentum and descent.
4. Touch down on the landing pad.
5. Land upright and slow to score, or crash on bad contact.

## Safe Landing Rules

A landing is safe only when all conditions pass:

- Rocket touches the landing pad.
- Vertical speed is below 90.
- Horizontal speed is below 60.
- Rocket angle is within 12 degrees of upright.

## Rocket Profiles

- Training Rocket: low gravity assist, dull steering, multiplier x1.0.
- Standard Rocket: normal gravity/steering, multiplier x2.0.
- Pro Rocket: heavier gravity, sharper steering, multiplier x3.0.

Keys `1`, `2`, and `3` switch profile and restart the run.

## Scoring

Safe landings start from a base score of 1000. The score subtracts penalties for vertical speed, horizontal speed, and landing angle, then applies the active rocket profile multiplier.
