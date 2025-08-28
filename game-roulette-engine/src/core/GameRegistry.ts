import { GameInterface } from '../types';

/**
 * Manages the registry of available games
 */
export class GameRegistry {
  private games: Map<string, GameInterface> = new Map();
  private gameCategories: Map<string, GameInterface[]> = new Map();

  /**
   * Register a new game
   */
  public registerGame(game: GameInterface): void {
    this.games.set(game.id, game);
    
    // Add to category
    if (!this.gameCategories.has(game.category)) {
      this.gameCategories.set(game.category, []);
    }
    this.gameCategories.get(game.category)!.push(game);
    
    console.log(`🎮 Registered game: ${game.name} (${game.category})`);
  }

  /**
   * Unregister a game
   */
  public unregisterGame(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (game) {
      // Remove from category
      const categoryGames = this.gameCategories.get(game.category);
      if (categoryGames) {
        const index = categoryGames.findIndex(g => g.id === gameId);
        if (index > -1) {
          categoryGames.splice(index, 1);
        }
      }
      
      // Remove from main registry
      this.games.delete(gameId);
      console.log(`🎮 Unregistered game: ${game.name}`);
      return true;
    }
    return false;
  }

  /**
   * Get a game by ID
   */
  public getGame(gameId: string): GameInterface | null {
    return this.games.get(gameId) || null;
  }

  /**
   * Get all games
   */
  public getAllGames(): GameInterface[] {
    return Array.from(this.games.values());
  }

  /**
   * Get games by category
   */
  public getGamesByCategory(category: string): GameInterface[] {
    return this.gameCategories.get(category) || [];
  }

  /**
   * Get games by difficulty
   */
  public getGamesByDifficulty(difficulty: string): GameInterface[] {
    return this.getAllGames().filter(game => game.difficulty === difficulty);
  }

  /**
   * Get total number of games
   */
  public getTotalGames(): number {
    return this.games.size;
  }

  /**
   * Get available categories
   */
  public getCategories(): string[] {
    return Array.from(this.gameCategories.keys());
  }

  /**
   * Get random game
   */
  public getRandomGame(): GameInterface | null {
    const games = this.getAllGames();
    if (games.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
  }

  /**
   * Get random game by category
   */
  public getRandomGameByCategory(category: string): GameInterface | null {
    const games = this.getGamesByCategory(category);
    if (games.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
  }

  /**
   * Check if game exists
   */
  public hasGame(gameId: string): boolean {
    return this.games.has(gameId);
  }

  /**
   * Clear all games
   */
  public clear(): void {
    this.games.clear();
    this.gameCategories.clear();
    console.log('🎮 Cleared all games from registry');
  }
}
