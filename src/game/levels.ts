import { CoinDef, LevelDef, LevelTheme, PlatformDef, RotatingObstacleDef } from '../types/game';

const THEMES: Record<string, LevelTheme> = {
  meadow: {
    skyTop: '#0284c7',
    skyBottom: '#bae6fd',
    fogColor: '#bae6fd',
    accentColor: '#10b981',
    normalColor: '#22c55e',
    movingColor: '#3b82f6',
    disappearingColor: '#f59e0b',
    narrowColor: '#a855f7',
    obstacleColor: '#ef4444',
  },
  sunset: {
    skyTop: '#7c3aed',
    skyBottom: '#fdba74',
    fogColor: '#fed7aa',
    accentColor: '#f97316',
    normalColor: '#fb923c',
    movingColor: '#06b6d4',
    disappearingColor: '#facc15',
    narrowColor: '#ec4899',
    obstacleColor: '#dc2626',
  },
  lagoon: {
    skyTop: '#0369a1',
    skyBottom: '#99f6e4',
    fogColor: '#99f6e4',
    accentColor: '#14b8a6',
    normalColor: '#06b6d4',
    movingColor: '#6366f1',
    disappearingColor: '#fbbf24',
    narrowColor: '#f43f5e',
    obstacleColor: '#ef4444',
  },
  candy: {
    skyTop: '#db2777',
    skyBottom: '#fbcfe8',
    fogColor: '#fce7f3',
    accentColor: '#ec4899',
    normalColor: '#f472b6',
    movingColor: '#38bdf8',
    disappearingColor: '#fde047',
    narrowColor: '#a78bfa',
    obstacleColor: '#be123c',
  },
  aurora: {
    skyTop: '#1e1b4b',
    skyBottom: '#67e8f9',
    fogColor: '#a5f3fc',
    accentColor: '#2dd4bf',
    normalColor: '#34d399',
    movingColor: '#818cf8',
    disappearingColor: '#fb923c',
    narrowColor: '#f472b6',
    obstacleColor: '#f43f5e',
  },
  gold: {
    skyTop: '#0f766e',
    skyBottom: '#fef08a',
    fogColor: '#fef9c3',
    accentColor: '#eab308',
    normalColor: '#38bdf8',
    movingColor: '#f97316',
    disappearingColor: '#eab308',
    narrowColor: '#10b981',
    obstacleColor: '#e11d48',
  },
};

function coinArc(
  prefix: string,
  start: [number, number, number],
  end: [number, number, number],
  count: number,
  arcHeight = 1.4
): CoinDef[] {
  const coins: CoinDef[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : (i + 1) / (count + 1);
    const x = start[0] + (end[0] - start[0]) * t;
    const z = start[2] + (end[2] - start[2]) * t;
    const baseY = start[1] + (end[1] - start[1]) * t;
    const y = baseY + Math.sin(t * Math.PI) * arcHeight + 0.9;
    coins.push({ id: `${prefix}_c${i}`, position: [x, y, z] });
  }
  return coins;
}

function coinLine(
  prefix: string,
  x: number,
  y: number,
  zStart: number,
  zEnd: number,
  count: number
): CoinDef[] {
  const coins: CoinDef[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    coins.push({
      id: `${prefix}_cl${i}`,
      position: [x, y + 1.0, zStart + (zEnd - zStart) * t],
    });
  }
  return coins;
}

export const LEVELS: LevelDef[] = [
  // =========================================================================
  // LEVEL 1: Sunlit Meadows — Friendly intro, basic jumps, 1 checkpoint
  // =========================================================================
  {
    id: 1,
    name: 'Sunlit Meadows',
    subtitle: 'Warm up your sky-boots on breezy floating pads!',
    difficulty: 'Easy',
    rewardCoins: 25,
    theme: THEMES.meadow,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l1_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l1_p1', type: 'normal', position: [0, -0.2, -6.8], size: [4.2, 0.9, 4.2] },
      { id: 'l1_p2', type: 'normal', position: [2.2, 0.3, -13.2], size: [4, 0.9, 4] },
      { id: 'l1_p3', type: 'normal', position: [-1.8, 0.8, -19.6], size: [4, 0.9, 4] },
      { id: 'l1_cp1', type: 'checkpoint', position: [0, 1.0, -26.5], size: [5, 1, 5], checkpointIndex: 1 },
      { id: 'l1_p4', type: 'normal', position: [0, 1.4, -33.2], size: [3.6, 0.9, 4.2] },
      { id: 'l1_p5', type: 'bounce', position: [0, 1.4, -39.5], size: [3.6, 0.8, 3.6], bounceForce: 20 },
      { id: 'l1_p6', type: 'normal', position: [0, 4.4, -46.5], size: [4.5, 1, 4.5] },
      { id: 'l1_fin', type: 'finish', position: [0, 4.4, -54.0], size: [6.5, 1, 6.5] },
    ],
    obstacles: [],
    coins: [
      ...coinArc('l1_a1', [0, 0, -2], [0, 0.3, -6.8], 2, 1.0),
      ...coinArc('l1_a2', [0, 0.3, -6.8], [2.2, 0.8, -13.2], 2, 1.2),
      ...coinArc('l1_a3', [2.2, 0.8, -13.2], [-1.8, 1.3, -19.6], 2, 1.2),
      ...coinLine('l1_l1', 0, 1.9, -32, -34.5, 3),
      ...coinArc('l1_a4', [0, 2.0, -39.5], [0, 4.9, -46.5], 3, 3.0),
    ],
  },

  // =========================================================================
  // LEVEL 2: Breezy Stepping Stones — Introduces Moving Platforms & Narrow Path
  // =========================================================================
  {
    id: 2,
    name: 'Breezy Stepping Stones',
    subtitle: 'Ride gliding sky-lifts across the canyon!',
    difficulty: 'Easy',
    rewardCoins: 35,
    theme: THEMES.lagoon,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l2_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l2_p1', type: 'normal', position: [0, 0, -6.8], size: [3.8, 0.9, 3.8] },
      {
        id: 'l2_m1',
        type: 'moving',
        position: [0, 0.3, -14.0],
        size: [4.2, 0.8, 4.2],
        moveOffset: [4.2, 0, 0],
        moveSpeed: 1.4,
      },
      { id: 'l2_p2', type: 'normal', position: [0, 0.6, -21.2], size: [3.8, 0.9, 3.8] },
      { id: 'l2_cp1', type: 'checkpoint', position: [0, 0.8, -28.0], size: [5, 1, 5], checkpointIndex: 1 },
      { id: 'l2_n1', type: 'narrow', position: [0, 1.0, -35.8], size: [1.7, 0.8, 8.2] },
      {
        id: 'l2_m2',
        type: 'moving',
        position: [0, 1.4, -44.5],
        size: [4, 0.8, 4],
        moveOffset: [0, 0, 3.2],
        moveSpeed: 1.6,
      },
      { id: 'l2_cp2', type: 'checkpoint', position: [0, 1.8, -53.5], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l2_p3', type: 'normal', position: [-2.5, 2.2, -60.2], size: [3.4, 0.9, 3.4] },
      { id: 'l2_p4', type: 'normal', position: [2.5, 2.6, -66.5], size: [3.4, 0.9, 3.4] },
      { id: 'l2_fin', type: 'finish', position: [0, 3.0, -73.8], size: [6.5, 1, 6.5] },
    ],
    obstacles: [],
    coins: [
      ...coinArc('l2_a1', [0, 0.5, -6.8], [0, 0.8, -14.0], 2, 1.1),
      ...coinLine('l2_n1c', 0, 1.5, -33, -38.5, 4),
      ...coinArc('l2_a2', [-2.5, 2.7, -60.2], [2.5, 3.1, -66.5], 3, 1.4),
      ...coinArc('l2_a3', [2.5, 3.1, -66.5], [0, 3.5, -73.8], 2, 1.2),
    ],
  },

  // =========================================================================
  // LEVEL 3: Spinning Windmills — Introduces Rotating Sweeper Obstacles
  // =========================================================================
  {
    id: 3,
    name: 'Spinning Windmills',
    subtitle: 'Time your leaps over sweeping sky-rotors!',
    difficulty: 'Easy',
    rewardCoins: 45,
    theme: THEMES.sunset,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l3_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l3_rot1', type: 'normal', position: [0, 0, -9.0], size: [6.4, 1, 6.4] },
      { id: 'l3_p1', type: 'normal', position: [0, 0.5, -16.8], size: [3.6, 0.9, 3.6] },
      { id: 'l3_cp1', type: 'checkpoint', position: [0, 0.8, -23.5], size: [5, 1, 5], checkpointIndex: 1 },
      {
        id: 'l3_m1',
        type: 'moving',
        position: [-2.5, 1.0, -30.8],
        size: [3.6, 0.8, 3.6],
        moveOffset: [3.5, 0, 0],
        moveSpeed: 1.6,
      },
      { id: 'l3_rot2', type: 'normal', position: [0, 1.4, -39.5], size: [7.0, 1, 7.0] },
      { id: 'l3_cp2', type: 'checkpoint', position: [0, 1.6, -48.2], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l3_p2', type: 'bounce', position: [0, 1.6, -54.8], size: [3.6, 0.8, 3.6], bounceForce: 21 },
      { id: 'l3_p3', type: 'normal', position: [0, 5.0, -62.2], size: [5.0, 1, 5.0] },
      { id: 'l3_fin', type: 'finish', position: [0, 5.0, -70.0], size: [6.5, 1, 6.5] },
    ],
    obstacles: [
      { id: 'l3_o1', position: [0, 1.15, -9.0], length: 6.2, thickness: 0.45, speed: 1.45, blades: 1 },
      { id: 'l3_o2', position: [0, 2.55, -39.5], length: 6.8, thickness: 0.45, speed: -1.65, blades: 2 },
    ],
    coins: [
      { id: 'l3_c1', position: [-2.2, 1.5, -9.0] },
      { id: 'l3_c2', position: [2.2, 1.5, -9.0] },
      ...coinArc('l3_a1', [0, 1.0, -16.8], [0, 1.3, -23.5], 2, 1.0),
      { id: 'l3_c3', position: [-2.3, 2.9, -39.5] },
      { id: 'l3_c4', position: [2.3, 2.9, -39.5] },
      ...coinArc('l3_a2', [0, 2.1, -54.8], [0, 5.5, -62.2], 4, 3.2),
    ],
  },

  // =========================================================================
  // LEVEL 4: Cloud-Drop Bridge — Introduces Disappearing Platforms
  // =========================================================================
  {
    id: 4,
    name: 'Cloud-Drop Bridge',
    subtitle: 'Keep moving! Frosted platforms vanish beneath your feet!',
    difficulty: 'Medium',
    rewardCoins: 55,
    theme: THEMES.candy,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l4_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l4_d1', type: 'disappearing', position: [0, 0, -6.5], size: [3.6, 0.8, 3.6] },
      { id: 'l4_d2', type: 'disappearing', position: [2.0, 0.3, -12.4], size: [3.6, 0.8, 3.6] },
      { id: 'l4_d3', type: 'disappearing', position: [-1.5, 0.6, -18.2], size: [3.6, 0.8, 3.6] },
      { id: 'l4_cp1', type: 'checkpoint', position: [0, 0.8, -24.8], size: [5, 1, 5], checkpointIndex: 1 },
      { id: 'l4_n1', type: 'narrow', position: [0, 1.0, -32.2], size: [1.5, 0.8, 7.6] },
      { id: 'l4_d4', type: 'disappearing', position: [0, 1.2, -39.8], size: [3.4, 0.8, 3.4] },
      {
        id: 'l4_m1',
        type: 'moving',
        position: [0, 1.5, -46.8],
        size: [3.6, 0.8, 3.6],
        moveOffset: [4.2, 0, 0],
        moveSpeed: 1.8,
      },
      { id: 'l4_cp2', type: 'checkpoint', position: [0, 1.8, -54.5], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l4_d5', type: 'disappearing', position: [-2.0, 2.2, -60.8], size: [3.3, 0.8, 3.3] },
      { id: 'l4_d6', type: 'disappearing', position: [2.0, 2.6, -66.5], size: [3.3, 0.8, 3.3] },
      { id: 'l4_fin', type: 'finish', position: [0, 3.0, -73.2], size: [6.5, 1, 6.5] },
    ],
    obstacles: [],
    coins: [
      { id: 'l4_c1', position: [0, 1.4, -6.5] },
      { id: 'l4_c2', position: [2.0, 1.7, -12.4] },
      { id: 'l4_c3', position: [-1.5, 2.0, -18.2] },
      ...coinLine('l4_nc', 0, 1.5, -29.8, -34.5, 4),
      { id: 'l4_c4', position: [0, 2.6, -39.8] },
      { id: 'l4_c5', position: [-2.0, 3.6, -60.8] },
      { id: 'l4_c6', position: [2.0, 4.0, -66.5] },
    ],
  },

  // =========================================================================
  // LEVEL 5: Skyline Slalom — Narrow Paths + Moving + Rotating Bars
  // =========================================================================
  {
    id: 5,
    name: 'Skyline Slalom',
    subtitle: 'Thread narrow beams and dodge twin sky sweepers!',
    difficulty: 'Medium',
    rewardCoins: 65,
    theme: THEMES.aurora,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l5_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l5_n1', type: 'narrow', position: [0, -0.1, -8.0], size: [1.45, 0.8, 8.2] },
      { id: 'l5_p1', type: 'normal', position: [0, 0.3, -16.2], size: [6.0, 1, 6.0] },
      { id: 'l5_cp1', type: 'checkpoint', position: [0, 0.6, -24.2], size: [5, 1, 5], checkpointIndex: 1 },
      {
        id: 'l5_m1',
        type: 'moving',
        position: [-2.2, 0.9, -31.5],
        size: [3.4, 0.8, 3.4],
        moveOffset: [4.4, 0, 0],
        moveSpeed: 1.9,
      },
      {
        id: 'l5_m2',
        type: 'moving',
        position: [2.2, 1.3, -38.5],
        size: [3.4, 0.8, 3.4],
        moveOffset: [-4.4, 0, 0],
        moveSpeed: 1.9,
      },
      { id: 'l5_d1', type: 'disappearing', position: [0, 1.7, -45.2], size: [3.4, 0.8, 3.4] },
      { id: 'l5_cp2', type: 'checkpoint', position: [0, 2.0, -52.2], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l5_n2', type: 'narrow', position: [-2.0, 2.2, -59.5], size: [1.4, 0.8, 7.2] },
      { id: 'l5_p2', type: 'normal', position: [0.5, 2.6, -68.2], size: [6.2, 1, 6.2] },
      { id: 'l5_fin', type: 'finish', position: [0, 3.0, -76.5], size: [6.5, 1, 6.5] },
    ],
    obstacles: [
      { id: 'l5_o1', position: [0, 1.45, -16.2], length: 5.8, thickness: 0.45, speed: 1.9, blades: 2 },
      { id: 'l5_o2', position: [0.5, 3.75, -68.2], length: 6.0, thickness: 0.45, speed: -2.1, blades: 2 },
    ],
    coins: [
      ...coinLine('l5_l1', 0, 0.4, -5.2, -10.8, 4),
      { id: 'l5_c1', position: [-2.2, 1.8, -16.2] },
      { id: 'l5_c2', position: [2.2, 1.8, -16.2] },
      { id: 'l5_c3', position: [0, 3.1, -45.2] },
      ...coinLine('l5_l2', -2.0, 2.7, -57.2, -62.0, 4),
      { id: 'l5_c4', position: [0.5, 4.4, -68.2] },
    ],
  },

  // =========================================================================
  // LEVEL 6: Twin Rotor Ascent — Verticality, Bounce Pads & Rotors
  // =========================================================================
  {
    id: 6,
    name: 'Twin Rotor Ascent',
    subtitle: 'Bounce high into the clouds and master vertical leaps!',
    difficulty: 'Medium',
    rewardCoins: 75,
    theme: THEMES.gold,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l6_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l6_b1', type: 'bounce', position: [0, -0.2, -6.5], size: [3.5, 0.8, 3.5], bounceForce: 21 },
      { id: 'l6_p1', type: 'normal', position: [0, 3.2, -13.8], size: [5.8, 1, 5.8] },
      { id: 'l6_d1', type: 'disappearing', position: [2.8, 3.6, -20.5], size: [3.2, 0.8, 3.2] },
      { id: 'l6_d2', type: 'disappearing', position: [-2.4, 4.0, -26.2], size: [3.2, 0.8, 3.2] },
      { id: 'l6_cp1', type: 'checkpoint', position: [0, 4.4, -32.8], size: [5, 1, 5], checkpointIndex: 1 },
      {
        id: 'l6_m1',
        type: 'moving',
        position: [0, 5.2, -40.2],
        size: [3.8, 0.8, 3.8],
        moveOffset: [0, 2.2, 0],
        moveSpeed: 1.8,
      },
      { id: 'l6_p2', type: 'normal', position: [0, 7.2, -47.5], size: [6.4, 1, 6.4] },
      { id: 'l6_cp2', type: 'checkpoint', position: [0, 7.6, -55.8], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l6_n1', type: 'narrow', position: [0, 8.0, -63.4], size: [1.35, 0.8, 7.8] },
      { id: 'l6_b2', type: 'bounce', position: [0, 8.2, -70.6], size: [3.4, 0.8, 3.4], bounceForce: 21 },
      { id: 'l6_fin', type: 'finish', position: [0, 11.4, -78.5], size: [6.8, 1, 6.8] },
    ],
    obstacles: [
      { id: 'l6_o1', position: [0, 4.35, -13.8], length: 5.6, thickness: 0.45, speed: 2.0, blades: 1 },
      { id: 'l6_o2', position: [0, 8.35, -47.5], length: 6.2, thickness: 0.48, speed: -2.25, blades: 2 },
    ],
    coins: [
      ...coinArc('l6_a1', [0, 0.3, -6.5], [0, 3.7, -13.8], 3, 3.0),
      { id: 'l6_c1', position: [2.8, 5.0, -20.5] },
      { id: 'l6_c2', position: [-2.4, 5.4, -26.2] },
      ...coinLine('l6_l1', 0, 8.5, -60.5, -66.0, 4),
      ...coinArc('l6_a2', [0, 8.7, -70.6], [0, 11.9, -78.5], 4, 3.2),
    ],
  },

  // =========================================================================
  // LEVEL 7: Mirage Steps — Disappearing Chains & 3 Checkpoints
  // =========================================================================
  {
    id: 7,
    name: 'Mirage Steps',
    subtitle: 'Sprint across vanishing sky-tiles without hesitation!',
    difficulty: 'Hard',
    rewardCoins: 85,
    theme: THEMES.sunset,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l7_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l7_d1', type: 'disappearing', position: [0, 0, -6.4], size: [3.2, 0.8, 3.2] },
      { id: 'l7_d2', type: 'disappearing', position: [2.4, 0.3, -12.0], size: [3.0, 0.8, 3.0] },
      { id: 'l7_d3', type: 'disappearing', position: [0, 0.6, -17.6], size: [3.0, 0.8, 3.0] },
      { id: 'l7_cp1', type: 'checkpoint', position: [0, 0.8, -24.0], size: [4.8, 1, 4.8], checkpointIndex: 1 },
      {
        id: 'l7_m1',
        type: 'moving',
        position: [0, 1.1, -31.0],
        size: [3.2, 0.8, 3.2],
        moveOffset: [4.6, 0, 0],
        moveSpeed: 2.1,
      },
      { id: 'l7_p1', type: 'normal', position: [0, 1.4, -38.8], size: [6.2, 1, 6.2] },
      { id: 'l7_cp2', type: 'checkpoint', position: [0, 1.6, -46.8], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l7_n1', type: 'narrow', position: [-2.0, 1.9, -53.8], size: [1.3, 0.8, 6.5] },
      { id: 'l7_d4', type: 'disappearing', position: [1.2, 2.2, -60.6], size: [3.0, 0.8, 3.0] },
      { id: 'l7_d5', type: 'disappearing', position: [-1.4, 2.5, -66.4], size: [3.0, 0.8, 3.0] },
      { id: 'l7_cp3', type: 'checkpoint', position: [0, 2.8, -73.0], size: [4.8, 1, 4.8], checkpointIndex: 3 },
      { id: 'l7_b1', type: 'bounce', position: [0, 2.9, -79.2], size: [3.2, 0.8, 3.2], bounceForce: 21 },
      { id: 'l7_p2', type: 'normal', position: [0, 6.2, -86.6], size: [5.8, 1, 5.8] },
      { id: 'l7_fin', type: 'finish', position: [0, 6.2, -94.8], size: [6.8, 1, 6.8] },
    ],
    obstacles: [
      { id: 'l7_o1', position: [0, 2.55, -38.8], length: 6.0, thickness: 0.45, speed: 2.35, blades: 2 },
      { id: 'l7_o2', position: [0, 7.35, -86.6], length: 5.6, thickness: 0.45, speed: -2.4, blades: 2 },
    ],
    coins: [
      { id: 'l7_c1', position: [0, 1.4, -6.4] },
      { id: 'l7_c2', position: [2.4, 1.7, -12.0] },
      { id: 'l7_c3', position: [0, 2.0, -17.6] },
      ...coinLine('l7_l1', -2.0, 2.4, -51.5, -56.0, 4),
      { id: 'l7_c4', position: [1.2, 3.6, -60.6] },
      { id: 'l7_c5', position: [-1.4, 3.9, -66.4] },
      ...coinArc('l7_a1', [0, 3.4, -79.2], [0, 6.7, -86.6], 3, 3.0),
    ],
  },

  // =========================================================================
  // LEVEL 8: Cyclone Gauntlet — Fast Movers, Counter-Rotors, Zig-Zag Beams
  // =========================================================================
  {
    id: 8,
    name: 'Cyclone Gauntlet',
    subtitle: 'Ride rapid cross-winds and weave through spinning blades!',
    difficulty: 'Hard',
    rewardCoins: 95,
    theme: THEMES.lagoon,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l8_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      {
        id: 'l8_m1',
        type: 'moving',
        position: [0, 0, -7.2],
        size: [3.2, 0.8, 3.2],
        moveOffset: [4.8, 0, 0],
        moveSpeed: 2.25,
      },
      {
        id: 'l8_m2',
        type: 'moving',
        position: [0, 0.4, -14.2],
        size: [3.2, 0.8, 3.2],
        moveOffset: [-4.8, 0, 0],
        moveSpeed: 2.25,
      },
      { id: 'l8_p1', type: 'normal', position: [0, 0.8, -22.2], size: [6.4, 1, 6.4] },
      { id: 'l8_cp1', type: 'checkpoint', position: [0, 1.0, -30.5], size: [4.8, 1, 4.8], checkpointIndex: 1 },
      { id: 'l8_n1', type: 'narrow', position: [-2.0, 1.3, -37.8], size: [1.25, 0.8, 6.8] },
      { id: 'l8_n2', type: 'narrow', position: [2.0, 1.6, -45.2], size: [1.25, 0.8, 6.8] },
      { id: 'l8_cp2', type: 'checkpoint', position: [0, 2.0, -53.2], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l8_d1', type: 'disappearing', position: [0, 2.4, -59.6], size: [3.0, 0.8, 3.0] },
      {
        id: 'l8_m3',
        type: 'moving',
        position: [0, 2.8, -66.8],
        size: [3.4, 0.8, 3.4],
        moveOffset: [0, 0, 3.6],
        moveSpeed: 2.2,
      },
      { id: 'l8_cp3', type: 'checkpoint', position: [0, 3.2, -75.8], size: [4.8, 1, 4.8], checkpointIndex: 3 },
      { id: 'l8_p2', type: 'normal', position: [0, 3.6, -84.0], size: [6.8, 1, 6.8] },
      { id: 'l8_fin', type: 'finish', position: [0, 4.0, -93.0], size: [6.8, 1, 6.8] },
    ],
    obstacles: [
      { id: 'l8_o1', position: [0, 1.95, -22.2], length: 6.2, thickness: 0.45, speed: 2.4, blades: 2 },
      { id: 'l8_o2', position: [0, 4.75, -84.0], length: 6.6, thickness: 0.48, speed: -2.6, blades: 2 },
    ],
    coins: [
      { id: 'l8_c1', position: [0, 2.2, -22.2] },
      ...coinLine('l8_l1', -2.0, 1.8, -35.5, -40.2, 3),
      ...coinLine('l8_l2', 2.0, 2.1, -43.0, -47.5, 3),
      { id: 'l8_c2', position: [0, 3.8, -59.6] },
      { id: 'l8_c3', position: [-2.3, 5.0, -84.0] },
      { id: 'l8_c4', position: [2.3, 5.0, -84.0] },
    ],
  },

  // =========================================================================
  // LEVEL 9: Starlight Citadel — High-altitude multi-stage precision course
  // =========================================================================
  {
    id: 9,
    name: 'Starlight Citadel',
    subtitle: 'Ascend the twilight citadel where every jump counts!',
    difficulty: 'Expert',
    rewardCoins: 110,
    theme: THEMES.aurora,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l9_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l9_d1', type: 'disappearing', position: [-2.2, 0.1, -6.5], size: [2.9, 0.8, 2.9] },
      { id: 'l9_d2', type: 'disappearing', position: [2.2, 0.6, -12.4], size: [2.9, 0.8, 2.9] },
      { id: 'l9_b1', type: 'bounce', position: [0, 0.8, -18.6], size: [3.2, 0.8, 3.2], bounceForce: 21.5 },
      { id: 'l9_p1', type: 'normal', position: [0, 4.4, -26.2], size: [6.4, 1, 6.4] },
      { id: 'l9_cp1', type: 'checkpoint', position: [0, 4.6, -34.5], size: [4.8, 1, 4.8], checkpointIndex: 1 },
      {
        id: 'l9_m1',
        type: 'moving',
        position: [0, 5.0, -41.8],
        size: [3.2, 0.8, 3.2],
        moveOffset: [4.8, 0, 0],
        moveSpeed: 2.35,
      },
      { id: 'l9_n1', type: 'narrow', position: [0, 5.4, -49.5], size: [1.2, 0.8, 7.6] },
      { id: 'l9_cp2', type: 'checkpoint', position: [0, 5.8, -57.8], size: [4.8, 1, 4.8], checkpointIndex: 2 },
      { id: 'l9_p2', type: 'normal', position: [0, 6.2, -65.8], size: [6.4, 1, 6.4] },
      { id: 'l9_d3', type: 'disappearing', position: [-2.6, 6.7, -72.8], size: [2.8, 0.8, 2.8] },
      { id: 'l9_d4', type: 'disappearing', position: [2.4, 7.2, -78.6], size: [2.8, 0.8, 2.8] },
      { id: 'l9_cp3', type: 'checkpoint', position: [0, 7.6, -85.2], size: [4.8, 1, 4.8], checkpointIndex: 3 },
      {
        id: 'l9_m2',
        type: 'moving',
        position: [0, 8.2, -92.5],
        size: [3.2, 0.8, 3.2],
        moveOffset: [0, 2.4, 0],
        moveSpeed: 2.2,
      },
      { id: 'l9_fin', type: 'finish', position: [0, 10.6, -100.2], size: [6.8, 1, 6.8] },
    ],
    obstacles: [
      { id: 'l9_o1', position: [0, 5.55, -26.2], length: 6.2, thickness: 0.45, speed: 2.55, blades: 2 },
      { id: 'l9_o2', position: [0, 7.35, -65.8], length: 6.2, thickness: 0.48, speed: -2.7, blades: 2 },
    ],
    coins: [
      { id: 'l9_c1', position: [-2.2, 1.5, -6.5] },
      { id: 'l9_c2', position: [2.2, 2.0, -12.4] },
      ...coinArc('l9_a1', [0, 1.3, -18.6], [0, 4.9, -26.2], 3, 3.2),
      ...coinLine('l9_l1', 0, 5.9, -46.8, -52.2, 4),
      { id: 'l9_c3', position: [-2.6, 8.1, -72.8] },
      { id: 'l9_c4', position: [2.4, 8.6, -78.6] },
      ...coinArc('l9_a2', [0, 9.6, -92.5], [0, 11.1, -100.2], 3, 1.6),
    ],
  },

  // =========================================================================
  // LEVEL 10: Ultimate Sky Crown — Grand Finale Gauntlet!
  // =========================================================================
  {
    id: 10,
    name: 'Ultimate Sky Crown',
    subtitle: 'Conquer the grand sky gauntlet and claim the crown!',
    difficulty: 'Expert',
    rewardCoins: 150,
    theme: THEMES.gold,
    spawn: [0, 0, 0],
    fallLimitY: -12,
    platforms: [
      { id: 'l10_start', type: 'normal', position: [0, -0.5, 0], size: [6, 1, 6] },
      { id: 'l10_n1', type: 'narrow', position: [0, 0, -7.8], size: [1.2, 0.8, 7.8] },
      { id: 'l10_p1', type: 'normal', position: [0, 0.5, -16.2], size: [6.4, 1, 6.4] },
      { id: 'l10_d1', type: 'disappearing', position: [2.6, 0.9, -23.0], size: [2.9, 0.8, 2.9] },
      { id: 'l10_d2', type: 'disappearing', position: [-2.4, 1.3, -28.6], size: [2.9, 0.8, 2.9] },
      { id: 'l10_cp1', type: 'checkpoint', position: [0, 1.6, -35.0], size: [4.8, 1, 4.8], checkpointIndex: 1 },
      {
        id: 'l10_m1',
        type: 'moving',
        position: [-2.5, 2.0, -42.2],
        size: [3.0, 0.8, 3.0],
        moveOffset: [5.0, 0, 0],
        moveSpeed: 2.45,
      },
      {
        id: 'l10_m2',
        type: 'moving',
        position: [2.5, 2.5, -49.2],
        size: [3.0, 0.8, 3.0],
        moveOffset: [-5.0, 0, 0],
        moveSpeed: 2.45,
      },
      { id: 'l10_b1', type: 'bounce', position: [0, 2.8, -56.0], size: [3.2, 0.8, 3.2], bounceForce: 22 },
      { id: 'l10_cp2', type: 'checkpoint', position: [0, 6.6, -64.0], size: [5, 1, 5], checkpointIndex: 2 },
      { id: 'l10_p2', type: 'normal', position: [0, 7.0, -72.5], size: [7.0, 1, 7.0] },
      { id: 'l10_n2', type: 'narrow', position: [-2.2, 7.4, -80.4], size: [1.18, 0.8, 6.8] },
      { id: 'l10_d3', type: 'disappearing', position: [1.8, 7.8, -87.4], size: [2.8, 0.8, 2.8] },
      { id: 'l10_cp3', type: 'checkpoint', position: [0, 8.2, -94.2], size: [4.8, 1, 4.8], checkpointIndex: 3 },
      {
        id: 'l10_m3',
        type: 'moving',
        position: [0, 8.6, -101.6],
        size: [3.2, 0.8, 3.2],
        moveOffset: [0, 0, 3.8],
        moveSpeed: 2.45,
      },
      { id: 'l10_p3', type: 'normal', position: [0, 9.2, -110.2], size: [6.4, 1, 6.4] },
      { id: 'l10_fin', type: 'finish', position: [0, 9.8, -119.5], size: [7.5, 1, 7.5] },
    ],
    obstacles: [
      { id: 'l10_o1', position: [0, 1.65, -16.2], length: 6.2, thickness: 0.48, speed: 2.5, blades: 2 },
      { id: 'l10_o2', position: [0, 8.15, -72.5], length: 6.8, thickness: 0.5, speed: -2.8, blades: 2 },
      { id: 'l10_o3', position: [0, 10.35, -110.2], length: 6.2, thickness: 0.48, speed: 2.9, blades: 2 },
    ],
    coins: [
      ...coinLine('l10_l1', 0, 0.5, -5.2, -10.4, 4),
      { id: 'l10_c1', position: [2.6, 2.3, -23.0] },
      { id: 'l10_c2', position: [-2.4, 2.7, -28.6] },
      ...coinArc('l10_a1', [0, 3.3, -56.0], [0, 7.1, -64.0], 4, 3.4),
      { id: 'l10_c3', position: [-2.5, 8.4, -72.5] },
      { id: 'l10_c4', position: [2.5, 8.4, -72.5] },
      ...coinLine('l10_l2', -2.2, 7.9, -78.2, -82.6, 3),
      { id: 'l10_c5', position: [1.8, 9.2, -87.4] },
      { id: 'l10_c6', position: [0, 11.2, -110.2] },
    ],
  },
];

export function getLevelById(id: number): LevelDef {
  return LEVELS.find((lvl) => lvl.id === id) ?? LEVELS[0];
}
