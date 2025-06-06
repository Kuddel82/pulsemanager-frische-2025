// Cache invalidation - 2024-03-19
/* global BigInt */
import { ethers } from 'ethers';
import { dbService } from './dbService';
import { retryOperation, retryStrategies } from './retryService';
import { logger } from './logger';
import { supabase } from '@/lib/supabaseClient';

const PULSECHAIN_SCAN_API_URL = 'https://scan.pulsechain.com/api';
const PULSECHAIN_RPC_URL = 'https://rpc.pulsechain.com';
const PLS_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

class TransactionServiceError extends Error {
  constructor(message, type = 'GENERIC_ERROR') {
    super(message);
    this.name = 'TransactionServiceError';
    this.type = type;
  }
}

const getPulseChainProvider = () => {
  try {
    return new ethers.providers.JsonRpcProvider(PULSECHAIN_RPC_URL);
  } catch (error) {
    logger.error('Failed to create PulseChain JsonRpcProvider:', error);
    throw new TransactionServiceError('Could not connect to PulseChain RPC', 'RPC_CONNECTION_ERROR');
  }
};

export const fetchTransactionHistory = async (address, startBlock = 0, userId) => {
  if (!address || !userId) {
    logger.error('fetchTransactionHistory: Wallet address or userId is missing.');
    throw new TransactionServiceError('Wallet address or user ID is required.', 'VALIDATION_ERROR');
  }

  return retryOperation(
    async () => {
      const provider = getPulseChainProvider();
      let currentBlock;
      try {
        currentBlock = await provider.getBlockNumber();
      } catch (error) {
        logger.error('Failed to get current block number from PulseChain RPC:', error);
        throw new TransactionServiceError('Could not fetch current block number.', 'RPC_ERROR');
      }

      const commonQueryParams = `&address=${address}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc`;
      
      let tokenTxUrl = `${PULSECHAIN_SCAN_API_URL}?module=account&action=tokentx${commonQueryParams}`;
      let plsTxUrl = `${PULSECHAIN_SCAN_API_URL}?module=account&action=txlist${commonQueryParams}`;
      
      logger.debug(`Fetching token transactions from: ${tokenTxUrl}`);
      logger.debug(`Fetching PLS transactions from: ${plsTxUrl}`);

      const [tokenTxResponse, plsTxResponse] = await Promise.all([
        fetch(tokenTxUrl),
        fetch(plsTxUrl)
      ]);

      if (!tokenTxResponse.ok) {
        const errorText = await tokenTxResponse.text();
        logger.error(`PulseChain Scan API error (tokentx): ${tokenTxResponse.status} ${errorText}`);
        throw new TransactionServiceError(`PulseChain Scan API error (tokentx): ${tokenTxResponse.status}`, 'API_ERROR');
      }
      if (!plsTxResponse.ok) {
        const errorText = await plsTxResponse.text();
        logger.error(`PulseChain Scan API error (txlist): ${plsTxResponse.status} ${errorText}`);
        throw new TransactionServiceError(`PulseChain Scan API error (txlist): ${plsTxResponse.status}`, 'API_ERROR');
      }

      const tokenTxData = await tokenTxResponse.json();
      const plsTxData = await plsTxResponse.json();

      if (tokenTxData.status !== "1" && tokenTxData.message !== "No transactions found") {
         logger.warn(`PulseChain Scan API (tokentx) non-success message: ${tokenTxData.message}`, tokenTxData);
      }
      if (plsTxData.status !== "1" && plsTxData.message !== "No transactions found") {
         logger.warn(`PulseChain Scan API (txlist) non-success message: ${plsTxData.message}`, plsTxData);
      }

      const transfers = Array.isArray(tokenTxData.result) ? tokenTxData.result : [];
      const plsTransfers = Array.isArray(plsTxData.result) ? plsTxData.result : [];
      
      logger.info(`Fetched ${transfers.length} token transactions and ${plsTransfers.length} PLS transactions for address ${address}`);

      const processedTransactions = [
        ...transfers.map(tx => {
          const amount = ethers.utils.formatUnits(tx.value, parseInt(tx.tokenDecimal || "18"));
          const gasFee = (tx.gasUsed && tx.gasPrice) ? ethers.utils.formatUnits((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), 'ether') : '0';
          return {
            user_id: userId,
            asset_symbol: tx.tokenSymbol || 'Unknown',
            asset_name: tx.tokenName || tx.tokenSymbol || 'Unknown Token',
            transaction_date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            transaction_type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
            amount: parseFloat(amount),
            price_usd: parseFloat(tx.price || '0'),
            total_value_usd: parseFloat(amount) * parseFloat(tx.price || '0'),
            notes: `Token Transfer: ${tx.tokenName || tx.tokenSymbol}`,
            wallet_address: address,
            transaction_hash: tx.hash,
            token_address: tx.contractAddress,
            from_address: tx.from,
            to_address: tx.to,
            gas_used: gasFee,
            block_number: parseInt(tx.blockNumber)
          };
        }),
        ...plsTransfers
          .filter(tx => parseFloat(ethers.utils.formatEther(tx.value)) > 0) 
          .map(tx => {
            const amount = ethers.utils.formatEther(tx.value);
            const gasFee = (tx.gasUsed && tx.gasPrice) ? ethers.utils.formatUnits((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), 'ether') : '0';
            return {
              user_id: userId,
              asset_symbol: 'PLS',
              asset_name: 'PulseChain',
              transaction_date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
              transaction_type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
              amount: parseFloat(amount),
              price_usd: parseFloat(tx.price || '0'), 
              total_value_usd: parseFloat(amount) * parseFloat(tx.price || '0'),
              notes: 'PLS Transfer',
              wallet_address: address,
              transaction_hash: tx.hash,
              token_address: PLS_CONTRACT_ADDRESS,
              from_address: tx.from,
              to_address: tx.to,
              gas_used: gasFee,
              block_number: parseInt(tx.blockNumber)
            };
        })
      ];
      
      const uniqueTransactions = Array.from(new Map(processedTransactions.map(tx => [tx.transaction_hash, tx])).values());

      logger.info(`Processed ${uniqueTransactions.length} unique transactions for address ${address}`);

      if (uniqueTransactions.length > 0) {
        const taxEntriesToSync = uniqueTransactions.map(tx => ({
          user_id: tx.user_id,
          asset_symbol: tx.asset_symbol,
          asset_name: tx.asset_name,
          transaction_date: tx.transaction_date,
          transaction_type: tx.transaction_type, 
          amount: tx.amount,
          price_usd: tx.price_usd, 
          total_value_usd: tx.total_value_usd, 
          notes: tx.notes,
          wallet_address: tx.wallet_address,
          transaction_hash: tx.transaction_hash, 
          from_address: tx.from_address,
          to_address: tx.to_address,
          gas_fee_native: tx.gas_used, 
          block_number: tx.block_number
        }));
        
        logger.debug(`Calling dbService.syncTaxEntries with ${taxEntriesToSync.length} entries.`);
        const { error: syncError } = await dbService.syncTaxEntries(userId, taxEntriesToSync);
        if (syncError) {
          logger.error('Failed to sync transactions with dbService.syncTaxEntries:', syncError);
          throw new TransactionServiceError('Failed to sync transactions to database.', 'DB_SYNC_ERROR');
        }
        logger.info(`Successfully synced ${taxEntriesToSync.length} transactions to tax_entries table.`);
      } else {
        logger.info('No new transactions to sync for tax_entries.');
      }
      
      return uniqueTransactions; 
    },
    {
      ...retryStrategies.network, 
      maxRetries: 3,
      retryDelay: 2000, 
      onRetry: (error, attempt) => {
        logger.warn(`fetchTransactionHistory: Retry attempt ${attempt} after error: ${error.message}`, { originalError: error.originalError || error });
      }
    }
  );
};