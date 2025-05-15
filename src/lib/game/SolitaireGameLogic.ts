
import { Card, Suit, Rank, Pile, PileType, GameState } from '../utils/constants';

export class SolitaireGameLogic {
  private state: GameState;
  private moveHistory: GameState[] = [];
  private redoStack: GameState[] = [];
  private updateCallback: ((state: GameState) => void) | null = null;
  private timerInterval: number | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  public setUpdateCallback(callback: (state: GameState) => void): void {
    this.updateCallback = callback;
  }

  private getInitialState(): GameState {
    return {
      stock: [],
      waste: [],
      foundations: [[], [], [], []],
      tableau: [[], [], [], [], [], [], []],
      moveCount: 0,
      score: 0,
      startTime: null,
      currentTime: 0,
      drawCount: 1, // Default to draw 1
      canUndo: false,
      canRedo: false
    };
  }

  public dealNewGame(): void {
    const deck = this.createDeck();
    this.shuffleDeck(deck);

    const tableau: Card[][] = [[], [], [], [], [], [], []];
    
    // Deal cards to tableau
    for (let row = 0; row < 7; row++) {
      for (let col = row; col < 7; col++) {
        const card = deck.pop();
        if (card) {
          // Only the top card in each pile should be face up
          card.faceUp = col === row;
          tableau[col].push(card);
        }
      }
    }

    // Remaining cards go to the stock pile
    const stock = deck.map(card => ({ ...card, faceUp: false }));

    this.state = {
      ...this.getInitialState(),
      stock,
      tableau,
      startTime: Date.now()
    };

    this.startTimer();
    this.notifyStateUpdated();
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    const suits = Object.values(Suit);
    
    for (const suit of suits) {
      for (let rank = Rank.ACE; rank <= Rank.KING; rank++) {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}`,
          faceUp: false
        });
      }
    }
    
    return deck;
  }

  private shuffleDeck(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  public drawFromStock(): boolean {
    if (this.state.stock.length === 0) {
      // No cards in stock, recycle waste
      if (this.state.waste.length === 0) {
        return false; // Nothing to draw
      }
      
      this.saveStateForUndo();
      
      // Move all waste cards back to stock and flip them face down
      const recycledStock = [...this.state.waste].reverse().map(card => ({
        ...card,
        faceUp: false
      }));
      
      this.state = {
        ...this.state,
        stock: recycledStock,
        waste: [],
        moveCount: this.state.moveCount + 1
      };
      
      this.notifyStateUpdated();
      return true;
    }
    
    this.saveStateForUndo();
    
    // Draw either 1 or 3 cards depending on drawCount setting
    const count = Math.min(this.state.drawCount, this.state.stock.length);
    const drawnCards = this.state.stock.slice(-count).map(card => ({
      ...card,
      faceUp: true
    }));
    
    this.state = {
      ...this.state,
      stock: this.state.stock.slice(0, -count),
      waste: [...this.state.waste, ...drawnCards],
      moveCount: this.state.moveCount + 1
    };
    
    this.notifyStateUpdated();
    return true;
  }

  // Method to move a card from one pile to another
  public moveCard(
    fromPile: PileType, 
    fromIndex: number, 
    cardIndex: number,
    toPile: PileType, 
    toIndex: number
  ): boolean {
    // Get source and target piles
    const { sourcePile, targetPile, cardsToMove } = this.getSourceAndTargetPiles(
      fromPile, fromIndex, cardIndex, toPile, toIndex
    );
    
    if (!sourcePile || !targetPile || !cardsToMove.length) {
      return false;
    }
    
    // Check if move is valid
    if (!this.isValidMove(cardsToMove, targetPile)) {
      return false;
    }

    this.saveStateForUndo();
    
    // Update source pile (remove moved cards)
    if (fromPile === PileType.WASTE) {
      this.state.waste.pop();
    } else if (fromPile === PileType.FOUNDATION) {
      this.state.foundations[fromIndex].pop();
    } else if (fromPile === PileType.TABLEAU) {
      this.state.tableau[fromIndex] = this.state.tableau[fromIndex].slice(0, cardIndex);
      
      // If we exposed a new card, flip it face up
      if (this.state.tableau[fromIndex].length > 0) {
        const lastCard = this.state.tableau[fromIndex][this.state.tableau[fromIndex].length - 1];
        if (!lastCard.faceUp) {
          this.state.tableau[fromIndex][this.state.tableau[fromIndex].length - 1] = {
            ...lastCard,
            faceUp: true
          };
        }
      }
    }
    
    // Update target pile (add moved cards)
    if (toPile === PileType.FOUNDATION) {
      // Only one card can be moved to foundation at a time
      this.state.foundations[toIndex].push(cardsToMove[0]);
    } else if (toPile === PileType.TABLEAU) {
      this.state.tableau[toIndex] = [...this.state.tableau[toIndex], ...cardsToMove];
    }
    
    // Update move count and score
    this.state.moveCount++;
    this.updateScore(fromPile, toPile);
    
    this.notifyStateUpdated();
    return true;
  }

  private getSourceAndTargetPiles(
    fromPile: PileType, 
    fromIndex: number, 
    cardIndex: number,
    toPile: PileType, 
    toIndex: number
  ): { 
    sourcePile: Card[] | null; 
    targetPile: Card[] | null; 
    cardsToMove: Card[];
  } {
    let sourcePile: Card[] | null = null;
    let targetPile: Card[] | null = null;
    let cardsToMove: Card[] = [];
    
    // Get source pile and cards to move
    if (fromPile === PileType.WASTE && this.state.waste.length > 0) {
      sourcePile = this.state.waste;
      cardsToMove = [this.state.waste[this.state.waste.length - 1]];
    } else if (fromPile === PileType.FOUNDATION && this.state.foundations[fromIndex]?.length > 0) {
      sourcePile = this.state.foundations[fromIndex];
      cardsToMove = [this.state.foundations[fromIndex][this.state.foundations[fromIndex].length - 1]];
    } else if (fromPile === PileType.TABLEAU && this.state.tableau[fromIndex]?.length > 0) {
      sourcePile = this.state.tableau[fromIndex];
      // In tableau we might move multiple cards
      if (cardIndex < sourcePile.length) {
        cardsToMove = sourcePile.slice(cardIndex);
        // All cards being moved must be face up
        if (cardsToMove.some(card => !card.faceUp)) {
          return { sourcePile: null, targetPile: null, cardsToMove: [] };
        }
      } else {
        return { sourcePile: null, targetPile: null, cardsToMove: [] };
      }
    }
    
    // Get target pile
    if (toPile === PileType.FOUNDATION && toIndex >= 0 && toIndex < 4) {
      targetPile = this.state.foundations[toIndex];
    } else if (toPile === PileType.TABLEAU && toIndex >= 0 && toIndex < 7) {
      targetPile = this.state.tableau[toIndex];
    }
    
    return { sourcePile, targetPile, cardsToMove };
  }

  private isValidMove(cardsToMove: Card[], targetPile: Card[]): boolean {
    if (!cardsToMove.length) return false;
    
    const firstCardToMove = cardsToMove[0];
    
    // Moving to empty foundation pile
    if (targetPile.length === 0 && targetPile === this.state.foundations[0] || 
        targetPile === this.state.foundations[1] ||
        targetPile === this.state.foundations[2] ||
        targetPile === this.state.foundations[3]) {
      // Only Aces can be moved to empty foundation piles
      return firstCardToMove.rank === Rank.ACE;
    }
    
    // Moving to non-empty foundation pile
    if (targetPile.length > 0 && 
        (targetPile === this.state.foundations[0] || 
         targetPile === this.state.foundations[1] ||
         targetPile === this.state.foundations[2] ||
         targetPile === this.state.foundations[3])) {
      const topCard = targetPile[targetPile.length - 1];
      // Card must be of the same suit and one rank higher
      return cardsToMove.length === 1 && 
             firstCardToMove.suit === topCard.suit && 
             firstCardToMove.rank === topCard.rank + 1;
    }
    
    // Moving to empty tableau pile
    if (targetPile.length === 0 && 
        (targetPile === this.state.tableau[0] || 
         targetPile === this.state.tableau[1] ||
         targetPile === this.state.tableau[2] ||
         targetPile === this.state.tableau[3] ||
         targetPile === this.state.tableau[4] ||
         targetPile === this.state.tableau[5] ||
         targetPile === this.state.tableau[6])) {
      // Only Kings can be moved to empty tableau piles
      return firstCardToMove.rank === Rank.KING;
    }
    
    // Moving to non-empty tableau pile
    if (targetPile.length > 0 && 
        (targetPile === this.state.tableau[0] || 
         targetPile === this.state.tableau[1] ||
         targetPile === this.state.tableau[2] ||
         targetPile === this.state.tableau[3] ||
         targetPile === this.state.tableau[4] ||
         targetPile === this.state.tableau[5] ||
         targetPile === this.state.tableau[6])) {
      const topCard = targetPile[targetPile.length - 1];
      
      // Target card must be face up
      if (!topCard.faceUp) return false;
      
      // Card must be of opposite color and one rank lower
      return this.isOppositeColor(firstCardToMove, topCard) && 
             firstCardToMove.rank === topCard.rank - 1;
    }
    
    return false;
  }

  private isOppositeColor(card1: Card, card2: Card): boolean {
    const redSuits = [Suit.HEARTS, Suit.DIAMONDS];
    const blackSuits = [Suit.CLUBS, Suit.SPADES];
    
    return (redSuits.includes(card1.suit) && blackSuits.includes(card2.suit)) ||
           (blackSuits.includes(card1.suit) && redSuits.includes(card2.suit));
  }

  private updateScore(fromPile: PileType, toPile: PileType): void {
    // Scoring based on Klondike Solitaire rules
    if (fromPile === PileType.WASTE && toPile === PileType.FOUNDATION) {
      this.state.score += 10; // Waste to Foundation
    } else if (fromPile === PileType.WASTE && toPile === PileType.TABLEAU) {
      this.state.score += 5; // Waste to Tableau
    } else if (fromPile === PileType.TABLEAU && toPile === PileType.FOUNDATION) {
      this.state.score += 10; // Tableau to Foundation
    } else if (fromPile === PileType.FOUNDATION && toPile === PileType.TABLEAU) {
      this.state.score -= 15; // Foundation to Tableau (penalty)
    } else if (fromPile === PileType.TABLEAU) {
      // Turning over a card in the tableau
      const tableauPile = this.state.tableau[fromPile === PileType.TABLEAU ? 0 : 1];
      if (tableauPile.length > 0 && tableauPile[tableauPile.length - 1].faceUp) {
        this.state.score += 5;
      }
    }
  }

  public setDrawCount(count: 1 | 3): void {
    if (this.state.drawCount !== count) {
      this.saveStateForUndo();
      this.state = {
        ...this.state,
        drawCount: count
      };
      this.notifyStateUpdated();
    }
  }

  public checkForWin(): boolean {
    // Game is won when all foundations have 13 cards each (all 52 cards)
    return this.state.foundations.every(foundation => foundation.length === 13);
  }
  
  public getState(): GameState {
    return { ...this.state };
  }
  
  private saveStateForUndo(): void {
    this.moveHistory.push(JSON.parse(JSON.stringify(this.state)));
    this.redoStack = []; // Clear redo stack when a new move is made
    this.state.canUndo = true;
    this.state.canRedo = false;
  }
  
  public undoMove(): boolean {
    if (this.moveHistory.length === 0) {
      return false;
    }
    
    this.redoStack.push(JSON.parse(JSON.stringify(this.state)));
    this.state = this.moveHistory.pop()!;
    this.state.canUndo = this.moveHistory.length > 0;
    this.state.canRedo = true;
    
    this.notifyStateUpdated();
    return true;
  }
  
  public redoMove(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }
    
    this.moveHistory.push(JSON.parse(JSON.stringify(this.state)));
    this.state = this.redoStack.pop()!;
    this.state.canUndo = true;
    this.state.canRedo = this.redoStack.length > 0;
    
    this.notifyStateUpdated();
    return true;
  }
  
  private startTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      if (this.state.startTime) {
        this.state.currentTime = Math.floor((Date.now() - this.state.startTime) / 1000);
        this.notifyStateUpdated();
      }
    }, 1000) as unknown as number;
  }
  
  public stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  private notifyStateUpdated(): void {
    if (this.updateCallback) {
      this.updateCallback({ ...this.state });
    }
  }
  
  public destroy(): void {
    this.stopTimer();
  }
}
