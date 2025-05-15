
export enum Suit {
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds',
  HEARTS = 'hearts',
  SPADES = 'spades'
}

export enum Rank {
  ACE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13
}

export enum PileType {
  STOCK = 'stock',
  WASTE = 'waste',
  FOUNDATION = 'foundation',
  TABLEAU = 'tableau'
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
  faceUp: boolean;
}

export interface Pile {
  type: PileType;
  index: number; // For tableau (0-6) or foundation (0-3)
  cards: Card[];
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
  moveCount: number;
  score: number;
  startTime: number | null;
  currentTime: number;
  drawCount: 1 | 3; // Either draw 1 or draw 3
  canUndo: boolean;
  canRedo: boolean;
}

// Game layout constants
export const CARD_WIDTH = 100;
export const CARD_HEIGHT = 140;
export const CARD_SCALE = 0.9; // Scale cards to fit better
export const CARD_OVERLAP = 30; // Vertical overlap for face-up cards in tableau
export const CARD_FACE_DOWN_OVERLAP = 15; // Vertical overlap for face-down cards
export const PILE_PADDING = 20; // Spacing between piles
