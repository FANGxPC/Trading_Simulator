/**
 * Simple Chart Implementation for Trading Simulator
 * This is a direct, no-frills implementation to ensure the chart is visible
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simple chart module loaded');
    
    // Initialize the chart after a short delay to ensure DOM is ready
    setTimeout(initializeChart, 500);
});

/**
 * Initialize a simple chart with basic data
 */
function initializeChart() {
    // Get the canvas element
    const canvas = document.getElementById('tradingChart');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    console.log('Canvas found:', canvas);
    
    // Make sure the canvas is visible
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    
    // Get the parent container
    const container = canvas.parentElement;
    if (container) {
        console.log('Container found:', container);
        container.style.height = '400px';
        container.style.position = 'relative';
    }
    
    // Get the 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return;
    }
    
    // Generate some sample data
    const labels = [];
    const data = [];
    
    // Create 400 data points
    const basePrice = 150;
    const now = new Date();
    let lastPrice = basePrice;
    let trend = 0; // Tracks the current trend direction (-1 to 1)
    
    for (let i = 0; i < 400; i++) {
        // Create time labels (last 400 seconds)
        const time = new Date(now.getTime() - (400 - i) * 1000);
        labels.push(time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}));
        
        // Calculate price with controlled randomness
        const randomFactor = (Math.random() - 0.5) * 2; // Reduced randomness
        
        // Gradually change the trend
        if (Math.random() > 0.95) {
            trend = (Math.random() - 0.5) * 0.1; // Small trend changes
        }
        
        // Calculate new price with trend and randomness
        const change = (randomFactor * 0.5) + trend;
        let newPrice = lastPrice + change;
        
        // Add occasional larger moves (5% chance)
        if (Math.random() > 0.95) {
            newPrice += (Math.random() - 0.5) * 4;
        }
        
        // Keep price within reasonable bounds
        newPrice = Math.max(basePrice * 0.9, Math.min(basePrice * 1.1, newPrice));
        
        // Add some momentum (40% of previous move)
        if (i > 0) {
            const momentum = (data[i-1] - (i > 1 ? data[i-2] : data[i-1])) * 0.4;
            newPrice += momentum;
        }
        
        data.push(parseFloat(newPrice.toFixed(2)));
        lastPrice = newPrice;
    }
    
    // Create a gradient for the chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    
    // Create the chart with enhanced configuration for better visibility
    try {
        console.log('Creating chart with data:', data);
        
        // Create a more visually appealing chart configuration
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    // Main line dataset
                    {
                        label: 'AAPL',
                        data: data,
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 1,
                        tension: 0,                    // Keep the smooth curve
                        pointRadius: 0,                   // Hide points by default
                        pointHoverRadius: 5,             // Show larger points on hover
                        pointBackgroundColor: 'white',    // White fill for points
                        pointBorderColor: 'rgb(16, 185, 129)', // Green border for points
                        pointBorderWidth: 2,              // Border width for points
                        pointHoverBorderWidth: 3,         // Thicker border on hover
                        fill: true,                      // Keep the fill under the line
                        borderJoinStyle: 'round',        // Smooth line joins
                        borderCapStyle: 'round',         // Smooth line caps
                        cubicInterpolationMode: 'monotone' // Smooth curve
                    },
                    // Dataset for the latest point (will be updated in updateSimpleChart)
                    {
                        label: 'Current',
                        data: Array(data.length - 1).fill(null).concat([data[data.length - 1]]),
                        borderColor: 'rgba(16, 185, 129, 0.9)',
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 7,
                        pointStyle: 'circle',
                        pointBorderColor: 'rgb(16, 185, 129)',
                        pointHoverBorderColor: 'rgb(16, 185, 129)',
                        pointHoverBackgroundColor: 'white',
                        showLine: false,
                        // Disable default animations
                        animation: {
                            duration: 1000
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,  // Match the update duration
                    easing: 'easeInOutQuad',
                    x: {
                        type: 'number',
                        easing: 'easeInOutQuad',
                        duration: 1000
                    },
                    y: {
                        type: 'number',
                        easing: 'easeInOutQuad',
                        duration: 1000
                    }
                },
                plugins: {
                    legend: {
                        display: false                   // Hide legend
                    },
                    tooltip: {
                        mode: 'index',                   // Show tooltip for all datasets at the same index
                        intersect: false,                // Show tooltip when cursor is anywhere over the x value
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1e293b',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        cornerRadius: 6,
                        padding: 10,
                        displayColors: false,            // Don't show color boxes
                        callbacks: {
                            // Format the tooltip text
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
                            color: '#94a3b8',
                            font: {
                                size: 10
                            },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10, // Show fewer ticks to prevent crowding
                            callback: function(value, index, values) {
                                // Show full time with seconds for better readability
                                return this.getLabelForValue(value);
                            }
                        },
                        time: {
                            displayFormats: {
                                millisecond: 'HH:mm:ss',
                                second: 'HH:mm:ss',
                                minute: 'HH:mm:ss',
                                hour: 'HH:mm:ss'
                            },
                            tooltipFormat: 'HH:mm:ss.SSS' // Show milliseconds in tooltip
                        }
                    },
                    y: {
                        position: 'right',               // Y axis on the right
                        grid: {
                            color: 'rgba(241, 245, 249, 0.6)' // Lighter grid lines
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 10
                            },
                            callback: function(value) {
                                return '$' + value.toFixed(2); // Format y-axis labels as currency
                            }
                        },
                        // Add padding to y-axis to prevent points from being cut off
                        grace: '5%'
                    }
                },
                // Interaction configuration
                interaction: {
                    mode: 'index',                       // Show all values at current x position
                    intersect: false                     // Don't require hovering directly over a point
                },
                // Elements configuration for styling points and lines
                elements: {
                    point: {
                        hoverBackgroundColor: 'white',    // White center on hover
                        hoverBorderWidth: 2              // Border on hover
                    },
                    line: {
                        borderWidth: 3                    // Thicker line
                    }
                }
            }
        });
        
        console.log('Chart created successfully:', chart);
        
        // Store the chart in window for access from console
        window.simpleChart = chart;
        
        // Show welcome message
        console.log('%c🚀 Welcome to Trading Simulation!', 'color: #10b981; font-size: 16px; font-weight: bold;');
        console.log('%cMonitor real-time price movements and track market trends.', 'color: #6b7280;');
        
        // Set up live updates (1 second interval for smooth updates)
        setInterval(updateSimpleChart, 2500, chart, data);
        
    } catch (error) {
        console.error('Error initializing trading simulation:', error);
    }
}

// Add these variables at the top of the file
let animationId = null;
let currentDot = { x: 0, y: 0 };
let targetDot = { x: 0, y: 0 };
let animationStart = 0;
const ANIMATION_DURATION = 1000; // 1 second

function animateDot(timestamp) {
    if (!animationStart) animationStart = timestamp;
    const progress = Math.min((timestamp - animationStart) / ANIMATION_DURATION, 1);
    
    // Easing function for smooth animation (easeOutQuad)
    const easeOut = t => t * (2 - t);
    
    // Calculate new position
    const x = currentDot.x + (targetDot.x - currentDot.x) * easeOut(progress);
    const y = currentDot.y + (targetDot.y - currentDot.y) * easeOut(progress);
    
    // Update the dot's position directly
    const dot = window.simpleChart?.getDatasetMeta(1)?.data[window.simpleChart.getDatasetMeta(1).data.length - 1];
    if (dot) {
        dot.x = x;
        dot.y = y;
        window.simpleChart.draw();
    }
    
    if (progress < 1) {
        animationId = requestAnimationFrame(animateDot);
    } else {
        animationId = null;
        animationStart = 0;
    }
}

function updateDotPosition() {
    if (!window.simpleChart) return;
    
    const dot = window.simpleChart.getDatasetMeta(1)?.data[window.simpleChart.getDatasetMeta(1).data.length - 1];
    if (!dot) return;
    
    // Store current position
    currentDot = { x: dot.x, y: dot.y };
    
    // Get the new target position
    window.simpleChart.update('none');
    const newDot = window.simpleChart.getDatasetMeta(1).data[window.simpleChart.getDatasetMeta(1).data.length - 1];
    if (newDot) {
        targetDot = { x: newDot.x, y: newDot.y };
        
        // Start animation if not already running
        if (!animationId) {
            animationStart = 0;
            animationId = requestAnimationFrame(animateDot);
        }
    }
}

/**
 * Update the chart with new data points
 * This enhanced version makes new values more visible and improves animation
 */
function updateSimpleChart(chart, initialData) {
    if (!chart) return;
    
    // Get the last price
    const lastPrice = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] || 150; // Default to base price if no data
    
    // Generate a new price with controlled randomness
    const randomChange = (Math.random() - 0.5) * 2; // Random between -1 and 1
    const newPrice = lastPrice + randomChange;
    
    // Get current time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    
    // Add new data point
    chart.data.labels.push(timeStr);
    chart.data.datasets[0].data.push(newPrice);
    
    // Update the current point dataset (the dot at the end)
    if (chart.data.datasets[1]) {
        chart.data.datasets[1].data = Array(chart.data.datasets[0].data.length - 1).fill(null).concat([newPrice]);
        
        // Update the dot position with smooth animation
        setTimeout(updateDotPosition, 0);
    }
    
    // Remove oldest data point if needed
    if (chart.data.labels.length > 400) {
        chart.options.animation = false;
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        // Also update the current point dataset after shift
        if (chart.data.datasets[1]) {
            chart.data.datasets[1].data.shift();
        }
    }
    
    // Store the last position for smooth animation
    if (!chart.lastY) chart.lastY = newPrice;
    
    // Calculate the difference for smooth transition
    const diff = newPrice - chart.lastY;
    chart.lastY = newPrice;
    
    // Update chart with smooth animation for the dot
    chart.update({
        duration: 1000,  // Longer duration for smoother animation
        easing: 'easeInOutQuad',  // Smoother easing function
        onComplete: function() {
            // Reset the animation state
            chart.lastUpdate = Date.now();
        }
    });
}
