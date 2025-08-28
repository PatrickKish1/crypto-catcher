import { BaseGame } from '../base/BaseGame';
import { GameState } from '../../types';

/**
 * Classic Snake Game
 * Eat food to grow longer and earn points
 */
export class SnakeGame extends BaseGame {
  // Game constants
  private static readonly GRID_SIZE = 20;
  private static readonly INITIAL_SNAKE_LENGTH = 3;
  private static readonly BASE_SPEED = 150; // milliseconds per move
  
  // Game state
  private snake: Array<{ x: number; y: number }> = [];
  private food: { x: number; y: number } = { x: 0, y: 0 };
  private direction: { x: number; y: number } = { x: 1, y: 0 };
  private nextDirection: { x: number; y: number } = { x: 1, y: 0 };
  private moveTimer: number = 0;
  private speed: number = SnakeGame.BASE_SPEED;
  
  // Game variables
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private lastMoveTime: number = 0;

  constructor() {
    super('snake', 'Snake', 'medium', 'arcade');
  }

  // Override abstract methods
  protected onGetInstructions(): string {
    return 'Use Arrow Keys or WASD to move. Eat the red food to grow and earn points!';
  }

  // Override lifecycle methods
  protected onStart(): void {
    this.initializeGame();
    this.setupControls();
  }

  protected onStop(): void {
    this.removeControls();
  }

  protected onUpdate(deltaTime: number): void {
    this.moveTimer += deltaTime;
    
    if (this.moveTimer >= this.speed) {
      this.moveSnake();
      this.moveTimer = 0;
    }
    
    this.checkCollisions();
  }

  protected onRender(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw grid
    this.drawGrid(ctx);
    
    // Draw snake
    this.drawSnake(ctx);
    
    // Draw food
    this.drawFood(ctx);
    
    // Draw UI
    this.drawUI(ctx);
  }

  protected onCanvasReady(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.gridWidth = Math.floor(canvas.width / SnakeGame.GRID_SIZE);
    this.gridHeight = Math.floor(canvas.height / SnakeGame.GRID_SIZE);
  }

  protected onScoreChanged(score: number): void {
    // Increase speed every 5 points
    if (score > 0 && score % 5 === 0) {
      this.speed = Math.max(50, SnakeGame.BASE_SPEED - (score / 5) * 10);
    }
  }

  // Private methods
  private initializeGame(): void {
    // Initialize snake in the center
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    
    this.snake = [];
    for (let i = 0; i < SnakeGame.INITIAL_SNAKE_LENGTH; i++) {
      this.snake.push({ x: centerX - i, y: centerY });
    }
    
    // Set initial direction
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    
    // Generate first food
    this.generateFood();
    
    // Reset game state
    this.setScore(0);
    this.setLevel(1);
    this.speed = SnakeGame.BASE_SPEED;
    this.moveTimer = 0;
    this.lastMoveTime = 0;
  }

  private setupControls(): void {
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  private removeControls(): void {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  private handleKeyPress(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    
    // Prevent opposite direction movement
    switch (key) {
      case 'arrowup':
      case 'w':
        if (this.direction.y === 0) {
          this.nextDirection = { x: 0, y: -1 };
        }
        break;
      case 'arrowdown':
      case 's':
        if (this.direction.y === 0) {
          this.nextDirection = { x: 0, y: 1 };
        }
        break;
      case 'arrowleft':
      case 'a':
        if (this.direction.x === 0) {
          this.nextDirection = { x: -1, y: 0 };
        }
        break;
      case 'arrowright':
      case 'd':
        if (this.direction.x === 0) {
          this.nextDirection = { x: 1, y: 0 };
        }
        break;
    }
  }

  private moveSnake(): void {
    // Update direction
    this.direction = { ...this.nextDirection };
    
    // Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };
    
    // Check wall collision
    if (newHead.x < 0 || newHead.x >= this.gridWidth || 
        newHead.y < 0 || newHead.y >= this.gridHeight) {
      this.gameOver();
      return;
    }
    
    // Check self collision
    if (this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      this.gameOver();
      return;
    }
    
    // Add new head
    this.snake.unshift(newHead);
    
    // Check if food is eaten
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.addScore(10);
      this.generateFood();
      
      // Level up every 50 points
      if (this.getScore() > 0 && this.getScore() % 50 === 0) {
        this.setLevel(this.getLevel() + 1);
      }
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }
  }

  private generateFood(): void {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      };
    } while (this.snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    ));
    
    this.food = newFood;
  }

  private checkCollisions(): void {
    // Collisions are checked in moveSnake method
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= this.gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * SnakeGame.GRID_SIZE, 0);
      ctx.lineTo(x * SnakeGame.GRID_SIZE, ctx.canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= this.gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * SnakeGame.GRID_SIZE);
      ctx.lineTo(ctx.canvas.width, y * SnakeGame.GRID_SIZE);
      ctx.stroke();
    }
  }

  private drawSnake(ctx: CanvasRenderingContext2D): void {
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = '#27ae60';
      } else {
        // Body
        ctx.fillStyle = '#2ecc71';
      }
      
      ctx.fillRect(
        segment.x * SnakeGame.GRID_SIZE + 1,
        segment.y * SnakeGame.GRID_SIZE + 1,
        SnakeGame.GRID_SIZE - 2,
        SnakeGame.GRID_SIZE - 2
      );
    });
  }

  private drawFood(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(
      this.food.x * SnakeGame.GRID_SIZE + 2,
      this.food.y * SnakeGame.GRID_SIZE + 2,
      SnakeGame.GRID_SIZE - 4,
      SnakeGame.GRID_SIZE - 4
    );
  }

  private drawUI(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    // Score
    ctx.fillText(`Score: ${this.getScore()}`, 10, 25);
    
    // Level
    ctx.fillText(`Level: ${this.getLevel()}`, 10, 45);
    
    // Snake length
    ctx.fillText(`Length: ${this.snake.length}`, 10, 65);
    
    // Time until next game switch
    const timeLeft = Math.max(0, 60 - Math.floor((Date.now() - this.lastMoveTime) / 1000));
    ctx.fillText(`Next Game: ${timeLeft}s`, 10, 85);
  }

  // Override state management to include custom data
  public getState(): GameState {
    const baseState = super.getState();
    return {
      ...baseState,
      customData: {
        snake: [...this.snake],
        food: { ...this.food },
        direction: { ...this.direction },
        speed: this.speed
      }
    };
  }

  public setState(state: GameState): void {
    super.setState(state);
    
    if (state.customData) {
      this.snake = [...state.customData.snake];
      this.food = { ...state.customData.food };
      this.direction = { ...state.customData.direction };
      this.speed = state.customData.speed;
    }
  }
}
