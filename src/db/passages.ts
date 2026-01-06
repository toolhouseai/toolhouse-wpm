export interface Passage {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
}

// Sample passages for the typing game
export const SAMPLE_PASSAGES: Passage[] = [
  {
    id: 'passage_001',
    text: 'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet, making it a perfect pangram for testing typing skills.',
    difficulty: 'easy',
    wordCount: 28,
  },
  {
    id: 'passage_002',
    text: 'Coffee is one of the most popular beverages in the world. Whether you prefer it hot or cold, black or with cream, there is no denying its appeal to millions of people every day.',
    difficulty: 'easy',
    wordCount: 38,
  },
  {
    id: 'passage_003',
    text: 'Technology has transformed the way we communicate, work, and learn. From smartphones to artificial intelligence, innovations continue to shape our daily lives in remarkable ways.',
    difficulty: 'easy',
    wordCount: 32,
  },
  {
    id: 'passage_004',
    text: 'The ancient library of Alexandria was one of the most important centers of learning in the classical world. Scholars from all regions came to study its vast collection of scrolls and manuscripts.',
    difficulty: 'medium',
    wordCount: 34,
  },
  {
    id: 'passage_005',
    text: 'In the heart of the rainforest, biodiversity reaches its peak. Countless species, from microscopic organisms to massive jaguars, coexist in an intricate web of interdependence and ecological balance.',
    difficulty: 'medium',
    wordCount: 33,
  },
  {
    id: 'passage_006',
    text: 'The phenomenon of bioluminescence has fascinated scientists for centuries. Certain organisms, including fireflies, anglerfish, and dinoflagellates, produce their own light through complex biochemical reactions.',
    difficulty: 'medium',
    wordCount: 32,
  },
  {
    id: 'passage_007',
    text: 'Quantum mechanics revolutionized our understanding of the subatomic world. The probabilistic nature of quantum phenomena challenged classical physics and introduced concepts like superposition and entanglement.',
    difficulty: 'hard',
    wordCount: 28,
  },
  {
    id: 'passage_008',
    text: 'Metamorphosis represents one of nature\'s most extraordinary transformations. The caterpillar\'s journey into a butterfly involves a profound reorganization of its cellular structure through the remarkable process of pupation.',
    difficulty: 'hard',
    wordCount: 32,
  },
  {
    id: 'passage_009',
    text: 'The Renaissance marked a pivotal transition from medieval to modern times. Characterized by intellectual curiosity and artistic innovation, this epoch witnessed extraordinary achievements in literature, science, and philosophy.',
    difficulty: 'hard',
    wordCount: 31,
  },
  {
    id: 'passage_010',
    text: 'Neural networks have become instrumental in advancing artificial intelligence. Their architecture mimics biological brain structures, enabling machines to learn patterns, recognize images, and process information with unprecedented sophistication.',
    difficulty: 'hard',
    wordCount: 33,
  },
  {
    id: 'passage_011',
    text: 'Mountains form through tectonic activity over millions of years. Plate collisions, volcanic eruptions, and erosion continuously reshape the landscape, creating the spectacular ranges we see today.',
    difficulty: 'easy',
    wordCount: 30,
  },
  {
    id: 'passage_012',
    text: 'The human body contains approximately sixty trillion cells. Each cell performs specialized functions, and together they create a complex system capable of thought, movement, healing, and countless other vital processes.',
    difficulty: 'medium',
    wordCount: 32,
  },
  {
    id: 'passage_013',
    text: 'Photosynthesis is the process by which plants convert sunlight into chemical energy. This fundamental biological mechanism feeds nearly all life on Earth and produces the oxygen we depend on for survival.',
    difficulty: 'medium',
    wordCount: 31,
  },
  {
    id: 'passage_014',
    text: 'The internet\'s exponential growth has fundamentally altered human interaction and commerce. What began as a military communication network has become an indispensable infrastructure connecting billions of people worldwide.',
    difficulty: 'medium',
    wordCount: 30,
  },
  {
    id: 'passage_015',
    text: 'Linguistics explores how humans communicate through language. Researchers study syntax, semantics, phonology, and pragmatics to understand the remarkable cognitive abilities that allow us to express infinite ideas with finite words.',
    difficulty: 'hard',
    wordCount: 32,
  },
];

/**
 * Get a random passage from the sample collection
 */
export function getRandomPassage(): Passage {
  const randomIndex = Math.floor(Math.random() * SAMPLE_PASSAGES.length);
  return SAMPLE_PASSAGES[randomIndex];
}

/**
 * Get a passage by ID
 */
export function getPassageById(id: string): Passage | undefined {
  return SAMPLE_PASSAGES.find(p => p.id === id);
}
