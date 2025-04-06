// utils/contracts.js
export const WC_ADDRESS = "0xDD175A3998D81C3Ef51aBB9c1Eab2D7a8C795F68";
export const SONIC_ADDRESS = "0xfc00000000000000000000000000000000000000";
export const CATSWAP_CONTRACT = "0x7c2dbfc3b50605b5c498fec331f4b4f77d2b9822";

export const ABI = [
  "function swapWcToSonic(uint256 wcAmount) external",
  "function swapSonicToWc(uint256 sonicAmount) external",
  "function getPrice(uint256 inputAmount, bool isWcToSonic) public view returns (uint256)",
  "function addLiquidity(uint256 wcAmount, uint256 sonicAmount) external",
  "function removeLiquidity(uint256 lpAmount) external",
  "function balanceOf(address owner) external view returns (uint256)"
];

export const ERC20_ABI = [
  "function approve(address,uint256) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
