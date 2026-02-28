/**
 * Contract configuration and ABI for the PassItOn smart contract.
 * Used by all frontend components to interact with the blockchain.
 */

// Base Mainnet chain ID
export const BASE_CHAIN_ID = 8453;

// Base Sepolia (testnet) chain ID — for development
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Deploy address — update after deployment
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

// Backend API URL
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Full ABI for frontend interactions
export const CONTRACT_ABI = [
  // Write functions
  "function mintNFT(address to) external returns (uint256 tokenId)",
  "function passNFT(address to, uint256 tokenId) external",
  "function claimLost(uint256 tokenId) external",

  // Read functions
  "function getNFTStatus(uint256 tokenId) external view returns (address owner, uint64 deadline, uint32 passCount, uint32 chainLength, bool alive, uint256 timeRemaining)",
  "function getLeaderboard() external view returns (uint256, uint32, uint256, uint32, uint256, uint32)",
  "function totalMinted() external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",

  // Events
  "event NFTMinted(uint256 indexed tokenId, address indexed to, uint64 deadline)",
  "event NFTPassed(uint256 indexed tokenId, address indexed from, address indexed to, uint32 passCount, uint32 chainLength, uint64 newDeadline)",
  "event NFTLost(uint256 indexed tokenId, address indexed lastHolder, uint32 finalPassCount, uint32 finalChainLength)",
  "event TimerReset(uint256 indexed tokenId, uint64 newDeadline)",
] as const;

// Base Mainnet network config for wallet providers
export const BASE_NETWORK = {
  chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
  chainName: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

// Base Sepolia network config for testing
export const BASE_SEPOLIA_NETWORK = {
  chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};
