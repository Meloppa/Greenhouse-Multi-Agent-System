export const PLANTS = ['Strawberry', 'Tomato', 'Lettuce', 'Orchid', 'Basil', 'Cactus'];
export const STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting'];

// Typical age (days since planting) for each plant at each growth stage —
// used to recommend a sensible default whenever the user picks a stage,
// since growth speed varies wildly between species (e.g. Lettuce vs Cactus).
const RECOMMENDED_AGE_DAYS = {
  Strawberry: { Seedling: 10, Vegetative: 35, Flowering: 60, Fruiting: 85 },
  Tomato:     { Seedling: 14, Vegetative: 35, Flowering: 55, Fruiting: 75 },
  Lettuce:    { Seedling: 7,  Vegetative: 21, Flowering: 40, Fruiting: 50 },
  Orchid:     { Seedling: 30, Vegetative: 120, Flowering: 200, Fruiting: 220 },
  Basil:      { Seedling: 10, Vegetative: 30, Flowering: 50, Fruiting: 65 },
  Cactus:     { Seedling: 60, Vegetative: 365, Flowering: 720, Fruiting: 730 },
};

export function getRecommendedAge(plant, stage) {
  return RECOMMENDED_AGE_DAYS[plant]?.[stage] ?? 1;
}
