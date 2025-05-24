/**
 * Enhanced Live Update System for Trading Simulator
 * This module provides a more robust implementation of live updates
 * with improved reliability and debugging features.
 * 
 * Features:
 * - Automatic recovery with watchdog timer
 * - Enhanced price volatility for visible changes
 * - Detailed logging with timestamps
 * - Error handling and graceful degradation
 * - Forced UI refreshes to ensure visibility
 */

// Configuration
const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds (changed from 1 second)
const VOLATILITY = 0.015; // 1.5% volatility for clearly visible movement
const MOMENTUM_FACTOR = 0.8; // Momentum factor for realistic price trends

// State tracking
let liveUpdateInterval = null;
let watchdogInterval = null;
let isLiveUpdating = true;
let lastUpdateTime = Date.now();

/**
 * Start the live update system with enhanced reliability
 * This implementation includes a watchdog timer to ensure updates keep running
 * and error handling to prevent crashes
 */
function startEnhancedLiveUpdates() {
    console.log('🚀 Starting enhanced live updates system...');
    isLiveUpdating = true;
    
    // Clear any existing intervals first to prevent duplicates
    stopAllUpdates();
    
    // Create a visual indicator for live updates
    createUpdateIndicator();
    
    // Set up the main update interval with error handling
    liveUpdateInterval = setInterval(() => {
        try {
            const now = new Date();
            console.log(`📊 Live update tick at ${now.toLocaleTimeString()}`);
            lastUpdateTime = Date.now();
            
            // Update the visual indicator
            updateVisualIndicator();
            
            // Update all market data first
            if (typeof updateMarketDataAndUI === 'function') {
                console.log('Updating market data and UI...');
                updateMarketDataAndUI();
            } else {
                console.warn('⚠️ updateMarketDataAndUI function not found!');
            }
            
            // Always try to update the chart, regardless of conditions
            if (typeof updateLiveChart === 'function') {
                console.log('Forcing chart update...');
                updateLiveChart();
            } else {
                console.warn('⚠️ updateLiveChart function not found!');
            }
            
            // Force a DOM refresh to ensure UI updates are visible
            document.body.classList.add('updating');
            setTimeout(() => document.body.classList.remove('updating'), 50);
            
            // Apply a small random jitter to stock prices to ensure movement
            applyRandomJitter();
            
        } catch (error) {
            // Log the error but don't stop the updates
            console.error('❌ Error in live update cycle:', error);
            // Record the error but continue running
            lastUpdateTime = Date.now(); // Still update the timestamp to prevent watchdog restart
        }
    }, UPDATE_INTERVAL_MS);
    
    // Set up the watchdog timer to restart updates if they stall
    watchdogInterval = setInterval(() => {
        try {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTime;
            
            // If no updates for 3 seconds, restart the system
            if (timeSinceLastUpdate > 3000) {
                console.warn('⚠️ Watchdog detected stalled updates, restarting...');
                stopAllUpdates();
                startEnhancedLiveUpdates();
            }
        } catch (error) {
            console.error('❌ Error in watchdog timer:', error);
            // If the watchdog itself fails, restart everything
            stopAllUpdates();
            setTimeout(startEnhancedLiveUpdates, 5000);
        }
    }, 5000); // Check every 5 seconds
    
    // Trigger immediate updates
    try {
        console.log('Triggering immediate initial update...');
        if (typeof updateMarketDataAndUI === 'function') updateMarketDataAndUI();
        if (typeof updateLiveChart === 'function') updateLiveChart();
    } catch (error) {
        console.error('❌ Error during initial update:', error);
    }
    
    // Show a notification to confirm live updates are active
    if (typeof showSuccessNotification === 'function') {
        showSuccessNotification('Enhanced live updates are now active with automatic recovery.');
    }
    
    return true;
}

/**
 * Stop all update intervals
 */
function stopAllUpdates() {
    console.log('Stopping all update intervals...');
    
    if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
    
    if (watchdogInterval) {
        clearInterval(watchdogInterval);
        watchdogInterval = null;
    }
    
    isLiveUpdating = false;
}

/**
 * Generate a more volatile price update for clearly visible changes
 * @param {number} currentPrice - The current price to update
 * @returns {number} - The new price
 */
function generateEnhancedPriceUpdate(currentPrice) {
    // Random component with higher volatility
    const randomComponent = (Math.random() - 0.5) * VOLATILITY;
    
    // Occasional price jumps for more dramatic movement (5% chance of a jump)
    const jumpComponent = Math.random() > 0.95 ? (Math.random() - 0.5) * 0.03 : 0;
    
    // Market trend component (slight upward bias in healthy markets)
    const trendComponent = 0.0005;
    
    // News event simulation (1% chance of significant news impact)
    const newsImpact = Math.random() > 0.99 ? (Math.random() > 0.5 ? 0.05 : -0.05) : 0;
    
    // Calculate new price with minimum movement
    const priceChange = randomComponent + jumpComponent + trendComponent + newsImpact;
    const minChange = 0.003; // Ensure at least some movement (0.3%)
    
    // Apply minimum movement in the direction of the change
    const adjustedChange = priceChange === 0 ? minChange : 
                          (Math.abs(priceChange) < minChange ? 
                           (priceChange > 0 ? minChange : -minChange) : 
                           priceChange);
    
    // Log significant price movements
    if (Math.abs(adjustedChange) > 0.01) {
        console.log(`📈 Significant price movement: ${(adjustedChange * 100).toFixed(2)}%`);
    }
    
    return currentPrice * (1 + adjustedChange);
}

/**
 * Create a visual indicator to show when updates are happening
 * This helps users see that the system is actively updating
 */
function createUpdateIndicator() {
    // Check if indicator already exists
    if (document.getElementById('update-indicator')) return;
    
    // Create the indicator element
    const indicator = document.createElement('div');
    indicator.id = 'update-indicator';
    indicator.innerHTML = `
        <div class="pulse"></div>
        <span>LIVE</span>
    `;
    
    // Add styles for the indicator
    const style = document.createElement('style');
    style.textContent = `
        #update-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            z-index: 9999;
        }
        #update-indicator .pulse {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
        .updating .market-price, .updating .portfolio-value {
            transition: all 0.3s ease;
            text-shadow: 0 0 5px rgba(74, 222, 128, 0.5);
        }
    `;
    
    // Add elements to the document
    document.head.appendChild(style);
    document.body.appendChild(indicator);
}

/**
 * Update the visual indicator to show activity
 */
function updateVisualIndicator() {
    const indicator = document.getElementById('update-indicator');
    if (!indicator) return;
    
    // Flash the indicator to show activity
    indicator.classList.add('active');
    setTimeout(() => indicator.classList.remove('active'), 200);
    
    // Add timestamp to the indicator
    const time = new Date().toLocaleTimeString();
    indicator.setAttribute('title', `Last update: ${time}`);
}

/**
 * Apply a small random jitter to stock prices to ensure visible movement
 * This helps when the normal update logic might not produce visible changes
 */
function applyRandomJitter() {
    // Only apply if we have access to the market data
    if (typeof marketData === 'undefined' || !marketData) return;
    
    // Get all symbols
    const symbols = Object.keys(marketData);
    if (symbols.length === 0) return;
    
    // Select a random symbol to jitter (20% chance)
    if (Math.random() > 0.8) {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        const symbol = symbols[randomIndex];
        
        if (marketData[symbol]) {
            // Apply a small jitter (±0.5%)
            const jitter = (Math.random() - 0.5) * 0.01;
            marketData[symbol].price *= (1 + jitter);
            marketData[symbol].change += jitter * 100;
            
            console.log(`🔄 Applied jitter to ${symbol}: ${jitter >= 0 ? '+' : ''}${(jitter * 100).toFixed(2)}%`);
        }
    }
}

// Export the functions for use in the main app
window.startEnhancedLiveUpdates = startEnhancedLiveUpdates;
window.stopAllUpdates = stopAllUpdates;
window.generateEnhancedPriceUpdate = generateEnhancedPriceUpdate;
