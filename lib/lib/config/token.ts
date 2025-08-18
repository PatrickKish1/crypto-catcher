export interface Token {
  symbol: string
  name: string
  imageUrl: string
  isObstacle: boolean
  value: number
}

export interface DifficultyLevel {
  name: string
  speed: number
  spawnRate: number
  multiplier: number
}

export const tokens: Token[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    imageUrl: '/assets/images/bitcoin-btc-logo.png',
    isObstacle: false,
    value: 100
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    imageUrl: '/assets/images/ethereum-eth-logo.png',
    isObstacle: false,
    value: 80
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    imageUrl: '/assets/images/solana-sol-logo.png',
    isObstacle: false,
    value: 40
  },
  {
    symbol: 'DOGE',
    name: 'DOGE COIN',
    imageUrl: '/assets/images/dogecoin-doge-logo.png',
    isObstacle: false,
    value: 30
  },
  {
    name: "Red Token",
    symbol: "RED",
    imageUrl: "/assets/images/bitcoin-btc-logo.png",
    isObstacle: true,
    value: -100
  },
  {
    symbol: 'BOMB',
    name: 'Bomb Token',
    imageUrl: '/assets/images/ethereum-eth-logo.png',
    isObstacle: true,
    value: -100
  }
]

export const difficultyLevels: DifficultyLevel[] = [
  {
    name: 'Easy',
    speed: 2,
    spawnRate: 0.02,
    multiplier: 1.0
  },
  {
    name: 'Medium',
    speed: 3,
    spawnRate: 0.03,
    multiplier: 1.2
  },
  {
    name: 'Hard',
    speed: 4,
    spawnRate: 0.04,
    multiplier: 1.5
  },
  {
    name: 'Expert',
    speed: 5,
    spawnRate: 0.05,
    multiplier: 2.0
  }
]