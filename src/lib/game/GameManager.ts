
import { SolitaireGameLogic } from './SolitaireGameLogic';
import { PixiRenderer, CardMoveEvent } from './PixiRenderer';
import { GameState, Card, PileType } from '../utils/constants';
import { AudioManager } from '../audio/AudioManager';

export class GameManager {
  private gameLogic: SolitaireGameLogic;
  private renderer: PixiRenderer;
  private audioManager: AudioManager;
  private stateUpdateCallback: ((state: GameState) => void) | null = null;
  private winCallback: (() => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    // Initialize game logic and audio first
    this.gameLogic = new SolitaireGameLogic();
    this.audioManager = new AudioManager();
    
    // Initialize renderer last - passing the canvas
    this.renderer = new PixiRenderer(canvas);
    
    // Set up callbacks
    this.gameLogic.setUpdateCallback(this.onGameStateUpdate.bind(this));
    this.renderer.setCardMoveCallback(this.onCardMove.bind(this));
  }
  
  public async initialize(): Promise<void> {
    // Load assets
    try {
      console.log("Starting asset loading...");
      // Small delay to ensure the canvas is fully ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize audio first
      await this.audioManager.initialize();
      console.log("Audio assets loaded successfully");
      
      // Then initialize renderer
      await this.renderer.loadAssets();
      console.log("Renderer assets loaded successfully");
      
      console.log("Game assets loaded successfully");
    } catch (error) {
      console.error("Error loading game assets:", error);
      throw error;
    }
  }
  
  public startNewGame(): void {
    this.gameLogic.dealNewGame();
    this.audioManager.playSound('shuffle');
  }
  
  public setUpdateCallback(callback: (state: GameState) => void): void {
    this.stateUpdateCallback = callback;
  }
  
  public setWinCallback(callback: () => void): void {
    this.winCallback = callback;
  }
  
  private onGameStateUpdate(state: GameState): void {
    // Update renderer with new state
    this.renderer.updateCards(
      state.stock,
      state.waste,
      state.foundations,
      state.tableau
    );
    
    // Check for win condition
    if (this.gameLogic.checkForWin()) {
      this.handleWin();
    }
    
    // Notify UI component of state changes
    if (this.stateUpdateCallback) {
      this.stateUpdateCallback(state);
    }
  }
  
  private onCardMove(event: CardMoveEvent): void {
    // Special case for drawing from stock
    if (event.fromPile === PileType.STOCK && event.toPile === PileType.WASTE) {
      this.drawFromStock();
      return;
    }
    
    // Attempt to move card
    const success = this.gameLogic.moveCard(
      event.fromPile,
      event.fromIndex,
      event.cardIndex,
      event.toPile,
      event.toIndex
    );
    
    if (success) {
      this.audioManager.playSound('cardPlace');
    } else {
      this.audioManager.playSound('invalid');
    }
  }
  
  public drawFromStock(): void {
    const success = this.gameLogic.drawFromStock();
    
    if (success) {
      this.audioManager.playSound('cardFlip');
    }
  }
  
  public undoMove(): void {
    const success = this.gameLogic.undoMove();
    
    if (success) {
      this.audioManager.playSound('undo');
    }
  }
  
  public redoMove(): void {
    const success = this.gameLogic.redoMove();
    
    if (success) {
      this.audioManager.playSound('redo');
    }
  }
  
  public setDrawCount(count: 1 | 3): void {
    this.gameLogic.setDrawCount(count);
  }
  
  private handleWin(): void {
    this.renderer.winAnimation();
    this.audioManager.playSound('win');
    
    if (this.winCallback) {
      this.winCallback();
    }
  }
  
  public getGameState(): GameState {
    return this.gameLogic.getState();
  }
  
  public destroy(): void {
    if (this.gameLogic) {
      this.gameLogic.destroy();
    }
    
    if (this.renderer) {
      try {
        this.renderer.destroy();
      } catch (e) {
        console.error("Error destroying renderer:", e);
      }
    }
    
    if (this.audioManager) {
      this.audioManager.destroy();
    }
  }
}
