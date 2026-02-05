import { createNoise2D } from "simplex-noise";
import seedrandom from "seedrandom";

const SEED = "brick-tower-world";

const rng = seedrandom(SEED);
const noise = new createNoise2D(rng);

export function terrainNoise(x) {
  return noise(x, 0);
  //  return createNoise2D(rng);
}
