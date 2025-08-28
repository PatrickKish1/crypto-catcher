# 🎰 Game Roulette Engine

A lightweight, wallet-free gaming framework that randomly switches between games every minute, creating an unpredictable and engaging gaming experience.

## 🌟 Overview

The Game Roulette Engine is a **browser-based gaming platform** that:
- **Randomly selects games** from a pool every 60 seconds
- **Automatically saves game state** when switching
- **Resumes games seamlessly** when you return to them
- **Supports any game type** that implements the standard interface
- **No wallet required** - pure gaming fun!

## 🎮 Supported Game Types

### Arcade Games (Current Focus)
- **Snake** - Classic snake game with growing mechanics
- **Tetris** - Block stacking puzzle game
- **Pong** - Simple paddle and ball game
- **Space Invaders** - Shoot 'em up style game

### Game Interface Requirements
All games must implement:
```typescript
interface GameInterface {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  getState(): GameState;
  setState(state: GameState): void;
  start(): void;
  pause(): void;
  resume(): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

## 🏗️ Architecture

### Core Components
1. **GameRouletteEngine** - Main orchestrator
2. **GameManager** - Handles game switching and state management
3. **GameRegistry** - Manages available games
4. **StateManager** - Handles game state persistence
5. **TimerManager** - Manages the 60-second countdown

### File Structure
```
game-roulette-engine/
├── src/
│   ├── core/
│   │   ├── GameRouletteEngine.ts
│   │   ├── GameManager.ts
│   │   ├── GameRegistry.ts
│   │   ├── StateManager.ts
│   │   └── TimerManager.ts
│   ├── games/
│   │   ├── base/
│   │   │   └── BaseGame.ts
│   │   ├── snake/
│   │   │   ├── SnakeGame.ts
│   │   │   └── SnakeGame.sol
│   │   ├── tetris/
│   │   │   ├── TetrisGame.ts
│   │   │   └── TetrisGame.sol
│   │   └── pong/
│   │       ├── PongGame.ts
│   │       └── PongGame.sol
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── random.ts
├── examples/
│   └── demo.html
└── README.md
```

## 🚀 Getting Started

### 1. Basic Usage
```typescript
import { GameRouletteEngine } from './src/core/GameRouletteEngine';

const engine = new GameRouletteEngine();
engine.start();
```

### 2. Add Your Own Game
```typescript
import { BaseGame } from './src/games/base/BaseGame';

class MyGame extends BaseGame {
  constructor() {
    super('my-game', 'My Awesome Game', 'medium');
  }
  
  start() {
    // Initialize your game
  }
  
  update(deltaTime: number) {
    // Update game logic
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // Render your game
  }
}

// Register your game
engine.registerGame(new MyGame());
```

### 3. Game State Management
```typescript
// Your game state
interface MyGameState {
  score: number;
  level: number;
  playerPosition: { x: number; y: number };
}

// Save state
this.setState({
  score: 100,
  level: 2,
  playerPosition: { x: 50, y: 50 }
});

// Load state
const state = this.getState();
this.score = state.score;
this.level = state.level;
```

## 🎯 Features

### Core Features
- **Random Game Selection** - Uses seeded randomness for fair selection
- **Automatic State Saving** - Preserves progress across game switches
- **Seamless Transitions** - Smooth game switching with loading screens
- **Difficulty Scaling** - Games adapt based on player performance
- **Progress Tracking** - Monitor your performance across all games

### Advanced Features
- **Game Categories** - Group games by type (arcade, puzzle, action)
- **Performance Analytics** - Track scores and improvement over time
- **Achievement System** - Unlock achievements across multiple games
- **Leaderboards** - Compare scores with other players
- **Custom Game Pools** - Create themed roulette sessions

## 🔧 Configuration

### Engine Settings
```typescript
const config = {
  gameSwitchInterval: 60000, // 60 seconds
  statePersistence: 'localStorage', // or 'sessionStorage'
  enableAnalytics: true,
  defaultDifficulty: 'medium',
  maxGamesInPool: 10
};
```

### Game Settings
```typescript
const gameConfig = {
  canvasWidth: 800,
  canvasHeight: 600,
  targetFPS: 60,
  enableSound: true,
  difficultyMultiplier: 1.0
};
```

## 📱 Integration

### Web App Integration
```html
<!DOCTYPE html>
<html>
<head>
  <title>Game Roulette</title>
</head>
<body>
  <div id="game-container"></div>
  <script type="module">
    import { GameRouletteEngine } from './src/core/GameRouletteEngine.js';
    
    const engine = new GameRouletteEngine('#game-container');
    engine.start();
  </script>
</body>
</html>
```

### React Integration
```tsx
import React, { useEffect, useRef } from 'react';
import { GameRouletteEngine } from './game-roulette-engine';

function GameRouletteComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameRouletteEngine | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      engineRef.current = new GameRouletteEngine(containerRef.current);
      engineRef.current.start();
    }

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  return <div ref={containerRef} className="game-container" />;
}
```

## 🎲 Game Examples

### Snake Game
- **Objective**: Eat food to grow longer
- **Controls**: Arrow keys or WASD
- **Scoring**: Points for each food eaten
- **Difficulty**: Speed increases with length

### Tetris Game
- **Objective**: Clear lines by stacking blocks
- **Controls**: Arrow keys for movement, space for rotation
- **Scoring**: Points for line clears
- **Difficulty**: Speed increases with level

### Pong Game
- **Objective**: Beat the AI opponent
- **Controls**: Up/down arrow keys
- **Scoring**: First to 11 points wins
- **Difficulty**: AI speed and accuracy

## 🔮 Future Enhancements

- **Multiplayer Support** - Play with friends
- **Mobile Optimization** - Touch controls and responsive design
- **Game Mods** - Custom game variations
- **Social Features** - Share scores and achievements
- **Tournament Mode** - Competitive gaming sessions
- **AI Opponents** - Smart computer players

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement your game** following the interface
4. **Add tests** for your game
5. **Submit a pull request**

## 📄 License

MIT License - feel free to use in your own projects!

---

**🎰 Ready to spin the wheel and discover your next gaming adventure?** 🎮
