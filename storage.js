// Storage keys
const STORAGE_KEYS = {
    PORTFOLIO: 'trading_portfolio',
    BALANCE: 'trading_balance',
    TRANSACTIONS: 'trading_transactions'
};

// Default values
const DEFAULTS = {
    PORTFOLIO: {},
    BALANCE: 10000,
    TRANSACTIONS: []
};

// Save data to localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

// Load data from localStorage
function loadFromStorage(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return defaultValue;
    }
}

// Load all application state
function loadAllData() {
    return {
        portfolio: loadFromStorage(STORAGE_KEYS.PORTFOLIO, { ...DEFAULTS.PORTFOLIO }),
        balance: loadFromStorage(STORAGE_KEYS.BALANCE, DEFAULTS.BALANCE),
        transactions: loadFromStorage(STORAGE_KEYS.TRANSACTIONS, [...DEFAULTS.TRANSACTIONS])
    };
}

// Save all application state
function saveAllData(data) {
    const { portfolio, balance, transactions } = data;
    saveToStorage(STORAGE_KEYS.PORTFOLIO, portfolio || DEFAULTS.PORTFOLIO);
    saveToStorage(STORAGE_KEYS.BALANCE, balance !== undefined ? balance : DEFAULTS.BALANCE);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions || DEFAULTS.TRANSACTIONS);
}

// Clear all saved data
function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// Export the storage API
window.tradingStorage = {
    loadAllData,
    saveAllData,
    clearAllData
};

// For debugging in console
console.log('%cStorage module loaded', 'color: #4CAF50; font-weight: bold;');
