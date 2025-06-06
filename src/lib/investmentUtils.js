import { formatUnits, parseUnits } from 'viem';

// PulseChain-spezifische Konstanten
export const PULSECHAIN_CHAIN_ID = 369;
export const PLS_DECIMALS = 18;
export const PLS_SYMBOL = 'PLS';

// Token-Adressen auf PulseChain
export const TOKEN_ADDRESSES = {
  PLS: '0x0000000000000000000000000000000000000000', // Native PLS
  WPLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', // Wrapped PLS
  HEX: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', // HEX auf PulseChain
  INC: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', // INC auf PulseChain
  // Weitere Token-Adressen hier hinzufügen
};

// Preis-Formatierung für PulseChain
export const formatPrice = (price, decimals = PLS_DECIMALS) => {
  try {
    return formatUnits(BigInt(price), decimals);
  } catch (error) {
    console.error('Error formatting price:', error);
    return '0';
  }
};

// Menge-Formatierung für PulseChain
export const formatAmount = (amount, decimals = PLS_DECIMALS) => {
  try {
    return formatUnits(BigInt(amount), decimals);
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0';
  }
};

// ROI-Berechnung für PulseChain-Investments
export const calculateROI = (purchasePrice, currentPrice, quantity) => {
  try {
    const purchaseValue = parseFloat(purchasePrice) * parseFloat(quantity);
    const currentValue = parseFloat(currentPrice) * parseFloat(quantity);
    const roi = ((currentValue - purchaseValue) / purchaseValue) * 100;
    return roi.toFixed(2);
  } catch (error) {
    console.error('Error calculating ROI:', error);
    return '0';
  }
};

// Gewinn/Verlust-Berechnung für PulseChain-Investments
export const calculateProfitLoss = (purchasePrice, currentPrice, quantity) => {
  try {
    const purchaseValue = parseFloat(purchasePrice) * parseFloat(quantity);
    const currentValue = parseFloat(currentPrice) * parseFloat(quantity);
    return (currentValue - purchaseValue).toFixed(2);
  } catch (error) {
    console.error('Error calculating profit/loss:', error);
    return '0';
  }
};

// Token-Validierung für PulseChain
export const isValidTokenAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// PLS zu USD Konvertierung
export const convertPlsToUsd = (plsAmount, plsPrice) => {
  try {
    return (parseFloat(plsAmount) * parseFloat(plsPrice)).toFixed(2);
  } catch (error) {
    console.error('Error converting PLS to USD:', error);
    return '0';
  }
};

// USD zu PLS Konvertierung
export const convertUsdToPls = (usdAmount, plsPrice) => {
  try {
    return (parseFloat(usdAmount) / parseFloat(plsPrice)).toFixed(PLS_DECIMALS);
  } catch (error) {
    console.error('Error converting USD to PLS:', error);
    return '0';
  }
};

// Token-Metadaten für PulseChain
export const getTokenMetadata = (tokenAddress) => {
  const token = Object.entries(TOKEN_ADDRESSES).find(
    ([_, address]) => address.toLowerCase() === tokenAddress.toLowerCase()
  );
  
  if (token) {
    return {
      symbol: token[0],
      address: token[1],
      decimals: PLS_DECIMALS
    };
  }
  
  return null;
};

// Steuerrelevante Berechnungen für PulseChain
export const calculateTaxInfo = (transactions) => {
  let totalProfit = 0;
  let totalLoss = 0;
  let holdingPeriod = 0;

  transactions.forEach(tx => {
    const profit = parseFloat(tx.profit || 0);
    if (profit > 0) {
      totalProfit += profit;
    } else {
      totalLoss += Math.abs(profit);
    }

    // Berechnung der Haltedauer
    const purchaseDate = new Date(tx.purchaseDate);
    const currentDate = new Date();
    const daysHeld = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24));
    holdingPeriod = Math.max(holdingPeriod, daysHeld);
  });

  return {
    totalProfit: totalProfit.toFixed(2),
    totalLoss: totalLoss.toFixed(2),
    netProfit: (totalProfit - totalLoss).toFixed(2),
    holdingPeriod,
    isLongTerm: holdingPeriod > 365 // Langfristig wenn > 1 Jahr
  };
};

export const formatDisplayDate = (dateString, locale = 'default') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

export const formatPercentage = (number, decimals = 2) => {
  if (number === null || number === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number / 100);
};

export const calculateTotalInvestment = (investments) => {
  return investments.reduce((total, investment) => {
    return total + (parseFloat(investment.purchase_price) || 0);
  }, 0);
};

export const calculateTotalCurrentValue = (investments) => {
  return investments.reduce((total, investment) => {
    return total + (parseFloat(investment.current_value) || 0);
  }, 0);
};

export const calculateTotalROI = (investments) => {
  const totalPurchasePrice = calculateTotalInvestment(investments);
  const totalCurrentValue = calculateTotalCurrentValue(investments);
  return calculateROI(totalPurchasePrice, totalCurrentValue);
};

export const calculateTotalProfitLoss = (investments) => {
  const totalPurchasePrice = calculateTotalInvestment(investments);
  const totalCurrentValue = calculateTotalCurrentValue(investments);
  return calculateProfitLoss(totalPurchasePrice, totalCurrentValue);
};

export const groupInvestmentsBySymbol = (investments) => {
  return investments.reduce((groups, investment) => {
    const symbol = investment.symbol || 'Unknown';
    if (!groups[symbol]) {
      groups[symbol] = [];
    }
    groups[symbol].push(investment);
    return groups;
  }, {});
};

export const calculateAveragePurchasePrice = (investments) => {
  if (!investments.length) return 0;
  const totalQuantity = investments.reduce((sum, inv) => sum + (parseFloat(inv.quantity) || 0), 0);
  const totalValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.purchase_price) || 0), 0);
  return totalQuantity ? totalValue / totalQuantity : 0;
};

export const calculateAverageCurrentPrice = (investments) => {
  if (!investments.length) return 0;
  const totalQuantity = investments.reduce((sum, inv) => sum + (parseFloat(inv.quantity) || 0), 0);
  const totalValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.current_value) || 0), 0);
  return totalQuantity ? totalValue / totalQuantity : 0;
};

export const sortInvestmentsByROI = (investments, ascending = false) => {
  return [...investments].sort((a, b) => {
    const roiA = calculateROI(a.purchase_price, a.current_value);
    const roiB = calculateROI(b.purchase_price, b.current_value);
    return ascending ? roiA - roiB : roiB - roiA;
  });
};

export const sortInvestmentsByProfitLoss = (investments, ascending = false) => {
  return [...investments].sort((a, b) => {
    const profitLossA = calculateProfitLoss(a.purchase_price, a.current_value);
    const profitLossB = calculateProfitLoss(b.purchase_price, b.current_value);
    return ascending ? profitLossA - profitLossB : profitLossB - profitLossA;
  });
};

export const filterInvestmentsByDateRange = (investments, startDate, endDate) => {
  return investments.filter(investment => {
    const purchaseDate = new Date(investment.purchase_date);
    return purchaseDate >= startDate && purchaseDate <= endDate;
  });
};

export const filterInvestmentsBySymbol = (investments, symbol) => {
  return investments.filter(investment => 
    investment.symbol?.toLowerCase() === symbol.toLowerCase()
  );
};

export const validateInvestmentData = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!data.purchase_date) {
    errors.purchase_date = 'Purchase date is required';
  } else {
    const date = new Date(data.purchase_date);
    if (isNaN(date.getTime())) {
      errors.purchase_date = 'Invalid date format';
    }
  }
  
  if (isNaN(parseFloat(data.purchase_price)) || parseFloat(data.purchase_price) < 0) {
    errors.purchase_price = 'Purchase price must be a non-negative number';
  }
  
  if (isNaN(parseFloat(data.current_value)) || parseFloat(data.current_value) < 0) {
    errors.current_value = 'Current value must be a non-negative number';
  }
  
  if (data.quantity && (isNaN(parseFloat(data.quantity)) || parseFloat(data.quantity) <= 0)) {
    errors.quantity = 'Quantity must be a positive number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatInputDate = (dateString) => {
  if (!dateString) return '';
  // Assuming dateString is from DB (could be ISO with time)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  // Format as YYYY-MM-DD for <input type="date">
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseInputDate = (dateString) => {
  // Input date is YYYY-MM-DD, which is fine for Supabase 'date' type
  return dateString; 
};