/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Address, createPublicClient, http, type Hash, keccak256 } from 'viem';
import { baseSepolia } from 'viem/chains';
import { ABI } from './abi.config';

const CLAIMS_CONTRACT = process.env.CLAIMS_CONTRACT_ADDRESS as `0x${string}`;
const USDC_CONTRACT = process.env.USDC_CONTRACT_ADDRESS as `0x${string}`;

// Initialize public client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

interface BalanceResponse {
  value: bigint;
}

// Read USDC balance
export const getUSDCBalance = async (walletAddress: Address): Promise<bigint> => {
  return publicClient.readContract({
    address: USDC_CONTRACT,
    abi: ['function balanceOf(address) view returns (uint256)'],
    functionName: 'balanceOf',
    args: [walletAddress]
  }) as Promise<bigint>;
};

// Calculate potential reward before claiming
export const calculateReward = async (points: number, walletAddress: Address) => {
  const reward = await publicClient.readContract({
    address: CLAIMS_CONTRACT,
    abi: ABI,
    functionName: 'calculateReward',
    args: [points]
  });

  return reward;
};

// Claim rewards
export const claimRewards = async (points: number, walletAddress: Address) => {
  try {
    // Read current USDC balance before claim
    const prevBalance = await publicClient.readContract({
      address: USDC_CONTRACT,
      abi: ['function balanceOf(address) view returns (uint256)'],
      functionName: 'balanceOf',
      args: [walletAddress]
    }) as bigint;

    // Execute claim transaction
    const hash = await publicClient.readContract({
      address: CLAIMS_CONTRACT,
      abi: ABI,
      functionName: 'claimRewards',
      args: [points],
      account: walletAddress
    });

    // Create event filter for ClaimMade event
    const filter = await publicClient.createContractEventFilter({
      address: CLAIMS_CONTRACT,
      abi: ABI,
      eventName: 'ClaimMade',
      fromBlock: 'latest'
    });

    // Get logs from the filter
    const logs = await publicClient.getFilterLogs({
      filter
    });

    // Check if claim was successful by comparing USDC balances
    const newBalance = await publicClient.readContract({
      address: USDC_CONTRACT,
      abi: ['function balanceOf(address) view returns (uint256)'],
      functionName: 'balanceOf',
      args: [walletAddress]
    }) as bigint;

    return {
      hash,
      success: newBalance > prevBalance,
      logs
    };
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};

// Function to find event by name in ABI
const findEventSignature = (eventName: string): string => {
  const event = ABI.find(item => 
    item.type === 'event' && item.name === eventName
  );
  
  if (!event || !('name' in event) || !('inputs' in event)) {
    throw new Error(`Event ${eventName} not found in ABI`);
  }
  
  // Create event signature manually
  const inputTypes = (event.inputs as Array<{type: string}>)
    .map(input => input.type)
    .join(',');
  
  return `${event.name}(${inputTypes})`;
};

// Execute the claim transaction
export const executeClaimTransaction = async (
  points: number,
  walletClient: any
): Promise<Hash> => {
  try {
    const txHash = await walletClient.writeContract({
      address: CLAIMS_CONTRACT,
      abi: ABI,
      functionName: 'claimRewards',
      args: [points],
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash
    });

    // Check for ClaimMade event in the receipt logs using manual signature matching
    const claimEventSignature = findEventSignature('ClaimMade');
    const eventHash = keccak256(`0x${claimEventSignature}`);
    
    const claimEvent = receipt.logs.find(log => 
      log.topics[0] === eventHash
    );

    if (!claimEvent) {
      throw new Error('Claim transaction failed - no ClaimMade event found');
    }

    return txHash;
  } catch (error) {
    console.error('Error executing claim transaction:', error);
    throw error;
  }
};