/**
 * ============= API Integration Instructions =============
 * 1. Choose your market data provider (e.g., Finnhub, Twelve Data, Alpha Vantage, etc.)
 * 2. Place your API key in the API_KEY variable below.
 * 3. Implement fetchStockQuote and fetchStockHistory with your selected provider's API endpoints.
 * See comments for more details!
 */

// === API Configuration ===
const API_KEY = 'I7WJKO27WH9RSZF7'; // <-- PLACE YOUR PROVIDER API KEY HERE

// Example base URLs (replace these with your provider's)
const QUOTE_API_URL = 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=I7WJKO27WH9RSZF7y';
const HISTORY_API_URL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=I7WJKO27WH9RSZF7y';

// Stocks tracked by default
const defaultTrackedSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META'];

// Initial state
let portfolio = {};
let balance = 10000;
let previousBalance = 10000; // For tracking change
let lastPortfolioTotal = 0;  // For tracking change

// Market data cache
let marketData = {};

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

// ======== API Integration Functions ========
async function fetchStockQuote(symbol) {
    try {
        let resp = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=I7WJKO27WH9RSZF7y`);
        let data = await resp.json();
        
        // Check for API limit message
        if (data['Note']) {
            console.warn('API rate limit reached:', data['Note']);
            alert('API rate limit reached. Please wait a minute and try again.');
            throw new Error('API rate limit reached');
        }
        
        const quote = data['Global Quote'];
        if (!quote || !quote['05. price']) {
            throw new Error('Invalid symbol or data not available');
        }
        
        const price = parseFloat(quote['05. price']);
        const prevClose = parseFloat(quote['08. previous close']);
        const change = prevClose ? ((price - prevClose) / prevClose * 100) : 0;
        
        return { symbol, price, change };
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        alert(`Error fetching quote for ${symbol}: ${error.message}`);
        throw error; // Propagate error so UI can handle it
    }
}

async function fetchStockHistory(symbol, timeframe = '1D') {
    try {
        let resp = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=I7WJKO27WH9RSZF7y`);
        let data = await resp.json();
        
        // Check for API limit message
        if (data['Note']) {
            console.warn('API rate limit reached:', data['Note']);
            alert('API rate limit reached. Please wait a minute and try again.');
            throw new Error('API rate limit reached');
        }
        
        const series = data['Time Series (Daily)'];
        if (!series) {
            throw new Error('Invalid symbol or data not available');
        }
        
        // Get the last 30 days of data and format it
        let prices = Object.entries(series)
            .slice(0, 30)
            .map(([date, info]) => ({
                date,
                close: parseFloat(info['4. close'])
            }))
            .reverse();
            
        return prices;
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error);
        alert(`Error fetching history for ${symbol}: ${error.message}`);
        throw error; // Propagate error so UI can handle it
    }
}

// API Integration Functions section end

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

// Fetch and update market prices for all tracked symbols
async function updateMarketDataAndUI() {
    // Show loading state
    document.body.classList.add('loading-data');
    
    // Fetch quotes for all tracked stocks
    const allSymbolsSet = new Set([...defaultTrackedSymbols, ...Object.keys(portfolio)]);
    const allSymbols = Array.from(allSymbolsSet);
    
    try {
        const promises = allSymbols.map(async (symbol) => {
            try {
                let data = await fetchStockQuote(symbol);
                marketData[symbol] = data;
            } catch (error) {
                console.error(`Failed to fetch data for ${symbol}:`, error);
                // Keep existing data if available
                if (!marketData[symbol]) {
                    marketData[symbol] = { symbol, price: 0, change: 0 };
                }
            }
        });
        
        await Promise.all(promises);
    } catch (error) {
        console.error('Error updating market data:', error);
        alert('There was a problem fetching market data. Some information may be outdated.');
    }
    
    // Update UI components
    updateMarketTable();
    updatePortfolioTable();
    calculatePortfolioTotal();
    
    // Update chart symbol data if it exists in the newly fetched data
    if (marketData[currentChartSymbol]) {
        updateChartHeaderInfo(currentChartSymbol);
    }
    
    // Update converter
    updateConverter();
    
    // Remove loading state
    document.body.classList.remove('loading-data');
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

// Shows the graph for symbol, fetching if needed
async function showGraphForSymbol(symbol, timeframe = currentTimeFrame) {
    if (!symbol) return;
    currentChartSymbol = symbol;
    currentTimeFrame = timeframe;
    
    // Update header info
    updateChartHeaderInfo(symbol);
    
    // Update time filter buttons
    timeFilters.forEach(btn => {
        if (btn.textContent === timeframe) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show loading state
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.classList.add('loading');

    // Fetch price history with the specified timeframe
    try {
        const history = await fetchStockHistory(symbol, timeframe);
        
        // Render the chart
        renderTradingGraph(symbol, history, timeframe);
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

// Render Chart.js graph for chosen symbol
function renderTradingGraph(symbol, history, timeframe) {
    if (!tradingChartCanvas) return;
    
    // Destroy previous chart if exists
    if (tradingChart) {
        tradingChart.destroy();
    }
    
    // Prepare data
    const labels = history.map(d => d.date);
    const data = history.map(d => d.close);
    
    // Determine color based on trend
    const firstPrice = data[0];
    const lastPrice = data[data.length - 1];
    const trendColor = lastPrice >= firstPrice ? '#10b981' : '#ef4444';
    const gradientColor = lastPrice >= firstPrice ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Get context and create gradient
    const ctx = tradingChartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, gradientColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    tradingChart = new Chart(tradingChartCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `${symbol} Price`,
                data,
                borderColor: trendColor,
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: trendColor,
                pointHoverBackgroundColor: trendColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: { 
                        autoSkip: true, 
                        maxTicksLimit: timeframe === '1H' ? 6 : 8,
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    beginAtZero: false,
                    suggestedMin: Math.min(...data) * 0.995,
                    suggestedMax: Math.max(...data) * 1.005
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#334155',
                    bodyColor: '#334155',
                    titleFont: {
                        weight: 'bold',
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: (items) => {
                            return items[0].label;
                        },
                        label: (context) => {
                            return `Price: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// ======== Trade execution and Logic ========

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
        alert('Please enter a valid stock symbol and quantity.');
        return;
    }
    
    // Check market data availability
    if (!marketData[symbol]) {
        // Try to fetch if not in our current market data
        try {
            const data = await fetchStockQuote(symbol);
            marketData[symbol] = data;
        } catch (err) {
            alert('Invalid stock symbol or price not available.');
            return;
        }
    }

    // Set previous balance for change tracking
    previousBalance = balance;
    
    const currentPrice = marketData[symbol].price;
    const totalCost = currentPrice * quantity;

    if (tradeType === 'buy') {
        if (totalCost > balance) {
            alert(`Insufficient funds. You need $${totalCost.toFixed(2)} but have $${balance.toFixed(2)}`);
            return;
        }
        
        // Deduct funds
        balance -= totalCost;
        
        // Track average cost for profit/loss calculation
        portfolio[symbol] = portfolio[symbol] || { quantity: 0, avgCost: 0 };
        portfolio[symbol].avgCost = calculateAverageCost(symbol, quantity, currentPrice, portfolio[symbol]);
        portfolio[symbol].quantity += quantity;
        
        // Success message
        showTradeNotification(`Successfully bought ${quantity} shares of ${symbol} at $${currentPrice.toFixed(2)}.`);
        
    } else { // sell
        if (!portfolio[symbol] || portfolio[symbol].quantity < quantity) {
            alert(`Not enough shares to sell. You have ${portfolio[symbol]?.quantity || 0} shares of ${symbol}.`);
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
        
        // Success message
        showTradeNotification(`Successfully sold ${quantity} shares of ${symbol} at $${currentPrice.toFixed(2)} with a ${profitLossText}.`);
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

// On load: fetch real market data and display a default symbol in the chart
(async function initializeApp() {
    // Add dynamic styles
    addTradeNotificationStyles();
    
    // Update date display
    updateDateDisplay();
    
    // Initialize stock data
    await updateMarketDataAndUI();
    
    // Setup converter
    updateConverter();
    
    // Show graph for default symbol
    showGraphForSymbol('AAPL');
    
    // Add resize listener for chart responsiveness
    window.addEventListener('resize', () => {
        if (currentChartSymbol && tradingChart) {
            tradingChart.resize();
        }
    });
})();
