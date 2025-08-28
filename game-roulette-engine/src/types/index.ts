// Core game interface that all games must implement
export interface GameInterface {
  id: string;
  name: string;
  difficulty: GameDifficulty;
  category: GameCategory;
  
  // Lifecycle methods
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  
  // Game loop methods
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  
  // State management
  getState(): GameState;
  setState(state: GameState): void;
  
  // Game info
  getScore(): number;
  getLevel(): number;
  isGameOver(): boolean;
  getInstructions(): string;
}

// Game difficulty levels
export type GameDifficulty = 'easy' | 'medium' | 'hard';

// Game categories
export type GameCategory = 'arcade' | 'puzzle' | 'action' | 'strategy' | 'casual';

// Base game state interface
export interface GameState {
  score: number;
  level: number;
  isPaused: boolean;
  isGameOver: boolean;
  timestamp: number;
  customData?: Record<string, any>;
}

// Game metadata for registration
export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  difficulty: GameDifficulty;
  category: GameCategory;
  author: string;
  version: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // in seconds
  tags: string[];
}

// Game performance metrics
export interface GameMetrics {
  totalPlayTime: number;
  gamesPlayed: number;
  highScore: number;
  averageScore: number;
  winRate: number;
  lastPlayed: Date;
}

// Roulette session data
export interface RouletteSession {
  id: string;
  startTime: Date;
  currentGame: string | null;
  gamesPlayed: string[];
  totalScore: number;
  isActive: boolean;
  difficulty: GameDifficulty;
}

// Game switching event
export interface GameSwitchEvent {
  fromGame: string | null;
  toGame: string;
  timestamp: Date;
  reason: 'timeout' | 'manual' | 'gameOver';
}

// Engine configuration
export interface EngineConfig {
  gameSwitchInterval: number; // milliseconds
  statePersistence: 'localStorage' | 'sessionStorage' | 'memory';
  enableAnalytics: boolean;
  defaultDifficulty: GameDifficulty;
  maxGamesInPool: number;
  enableSound: boolean;
  targetFPS: number;
  canvasWidth: number;
  canvasHeight: number;
}

// Random number generator interface
export interface RandomGenerator {
  nextInt(min: number, max: number): number;
  nextFloat(): number;
  nextBoolean(): boolean;
  pickRandom<T>(items: T[]): T;
  setSeed(seed: string): void;
}

// Event types for the engine
export type EngineEventType = 
  | 'gameStarted'
  | 'gamePaused'
  | 'gameResumed'
  | 'gameStopped'
  | 'gameSwitched'
  | 'sessionStarted'
  | 'sessionEnded'
  | 'scoreUpdated'
  | 'levelUp';

// Event payload interface
export interface EngineEvent {
  type: EngineEventType;
  timestamp: Date;
  data?: any;
}

// Achievement interface
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockDate?: Date;
  requirements: AchievementRequirement[];
}

// Achievement requirement
export interface AchievementRequirement {
  type: 'score' | 'gamesPlayed' | 'winStreak' | 'timePlayed';
  value: number;
  gameId?: string; // specific game or all games
}

// Leaderboard entry
export interface LeaderboardEntry {
  playerName: string;
  score: number;
  gameId: string;
  timestamp: Date;
  difficulty: GameDifficulty;
}

// Game pool configuration
export interface GamePool {
  id: string;
  name: string;
  description: string;
  games: string[];
  difficulty: GameDifficulty;
  category: GameCategory;
  isActive: boolean;
}

// Export all types
export * from './game';
export * from './engine';
export * from './events';
