import { GameInterface, GameState } from '../types';

/**
 * Manages individual game lifecycle and switching
 */
export class GameManager {
  private currentGame: GameInterface | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  constructor(
    private gameRegistry: any,
    private stateManager: any,
    private timerManager: any
  ) {}

  /**
   * Set the canvas for the game manager
   */
  public setCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /**
   * Switch to a specific game
   */
  public switchToGame(game: GameInterface): void {
    // Stop current game if running
    if (this.currentGame) {
      this.stopCurrentGame();
    }

    // Set up new game
    this.currentGame = game;
    if (this.canvas) {
      game.setCanvas(this.canvas);
    }

    // Load saved state if available
    const savedState = this.stateManager.loadGameState(game.id);
    if (savedState) {
      game.setState(savedState);
    }

    // Start the new game
    game.start();
    
    this.emitEvent('gameStarted', { game });
    console.log(`🎮 Switched to: ${game.name}`);
  }

  /**
   * Stop the current game
   */
  public stopCurrentGame(): void {
    if (this.currentGame) {
      // Save game state before stopping
      const gameState = this.currentGame.getState();
      this.stateManager.saveGameState(this.currentGame.id, gameState);
      
      // Stop the game
      this.currentGame.stop();
      
      this.emitEvent('gameStopped', { game: this.currentGame, state: gameState });
      this.currentGame = null;
    }
  }

  /**
   * Pause the current game
   */
  public pauseCurrentGame(): void {
    if (this.currentGame && this.currentGame.isActive) {
      this.currentGame.pause();
      this.emitEvent('gamePaused', { game: this.currentGame });
    }
  }

  /**
   * Resume the current game
   */
  public resumeCurrentGame(): void {
    if (this.currentGame && this.currentGame.isActive) {
      this.currentGame.resume();
      this.emitEvent('gameResumed', { game: this.currentGame });
    }
  }

  /**
   * Get the current game
   */
  public getCurrentGame(): GameInterface | null {
    return this.currentGame;
  }

  /**
   * Set game difficulty
   */
  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    // Could implement difficulty scaling here
  }

  /**
   * Add event listener
   */
  public on(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }
}
