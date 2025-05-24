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
    
    // Create 30 data points
    const basePrice = 150;
    for (let i = 0; i < 30; i++) {
        // Create time labels (last 30 minutes)
        const now = new Date();
        const time = new Date(now.getTime() - (30-i) * 60000);
        labels.push(time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        // Create price data with some randomness
        const randomFactor = Math.random() * 10 - 5; // Random between -5 and 5
        data.push(basePrice + randomFactor + i * 0.5); // Slight upward trend
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
                        backgroundColor: gradient,
                        borderWidth: 3,                  // Thicker line for better visibility
                        tension: 0.4,                    // Smooth curve
                        fill: true,                      // Fill area under the line
                        pointRadius: 0,                  // Hide points on the main line
                        cubicInterpolationMode: 'monotone' // Smoother curve that respects data points
                    },
                    // Dataset for the latest point (will be updated in updateSimpleChart)
                    {
                        label: 'Current',
                        data: Array(data.length - 1).fill(null).concat([data[data.length - 1]]),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgb(16, 185, 129)',
                        pointRadius: 5,                  // Large point for the latest value
                        pointHoverRadius: 8,             // Even larger on hover
                        pointStyle: 'circle',            // Circle point style
                        showLine: false                  // Don't show line, just the point
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500,                      // Faster animation
                    easing: 'easeOutQuad'               // Smooth easing function
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
                            display: false                // Hide x grid lines
                        },
                        ticks: {
                            color: '#94a3b8',             // Lighter text color
                            font: {
                                size: 10                  // Smaller font
                            },
                            maxTicksLimit: 6             // Limit number of ticks
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
        
        // Set up live updates
        setInterval(updateSimpleChart, 1000, chart, data);
        
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

/**
 * Update the chart with new data points
 * This enhanced version makes new values more visible and improves animation
 */
function updateSimpleChart(chart, initialData) {
    if (!chart) return;
    
    // Get the last price
    const lastPrice = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
    
    // Generate a new price with more significant randomness for visibility
    const randomChange = (Math.random() - 0.5) * 4; // Random between -2 and 2 (more visible)
    const newPrice = lastPrice + randomChange;
    
    // Get current time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    
    // Add new data
    chart.data.labels.push(timeStr);
    chart.data.datasets[0].data.push(newPrice);
    
    // Remove oldest data point if we have more than 30
    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    
    // Update chart color based on price movement
    const isPriceUp = newPrice >= lastPrice;
    const lineColor = isPriceUp ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
    chart.data.datasets[0].borderColor = lineColor;
    
    // Add point for the newest value to make it more visible
    chart.data.datasets[0].pointRadius = 0; // Reset all points
    
    // Create a second dataset just for the newest point
    if (!chart.data.datasets[1]) {
        chart.data.datasets.push({
            data: Array(chart.data.datasets[0].data.length - 1).fill(null).concat([newPrice]),
            borderColor: lineColor,
            backgroundColor: lineColor,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointStyle: 'circle',
            showLine: false
        });
    } else {
        // Update the point dataset
        chart.data.datasets[1].data = Array(chart.data.datasets[0].data.length - 1).fill(null).concat([newPrice]);
        chart.data.datasets[1].borderColor = lineColor;
        chart.data.datasets[1].backgroundColor = lineColor;
    }
    
    // Ensure y-axis scale updates to show the new value
    const min = Math.min(...chart.data.datasets[0].data) * 0.99;
    const max = Math.max(...chart.data.datasets[0].data) * 1.01;
    chart.options.scales.y.min = min;
    chart.options.scales.y.max = max;
    
    // Update the chart with animation
    chart.update({
        duration: 300,
        easing: 'easeOutQuad'
    });
    
    // Update price display in the UI if elements exist
    const priceElement = document.getElementById('chartPrice');
    if (priceElement) {
        priceElement.textContent = `$${newPrice.toFixed(2)}`;
        priceElement.className = isPriceUp ? 'price up' : 'price down';
    }
    
    const changeElement = document.getElementById('chartPriceChange');
    if (changeElement) {
        const changePercent = (randomChange / lastPrice) * 100;
        changeElement.textContent = `${isPriceUp ? '+' : ''}${changePercent.toFixed(2)}%`;
        changeElement.className = isPriceUp ? 'change up' : 'change down';
    }
    
    // Log the update
    console.log(`Chart updated: $${newPrice.toFixed(2)} (${isPriceUp ? '+' : '-'}${Math.abs(randomChange).toFixed(2)})`);
}
