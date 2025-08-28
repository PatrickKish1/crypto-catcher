import { 
  GameInterface, 
  GameState, 
  GameDifficulty, 
  GameCategory 
} from '../../types';

/**
 * Base class for all games in the Game Roulette Engine
 * Provides common functionality and implements the GameInterface
 */
export abstract class BaseGame implements GameInterface {
  // Game identification
  public readonly id: string;
  public readonly name: string;
  public readonly difficulty: GameDifficulty;
  public readonly category: GameCategory;
  
  // Game state
  protected score: number = 0;
  protected level: number = 1;
  protected isPaused: boolean = false;
  protected isGameOver: boolean = false;
  protected isRunning: boolean = false;
  
  // Game loop
  protected lastUpdateTime: number = 0;
  protected frameId: number | null = null;
  protected targetFPS: number = 60;
  protected frameInterval: number = 1000 / 60;
  
  // Canvas and rendering
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;
  
  // Custom game data
  protected customData: Record<string, any> = {};

  constructor(
    id: string, 
    name: string, 
    difficulty: GameDifficulty = 'medium',
    category: GameCategory = 'arcade'
  ) {
    this.id = id;
    this.name = name;
    this.difficulty = difficulty;
    this.category = category;
  }

  // Lifecycle methods
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.lastUpdateTime = performance.now();
    
    this.onStart();
    this.startGameLoop();
    
    console.log(`🎮 Started game: ${this.name}`);
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    this.onPause();
    
    console.log(`⏸️ Paused game: ${this.name}`);
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.lastUpdateTime = performance.now();
    this.onResume();
    
    console.log(`▶️ Resumed game: ${this.name}`);
  }

  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    this.onStop();
    
    console.log(`⏹️ Stopped game: ${this.name}`);
  }

  // Game loop methods
  public update(deltaTime: number): void {
    if (!this.isRunning || this.isPaused) return;
    
    this.onUpdate(deltaTime);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isRunning) return;
    
    this.onRender(ctx);
  }

  // State management
  public getState(): GameState {
    return {
      score: this.score,
      level: this.level,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      timestamp: Date.now(),
      customData: { ...this.customData }
    };
  }

  public setState(state: GameState): void {
    this.score = state.score;
    this.level = state.level;
    this.isPaused = state.isPaused;
    this.isGameOver = state.isGameOver;
    
    if (state.customData) {
      this.customData = { ...state.customData };
    }
    
    this.onStateLoaded(state);
  }

  // Game info methods
  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.level;
  }

  public isGameOver(): boolean {
    return this.isGameOver;
  }

  public getInstructions(): string {
    return this.onGetInstructions();
  }

  // Canvas setup
  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    
    this.onCanvasReady(canvas, this.ctx);
  }

  // Utility methods
  protected addScore(points: number): void {
    this.score += points;
    this.onScoreChanged(this.score);
  }

  protected setScore(score: number): void {
    this.score = score;
    this.onScoreChanged(this.score);
  }

  protected setLevel(level: number): void {
    this.level = level;
    this.onLevelChanged(this.level);
  }

  protected gameOver(): void {
    this.isGameOver = true;
    this.isRunning = false;
    this.onGameOver();
    
    console.log(`💀 Game Over in ${this.name}. Final Score: ${this.score}`);
  }

  protected setCustomData(key: string, value: any): void {
    this.customData[key] = value;
  }

  protected getCustomData(key: string): any {
    return this.customData[key];
  }

  // Protected methods that subclasses can override
  protected onStart(): void {}
  protected onPause(): void {}
  protected onResume(): void {}
  protected onStop(): void {}
  protected onUpdate(deltaTime: number): void {}
  protected onRender(ctx: CanvasRenderingContext2D): void {}
  protected onStateLoaded(state: GameState): void {}
  protected onCanvasReady(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {}
  protected onScoreChanged(score: number): void {}
  protected onLevelChanged(level: number): void {}
  protected onGameOver(): void {}

  // Abstract methods that subclasses must implement
  protected abstract onGetInstructions(): string;

  // Private methods
  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      if (!this.isRunning) return;
      
      const deltaTime = currentTime - this.lastUpdateTime;
      
      if (deltaTime >= this.frameInterval) {
        this.update(deltaTime);
        this.lastUpdateTime = currentTime;
      }
      
      if (this.ctx) {
        this.render(this.ctx);
      }
      
      this.frameId = requestAnimationFrame(gameLoop);
    };
    
    this.frameId = requestAnimationFrame(gameLoop);
  }

  // Getters
  public get isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }

  public get canvasElement(): HTMLCanvasElement | null {
    return this.canvas;
  }

  public get context(): CanvasRenderingContext2D | null {
    return this.ctx;
  }
}
