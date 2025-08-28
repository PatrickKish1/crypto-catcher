import { GameInterface, GameState, EngineConfig, RouletteSession, GameSwitchEvent, EngineEvent, EngineEventType } from '../types';
import { GameManager } from './GameManager';
import { GameRegistry } from './GameRegistry';
import { StateManager } from './StateManager';
import { TimerManager } from './TimerManager';

/**
 * Main Game Roulette Engine
 * Orchestrates random game switching every minute with state preservation
 */
export class GameRouletteEngine {
  // Core components
  private gameManager: GameManager;
  private gameRegistry: GameRegistry;
  private stateManager: StateManager;
  private timerManager: TimerManager;
  
  // Engine state
  private isRunning: boolean = false;
  private currentSession: RouletteSession | null = null;
  private container: HTMLElement | string;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Configuration
  private config: EngineConfig;
  
  // Event listeners
  private eventListeners: Map<EngineEventType, Function[]> = new Map();

  constructor(
    container: HTMLElement | string,
    config: Partial<EngineConfig> = {}
  ) {
    this.container = container;
    
    // Default configuration
    this.config = {
      gameSwitchInterval: 60000, // 60 seconds
      statePersistence: 'localStorage',
      enableAnalytics: true,
      defaultDifficulty: 'medium',
      maxGamesInPool: 10,
      enableSound: true,
      targetFPS: 60,
      canvasWidth: 800,
      canvasHeight: 600,
      ...config
    };

    // Initialize core components
    this.gameRegistry = new GameRegistry();
    this.stateManager = new StateManager(this.config.statePersistence);
    this.timerManager = new TimerManager(this.config.gameSwitchInterval);
    this.gameManager = new GameManager(
      this.gameRegistry,
      this.stateManager,
      this.timerManager
    );

    // Set up event handling
    this.setupEventHandling();
  }

  /**
   * Start the Game Roulette Engine
   */
  public start(): void {
    if (this.isRunning) return;

    console.log('🎰 Starting Game Roulette Engine...');
    
    // Initialize container and canvas
    this.initializeContainer();
    
    // Start the engine
    this.isRunning = true;
    this.startNewSession();
    
    // Start the timer for game switching
    this.timerManager.start(this.onGameSwitch.bind(this));
    
    this.emitEvent('sessionStarted', { session: this.currentSession });
    console.log('🎰 Game Roulette Engine started successfully!');
  }

  /**
   * Stop the Game Roulette Engine
   */
  public stop(): void {
    if (!this.isRunning) return;

    console.log('🎰 Stopping Game Roulette Engine...');
    
    // Stop current game
    this.gameManager.stopCurrentGame();
    
    // Stop timer
    this.timerManager.stop();
    
    // End session
    this.endCurrentSession();
    
    this.isRunning = false;
    this.emitEvent('sessionEnded', { session: this.currentSession });
    
    console.log('🎰 Game Roulette Engine stopped');
  }

  /**
   * Register a new game with the engine
   */
  public registerGame(game: GameInterface): void {
    this.gameRegistry.registerGame(game);
    console.log(`🎮 Registered game: ${game.name}`);
  }

  /**
   * Get current game information
   */
  public getCurrentGame(): GameInterface | null {
    return this.gameManager.getCurrentGame();
  }

  /**
   * Get current session information
   */
  public getCurrentSession(): RouletteSession | null {
    return this.currentSession;
  }

  /**
   * Get engine statistics
   */
  public getStats() {
    return {
      totalGames: this.gameRegistry.getTotalGames(),
      gamesPlayed: this.currentSession?.gamesPlayed.length || 0,
      totalScore: this.currentSession?.totalScore || 0,
      sessionDuration: this.currentSession ? 
        Date.now() - this.currentSession.startTime.getTime() : 0
    };
  }

  /**
   * Add event listener
   */
  public on(eventType: EngineEventType, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(eventType: EngineEventType, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Manually trigger game switch
   */
  public switchGame(): void {
    if (this.isRunning) {
      this.onGameSwitch();
    }
  }

  /**
   * Pause current game
   */
  public pauseGame(): void {
    this.gameManager.pauseCurrentGame();
  }

  /**
   * Resume current game
   */
  public resumeGame(): void {
    this.gameManager.resumeCurrentGame();
  }

  /**
   * Get available games
   */
  public getAvailableGames(): GameInterface[] {
    return this.gameRegistry.getAllGames();
  }

  /**
   * Set game difficulty
   */
  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.config.defaultDifficulty = difficulty;
    this.gameManager.setDifficulty(difficulty);
  }

  // Private methods

  private initializeContainer(): void {
    let containerElement: HTMLElement;
    
    if (typeof this.container === 'string') {
      const element = document.querySelector(this.container);
      if (!element) {
        throw new Error(`Container not found: ${this.container}`);
      }
      containerElement = element as HTMLElement;
    } else {
      containerElement = this.container;
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.canvas.style.border = '2px solid #333';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    
    // Add canvas to container
    containerElement.innerHTML = '';
    containerElement.appendChild(this.canvas);
    
    // Get 2D context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Set up canvas for game manager
    this.gameManager.setCanvas(this.canvas, this.ctx);
  }

  private startNewSession(): void {
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: new Date(),
      currentGame: null,
      gamesPlayed: [],
      totalScore: 0,
      isActive: true,
      difficulty: this.config.defaultDifficulty
    };

    // Start with a random game
    this.selectRandomGame();
  }

  private endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.isActive = false;
      
      // Save session data
      this.stateManager.saveSession(this.currentSession);
      
      // Save final game state
      const currentGame = this.gameManager.getCurrentGame();
      if (currentGame) {
        this.stateManager.saveGameState(currentGame.id, currentGame.getState());
      }
    }
  }

  private selectRandomGame(): void {
    const availableGames = this.gameRegistry.getAllGames();
    if (availableGames.length === 0) {
      console.warn('⚠️ No games available for selection');
      return;
    }

    // Select random game
    const randomIndex = Math.floor(Math.random() * availableGames.length);
    const selectedGame = availableGames[randomIndex];
    
    console.log(`🎲 Randomly selected: ${selectedGame.name}`);
    
    // Switch to the selected game
    this.gameManager.switchToGame(selectedGame);
    
    // Update session
    if (this.currentSession) {
      this.currentSession.currentGame = selectedGame.id;
      if (!this.currentSession.gamesPlayed.includes(selectedGame.id)) {
        this.currentSession.gamesPlayed.push(selectedGame.id);
      }
    }

    this.emitEvent('gameSwitched', {
      fromGame: null,
      toGame: selectedGame.id,
      timestamp: new Date(),
      reason: 'timeout'
    });
  }

  private onGameSwitch(): void {
    if (!this.isRunning) return;

    console.log('⏰ Time to switch games!');
    
    // Save current game state
    const currentGame = this.gameManager.getCurrentGame();
    if (currentGame) {
      const gameState = currentGame.getState();
      this.stateManager.saveGameState(currentGame.id, gameState);
      
      // Update session score
      if (this.currentSession) {
        this.currentSession.totalScore += gameState.score;
      }
      
      this.emitEvent('gameStopped', { game: currentGame, state: gameState });
    }
    
    // Select and start new game
    this.selectRandomGame();
    
    // Restart timer
    this.timerManager.restart();
  }

  private setupEventHandling(): void {
    // Listen to game manager events
    this.gameManager.on('gameStarted', (data: any) => {
      this.emitEvent('gameStarted', data);
    });
    
    this.gameManager.on('gamePaused', (data: any) => {
      this.emitEvent('gamePaused', data);
    });
    
    this.gameManager.on('gameResumed', (data: any) => {
      this.emitEvent('gameResumed', data);
    });
    
    this.gameManager.on('scoreUpdated', (data: any) => {
      this.emitEvent('scoreUpdated', data);
    });
    
    this.gameManager.on('levelUp', (data: any) => {
      this.emitEvent('levelUp', data);
    });
  }

  private emitEvent(eventType: EngineEventType, data?: any): void {
    const event: EngineEvent = {
      type: eventType,
      timestamp: new Date(),
      data
    };

    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  public get isActive(): boolean {
    return this.isRunning;
  }

  public get canvasElement(): HTMLCanvasElement | null {
    return this.canvas;
  }

  public get configuration(): EngineConfig {
    return { ...this.config };
  }
}
