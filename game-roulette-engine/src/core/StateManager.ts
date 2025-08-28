import { GameState } from '../types';

/**
 * Manages game state persistence
 */
export class StateManager {
  private storage: Storage;
  private prefix: string = 'game_roulette_';

  constructor(storageType: 'localStorage' | 'sessionStorage' | 'memory') {
    switch (storageType) {
      case 'localStorage':
        this.storage = window.localStorage;
        break;
      case 'sessionStorage':
        this.storage = window.sessionStorage;
        break;
      case 'memory':
        this.storage = new MemoryStorage();
        break;
      default:
        this.storage = window.localStorage;
    }
  }

  /**
   * Save game state
   */
  public saveGameState(gameId: string, state: GameState): void {
    try {
      const key = this.prefix + 'game_' + gameId;
      const serializedState = JSON.stringify({
        ...state,
        timestamp: Date.now()
      });
      this.storage.setItem(key, serializedState);
      console.log(`💾 Saved state for game: ${gameId}`);
    } catch (error) {
      console.error(`❌ Failed to save state for game ${gameId}:`, error);
    }
  }

  /**
   * Load game state
   */
  public loadGameState(gameId: string): GameState | null {
    try {
      const key = this.prefix + 'game_' + gameId;
      const serializedState = this.storage.getItem(key);
      
      if (serializedState) {
        const state = JSON.parse(serializedState);
        console.log(`📂 Loaded state for game: ${gameId}`);
        return state;
      }
    } catch (error) {
      console.error(`❌ Failed to load state for game ${gameId}:`, error);
    }
    
    return null;
  }

  /**
   * Delete game state
   */
  public deleteGameState(gameId: string): boolean {
    try {
      const key = this.prefix + 'game_' + gameId;
      this.storage.removeItem(key);
      console.log(`🗑️ Deleted state for game: ${gameId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete state for game ${gameId}:`, error);
      return false;
    }
  }

  /**
   * Save session data
   */
  public saveSession(sessionData: any): void {
    try {
      const key = this.prefix + 'session';
      const serializedSession = JSON.stringify({
        ...sessionData,
        timestamp: Date.now()
      });
      this.storage.setItem(key, serializedSession);
      console.log('💾 Saved session data');
    } catch (error) {
      console.error('❌ Failed to save session data:', error);
    }
  }

  /**
   * Load session data
   */
  public loadSession(): any | null {
    try {
      const key = this.prefix + 'session';
      const serializedSession = this.storage.getItem(key);
      
      if (serializedSession) {
        const session = JSON.parse(serializedSession);
        console.log('📂 Loaded session data');
        return session;
      }
    } catch (error) {
      console.error('❌ Failed to load session data:', error);
    }
    
    return null;
  }

  /**
   * Save high scores
   */
  public saveHighScore(gameId: string, score: number, playerName: string = 'Player'): void {
    try {
      const key = this.prefix + 'highscore_' + gameId;
      const existingScores = this.loadHighScores(gameId);
      
      existingScores.push({
        playerName,
        score,
        timestamp: Date.now()
      });
      
      // Sort by score (highest first) and keep top 10
      existingScores.sort((a, b) => b.score - a.score);
      existingScores.splice(10);
      
      this.storage.setItem(key, JSON.stringify(existingScores));
      console.log(`🏆 Saved high score for game: ${gameId}`);
    } catch (error) {
      console.error(`❌ Failed to save high score for game ${gameId}:`, error);
    }
  }

  /**
   * Load high scores
   */
  public loadHighScores(gameId: string): Array<{playerName: string, score: number, timestamp: number}> {
    try {
      const key = this.prefix + 'highscore_' + gameId;
      const serializedScores = this.storage.getItem(key);
      
      if (serializedScores) {
        return JSON.parse(serializedScores);
      }
    } catch (error) {
      console.error(`❌ Failed to load high scores for game ${gameId}:`, error);
    }
    
    return [];
  }

  /**
   * Clear all game data
   */
  public clearAllData(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Find all keys with our prefix
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all found keys
      keysToRemove.forEach(key => this.storage.removeItem(key));
      
      console.log(`🗑️ Cleared ${keysToRemove.length} data entries`);
    } catch (error) {
      console.error('❌ Failed to clear all data:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): {totalKeys: number, totalSize: number} {
    let totalKeys = 0;
    let totalSize = 0;
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          totalKeys++;
          const value = this.storage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
    }
    
    return { totalKeys, totalSize };
  }
}

/**
 * In-memory storage implementation for testing
 */
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();
  
  get length(): number {
    return this.data.size;
  }
  
  clear(): void {
    this.data.clear();
  }
  
  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }
  
  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] || null;
  }
  
  removeItem(key: string): void {
    this.data.delete(key);
  }
  
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}
