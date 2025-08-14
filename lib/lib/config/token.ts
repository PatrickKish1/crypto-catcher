export interface Token {
    name: string
    symbol: string
    imageUrl: string
    isObstacle: boolean
  }
  
  export interface DifficultyLevel {
    name: string
    speed: number
    spawnRate: number
  }
  
  export const tokens: Token[] = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      imageUrl: "/assets/images/bitcoin-btc-logo.png",
      isObstacle: false,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      imageUrl: "/assets/images/ethereum-eth-logo.png",
      isObstacle: false,
    },
    {
      name: "Solana",
      symbol: "SOL",
      imageUrl: "/assets/images/solana-sol-logo.png",
      isObstacle: false,
    },
    {
      name: "Dogecoin",
      symbol: "DOGE",
      imageUrl: "/assets/images/dogecoin-doge-logo.png",
      isObstacle: false,
    },
    {
      name: "Red Token",
      symbol: "RED",
      imageUrl: "/assets/images/bitcoin-btc-logo.png",
      isObstacle: true,
    },
    {
      name: "Danger Coin",
      symbol: "DANGER",
      imageUrl: "/assets/images/ethereum-eth-logo.png",
      isObstacle: true,
    },
  ]
  
  export const difficultyLevels: DifficultyLevel[] = [
    {
      name: "Easy",
      speed: 3,
      spawnRate: 0.02,
    },
    {
      name: "Medium",
      speed: 5,
      spawnRate: 0.03,
    },
    {
      name: "Hard",
      speed: 7,
      spawnRate: 0.04,
    },
    {
      name: "Expert",
      speed: 10,
      spawnRate: 0.05,
    },
  ]