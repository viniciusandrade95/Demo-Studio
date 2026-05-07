export type SeededRandom = {
  next(): number;
  integer(minInclusive: number, maxInclusive: number): number;
  chance(probability: number): boolean;
  pick<T>(values: readonly T[]): T;
};

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed: string): SeededRandom {
  let state = hashSeed(seed) || 1;

  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    integer(minInclusive, maxInclusive) {
      return (
        Math.floor(next() * (maxInclusive - minInclusive + 1)) + minInclusive
      );
    },
    chance(probability) {
      return next() < probability;
    },
    pick(values) {
      if (values.length === 0) {
        throw new Error("Cannot pick from an empty collection");
      }

      return values[Math.floor(next() * values.length)]!;
    },
  };
}
