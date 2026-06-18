export interface Category {
  name: string;
  hint: string;
}

export const CATEGORIES: Category[] = [
  { name: "Car brands based on their price and prestige", hint: "think luxury vs economy" },
  { name: "Foods based on how indulgent they are", hint: "think richness and decadence" },
  { name: "Movies based on how intense they are", hint: "think dark, heavy, or emotionally draining" },
  { name: "Animals based on how dangerous they are", hint: "think threat to humans in the wild" },
  { name: "Sports based on how physically demanding they are", hint: "think exhaustion and athleticism required" },
  { name: "Countries based on how hot the climate is", hint: "think average temperature year-round" },
  { name: "Music genres based on how energetic they are", hint: "think BPM and crowd energy" },
  { name: "Celebrities based on how famous they are worldwide", hint: "think recognition across every country" },
  { name: "Drinks based on how strong they are", hint: "think alcohol content or caffeine kick" },
  { name: "Jobs based on how stressful they are", hint: "think high-stakes and high-pressure" },
  { name: "Superpowers based on how powerful they are", hint: "think game-changing and unstoppable" },
  { name: "Emotions based on how overwhelming they are", hint: "think all-consuming and hard to control" },
  { name: "Hobbies based on how expensive they are to get into", hint: "think gear, lessons, and ongoing costs" },
  { name: "TV shows based on how dramatic they are", hint: "think plot twists and emotional intensity" },
  { name: "Dog breeds based on how intimidating they look", hint: "think first impression on a stranger" },
  { name: "Desserts based on how sweet they are", hint: "think pure sugar content" },
  { name: "Historical figures based on how controversial they are", hint: "think how divided opinions are today" },
  { name: "Video games based on how difficult they are", hint: "think skill ceiling and punishment for mistakes" },
  { name: "Phobias based on how common they are", hint: "think how many people share this fear" },
  { name: "Natural disasters based on how destructive they are", hint: "think death toll and damage" },
  { name: "Spices based on how spicy they are", hint: "think Scoville scale and mouth burn" },
  { name: "Cities based on how expensive they are to live in", hint: "think rent, food, and daily costs" },
  { name: "Social media platforms based on how addictive they are", hint: "think time lost without realizing it" },
  { name: "Fictional villains based on how scary they are", hint: "think genuine threat and menace" },
  { name: "Workout exercises based on how exhausting they are", hint: "think full-body effort and recovery time" },
];

export function pickCategories(count: number): Category[] {
  return [...CATEGORIES].sort(() => Math.random() - 0.5).slice(0, count);
}
