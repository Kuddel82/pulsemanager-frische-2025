import { logger } from '@/lib/logger';

// Build cache fix - ensure named import is recognized
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 Sekunde

export class RetryError extends Error {
    constructor(message, originalError, attempts) {
        super(message);
        this.name = 'RetryError';
        this.originalError = originalError;
        this.attempts = attempts;
    }
}

export const retryOperation = async (
    operation,
    {
        maxRetries = DEFAULT_MAX_RETRIES,
        retryDelay = DEFAULT_RETRY_DELAY,
        shouldRetry = (error) => true, // Default: retry on any error
        onRetry = (error, attempt) => logger.warn(`Retry attempt ${attempt} after error: ${error.message}`, { originalError: error })
    } = {}
) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries || !shouldRetry(error)) {
                logger.error(`Operation failed after ${attempt} attempts. Error: ${error.message}`, { originalError: error, attempts: attempt });
                throw new RetryError(
                    `Operation failed after ${attempt} attempts: ${error.message}`,
                    error,
                    attempt
                );
            }
            
            onRetry(error, attempt);
            // Exponential backoff could be an option here, but linear for now.
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); 
        }
    }
    
    // This line should ideally not be reached if maxRetries > 0, 
    // as the loop's throw or return should exit.
    // However, to satisfy linters and ensure an error is thrown:
    if (lastError) {
        logger.error(`Operation ultimately failed. Last error: ${lastError.message}`, { originalError: lastError });
        throw lastError;
    }
    // Fallback for an unexpected scenario where lastError is not set (should not happen with typical operation flow)
    throw new Error("Operation failed due to an unexpected issue in retry logic.");
};

export const retryStrategies = {
    network: {
        shouldRetry: (error) => {
            const msg = error.message.toLowerCase();
            return msg.includes('network error') || 
                   msg.includes('failed to fetch') || 
                   msg.includes('timeout') ||
                   msg.includes('connreset') || // ECONNRESET
                   msg.includes('econnrefused'); // ECONNREFUSED
        },
        maxRetries: 5,
        retryDelay: 2000 
    },
    
    database: {
        shouldRetry: (error) => {
            const msg = error.message.toLowerCase();
            // Supabase specific errors might need more detailed checks based on error codes if available
            return msg.includes('deadlock') ||
                   msg.includes('connection') || // Generic connection issues
                   msg.includes('timeout') || // Request timeout
                   error.code === 'PGRST_01' || // PostgREST error: connection error
                   (error.details && error.details.toLowerCase().includes('timed out')); 
        },
        maxRetries: 3,
        retryDelay: 1500 
    },
    
    api: {
        shouldRetry: (error) => {
            const status = error.response?.status || error.status; // error.status for Supabase client errors
            return status === 429 || // Rate limit
                   status === 502 || // Bad Gateway
                   status === 503 || // Service unavailable
                   status === 504;   // Gateway timeout
        },
        maxRetries: 4,
        retryDelay: 2000
    },

    supabaseFunction: {
      shouldRetry: (error) => {
        const status = error.context?.status; // Supabase function invocation error structure
        const msg = error.message?.toLowerCase();
        return status === 429 || // Rate limit
               status === 502 || // Bad Gateway
               status === 503 || // Service unavailable
               status === 504 || // Gateway timeout
               (msg && (msg.includes('function timed out') || msg.includes('network error')));
      },
      maxRetries: 3,
      retryDelay: 1500
    }
};