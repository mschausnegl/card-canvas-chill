import * as PIXI from 'pixi.js';
import TWEEN from '../utils/tween';
import { Card, PileType, Suit, Rank, CARD_WIDTH, CARD_HEIGHT, CARD_SCALE, CARD_OVERLAP, CARD_FACE_DOWN_OVERLAP, PILE_PADDING } from '../utils/constants';

export interface CardMoveEvent {
  fromPile: PileType;
  fromIndex: number;
  cardIndex: number;
  toPile: PileType;
  toIndex: number;
}

export class PixiRenderer {
  private app: PIXI.Application;
  private cardTextures: Record<string, PIXI.Texture> = {};
  private cardSprites: Record<string, PIXI.Sprite> = {};
  private cardBackTexture: PIXI.Texture | null = null;
  private containers: {
    stock: PIXI.Container;
    waste: PIXI.Container;
    foundations: PIXI.Container[];
    tableau: PIXI.Container[];
    dragLayer: PIXI.Container;
  };
  private emptyPileTexture: PIXI.Texture | null = null;
  private draggedCards: PIXI.Sprite[] = [];
  private dragOrigin: { pile: PileType; index: number; cardIndex: number } | null = null;
  private dragStartPosition = { x: 0, y: 0 };
  private onCardMoveCallback: ((event: CardMoveEvent) => void) | null = null;
  private isLoaded = false;
  private resizeTimeout: number | null = null;
  private animationInProgress = false;
  
  constructor(canvas: HTMLCanvasElement) {
    // Create Pixi Application
    this.app = new PIXI.Application({
      view: canvas as HTMLCanvasElement,
      resolution: window.devicePixelRatio || 1,
      backgroundColor: 0x219653, // Solitaire green
      autoDensity: true
    });
    
    // Create containers for card piles
    this.containers = {
      stock: new PIXI.Container(),
      waste: new PIXI.Container(),
      foundations: [
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container()
      ],
      tableau: [
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container(),
        new PIXI.Container()
      ],
      dragLayer: new PIXI.Container() // Top layer for dragged cards
    };
    
    // Add containers to the stage
    this.app.stage.addChild(this.containers.stock);
    this.app.stage.addChild(this.containers.waste);
    
    for (const foundation of this.containers.foundations) {
      this.app.stage.addChild(foundation);
    }
    
    for (const tableau of this.containers.tableau) {
      this.app.stage.addChild(tableau);
    }
    
    this.app.stage.addChild(this.containers.dragLayer);
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  public async loadAssets(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      // Create base textures for cards using direct URLs instead of graphics generation
      this.emptyPileTexture = PIXI.Texture.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAQAAACK6o+NAAAA2ElEQVR4Ae3VMREAAAQEMZ+Y2vYSQA4Xj5LJ7FQsCBGICBABIgJEgIgAESAiQASICBABIgJEgIgAESAiQASICBABIgJEgIgAESAiQASICBABIgJEgIgAESAiQASICBABIgJEgIgAESAiQASICBABIgJEBMjwgAEEBQ37/JQdAAAAAElFTkSuQmCC');
      this.cardBackTexture = PIXI.Texture.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAQAAACK6o+NAAAA2klEQVR4Ae3VMQ0AAAzDsPIPvSS4QQtIZrMXiwMCIkAEiAgQASICRICIABEgIkAEiAgQASICRICIABEgIkAEiAgQASICRICIABEgIkAEiAgQASICRICIABEgIkAEiAgQedUBsQEE0cnDiU8AAAAASUVORK5CYII=');

      const suits = Object.values(Suit);
      const ranks = Array.from({ length: 13 }, (_, i) => i + 1);

      // Create simple card textures using canvas instead of PIXI.Graphics
      for (const suit of suits) {
        for (const rank of ranks) {
          const key = `${suit}-${rank}`;
          const isRed = suit === Suit.HEARTS || suit === Suit.DIAMONDS;
          
          // Create a canvas for the card
          const canvas = document.createElement('canvas');
          canvas.width = CARD_WIDTH;
          canvas.height = CARD_HEIGHT;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw card background
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
            ctx.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
            
            // Draw rank and suit
            const rankText = this.getRankText(rank);
            const suitSymbol = this.getSuitSymbol(suit);
            ctx.fillStyle = isRed ? '#FF0000' : '#000000';
            ctx.font = 'bold 24px Arial';
            
            // Top-left rank and suit
            ctx.fillText(rankText, 10, 30);
            ctx.fillText(suitSymbol, 10, 60);
            
            // Center rank and suit
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(rankText, CARD_WIDTH / 2, CARD_HEIGHT / 2 - 10);
            ctx.fillText(suitSymbol, CARD_WIDTH / 2, CARD_HEIGHT / 2 + 40);
            
            // Convert canvas to texture
            this.cardTextures[key] = PIXI.Texture.from(canvas);
          }
        }
      }
      
      // Create empty pile markers
      for (let i = 0; i < 4; i++) {
        const emptyFoundation = new PIXI.Sprite(this.emptyPileTexture);
        emptyFoundation.alpha = 0.2;
        emptyFoundation.width = CARD_WIDTH * CARD_SCALE;
        emptyFoundation.height = CARD_HEIGHT * CARD_SCALE;
        emptyFoundation.tint = 0x999999;
        this.containers.foundations[i].addChild(emptyFoundation);
      }
      
      for (let i = 0; i < 7; i++) {
        const emptyTableau = new PIXI.Sprite(this.emptyPileTexture);
        emptyTableau.alpha = 0.2;
        emptyTableau.width = CARD_WIDTH * CARD_SCALE;
        emptyTableau.height = CARD_HEIGHT * CARD_SCALE;
        emptyTableau.tint = 0x999999;
        this.containers.tableau[i].addChild(emptyTableau);
      }
      
      // Empty stock pile
      const emptyStock = new PIXI.Sprite(this.emptyPileTexture);
      emptyStock.alpha = 0.2;
      emptyStock.width = CARD_WIDTH * CARD_SCALE;
      emptyStock.height = CARD_HEIGHT * CARD_SCALE;
      emptyStock.tint = 0x999999;
      this.containers.stock.addChild(emptyStock);
      
      // Empty waste pile
      const emptyWaste = new PIXI.Sprite(this.emptyPileTexture);
      emptyWaste.alpha = 0.2;
      emptyWaste.width = CARD_WIDTH * CARD_SCALE;
      emptyWaste.height = CARD_HEIGHT * CARD_SCALE;
      emptyWaste.tint = 0x999999;
      this.containers.waste.addChild(emptyWaste);
      
      this.isLoaded = true;
      this.positionContainers();
    } catch (error) {
      console.error("Error loading assets:", error);
      throw error;
    }
  }
  
  private getSuitSymbol(suit: Suit): string {
    switch (suit) {
      case Suit.CLUBS: return "♣";
      case Suit.DIAMONDS: return "♦";
      case Suit.HEARTS: return "♥";
      case Suit.SPADES: return "♠";
    }
  }
  
  private getRankText(rank: number): string {
    switch (rank) {
      case 1: return "A";
      case 11: return "J";
      case 12: return "Q";
      case 13: return "K";
      default: return String(rank);
    }
  }
  
  public setCardMoveCallback(callback: (event: CardMoveEvent) => void): void {
    this.onCardMoveCallback = callback;
  }
  
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = window.setTimeout(() => {
      this.positionContainers();
      this.updateCardPositions();
    }, 100) as unknown as number;
  }
  
  private positionContainers(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    // Calculate layout
    const scaledCardWidth = CARD_WIDTH * CARD_SCALE;
    const scaledCardHeight = CARD_HEIGHT * CARD_SCALE;
    
    // Position stock and waste piles
    this.containers.stock.position.set(PILE_PADDING, PILE_PADDING);
    this.containers.waste.position.set(PILE_PADDING + scaledCardWidth + PILE_PADDING, PILE_PADDING);
    
    // Position foundation piles
    for (let i = 0; i < 4; i++) {
      this.containers.foundations[i].position.set(
        width - PILE_PADDING - scaledCardWidth * (4 - i),
        PILE_PADDING
      );
    }
    
    // Position tableau piles
    const tableauTop = PILE_PADDING + scaledCardHeight + PILE_PADDING;
    for (let i = 0; i < 7; i++) {
      this.containers.tableau[i].position.set(
        PILE_PADDING + i * (scaledCardWidth + PILE_PADDING),
        tableauTop
      );
    }
  }
  
  public updateCards(
    stock: Card[],
    waste: Card[],
    foundations: Card[][],
    tableau: Card[][]
  ): void {
    this.clearAllCards();
    
    // Create sprites for all cards if they don't exist yet
    this.createCardSprites(stock);
    this.createCardSprites(waste);
    foundations.forEach(pile => this.createCardSprites(pile));
    tableau.forEach(pile => this.createCardSprites(pile));
    
    // Position and add cards to containers
    this.positionStockCards(stock);
    this.positionWasteCards(waste);
    this.positionFoundationCards(foundations);
    this.positionTableauCards(tableau);
    
    // Set up interactivity
    this.setupInteractivity(stock, waste, foundations, tableau);
  }
  
  private clearAllCards(): void {
    // Remove all card sprites from containers but keep empty pile markers
    this.containers.stock.children.slice(1).forEach(child => this.containers.stock.removeChild(child));
    this.containers.waste.children.slice(1).forEach(child => this.containers.waste.removeChild(child));
    
    this.containers.foundations.forEach(container => {
      container.children.slice(1).forEach(child => container.removeChild(child));
    });
    
    this.containers.tableau.forEach(container => {
      container.children.slice(1).forEach(child => container.removeChild(child));
    });
    
    this.containers.dragLayer.removeChildren();
  }
  
  private createCardSprites(cards: Card[]): void {
    cards.forEach(card => {
      if (!this.cardSprites[card.id]) {
        const texture = card.faceUp 
          ? this.cardTextures[`${card.suit}-${card.rank}`]
          : this.cardBackTexture!;
          
        if (!texture) {
          console.error(`Texture not found for card: ${card.id}`);
          return;
        }
        
        const sprite = new PIXI.Sprite(texture);
        sprite.scale.set(CARD_SCALE);
        sprite.name = card.id;
        
        // Add reference to the card data on the sprite for easier access
        (sprite as any).cardData = card;
        
        this.cardSprites[card.id] = sprite;
      }
    });
  }
  
  private positionStockCards(cards: Card[]): void {
    if (cards.length === 0) return;
    
    const topCard = cards[cards.length - 1];
    const sprite = this.cardSprites[topCard.id];
    if (sprite) {
      this.containers.stock.addChild(sprite);
    }
  }
  
  private positionWasteCards(cards: Card[]): void {
    if (cards.length === 0) return;
    
    const topCard = cards[cards.length - 1];
    const sprite = this.cardSprites[topCard.id];
    if (sprite) {
      this.containers.waste.addChild(sprite);
    }
  }
  
  private positionFoundationCards(foundations: Card[][]): void {
    foundations.forEach((pile, index) => {
      if (pile.length === 0) return;
      
      const topCard = pile[pile.length - 1];
      const sprite = this.cardSprites[topCard.id];
      if (sprite) {
        this.containers.foundations[index].addChild(sprite);
      }
    });
  }
  
  private positionTableauCards(tableau: Card[][]): void {
    tableau.forEach((pile, pileIndex) => {
      pile.forEach((card, cardIndex) => {
        const sprite = this.cardSprites[card.id];
        if (sprite) {
          // Position the card with overlap
          sprite.position.y = (card.faceUp ? CARD_OVERLAP : CARD_FACE_DOWN_OVERLAP) * cardIndex;
          this.containers.tableau[pileIndex].addChild(sprite);
        }
      });
    });
  }
  
  private updateCardPositions(): void {
    // Implementation details would depend on how you track the current state
  }
  
  private setupInteractivity(
    stock: Card[],
    waste: Card[],
    foundations: Card[][],
    tableau: Card[][]
  ): void {
    // Make stock pile clickable
    if (stock.length > 0) {
      const stockSprite = this.containers.stock.children[this.containers.stock.children.length - 1];
      if (stockSprite instanceof PIXI.Sprite) {
        stockSprite.eventMode = 'static';
        stockSprite.cursor = 'pointer';
        stockSprite.on('pointerdown', () => {
          if (this.onCardMoveCallback) {
            this.onCardMoveCallback({
              fromPile: PileType.STOCK,
              fromIndex: 0,
              cardIndex: 0,
              toPile: PileType.WASTE,
              toIndex: 0
            });
          }
        });
      }
    } else {
      // Make empty stock pile clickable to recycle waste
      const emptyStock = this.containers.stock.children[0];
      if (emptyStock instanceof PIXI.Sprite) {
        emptyStock.eventMode = 'static';
        emptyStock.cursor = 'pointer';
        emptyStock.on('pointerdown', () => {
          if (this.onCardMoveCallback && waste.length > 0) {
            this.onCardMoveCallback({
              fromPile: PileType.WASTE,
              fromIndex: 0,
              cardIndex: 0,
              toPile: PileType.STOCK,
              toIndex: 0
            });
          }
        });
      }
    }
    
    // Make waste pile draggable
    if (waste.length > 0) {
      const wasteSprite = this.containers.waste.children[this.containers.waste.children.length - 1];
      if (wasteSprite instanceof PIXI.Sprite) {
        this.makeCardDraggable(wasteSprite, PileType.WASTE, 0, waste.length - 1);
      }
    }
    
    // Make foundation cards draggable (only top card)
    foundations.forEach((pile, index) => {
      if (pile.length > 0) {
        const topCardSprite = this.containers.foundations[index].children[
          this.containers.foundations[index].children.length - 1
        ];
        
        if (topCardSprite instanceof PIXI.Sprite) {
          this.makeCardDraggable(topCardSprite, PileType.FOUNDATION, index, pile.length - 1);
        }
      }
    });
    
    // Make tableau cards draggable (any face-up card and cards below it)
    tableau.forEach((pile, pileIndex) => {
      pile.forEach((card, cardIndex) => {
        if (card.faceUp) {
          const sprite = this.cardSprites[card.id];
          if (sprite) {
            this.makeCardDraggable(sprite, PileType.TABLEAU, pileIndex, cardIndex);
          }
        }
      });
    });
  }
  
  private makeCardDraggable(sprite: PIXI.Sprite, pileType: PileType, pileIndex: number, cardIndex: number): void {
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    
    sprite.on('pointerdown', (event) => {
      if (this.animationInProgress) return;
      
      const parentContainer = sprite.parent;
      this.dragOrigin = { pile: pileType, index: pileIndex, cardIndex };
      
      // Calculate global position
      const globalPos = sprite.getGlobalPosition();
      this.dragStartPosition = { x: globalPos.x, y: globalPos.y };
      
      // Create drag sprites
      this.draggedCards = [];
      
      if (pileType === PileType.TABLEAU) {
        // For tableau, drag the card and all cards on top of it
        const containerChildren = parentContainer.children;
        const startIndex = containerChildren.findIndex(child => child === sprite);
        
        for (let i = startIndex; i < containerChildren.length; i++) {
          const child = containerChildren[i] as PIXI.Sprite;
          const dragSprite = new PIXI.Sprite(child.texture);
          dragSprite.scale.set(CARD_SCALE);
          
          // Position relative to the first dragged card
          dragSprite.position.y = (i - startIndex) * CARD_OVERLAP;
          
          this.draggedCards.push(dragSprite);
          this.containers.dragLayer.addChild(dragSprite);
        }
      } else {
        // For waste and foundation, just drag the single card
        const dragSprite = new PIXI.Sprite(sprite.texture);
        dragSprite.scale.set(CARD_SCALE);
        this.draggedCards.push(dragSprite);
        this.containers.dragLayer.addChild(dragSprite);
      }
      
      // Position the drag container at the start position
      this.containers.dragLayer.position.set(this.dragStartPosition.x, this.dragStartPosition.y);
      
      // Start listening to pointer move events
      this.app.stage.eventMode = 'static';
      this.app.stage.on('pointermove', this.onDragMove, this);
      this.app.stage.on('pointerup', this.onDragEnd, this);
      this.app.stage.on('pointerupoutside', this.onDragEnd, this);
    });
  }
  
  private onDragMove(event: PIXI.FederatedPointerEvent): void {
    if (this.draggedCards.length === 0) return;
    
    const newPosition = event.global;
    this.containers.dragLayer.position.set(newPosition.x, newPosition.y);
  }
  
  private onDragEnd(event: PIXI.FederatedPointerEvent): void {
    this.app.stage.off('pointermove', this.onDragMove, this);
    this.app.stage.off('pointerup', this.onDragEnd, this);
    this.app.stage.off('pointerupoutside', this.onDragEnd, this);
    
    if (this.draggedCards.length === 0 || !this.dragOrigin) return;
    
    // Determine drop target
    const dropTarget = this.getDropTarget(event.global);
    
    // Clear drag layer
    this.containers.dragLayer.removeChildren();
    this.draggedCards = [];
    
    if (dropTarget && this.onCardMoveCallback) {
      // Attempt to move card
      this.onCardMoveCallback({
        fromPile: this.dragOrigin.pile,
        fromIndex: this.dragOrigin.index,
        cardIndex: this.dragOrigin.cardIndex,
        toPile: dropTarget.pile,
        toIndex: dropTarget.index
      });
    }
    
    this.dragOrigin = null;
  }
  
  private getDropTarget(position: PIXI.Point): { pile: PileType; index: number } | null {
    // Check foundations
    for (let i = 0; i < 4; i++) {
      const bounds = this.containers.foundations[i].getBounds();
      if (position.x >= bounds.x && position.x <= bounds.x + bounds.width &&
          position.y >= bounds.y && position.y <= bounds.y + bounds.height) {
        return { pile: PileType.FOUNDATION, index: i };
      }
    }
    
    // Check tableau piles
    for (let i = 0; i < 7; i++) {
      const bounds = this.containers.tableau[i].getBounds();
      if (position.x >= bounds.x && position.x <= bounds.x + bounds.width &&
          position.y >= bounds.y) { // No upper bound check for tableau as it can extend vertically
        return { pile: PileType.TABLEAU, index: i };
      }
    }
    
    return null;
  }
  
  public animateCardMove(
    card: Card,
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number },
    onComplete?: () => void
  ): void {
    const sprite = this.cardSprites[card.id];
    if (!sprite) return;
    
    this.animationInProgress = true;
    
    // Create a temporary sprite for animation
    const animSprite = new PIXI.Sprite(sprite.texture);
    animSprite.scale.set(CARD_SCALE);
    animSprite.position.set(fromPos.x, fromPos.y);
    this.app.stage.addChild(animSprite);
    
    // Use TWEEN for animation 
    new TWEEN.Tween(animSprite.position)
      .to({ x: toPos.x, y: toPos.y }, 250)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.app.stage.removeChild(animSprite);
        animSprite.destroy();
        this.animationInProgress = false;
        if (onComplete) onComplete();
      })
      .start();
  }
  
  public flipCard(card: Card, onComplete?: () => void): void {
    const sprite = this.cardSprites[card.id];
    if (!sprite) return;
    
    this.animationInProgress = true;
    
    // Use TWEEN for animation
    new TWEEN.Tween(sprite.scale)
      .to({ x: 0 }, 150)
      .onComplete(() => {
        sprite.texture = card.faceUp 
          ? this.cardTextures[`${card.suit}-${card.rank}`]
          : this.cardBackTexture!;
          
        new TWEEN.Tween(sprite.scale)
          .to({ x: CARD_SCALE }, 150)
          .onComplete(() => {
            this.animationInProgress = false;
            if (onComplete) onComplete();
          })
          .start();
      })
      .start();
  }
  
  public winAnimation(): void {
    // Create falling card sprites
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    
    // Create 52 falling cards
    for (let i = 0; i < 52; i++) {
      const suit = Object.values(Suit)[Math.floor(Math.random() * 4)];
      const rank = Math.floor(Math.random() * 13) + 1;
      const texture = this.cardTextures[`${suit}-${rank}`];
      
      if (!texture) continue;
      
      const sprite = new PIXI.Sprite(texture);
      sprite.scale.set(CARD_SCALE * 0.7); // Make them a bit smaller
      sprite.position.set(
        Math.random() * width,
        -CARD_HEIGHT * CARD_SCALE - Math.random() * 500 // Start above screen
      );
      sprite.rotation = (Math.random() - 0.5) * Math.PI / 2; // Random rotation
      
      this.app.stage.addChild(sprite);
      
      // Use TWEEN for animations
      new TWEEN.Tween(sprite.position)
        .to({ y: height + CARD_HEIGHT * CARD_SCALE }, 3000 + Math.random() * 4000)
        .delay(Math.random() * 2000)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => {
          this.app.stage.removeChild(sprite);
          sprite.destroy();
        })
        .start();
        
      new TWEEN.Tween(sprite)
        .to({ rotation: (Math.random() - 0.5) * Math.PI * 4 }, 3000 + Math.random() * 4000)
        .delay(Math.random() * 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
    }
  }
  
  public destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Destroy all textures and sprites
    Object.values(this.cardTextures).forEach(texture => texture.destroy(true));
    if (this.cardBackTexture) this.cardBackTexture.destroy(true);
    if (this.emptyPileTexture) this.emptyPileTexture.destroy(true);
    
    this.app.destroy(true, { children: true, texture: true });
  }
}
