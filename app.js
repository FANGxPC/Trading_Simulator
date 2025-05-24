/**
 * ============= StockVibe Trading Simulator =============
 * A realistic stock trading simulator with live price updates
 * and dynamic charts for an immersive trading experience.
 */

// === Configuration ===

// Stocks tracked by default
const defaultTrackedSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META'];

// Initial state
let portfolio = {};
let balance = 10000;
let previousBalance = 10000; // For tracking change
let lastPortfolioTotal = 0;  // For tracking change

// Market data cache
let marketData = {};

// Transaction history
let transactionHistory = [];

// Live graph update settings
let liveUpdateInterval = null;
const UPDATE_INTERVAL_MS = 1000; // Update every 1 second for real-time experience
let isLiveUpdating = true; // Live updates are always active

// Parameters for realistic price movements
const VOLATILITY = 0.02; // 2% volatility per update for clearly visible movement
const MOMENTUM_FACTOR = 0.8; // Stronger momentum for more realistic price trends
let lastPriceChange = {}; // Track last price movement for momentum

// Initialization is now handled exclusively by the DOMContentLoaded event listener below.
// This avoids duplicate initialization and ensures only one live update interval is created.
// See the DOMContentLoaded block at the end of this file for startup logic.

// ===== Chart.js Variables =====
let tradingChart = null;
let currentChartSymbol = 'AAPL'; // Default chart symbol
let currentTimeFrame = '1D';     // Default timeframe

// DOM Elements - Main UI
const currentBalanceElement = document.getElementById('currentBalance');
const totalPortfolioElement = document.getElementById('totalPortfolio');
const portfolioChangeElement = document.getElementById('portfolioChange');
const balanceChangeElement = document.getElementById('balanceChange');
const portfolioChangeContainer = document.getElementById('portfolioChangeContainer');
const currentDateElement = document.getElementById('currentDate');
const chartSymbolElement = document.getElementById('chartSymbol');
const chartPriceElement = document.getElementById('chartPrice');
const chartPriceChangeElement = document.getElementById('chartPriceChange');

// DOM Elements - Tables
const portfolioBody = document.getElementById('portfolioBody');
const marketBody = document.getElementById('marketBody');

// DOM Elements - Forms and Chart
const tradeForm = document.getElementById('tradeForm');
const tradingChartCanvas = document.getElementById('tradingChart');
const timeFilters = document.querySelectorAll('.time-filter');
const buyNowBtn = document.querySelector('.buy-btn');
const sellNowBtn = document.querySelector('.sell-btn');
const stockAmountInput = document.getElementById('stockAmount');
const stockSelect = document.getElementById('stockSelect');
const usdAmountInput = document.getElementById('usdAmount');
const apiNotice = document.getElementById('apiNotice');
const closeApiNoticeBtn = document.getElementById('closeApiNotice');

// ======== Stock Data Generation Functions ========

/**
 * Generate a realistic stock quote with price and change percentage
 * @param {string} symbol - Stock symbol
 * @returns {Object} Stock data with price and change percentage
 */
function generateStockQuote(symbol) {
    console.log(`Generating data for ${symbol}`);
    
    // Base prices for common stocks - based on realistic market values
    const basePrices = {
        'AAPL': 175.50,  // Apple
        'MSFT': 320.75,  // Microsoft
        'GOOGL': 140.25, // Google
        'AMZN': 145.80,  // Amazon
        'META': 325.40,  // Meta/Facebook
        'TSLA': 240.60,  // Tesla
        'NVDA': 450.30,  // NVIDIA
        'JPM': 180.20,   // JPMorgan Chase
        'V': 270.15,     // Visa
        'WMT': 65.40,    // Walmart
        'DIS': 105.30,   // Disney
        'NFLX': 410.25,  // Netflix
        'PYPL': 62.80,   // PayPal
        'INTC': 35.20,   // Intel
        'AMD': 120.50,   // AMD
        'CSCO': 48.75,   // Cisco
        'ORCL': 115.40,  // Oracle
        'IBM': 140.60,   // IBM
        'ADBE': 480.30,  // Adobe
        'CRM': 250.80    // Salesforce
    };
    
    // Use base price if available, otherwise generate a random price between 50 and 500
    const basePrice = basePrices[symbol] || (50 + Math.random() * 450);
    
    // Add some small randomness to the price (±0.5%)
    const randomFactor = 0.995 + (Math.random() * 0.01);
    const price = basePrice * randomFactor;
    
    // Generate a realistic change percentage between -1% and +1%
    // Slightly biased toward positive (reflecting general market trend)
    const change = (Math.random() * 2 - 0.9);
    
    return {
        symbol,
        price,
        change,
        timestamp: Date.now()
    };
}

/**
 * Generate realistic historical stock data
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Time period (e.g., '1D', '1W')
 * @returns {Array} Historical price data
 */
function generateStockHistory(symbol, timeframe = '1D') {
    console.log(`Generating history for ${symbol} with timeframe ${timeframe}`);
    
    // Get current price from market data or generate a new one
    const currentData = marketData[symbol] || generateStockQuote(symbol);
    const currentPrice = currentData.price;
    
    // Determine number of data points based on timeframe
    let dataPoints = 30; // Default for 1D
    if (timeframe === '1W') dataPoints = 7;
    if (timeframe === '1M') dataPoints = 30;
    if (timeframe === '3M') dataPoints = 90;
    if (timeframe === '1Y') dataPoints = 365;
    
    // Generate dates for the timeframe
    const dates = [];
    const today = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
    
    // Generate price data with a realistic pattern
    // Parameters for more realistic price movements
    const volatility = 0.008; // 0.8% daily volatility (realistic for most stocks)
    const trend = 0.0002; // Slight upward trend (0.02% per day on average)
    const momentum = 0.85; // Price momentum/autocorrelation (prices tend to continue in same direction)
    
    let price = currentPrice * (1 - (Math.random() * 0.05)); // Start slightly lower than current price
    let lastMove = 0; // Track the last price movement for momentum
    
    const history = dates.map((date, index) => {
        // Random component with momentum
        const randomComponent = (Math.random() - 0.5) * volatility;
        const momentumComponent = lastMove * momentum;
        const trendComponent = trend;
        
        // Combine components for daily change
        const dailyChange = randomComponent + momentumComponent + trendComponent;
        lastMove = dailyChange; // Update momentum
        
        // Update price with the daily change
        price = price * (1 + dailyChange);
        
        // For the last data point, ensure it's exactly the current price
        if (index === dates.length - 1) {
            price = currentPrice;
        }
        
        return {
            date,
            close: price
        };
    });
    
    return history;
}

// Stock Data Generation Functions section end

// ========== Market Data/Portfolio/Graph Logic ==========

// Set current date display
function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Calculate portfolio total and change
function calculatePortfolioTotal() {
    let total = 0;
    for (let [symbol, details] of Object.entries(portfolio)) {
        const curData = marketData[symbol] || {};
        const currentPrice = curData.price ?? 0;
        total += details.quantity * currentPrice;
    }
    
    // Calculate change percentage
    const changePercent = lastPortfolioTotal > 0 ? 
        ((total - lastPortfolioTotal) / lastPortfolioTotal * 100).toFixed(2) : 
        '0.00';
        
    // Update UI
    totalPortfolioElement.textContent = total.toFixed(2);
    portfolioChangeElement.textContent = (changePercent > 0 ? '+' : '') + changePercent + '%';
    
    // Update UI classes
    if (parseFloat(changePercent) > 0) {
        portfolioChangeContainer.className = 'change-indicator up';
        portfolioChangeContainer.querySelector('i').className = 'fas fa-arrow-up';
    } else if (parseFloat(changePercent) < 0) {
        portfolioChangeContainer.className = 'change-indicator down';
        portfolioChangeContainer.querySelector('i').className = 'fas fa-arrow-down';
    } else {
        portfolioChangeContainer.className = 'change-indicator';
        portfolioChangeContainer.querySelector('i').className = 'fas fa-arrow-right';
    }
    
    // Store for next comparison
    if (total > 0) lastPortfolioTotal = total;
    
    return total;
}

// Update market prices for all tracked symbols with realistic price movements
function updateMarketDataAndUI() {
    console.log('Updating all market data at ' + new Date().toLocaleTimeString() + '...');
    
    // Get all symbols we need to update (tracked + portfolio)
    const portfolioSymbols = Object.keys(portfolio);
    const allSymbols = [...new Set([...defaultTrackedSymbols, ...portfolioSymbols])];
    
    // Update each symbol with realistic price movements
    for (const symbol of allSymbols) {
        // If we don't have data for this symbol yet, generate it
        if (!marketData[symbol]) {
            marketData[symbol] = generateStockQuote(symbol);
            lastPriceChange[symbol] = 0;
            continue;
        }
        
        // Get existing data
        const currentData = marketData[symbol];
        
        // 1. Get last price change for this symbol (or default to small random value)
        const lastChange = lastPriceChange[symbol] || (Math.random() * 0.001 - 0.0005);
        
        // 2. Random component with realistic market noise
        const randomComponent = (Math.random() - 0.5) * VOLATILITY;
        
        // 3. Momentum component (prices tend to continue in same direction)
        const momentumComponent = lastChange * MOMENTUM_FACTOR;
        
        // 4. Market trend component (slight upward bias in healthy markets)
        const trendComponent = 0.0001;
        
        // 5. Occasional price jumps (breaking news, earnings reports, etc.)
        const jumpComponent = Math.random() > 0.98 ? (Math.random() - 0.5) * 0.01 : 0;
        
        // 6. Combine all components for final price change
        const priceChange = randomComponent + momentumComponent + trendComponent + jumpComponent;
        
        // Store this change for next update (momentum)
        lastPriceChange[symbol] = priceChange;
        
        // Calculate new price with higher volatility for more visible changes
        const newPrice = currentData.price * (1 + priceChange);
        
        // Update market data with new price
        marketData[symbol] = {
            symbol: symbol,
            price: newPrice,
            change: currentData.change + (priceChange * 100),
            timestamp: Date.now()
        };
        
        console.log(`Updated ${symbol}: $${newPrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${(priceChange * 100).toFixed(2)}%)`);
    }
    
    // Update UI components with forced refreshes
    console.log('Refreshing UI components...');
    updateMarketTable(); // Update market prices table
    updatePortfolioTable(); // Update portfolio holdings
    calculatePortfolioTotal(); // Recalculate total portfolio value
    
    // Update chart symbol data if it exists
    if (currentChartSymbol && marketData[currentChartSymbol]) {
        updateChartHeaderInfo(currentChartSymbol);
    }
    
    // Update converter
    updateConverter();
    
    return true;
}

// Update market prices table
function updateMarketTable() {
    marketBody.innerHTML = '';
    
    // Sort by market cap (here we just sort alphabetically since we don't have market cap data)
    const sortedSymbols = Object.keys(marketData).sort();
    
    for (let symbol of sortedSymbols) {
        const data = marketData[symbol];
        const row = marketBody.insertRow();
        row.onclick = () => showGraphForSymbol(symbol);

        const changeClass = data.change >= 0 ? 'up' : 'down';
        const changePrefix = data.change >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td><strong>${symbol}</strong></td>
            <td>$${data.price?.toFixed(2) ?? '--'}</td>
            <td class="${changeClass}">
                ${changePrefix}${data.change.toFixed(2)}%
            </td>
            <td>
                <button class="table-action btn-buy">Buy</button>
                <button class="table-action btn-sell">Sell</button>
            </td>
        `;
        
        // Add event listeners to action buttons
        const buyBtn = row.querySelector('.btn-buy');
        const sellBtn = row.querySelector('.btn-sell');
        
        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent row click
            document.getElementById('stockSymbol').value = symbol;
            document.getElementById('tradeType').value = 'buy';
            document.getElementById('stockSymbol').dispatchEvent(new Event('change'));
        });
        
        sellBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent row click
            document.getElementById('stockSymbol').value = symbol;
            document.getElementById('tradeType').value = 'sell';
            document.getElementById('stockSymbol').dispatchEvent(new Event('change'));
        });
    }
}

// Update portfolio table
function updatePortfolioTable() {
    portfolioBody.innerHTML = '';
    let totalPortfolioValue = 0;
    
    // Show message if portfolio is empty
    if (Object.keys(portfolio).length === 0) {
        const row = portfolioBody.insertRow();
        row.innerHTML = `<td colspan="5" class="empty-message">Your portfolio is empty. Start trading to see your holdings here.</td>`;
        return;
    }
    
    for (let [symbol, details] of Object.entries(portfolio)) {
        const curData = marketData[symbol] || {};
        const currentPrice = curData.price ?? 0;
        const totalValue = details.quantity * currentPrice;
        const profitLoss = totalValue - (details.avgCost * details.quantity);
        const profitLossPercent = details.avgCost > 0 ? 
            ((currentPrice - details.avgCost) / details.avgCost * 100).toFixed(2) : 
            '0.00';
        
        const row = portfolioBody.insertRow();
        const profitClass = profitLoss >= 0 ? 'up' : 'down';
        
        row.innerHTML = `
            <td><strong>${symbol}</strong></td>
            <td>${details.quantity}</td>
            <td>$${currentPrice.toFixed(2)}</td>
            <td>$${totalValue.toFixed(2)}</td>
            <td class="${profitClass}">${profitLoss >= 0 ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)} (${profitLoss >= 0 ? '+' : ''}${profitLossPercent}%)</td>
        `;
        
        totalPortfolioValue += totalValue;
    }
    
    // Update UI elements
    currentBalanceElement.textContent = balance.toFixed(2);
    
    // Calculate balance change
    const balanceChange = ((balance - previousBalance) / previousBalance * 100).toFixed(2);
    balanceChangeElement.textContent = (balanceChange > 0 ? '+' : '') + balanceChange + '%';
    
    const balanceChangeContainer = document.querySelector('.total-balance .change-indicator');
    if (parseFloat(balanceChange) > 0) {
        balanceChangeContainer.className = 'change-indicator up';
    } else if (parseFloat(balanceChange) < 0) {
        balanceChangeContainer.className = 'change-indicator down';
    } else {
        balanceChangeContainer.className = 'change-indicator';
    }
}

// ======== Graph/Chart.js Logic ========

// Update the chart header info with symbol price and change
function updateChartHeaderInfo(symbol) {
    if (!marketData[symbol]) return;
    
    const data = marketData[symbol];
    chartSymbolElement.textContent = symbol;
    chartPriceElement.textContent = data.price.toFixed(2);
    
    // Update price change display
    const changeValue = data.change.toFixed(2);
    chartPriceChangeElement.textContent = `${changeValue >= 0 ? '+' : ''}${changeValue}%`;
    
    // Set color based on change direction
    if (data.change >= 0) {
        chartPriceChangeElement.className = 'price-change up';
        chartPriceChangeElement.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        chartPriceChangeElement.style.color = '#10b981';
    } else {
        chartPriceChangeElement.className = 'price-change down';
        chartPriceChangeElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        chartPriceChangeElement.style.color = '#ef4444';
    }
}

// Shows the graph for symbol with generated data
function showGraphForSymbol(symbol, timeframe = '1D') {
    if (!symbol) return;
    
    // Update current chart symbol and timeframe
    currentChartSymbol = symbol;
    currentTimeFrame = timeframe;
    
    // Clear any previous chart
    if (tradingChart) {
        tradingChart.destroy();
        tradingChart = null;
    }
    
    // Update time filter buttons
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        if (btn.textContent === timeframe) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show loading state
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.classList.add('loading');
    
    try {
        // Generate historical data
        const history = generateStockHistory(symbol, timeframe);
        
        // Get the latest price from history
        if (history && history.length > 0) {
            const latestPrice = history[history.length - 1].close;
            
            // If we have market data for this symbol, update it
            if (marketData[symbol]) {
                // Calculate change based on previous close if available
                const prevClose = history.length > 1 ? history[history.length - 2].close : latestPrice * 0.99;
                const change = ((latestPrice - prevClose) / prevClose) * 100;
                
                // Update market data with consistent values
                marketData[symbol].price = latestPrice;
                marketData[symbol].change = change;
                marketData[symbol].timestamp = Date.now();
                
                // Update header with the synchronized data
                updateChartHeaderInfo(symbol);
            }
        }
        
        // Render the chart
        renderTradingGraph(symbol, history, timeframe);
        
        // Start live updates if not already running
        startLiveUpdates();
        
    } catch (error) {
        console.error(`Failed to load chart data for ${symbol}:`, error);
        // Show error message in chart area
        const ctx = tradingChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, tradingChartCanvas.width, tradingChartCanvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(`Unable to load chart data for ${symbol}`, tradingChartCanvas.width/2, tradingChartCanvas.height/2);
        
        // Destroy previous chart if exists
        if (tradingChart) {
            tradingChart.destroy();
            tradingChart = null;
        }
    }
    
    // Remove loading state
    chartContainer.classList.remove('loading');
}

// Update the live chart with real-time data
function updateLiveChart() {
    console.log('===== UPDATING LIVE CHART: ' + new Date().toLocaleTimeString() + ' =====');
    
    // Only proceed if we have a chart and symbol
    if (!tradingChart || !currentChartSymbol) {
        console.log('No chart or symbol to update - reinitializing chart');
        // Try to initialize the chart if it doesn't exist
        const initialSymbol = currentChartSymbol || 'AAPL';
        showGraphForSymbol(initialSymbol);
        return;
    }
    
    // Get current price from market data
    const data = marketData[currentChartSymbol];
    if (!data) {
        console.log('No data for symbol:', currentChartSymbol);
        return;
    }
    
    // Get the current price
    const newPrice = data.price;
    console.log(`Current price for ${currentChartSymbol}: $${newPrice.toFixed(2)}`);
    
    // Get current date/time for the new data point
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {hour12: false});
    
    // Calculate the change from the last point
    // If this is the first update, create a slightly different starting price
    if (!tradingChart.lastPrice) {
        // Start with a slight difference to ensure visible change
        tradingChart.lastPrice = newPrice * 0.99; 
    }
    const lastPrice = tradingChart.lastPrice;
    const priceChange = (newPrice - lastPrice) / lastPrice;
    tradingChart.lastPrice = newPrice; // Store for next update
    
    // Check if chart data exists and initialize if needed
    if (!tradingChart.data || !tradingChart.data.datasets || !tradingChart.data.datasets[0] || !tradingChart.data.datasets[0].data) {
        console.log('Chart data structure is invalid, reinitializing...');
        showGraphForSymbol(currentChartSymbol);
        return;
    }
    
    // Determine color based on price direction
    const isUp = priceChange >= 0;
    const lineColor = isUp ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
    
    // Create new gradient based on direction
    const ctx = tradingChartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    
    if (isUp) {
        // Green gradient for upward movement
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
        // Red gradient for downward movement
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    }
    
    // Add the new data point
    tradingChart.data.labels.push(timeStr);
    tradingChart.data.datasets[0].data.push(newPrice);
    
    // Keep only the last 30 points for better visualization
    if (tradingChart.data.labels.length > 30) {
        tradingChart.data.labels.shift();
        tradingChart.data.datasets[0].data.shift();
    }
    
    // Update chart colors
    tradingChart.data.datasets[0].borderColor = lineColor;
    tradingChart.data.datasets[0].backgroundColor = gradient;
    
    // Use immediate animation for this update only
    tradingChart.options.animation = {
        duration: 200,
        easing: 'linear'
    };
    
    // Force min/max recalculation to ensure chart scales properly
    tradingChart.options.scales.y.min = Math.min(...tradingChart.data.datasets[0].data) * 0.995;
    tradingChart.options.scales.y.max = Math.max(...tradingChart.data.datasets[0].data) * 1.005;
    
    // Force the chart to update
    console.log('🔄 Forcing chart update...');
    tradingChart.update();
    
    // Update the price display in the UI
    updateChartHeaderInfo(currentChartSymbol);
    
    console.log(`✅ Updated ${currentChartSymbol} chart with new price: $${newPrice.toFixed(2)} (${isUp ? '+' : '-'}${Math.abs(priceChange * 100).toFixed(2)}%)`);
    console.log('===== UPDATE COMPLETE =====');
}

// Update chart gradient based on price movement
function updateChartGradient(chart, priceChange) {
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) return;
    
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    
    if (!ctx || !chartArea) return;
    
    // Create gradient based on price direction
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    
    if (priceChange >= 0) {
        // Green gradient for upward movement
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.0)');
        gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
    } else {
        // Red gradient for downward movement
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.0)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.1)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
    }
    
    // Apply gradient to chart background
    chart.data.datasets[0].backgroundColor = gradient;
}

// Start live updates with enhanced reliability
function startLiveUpdates() {
    console.log('Starting live updates with enhanced visualization...');
    isLiveUpdating = true;
    
    // Always clear any existing interval first
    if (liveUpdateInterval) {
        console.log('Clearing existing update interval');
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
    
    // Set up new interval with enhanced debug logging
    liveUpdateInterval = setInterval(() => {
        console.log('Live update tick...');
        
        // Update all market data with realistic price movements
        updateMarketDataAndUI();
        
        // Then specifically update the chart if one is active
        if (tradingChart && currentChartSymbol) {
            console.log(`Triggering chart update for ${currentChartSymbol}`);
            updateLiveChart();
        } else {
            console.log('No active chart to update');
        }
    }, UPDATE_INTERVAL_MS);
    
    console.log(`Live updates will occur every ${UPDATE_INTERVAL_MS}ms`);
    
    // Trigger immediate updates to avoid waiting for first interval
    console.log('Triggering immediate initial update...');
    updateMarketDataAndUI();
    
    // Update the chart immediately if we have one
    if (tradingChart && currentChartSymbol) {
        console.log(`Immediate chart update for ${currentChartSymbol}`);
        updateLiveChart();
    }
    
    // Show a notification to confirm live updates are active
    showSuccessNotification('Live updates are now active and will update every second.');
    
    return true;
}

// Stop live updates
function stopLiveUpdates() {
    console.log('Stopping live updates...');
    isLiveUpdating = false;
    
    if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
}

// Create and render the trading chart with historical data
function renderTradingGraph(symbol, history, timeframe) {
    console.log(`Rendering NEW trading graph for ${symbol} with ${history.length} data points`);
    
    // Ensure we have valid history data
    if (!history || history.length === 0) {
        console.error('No history data available for chart rendering');
        // Generate some default data if history is empty
        history = [];
        const basePrice = 100; // Default starting price
        const now = new Date();
        
        // Generate 30 data points for the last 30 minutes
        for (let i = 0; i < 30; i++) {
            const pastTime = new Date(now.getTime() - (30-i) * 60000);
            const randomChange = (Math.random() - 0.5) * 2; // Random price movement
            history.push({
                date: pastTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}),
                close: basePrice + randomChange * i
            });
        }
        console.log('Generated default chart data:', history);
    }
    
    // Extract dates and prices from history
    const dates = history.map(item => item.date);
    const prices = history.map(item => item.close);
    
    // Determine if price is up or down from start to end
    const isPriceUp = prices[prices.length - 1] >= prices[0];
    
    // Set colors based on price movement
    const lineColor = isPriceUp ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
    
    // Create gradient
    const ctx = tradingChartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    
    if (isPriceUp) {
        // Green gradient for upward movement
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
        // Red gradient for downward movement
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    }
    
    // Destroy existing chart if it exists
    if (tradingChart) {
        tradingChart.destroy();
    }
    
    // Set up chart configuration
    const config = {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: symbol,
                data: prices,
                borderColor: lineColor,
                borderWidth: 2,
                backgroundColor: gradient,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Turn off initial animation
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#fff',
                    titleColor: '#1e293b',
                    bodyColor: '#64748b',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        color: '#94a3b8',
                        font: {
                            size: 10
                        },
                        maxTicksLimit: 6
                    },
                    adapters: {
                        date: {
                            locale: 'en-US'
                        }
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    },
                    grace: '5%' // Add padding to prevent jumpy animations
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    };
    
    // Debug the canvas element
    console.log('Canvas element:', tradingChartCanvas);
    console.log('Canvas dimensions:', tradingChartCanvas.width, 'x', tradingChartCanvas.height);
    console.log('Canvas context:', ctx);
    
    // Make sure the canvas is visible and has dimensions
    if (tradingChartCanvas.style.display === 'none') {
        console.warn('Canvas was hidden, making it visible');
        tradingChartCanvas.style.display = 'block';
    }
    
    // Ensure the canvas has proper dimensions
    if (tradingChartCanvas.width === 0 || tradingChartCanvas.height === 0) {
        console.warn('Canvas had zero dimensions, setting default size');
        tradingChartCanvas.width = 800;
        tradingChartCanvas.height = 400;
    }
    
    try {
        // Create new chart instance with explicit animation settings
        tradingChart = new Chart(ctx, config);
        console.log('Chart created successfully:', tradingChart);
        
        // Store the last price for live updates
        tradingChart.lastPrice = prices[prices.length - 1];
        console.log('Last price set to:', tradingChart.lastPrice);
    } catch (error) {
        console.error('Error creating chart:', error);
        // Try to recover by creating a simpler chart
        try {
            const simpleConfig = {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        data: prices,
                        borderColor: lineColor,
                        borderWidth: 2,
                        backgroundColor: gradient,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            };
            tradingChart = new Chart(ctx, simpleConfig);
            tradingChart.lastPrice = prices[prices.length - 1];
            console.log('Created simplified chart as fallback');
        } catch (fallbackError) {
            console.error('Even simplified chart failed:', fallbackError);
        }
    }
    
    // Store chart options for reuse during updates
    tradingChart.customOptions = {
        lineColor: lineColor,
        gradient: gradient
    };
    
    // Remove loading state
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.classList.remove('loading');
    
    // Update the chart header with current price and change
    updateChartHeaderInfo(symbol);
    
    // Store the current symbol as the active chart symbol
    currentChartSymbol = symbol;
    
    return tradingChart;
}

// Start live updates with enhanced reliability
function startLiveUpdates() {
    console.log('Starting live updates with enhanced visualization...');
    isLiveUpdating = true;
    
    // Always clear any existing interval first
    if (liveUpdateInterval) {
        console.log('Clearing existing update interval');
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
    
    // Set up new interval with enhanced debug logging
    liveUpdateInterval = setInterval(() => {
        console.log('Live update tick...');
        
        // Update all market data with realistic price movements
        updateMarketDataAndUI();
        
        // Then specifically update the chart if one is active
        if (tradingChart && currentChartSymbol) {
            console.log(`Triggering chart update for ${currentChartSymbol}`);
            updateLiveChart();
        } else {
            console.log('No active chart to update');
        }
    }, UPDATE_INTERVAL_MS);
    
    console.log(`Live updates will occur every ${UPDATE_INTERVAL_MS}ms`);
    
    // Trigger immediate updates to avoid waiting for first interval
    console.log('Triggering immediate initial update...');
    updateMarketDataAndUI();
    
    // Update the chart immediately if we have one
    if (tradingChart && currentChartSymbol) {
        console.log(`Immediate chart update for ${currentChartSymbol}`);
        updateLiveChart();
    }
    
    // Show a notification to confirm live updates are active
    showSuccessNotification('Live updates are now active and will update every second.');
    
    return true;
}

// Stop live updates
function stopLiveUpdates() {
    console.log('Stopping live updates...');
    isLiveUpdating = false;
    
    if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
}

// Update currency converter tool
function updateConverter() {
    const symbol = stockSelect.value;
    const amount = parseFloat(stockAmountInput.value) || 1;
    
    if (marketData[symbol]) {
        const price = marketData[symbol].price;
        usdAmountInput.value = (price * amount).toFixed(2);
    } else {
        usdAmountInput.value = "--";
    }
}

// Calculate average cost for purchased stocks
function calculateAverageCost(symbol, newQuantity, newPrice, existingDetails) {
    if (!existingDetails) {
        return newPrice; // First purchase, avg cost is current price
    }
    
    const totalValue = (existingDetails.avgCost * existingDetails.quantity) + (newPrice * newQuantity);
    const totalShares = existingDetails.quantity + newQuantity;
    
    return totalValue / totalShares;
}

// Execute trade with improved feedback
tradeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const symbol = document.getElementById('stockSymbol').value.toUpperCase();
    const quantity = parseInt(document.getElementById('quantity').value);
    const tradeType = document.getElementById('tradeType').value;

    // Check valid symbol and quantity
    if (!symbol || !quantity || quantity <= 0) {
        showErrorNotification('Please enter a valid stock symbol and quantity.');
        return;
    }
    
    // Check market data availability
    if (!marketData[symbol]) {
        // Try to fetch if not in our current market data
        try {
            const data = await fetchStockQuote(symbol);
            marketData[symbol] = data;
        } catch (err) {
            showErrorNotification('Invalid stock symbol or price not available.');
            return;
        }
    }

    // Set previous balance for change tracking
    previousBalance = balance;
    
    const currentPrice = marketData[symbol].price;
    const totalCost = currentPrice * quantity;

    if (tradeType === 'buy') {
        if (totalCost > balance) {
            showErrorNotification(`Insufficient funds. You need $${totalCost.toFixed(2)} but have $${balance.toFixed(2)}`);
            return;
        }
        
        // Deduct funds
        balance -= totalCost;
        
        // Track average cost for profit/loss calculation
        portfolio[symbol] = portfolio[symbol] || { quantity: 0, avgCost: 0 };
        portfolio[symbol].avgCost = calculateAverageCost(symbol, quantity, currentPrice, portfolio[symbol]);
        portfolio[symbol].quantity += quantity;
        
        // Record transaction in history
        transactionHistory.push({
            type: 'buy',
            symbol,
            quantity,
            price: currentPrice,
            total: totalCost,
            timestamp: Date.now()
        });
        
        // Success message
        showSuccessNotification(`Successfully bought ${quantity} shares of ${symbol} at $${currentPrice.toFixed(2)}.`);
        
    } else { // sell
        if (!portfolio[symbol] || portfolio[symbol].quantity < quantity) {
            showErrorNotification(`Not enough shares to sell. You have ${portfolio[symbol]?.quantity || 0} shares of ${symbol}.`);
            return;
        }
        
        // Add funds
        balance += totalCost;
        portfolio[symbol].quantity -= quantity;
        
        // Calculate profit/loss from this trade
        const profitLoss = (currentPrice - portfolio[symbol].avgCost) * quantity;
        const profitLossText = profitLoss >= 0 ? 
            `profit of $${profitLoss.toFixed(2)}` : 
            `loss of $${Math.abs(profitLoss).toFixed(2)}`;
        
        // Remove stock if quantity becomes zero
        if (portfolio[symbol].quantity === 0) {
            delete portfolio[symbol];
        }
        
        // Record transaction in history
        transactionHistory.push({
            type: 'sell',
            symbol,
            quantity,
            price: currentPrice,
            total: totalCost,
            timestamp: Date.now()
        });
        
        // Success message
        showSuccessNotification(`Successfully sold ${quantity} shares of ${symbol} at $${currentPrice.toFixed(2)} with a ${profitLossText}.`);
    }
    
    // Update UI
    updatePortfolioTable();
    updateMarketDataAndUI();
    calculatePortfolioTotal();
    tradeForm.reset();

    // Update chart to currently traded symbol
    showGraphForSymbol(symbol);
});

// Display trade notification
function showTradeNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.trade-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'trade-notification';
        document.body.appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after delay
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Display API rate limit notification
function showApiLimitNotification() {
    showNotification({
        type: 'warning',
        title: 'API rate limit reached',
        message: 'Alpha Vantage limits free tier to 5 requests per minute. Data will continue loading after a short delay.',
        icon: 'exclamation-circle',
        duration: 8000
    });
}

// Display error notification
function showErrorNotification(message) {
    showNotification({
        type: 'error',
        title: 'Error',
        message: message,
        icon: 'exclamation-triangle',
        duration: 5000
    });
}

// Display success notification
function showSuccessNotification(message) {
    showNotification({
        type: 'success',
        title: 'Success',
        message: message,
        icon: 'check-circle',
        duration: 3000
    });
}

// Generic notification function
function showNotification(options) {
    const { type, title, message, icon, duration } = options;
    
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles for notifications
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            }
            
            .notification {
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.3s ease;
                overflow: hidden;
                position: relative;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            }
            
            .notification-header i {
                margin-right: 8px;
            }
            
            .notification-title {
                font-weight: 600;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                opacity: 0.7;
                cursor: pointer;
                font-size: 14px;
                padding: 0;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .notification-message {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                width: 100%;
                transform-origin: left;
            }
            
            .notification.error {
                background-color: #fee2e2;
                color: #b91c1c;
            }
            
            .notification.error .notification-progress {
                background-color: #ef4444;
            }
            
            .notification.warning {
                background-color: #fef3c7;
                color: #92400e;
            }
            
            .notification.warning .notification-progress {
                background-color: #f59e0b;
            }
            
            .notification.success {
                background-color: #d1fae5;
                color: #065f46;
            }
            
            .notification.success .notification-progress {
                background-color: #10b981;
            }
            
            .notification.info {
                background-color: #e0f2fe;
                color: #0369a1;
            }
            
            .notification.info .notification-progress {
                background-color: #0ea5e9;
            }
            
            @keyframes progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <i class="fas fa-${icon}"></i>
            <div class="notification-title">${title}</div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-progress"></div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Show notification with a small delay
    setTimeout(() => {
        notification.classList.add('show');
        
        // Animate progress bar
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.animation = `progress ${duration/1000}s linear forwards`;
    }, 10);
    
    // Add close button event listener
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto-hide after duration
    setTimeout(() => {
        closeNotification(notification);
    }, duration);
}

// Close notification with animation
function closeNotification(notification) {
    notification.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ======== Event Listeners ========

// Add event listeners for time filter buttons
timeFilters.forEach(btn => {
    btn.addEventListener('click', () => {
        const timeframe = btn.textContent;
        showGraphForSymbol(currentChartSymbol, timeframe);
    });
});

// Buy/Sell buttons in chart area
buyNowBtn.addEventListener('click', () => {
    document.getElementById('stockSymbol').value = currentChartSymbol;
    document.getElementById('tradeType').value = 'buy';
    document.getElementById('quantity').focus();
});

sellNowBtn.addEventListener('click', () => {
    document.getElementById('stockSymbol').value = currentChartSymbol;
    document.getElementById('tradeType').value = 'sell';
    document.getElementById('quantity').focus();
});

// Stock to USD converter events
stockAmountInput.addEventListener('input', updateConverter);
stockSelect.addEventListener('change', updateConverter);

// Close API notice
if (closeApiNoticeBtn) {
    closeApiNoticeBtn.addEventListener('click', () => {
        apiNotice.style.display = 'none';
    });
}

// ======== Utility: Pick default charted symbol ========
function getRandomTrackedSymbol() {
    const tracked = [...Object.keys(portfolio), ...defaultTrackedSymbols];
    const unique = [...new Set(tracked)];
    return unique[Math.floor(Math.random() * unique.length)];
}

// Add CSS rule for trade notification
function addTradeNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .trade-notification {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
            font-weight: 500;
        }
        .trade-notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        .loading-data .chart-container:before {
            content: "Loading...";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #64748b;
            font-weight: 500;
        }
        .loading-data .chart-container {
            opacity: 0.5;
        }
        .empty-message {
            color: #64748b;
            text-align: center;
            padding: 20px;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

// ======== Live Graph Updates ========

/**
 * Generate a realistic price update for a stock
 * @param {number} currentPrice - The current stock price
 * @param {number} volatility - How volatile the stock is (0.001 to 0.01)
 * @returns {number} - The new stock price
 */
function generatePriceUpdate(currentPrice, volatility = 0.003) {
    // Generate a random price movement with slight upward bias
    // Normal stocks move about 0.1% to 1% in a few seconds during active trading
    const randomFactor = (Math.random() - 0.48) * volatility;
    const newPrice = currentPrice * (1 + randomFactor);
    
    // Ensure price doesn't go too low
    return Math.max(newPrice, currentPrice * 0.95);
}

/**
 * Start live updates for market data and chart
 * This is the main function that handles all live updates
 */
function startLiveUpdates() {
    console.log('Starting comprehensive live updates...');
    
    // Always clear any existing interval first to prevent duplicates
    if (liveUpdateInterval) {
        console.log('Clearing existing update interval');
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
    
    // Get the live update toggle button
    const liveToggle = document.getElementById('liveUpdateToggle');
    if (liveToggle) {
        liveToggle.classList.add('active');
        liveToggle.innerHTML = '<i class="fas fa-circle-dot pulse"></i> Live';
    }
    
    isLiveUpdating = true;
    
    // Create a live indicator if it doesn't exist
    let liveIndicator = document.querySelector('.live-indicator');
    if (!liveIndicator) {
        liveIndicator = document.createElement('div');
        liveIndicator.className = 'live-indicator';
        liveIndicator.innerHTML = '<i class="fas fa-circle-dot pulse"></i> Live';
        
        // Insert after data source indicator
        const dataSourceIndicator = document.querySelector('.data-source-indicator');
        if (dataSourceIndicator && dataSourceIndicator.parentNode) {
            dataSourceIndicator.parentNode.insertBefore(liveIndicator, dataSourceIndicator.nextSibling);
        }
    }
    
    // Make sure we have initial data for all symbols
    console.log('Ensuring all symbols have initial data...');
    for (const symbol of defaultTrackedSymbols) {
        if (!marketData[symbol]) {
            marketData[symbol] = generateStockQuote(symbol);
            console.log(`Generated initial data for ${symbol}: $${marketData[symbol].price.toFixed(2)}`);
        }
    }
    
    // Start the update interval that updates BOTH market data AND chart
    liveUpdateInterval = setInterval(() => {
        console.log('Live update tick at ' + new Date().toLocaleTimeString());
        
        // First update all market data and UI
        updateMarketDataAndUI();
        
        // Then update the chart
        updateLiveChart();
    }, UPDATE_INTERVAL_MS);
    
    // Trigger immediate updates to avoid waiting for first interval
    console.log('Triggering immediate initial update...');
    updateMarketDataAndUI();
    updateLiveChart();
    
    // Show a notification to confirm live updates are active
    showSuccessNotification('Live updates are now active and will update every second.');
    
    return true;
}

/**
 * Stop live updates for the current chart
 */
function stopLiveUpdates() {
    if (!isLiveUpdating) return;
    
    // Get the live update toggle button
    const liveToggle = document.getElementById('liveUpdateToggle');
    if (liveToggle) {
        liveToggle.classList.remove('active');
        liveToggle.innerHTML = '<i class="fas fa-circle-dot"></i> Live';
    }
    
    isLiveUpdating = false;
    
    // Remove the live indicator
    const liveIndicator = document.querySelector('.live-indicator');
    if (liveIndicator) {
        liveIndicator.remove();
    }
    
    // Clear the update interval
    if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
        liveUpdateInterval = null;
    }
}

/**
 * Update the chart with a new price point
 */
function updateLiveChart() {
    // Only update if we have a chart and a symbol
    if (!tradingChart || !currentChartSymbol) return;
    
    // Get the current price from the chart data
    const chartData = tradingChart.data.datasets[0].data;
    if (!chartData || chartData.length === 0) return;
    
    const currentPrice = chartData[chartData.length - 1];
    
    // Generate a new price
    const newPrice = generatePriceUpdate(currentPrice);
    
    // Get the current date and format it
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Prepare data updates (but don't apply yet to avoid rendering delays)
    const newLabels = [...tradingChart.data.labels, timeString];
    const newData = [...tradingChart.data.datasets[0].data, newPrice];
    
    // Remove the oldest data point if we have more than 30 points
    if (newLabels.length > 30) {
        newLabels.shift();
        newData.shift();
    }
    
    // Update the chart colors based on the price change (not trend)
    // This ensures the chart is red when the current price is lower than previous price
    const prevPrice = marketData[currentChartSymbol] ? marketData[currentChartSymbol].price : currentPrice;
    const isPriceUp = newPrice >= prevPrice;
    
    // Set colors based on price movement - using more vibrant colors
    const lineColor = isPriceUp ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
    
    // Create multi-stop gradient for a more professional look
    const ctx = tradingChartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    
    if (isPriceUp) {
        // Green gradient with multiple stops for a more refined look
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        gradient.addColorStop(0.2, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    } else {
        // Red gradient with multiple stops
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(0.2, 'rgba(239, 68, 68, 0.3)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    }
    
    // Update the market data with the new price for the current chart symbol
    if (marketData[currentChartSymbol]) {
        const prevPrice = marketData[currentChartSymbol].price;
        const change = ((newPrice - prevPrice) / prevPrice) * 100;
        
        marketData[currentChartSymbol].price = newPrice;
        marketData[currentChartSymbol].change = change;
        marketData[currentChartSymbol].timestamp = Date.now();
        
        // Update the chart header info immediately
        updateChartHeaderInfo(currentChartSymbol);
    }
    
    // Update ALL stocks in the market data with new prices
    Object.keys(marketData).forEach(symbol => {
        if (symbol !== currentChartSymbol) { // Already updated the current symbol above
            const stock = marketData[symbol];
            const stockPrice = stock.price;
            
            // Generate a new price with lower volatility for other stocks
            const newStockPrice = generatePriceUpdate(stockPrice, 0.002);
            const stockChange = ((newStockPrice - stockPrice) / stockPrice) * 100;
            
            // Update the market data
            marketData[symbol].price = newStockPrice;
            marketData[symbol].change = stockChange;
            marketData[symbol].timestamp = Date.now();
        }
    });
    
    // Update market and portfolio tables immediately
    updateMarketTable();
    updatePortfolioTable();
    calculatePortfolioTotal();
    
    // Show the API key notification if using mock data
    if (usingMockData) {
        showApiKeyNotification();
    }
    
    // Apply all chart updates at once for smoother animation
    // This prevents the timeline and value updates from being out of sync
    requestAnimationFrame(() => {
        // Apply the prepared data updates
        tradingChart.data.labels = newLabels;
        tradingChart.data.datasets[0].data = newData;
        
        // Apply the color updates
        tradingChart.data.datasets[0].borderColor = lineColor;
        tradingChart.data.datasets[0].backgroundColor = gradient;
        tradingChart.data.datasets[0].pointBackgroundColor = lineColor;
        tradingChart.data.datasets[0].pointHoverBackgroundColor = lineColor;
        
        // Update the chart with animation
        tradingChart.update({
            duration: 300,  // Shorter animation duration for smoother updates
            easing: 'easeOutQuad'  // Smoother easing function
        });
    });
}

// ======== Mock Data Generation ========

/**
 * Generate mock stock quote data when API limits are reached
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock stock data
 */
function generateMockStockQuote(symbol) {
    console.log(`Generating mock data for ${symbol}`);
    
    // Base prices for common stocks to make the mock data somewhat realistic
    const basePrices = {
        'AAPL': 175.50,
        'MSFT': 320.75,
        'GOOGL': 140.25,
        'AMZN': 145.80,
        'META': 325.40,
        'TSLA': 240.60,
        'NVDA': 450.30,
        'JPM': 180.20,
        'V': 270.15,
        'WMT': 65.40
    };
    
    // Use base price if available, otherwise generate a random price between 50 and 500
    const basePrice = basePrices[symbol] || (50 + Math.random() * 450);
    
    // Add some randomness to the price (±2%)
    const randomFactor = 0.98 + (Math.random() * 0.04);
    const price = basePrice * randomFactor;
    
    // Generate a random change percentage between -2% and +2%
    const change = (Math.random() * 4) - 2;
    
    return {
        symbol,
        price,
        change,
        isMockData: true,
        timestamp: Date.now()
    };
}

/**
 * Generate mock stock history data when API limits are reached
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Time period (e.g., '1D', '1W')
 * @returns {Array} Mock history data
 */
function generateMockStockHistory(symbol, timeframe) {
    console.log(`Generating mock history for ${symbol} with timeframe ${timeframe}`);
    
    // Get current price from market data or generate a random one
    const currentData = marketData[symbol] || generateMockStockQuote(symbol);
    const currentPrice = currentData.price;
    
    // Determine number of data points based on timeframe
    let dataPoints = 30; // Default for 1D
    if (timeframe === '1W') dataPoints = 7;
    if (timeframe === '1M') dataPoints = 30;
    if (timeframe === '3M') dataPoints = 90;
    if (timeframe === '1Y') dataPoints = 365;
    
    // Generate dates for the timeframe
    const dates = [];
    const today = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
    
    // Generate price data with a somewhat realistic pattern
    // Start with a lower price and gradually move toward the current price
    const volatility = 0.01; // 1% daily volatility
    let startPrice = currentPrice * 0.9; // Start 10% lower than current price
    
    // Calculate how much the price needs to change each day to reach the current price
    const priceStep = (currentPrice - startPrice) / dataPoints;
    let price = startPrice;
    
    const history = dates.map((date, index) => {
        // Add some randomness to create a somewhat realistic price movement
        // but ensure we're trending toward the current price
        const dailyChange = (Math.random() - 0.4) * volatility; // Slightly biased toward up
        const trendComponent = priceStep * (1 + (Math.random() - 0.5) * 0.5); // Trend with some variance
        
        // Update price with both random movement and trend toward current price
        price = price * (1 + dailyChange) + trendComponent;
        
        // For the last data point, ensure it's exactly the current price
        if (index === dates.length - 1) {
            price = currentPrice;
        }
        
        return {
            date,
            close: price
        };
    });
    
    return history;
}

/**
 * Update the data source indicator to show if we're using real or mock data
 * @param {boolean} isMock - Whether we're using mock data
 */
function updateDataSourceIndicator(isMock) {
    // Find or create the data source indicator
    let indicator = document.querySelector('.data-source-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'data-source-indicator';
        
        // Insert after chart title
        const chartTitle = document.querySelector('.chart-title h2');
        if (chartTitle) {
            chartTitle.parentNode.appendChild(indicator);
        }
    }
    
    // Update the indicator content based on data source
    if (isMock) {
        indicator.className = 'data-source-indicator mock';
        indicator.innerHTML = '<i class="fas fa-circle"></i> Mock Data';
    } else {
        indicator.className = 'data-source-indicator real';
        indicator.innerHTML = '<i class="fas fa-circle"></i> Real-time Data';
    }
}

// ======== Page Navigation ========

/**
 * Initialize page navigation functionality
 */
function initializePageNavigation() {
    // Get all navigation items and pages
    const navItems = document.querySelectorAll('.main-nav li');
    const pages = document.querySelectorAll('.page');
    
    // Add click event to each navigation item
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            
            // Update active navigation item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Show selected page, hide others
            pages.forEach(page => {
                if (page.getAttribute('data-page') === pageId) {
                    page.style.display = 'block';
                    
                    // Update page-specific content
                    updatePageContent(pageId);
                } else {
                    page.style.display = 'none';
                }
            });
        });
    });
    
    // Show default page (dashboard)
    showPage('dashboard');
}

/**
 * Show a specific page
 * @param {string} pageId - ID of the page to show
 */
function showPage(pageId) {
    // Update active navigation item
    document.querySelectorAll('.main-nav li').forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show selected page, hide others
    document.querySelectorAll('.page').forEach(page => {
        if (page.getAttribute('data-page') === pageId) {
            page.style.display = 'block';
            
            // Update page-specific content
            updatePageContent(pageId);
        } else {
            page.style.display = 'none';
        }
    });
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Market table click events
    document.addEventListener('click', function(e) {
        // Use event delegation for market table rows
        if (e.target.closest('#marketTableBody tr')) {
            const row = e.target.closest('#marketTableBody tr');
            const symbol = row.getAttribute('data-symbol');
            if (symbol) {
                showGraphForSymbol(symbol);
            }
        }
    });
    
    // Timeframe buttons
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const timeframe = this.textContent;
            showGraphForSymbol(currentChartSymbol, timeframe);
        });
    });
    
    // Buy/Sell buttons in chart area
    const buyNowBtn = document.getElementById('buyNowBtn');
    const sellNowBtn = document.getElementById('sellNowBtn');
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            document.getElementById('stockSymbol').value = currentChartSymbol;
            document.getElementById('tradeType').value = 'buy';
            document.getElementById('quantity').focus();
        });
    }
    
    if (sellNowBtn) {
        sellNowBtn.addEventListener('click', () => {
            document.getElementById('stockSymbol').value = currentChartSymbol;
            document.getElementById('tradeType').value = 'sell';
            document.getElementById('quantity').focus();
        });
    }
    
    // Stock to USD converter events
    const stockAmountInput = document.getElementById('stockAmount');
    const stockSelect = document.getElementById('stockSelect');
    
    if (stockAmountInput && stockSelect) {
        stockAmountInput.addEventListener('input', updateConverter);
        stockSelect.addEventListener('change', updateConverter);
    }
    
    // Trade form submission
    const tradeForm = document.getElementById('tradeForm');
    if (tradeForm) {
        tradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            executeTrade();
        });
    }
}

/**
 * Update content for specific pages
 * @param {string} pageId - ID of the page to update
 */
function updatePageContent(pageId) {
    switch (pageId) {
        case 'portfolio':
            updatePortfolioPageContent();
            break;
        case 'history':
            updateHistoryPageContent();
            break;
        case 'stocks':
            updateStocksPageContent();
            break;
        case 'exchanges':
            // Static content, no update needed
            break;
        case 'community':
            // Static content, no update needed
            break;
    }
}

/**
 * Update Portfolio page content
 */
function updatePortfolioPageContent() {
    const portfolioBodyFull = document.getElementById('portfolioBodyFull');
    const portfolioTotalValue = document.getElementById('portfolioTotalValue');
    const portfolioProfitLoss = document.getElementById('portfolioProfitLoss');
    const portfolioPerformance = document.getElementById('portfolioPerformance');
    const portfolioProfitLossContainer = document.getElementById('portfolioProfitLossContainer');
    const portfolioPerformanceContainer = document.getElementById('portfolioPerformanceContainer');
    
    if (!portfolioBodyFull) return;
    
    portfolioBodyFull.innerHTML = '';
    let totalValue = 0;
    let totalCost = 0;
    
    // Show message if portfolio is empty
    if (Object.keys(portfolio).length === 0) {
        const row = portfolioBodyFull.insertRow();
        row.innerHTML = `<td colspan="7" class="empty-message">Your portfolio is empty. Start trading to see your holdings here.</td>`;
        
        // Update summary cards
        portfolioTotalValue.textContent = '0.00';
        portfolioProfitLoss.textContent = '0.00';
        portfolioPerformance.textContent = '0.00';
        portfolioProfitLossContainer.className = 'card-value';
        portfolioPerformanceContainer.className = 'card-value';
        return;
    }
    
    // Add each portfolio item to the table
    for (let [symbol, details] of Object.entries(portfolio)) {
        const curData = marketData[symbol] || {};
        const currentPrice = curData.price ?? 0;
        const totalItemValue = details.quantity * currentPrice;
        const totalItemCost = details.quantity * details.avgCost;
        const profitLoss = totalItemValue - totalItemCost;
        const profitLossPercent = details.avgCost > 0 ? 
            ((currentPrice - details.avgCost) / details.avgCost * 100).toFixed(2) : 
            '0.00';
        
        totalValue += totalItemValue;
        totalCost += totalItemCost;
        
        const row = portfolioBodyFull.insertRow();
        const profitClass = profitLoss >= 0 ? 'up' : 'down';
        
        row.innerHTML = `
            <td><strong>${symbol}</strong></td>
            <td>${details.quantity}</td>
            <td>$${details.avgCost.toFixed(2)}</td>
            <td>$${currentPrice.toFixed(2)}</td>
            <td>$${totalItemValue.toFixed(2)}</td>
            <td class="${profitClass}">${profitLoss >= 0 ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)} (${profitLoss >= 0 ? '+' : ''}${profitLossPercent}%)</td>
            <td>
                <button class="btn-buy" data-symbol="${symbol}">Buy</button>
                <button class="btn-sell" data-symbol="${symbol}">Sell</button>
            </td>
        `;
    }
    
    // Update summary cards
    portfolioTotalValue.textContent = totalValue.toFixed(2);
    
    const totalProfitLoss = totalValue - totalCost;
    portfolioProfitLoss.textContent = (totalProfitLoss >= 0 ? '+' : '') + totalProfitLoss.toFixed(2);
    portfolioProfitLossContainer.className = `card-value ${totalProfitLoss >= 0 ? 'up' : 'down'}`;
    
    const performancePercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : '0.00';
    portfolioPerformance.textContent = (performancePercent >= 0 ? '+' : '') + performancePercent;
    portfolioPerformanceContainer.className = `card-value ${performancePercent >= 0 ? 'up' : 'down'}`;
    
    // Add event listeners to buy/sell buttons
    document.querySelectorAll('.btn-buy, .btn-sell').forEach(button => {
        button.addEventListener('click', () => {
            const symbol = button.getAttribute('data-symbol');
            const isBuy = button.classList.contains('btn-buy');
            
            // Navigate to dashboard and set up trade form
            document.querySelector('.main-nav li[data-page="dashboard"]').click();
            document.getElementById('stockSymbol').value = symbol;
            document.getElementById('tradeType').value = isBuy ? 'buy' : 'sell';
            document.getElementById('quantity').focus();
            
            // Show the chart for this symbol
            showGraphForSymbol(symbol);
        });
    });
}

/**
 * Update History page content
 */
function updateHistoryPageContent() {
    const historyBody = document.getElementById('historyBody');
    const historyFilter = document.getElementById('historyFilter');
    const historySort = document.getElementById('historySort');
    
    if (!historyBody) return;
    
    // Function to render the history table
    const renderHistoryTable = () => {
        historyBody.innerHTML = '';
        
        // Show message if history is empty
        if (transactionHistory.length === 0) {
            const row = historyBody.insertRow();
            row.innerHTML = `<td colspan="6" class="empty-message">No transaction history yet. Start trading to see your history here.</td>`;
            return;
        }
        
        // Get filter and sort values
        const filterValue = historyFilter ? historyFilter.value : 'all';
        const sortValue = historySort ? historySort.value : 'date-desc';
        
        // Filter transactions
        let filteredHistory = [...transactionHistory];
        if (filterValue === 'buy') {
            filteredHistory = filteredHistory.filter(t => t.type === 'buy');
        } else if (filterValue === 'sell') {
            filteredHistory = filteredHistory.filter(t => t.type === 'sell');
        }
        
        // Sort transactions
        filteredHistory.sort((a, b) => {
            if (sortValue === 'date-desc') return b.timestamp - a.timestamp;
            if (sortValue === 'date-asc') return a.timestamp - b.timestamp;
            if (sortValue === 'amount-desc') return b.total - a.total;
            if (sortValue === 'amount-asc') return a.total - b.total;
            return 0;
        });
        
        // Add each transaction to the table
        filteredHistory.forEach(transaction => {
            const row = historyBody.insertRow();
            const date = new Date(transaction.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const typeClass = transaction.type === 'buy' ? 'down' : 'up';
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td class="${typeClass}">${transaction.type.toUpperCase()}</td>
                <td>${transaction.symbol}</td>
                <td>${transaction.quantity}</td>
                <td>$${transaction.price.toFixed(2)}</td>
                <td>$${transaction.total.toFixed(2)}</td>
            `;
        });
    };
    
    // Render the table initially
    renderHistoryTable();
    
    // Add event listeners to filter and sort controls
    if (historyFilter) {
        historyFilter.addEventListener('change', renderHistoryTable);
    }
    
    if (historySort) {
        historySort.addEventListener('change', renderHistoryTable);
    }
}

/**
 * Update Stocks page content
 */
function updateStocksPageContent() {
    const stocksBody = document.getElementById('stocksBody');
    const stockSearch = document.getElementById('stockSearch');
    const searchStockBtn = document.getElementById('searchStockBtn');
    
    if (!stocksBody) return;
    
    // Function to render the stocks table
    const renderStocksTable = (filter = '') => {
        stocksBody.innerHTML = '';
        
        // Get all symbols from market data and default tracked symbols
        const allSymbolsSet = new Set([...defaultTrackedSymbols, ...Object.keys(marketData)]);
        let allSymbols = Array.from(allSymbolsSet);
        
        // Apply filter if provided
        if (filter) {
            filter = filter.toUpperCase();
            allSymbols = allSymbols.filter(symbol => symbol.includes(filter));
        }
        
        // Show message if no stocks match filter
        if (allSymbols.length === 0) {
            const row = stocksBody.insertRow();
            row.innerHTML = `<td colspan="5" class="empty-message">No stocks found matching "${filter}". Try a different search term.</td>`;
            return;
        }
        
        // Add each stock to the table
        allSymbols.forEach(symbol => {
            const stockData = marketData[symbol] || generateMockStockQuote(symbol);
            const price = stockData.price;
            const change = stockData.change;
            const changeClass = change >= 0 ? 'up' : 'down';
            
            // Calculate mock market cap (price * random factor between 1M and 2T)
            const marketCapFactor = Math.pow(10, 6 + Math.floor(Math.random() * 6)); // Between 1M and 1T
            const marketCap = price * marketCapFactor;
            let marketCapFormatted;
            
            if (marketCap >= 1e12) {
                marketCapFormatted = (marketCap / 1e12).toFixed(2) + 'T';
            } else if (marketCap >= 1e9) {
                marketCapFormatted = (marketCap / 1e9).toFixed(2) + 'B';
            } else if (marketCap >= 1e6) {
                marketCapFormatted = (marketCap / 1e6).toFixed(2) + 'M';
            } else {
                marketCapFormatted = marketCap.toFixed(2);
            }
            
            const row = stocksBody.insertRow();
            row.innerHTML = `
                <td><strong>${symbol}</strong></td>
                <td>$${price.toFixed(2)}</td>
                <td class="${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</td>
                <td>$${marketCapFormatted}</td>
                <td>
                    <button class="btn-buy" data-symbol="${symbol}">Buy</button>
                    <button class="view-chart" data-symbol="${symbol}">Chart</button>
                </td>
            `;
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.stocks-section .btn-buy').forEach(button => {
            button.addEventListener('click', () => {
                const symbol = button.getAttribute('data-symbol');
                
                // Navigate to dashboard and set up trade form
                document.querySelector('.main-nav li[data-page="dashboard"]').click();
                document.getElementById('stockSymbol').value = symbol;
                document.getElementById('tradeType').value = 'buy';
                document.getElementById('quantity').focus();
                
                // Show the chart for this symbol
                showGraphForSymbol(symbol);
            });
        });
        
        document.querySelectorAll('.stocks-section .view-chart').forEach(button => {
            button.addEventListener('click', () => {
                const symbol = button.getAttribute('data-symbol');
                
                // Navigate to dashboard and show chart
                document.querySelector('.main-nav li[data-page="dashboard"]').click();
                showGraphForSymbol(symbol);
            });
        });
    };
    
    // Render the table initially
    renderStocksTable();
    
    // Add event listeners to search controls
    if (searchStockBtn && stockSearch) {
        searchStockBtn.addEventListener('click', () => {
            renderStocksTable(stockSearch.value);
        });
        
        stockSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                renderStocksTable(stockSearch.value);
                e.preventDefault();
            }
        });
    }
}

// Function to check API key and show notification if needed
function checkApiKey() {
    if (!isValidApiKey) {
        console.warn('API key is missing or invalid. Please provide a valid API key.');
        showApiKeyNotification();
        usingMockData = true;
    }
}

// Show API key notification when using mock data
function showApiKeyNotification() {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.api-key-missing');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'api-key-missing';
        notification.innerHTML = `
            <div class="api-key-content">
                <div class="api-key-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Using Mock Data</h3>
                    <button id="closeApiKeyNotice"><i class="fas fa-times"></i></button>
                </div>
                <p>For real-time stock data, please provide your Alpha Vantage API key in the app.js file.</p>
                <p>Replace <code>YOUR_API_KEY</code> with your actual API key.</p>
                <p>Get a free API key at <a href="https://www.alphavantage.co/support/#api-key" target="_blank">alphavantage.co</a></p>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Add close button event listener
        const closeBtn = notification.querySelector('#closeApiKeyNotice');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
            });
        }
    }
    
    // Show the notification
    notification.classList.add('show');
}

// Add event listener for the live update toggle button
function setupLiveUpdateToggle() {
    const liveToggle = document.getElementById('liveUpdateToggle');
    if (liveToggle) {
        liveToggle.addEventListener('click', () => {
            if (isLiveUpdating) {
                stopLiveUpdates();
            } else {
                startLiveUpdates();
            }
        });
    }
}

// On load: fetch real market data and display a default symbol in the chart
// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing trading simulator...');
    
    // Add dynamic styles
    addTradeNotificationStyles();
    
    // Update date display
    updateDateDisplay();
    
    // Initial data load with detailed logging
    console.log('Loading initial market data...');
    updateMarketDataAndUI();
    
    // Make sure we have data for all default symbols
    console.log('Ensuring data for all default symbols...');
    for (const symbol of defaultTrackedSymbols) {
        if (!marketData[symbol]) {
            console.log(`Generating initial data for ${symbol}`);
            marketData[symbol] = generateStockQuote(symbol);
        }
    }
    
    // Verify the chart canvas exists and is accessible
    console.log('Chart canvas element:', tradingChartCanvas);
    if (!tradingChartCanvas) {
        console.error('Trading chart canvas not found! Chart will not render.');
    } else {
        // Ensure canvas has proper dimensions
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            console.log('Chart container found, setting canvas dimensions...');
            tradingChartCanvas.width = chartContainer.clientWidth || 800;
            tradingChartCanvas.height = chartContainer.clientHeight || 400;
        }
    }
    
    // Show initial graph with error handling
    try {
        console.log('Initializing chart with default symbol...');
        const initialSymbol = getRandomTrackedSymbol() || 'AAPL';
        console.log(`Selected initial symbol: ${initialSymbol}`);
        showGraphForSymbol(initialSymbol);
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
    
    // Initialize page navigation
    initializePageNavigation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start live updates automatically
    console.log('Starting standard live updates...');
    startLiveUpdates();
    
    // Show welcome notification
    showSuccessNotification('Welcome to StockVibe Trading Simulator! Live updates are enabled.');
    
    // Add resize listener for chart responsiveness
    window.addEventListener('resize', () => {
        if (currentChartSymbol && tradingChart) {
            tradingChart.resize();
        }
    });
});
