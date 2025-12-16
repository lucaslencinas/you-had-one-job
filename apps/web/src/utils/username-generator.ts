const ADJECTIVES = [
  "Grumpy", "Happy", "Sleepy", "Sneezy", "Dopey", "Bashful", "Doc",
  "Chubby", "Skinny", "Fluffy", "Scruffy", "Shiny", "Sparkly", "Brave",
  "Mighty", "Tiny", "Giant", "Fast", "Slow", "Lazy", "Hyper", "Calm",
  "Blue", "Red", "Green", "Yellow", "Purple", "Pink", "Orange", "Black",
  "White", "Golden", "Silver", "Neon", "Pastel", "Dark", "Light",
  "Lucky", "Unlucky", "Funny", "Silly", "Serious", "Smart", "Clever"
];

const NOUNS = [
  "Fox", "Dog", "Cat", "Bear", "Lion", "Tiger", "Wolf", "Panda", "Koala",
  "Penguin", "Eagle", "Hawk", "Owl", "Parrot", "Shark", "Whale", "Dolphin",
  "Octopus", "Squid", "Crab", "Lobster", "Shrimp", "Clam", "Snail", "Slug",
  "Ant", "Bee", "Wasp", "Fly", "Spider", "Scorpion", "Snake", "Lizard",
  "Turtle", "Frog", "Toad", "Fish", "Bird", "Mouse", "Rat", "Hamster",
  "Rabbit", "Hare", "Deer", "Elk", "Moose", "Cow", "Pig", "Sheep", "Goat"
];

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}`;
}
