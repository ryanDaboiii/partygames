export interface Category {
  id: string;
  name: string;
}

export const CATEGORIES: Category[] = [
  { id: "car-brands", name: "Car brands" },
  { id: "foods", name: "Foods" },
  { id: "movies", name: "Movies" },
  { id: "animals", name: "Animals" },
  { id: "sports", name: "Sports" },
  { id: "countries", name: "Countries" },
  { id: "music-genres", name: "Music genres" },
  { id: "celebrities", name: "Celebrities" },
  { id: "drinks", name: "Drinks" },
  { id: "jobs", name: "Jobs" },
  { id: "superpowers", name: "Superpowers" },
  { id: "emotions", name: "Emotions" },
  { id: "hobbies", name: "Expensive hobbies" },
  { id: "tv-shows", name: "TV shows" },
  { id: "dog-breeds", name: "Dog breeds" },
  { id: "desserts", name: "Desserts" },
  { id: "historical-figures", name: "Impactful historical figures" },
  { id: "video-games", name: "Video games" },
  { id: "phobias", name: "Phobias" },
  { id: "natural-disasters", name: "Most destructive natural disasters" },
  { id: "cities", name: "Cities" },
  { id: "social-media", name: "Social media platforms" },
  { id: "fictional-villains", name: "Fictional villains" },
  { id: "workout-exercises", name: "Most exhausting exercises" },
  { id: "best_candy", name: "Best candy brands" },
  { id: "best_chips", name: "Best chip brands" },
  { id: "best_cereal", name: "Best cereal brands" },
  { id: "best_social_media", name: "Best social media platforms" },
  { id: "best_phones", name: "Best phone brands" },
  { id: "best_chocolate", name: "Best chocolate brands" },
  { id: "best_shoes", name: "Best shoe brands" },
  { id: "best_sports_brands", name: "Best sports brands" },
  { id: "best_game_franchises", name: "Best video game franchises" },
  { id: "worst_chores", name: "Worst chores" },
  { id: "common_phobias", name: "Most common phobias" },
];

export function pickCategories(count: number): Category[] {
  return [...CATEGORIES].sort(() => Math.random() - 0.5).slice(0, count);
}
