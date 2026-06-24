export interface Category {
  id: string;
  name: string;   // base noun e.g. "Movies"
  label: string;  // full phrase e.g. "Movies based on their intensity"
  hint: string;
}

export const CATEGORIES: Category[] = [
  { id: "car-brands", name: "Car brands", label: "Car brands based on their price and prestige", hint: "think luxury vs economy" },
  { id: "foods", name: "Foods", label: "Foods based on how indulgent they are", hint: "think richness and decadence" },
  { id: "movies", name: "Movies", label: "Movies based on how intense they are", hint: "think dark, heavy, or emotionally draining" },
  { id: "animals", name: "Animals", label: "Animals based on how dangerous they are", hint: "think threat to humans in the wild" },
  { id: "sports", name: "Sports", label: "Sports based on how physically demanding they are", hint: "think exhaustion and athleticism required" },
  { id: "countries", name: "Countries", label: "Countries based on how hot the climate is", hint: "think average temperature year-round" },
  { id: "music-genres", name: "Music genres", label: "Music genres based on how energetic they are", hint: "think BPM and crowd energy" },
  { id: "celebrities", name: "Celebrities", label: "Celebrities based on how famous they are worldwide", hint: "think recognition across every country" },
  { id: "drinks", name: "Drinks", label: "Drinks based on how strong they are", hint: "think alcohol content or caffeine kick" },
  { id: "jobs", name: "Jobs", label: "Jobs based on how stressful they are", hint: "think high-stakes and high-pressure" },
  { id: "superpowers", name: "Superpowers", label: "Superpowers based on how powerful they are", hint: "think game-changing and unstoppable" },
  { id: "emotions", name: "Emotions", label: "Emotions based on how overwhelming they are", hint: "think all-consuming and hard to control" },
  { id: "hobbies", name: "Hobbies", label: "Hobbies based on how expensive they are to get into", hint: "think gear, lessons, and ongoing costs" },
  { id: "tv-shows", name: "TV shows", label: "TV shows based on how dramatic they are", hint: "think plot twists and emotional intensity" },
  { id: "dog-breeds", name: "Dog breeds", label: "Dog breeds based on how intimidating they look", hint: "think first impression on a stranger" },
  { id: "desserts", name: "Desserts", label: "Desserts based on how sweet they are", hint: "think pure sugar content" },
  { id: "historical-figures", name: "Historical figures", label: "Historical figures based on how controversial they are", hint: "think how divided opinions are today" },
  { id: "video-games", name: "Video games", label: "Video games based on how difficult they are", hint: "think skill ceiling and punishment for mistakes" },
  { id: "phobias", name: "Phobias", label: "Phobias based on how common they are", hint: "think how many people share this fear" },
  { id: "natural-disasters", name: "Natural disasters", label: "Natural disasters based on how destructive they are", hint: "think death toll and damage" },
  { id: "spices", name: "Spices", label: "Spices based on how spicy they are", hint: "think Scoville scale and mouth burn" },
  { id: "cities", name: "Cities", label: "Cities based on how expensive they are to live in", hint: "think rent, food, and daily costs" },
  { id: "social-media", name: "Social media platforms", label: "Social media platforms based on how addictive they are", hint: "think time lost without realizing it" },
  { id: "fictional-villains", name: "Fictional villains", label: "Fictional villains based on how scary they are", hint: "think genuine threat and menace" },
  { id: "workout-exercises", name: "Workout exercises", label: "Workout exercises based on how exhausting they are", hint: "think full-body effort and recovery time" },
];

export function pickCategories(count: number): Category[] {
  return [...CATEGORIES].sort(() => Math.random() - 0.5).slice(0, count);
}
