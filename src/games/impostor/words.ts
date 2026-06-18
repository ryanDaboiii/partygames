import type { ImpostorCategory } from "./types";

export const WORD_LISTS: Record<ImpostorCategory, string[]> = {
  Animals: [
    "Elephant", "Penguin", "Octopus", "Kangaroo", "Giraffe",
    "Dolphin", "Cheetah", "Gorilla", "Flamingo", "Chameleon",
    "Platypus", "Porcupine", "Meerkat", "Narwhal", "Axolotl",
    "Capybara", "Komodo Dragon", "Mantis Shrimp", "Pangolin", "Sloth",
  ],
  "Movies & TV": [
    "Titanic", "Friends", "The Office", "Star Wars", "Breaking Bad",
    "Avatar", "The Lion King", "Jurassic Park", "Game of Thrones", "Interstellar",
    "Stranger Things", "Inception", "The Dark Knight", "Pulp Fiction", "Avengers",
    "Parasite", "La La Land", "Forrest Gump", "The Godfather", "Shrek",
  ],
  "Food & Drink": [
    "Pizza", "Sushi", "Pancakes", "Lemonade", "Tacos",
    "Ramen", "Croissant", "Guacamole", "Lasagna", "Dumplings",
    "Nachos", "Fondue", "Boba Tea", "Cheesecake", "Pretzels",
    "Paella", "Tiramisu", "Hot Dog", "Falafel", "Macarons",
  ],
  Sports: [
    "Soccer", "Basketball", "Tennis", "Surfing", "Bowling",
    "Volleyball", "Gymnastics", "Fencing", "Table Tennis", "Archery",
    "Snowboarding", "Badminton", "Wrestling", "Polo", "Curling",
    "Rock Climbing", "Synchronized Swimming", "Bobsled", "Biathlon", "Lacrosse",
  ],
  "Famous Places": [
    "Eiffel Tower", "Grand Canyon", "Times Square", "Great Wall of China",
    "Machu Picchu", "Colosseum", "Niagara Falls", "Sydney Opera House",
    "Stonehenge", "Sahara Desert", "Amazon Rainforest", "Mount Everest",
    "Statue of Liberty", "Big Ben", "Taj Mahal", "Angkor Wat",
    "Northern Lights", "Santorini", "Petra", "Easter Island",
  ],
  "Jobs & Professions": [
    "Firefighter", "Dentist", "Chef", "Pilot", "Teacher",
    "Astronaut", "Architect", "Surgeon", "Judge", "Archaeologist",
    "Marine Biologist", "Sommelier", "Taxidermist", "Cryptographer", "Actuary",
    "Bomb Disposal", "Air Traffic Controller", "Forensic Artist", "Vet", "Puppeteer",
  ],
  "Everyday Objects": [
    "Umbrella", "Toothbrush", "Backpack", "Stapler", "Flashlight",
    "Scissors", "Rubber Duck", "Duct Tape", "Whisk", "Compass",
    "Bubble Wrap", "Paper Clip", "Thermometer", "Magnifying Glass", "Tape Measure",
    "Sticky Notes", "Lint Roller", "Corkscrew", "Padlock", "Doorstop",
  ],
};

export const CATEGORIES = Object.keys(WORD_LISTS) as ImpostorCategory[];

export function getRandomWord(category: ImpostorCategory): string {
  const list = WORD_LISTS[category];
  return list[Math.floor(Math.random() * list.length)];
}
