export type RocketProfile = {
  id: 'training' | 'standard' | 'pro';
  name: string;
  gravity: number;
  thrust: number;
  steering: number;
  angularDamping: number;
  multiplier: number;
};

export const rocketProfiles: RocketProfile[] = [
  {
    id: 'training',
    name: 'Training Rocket',
    gravity: 155,
    thrust: 265,
    steering: 2.25,
    angularDamping: 6.5,
    multiplier: 1
  },
  {
    id: 'standard',
    name: 'Standard Rocket',
    gravity: 190,
    thrust: 300,
    steering: 2.85,
    angularDamping: 5.5,
    multiplier: 2
  },
  {
    id: 'pro',
    name: 'Pro Rocket',
    gravity: 230,
    thrust: 330,
    steering: 3.75,
    angularDamping: 4.6,
    multiplier: 3
  }
];
