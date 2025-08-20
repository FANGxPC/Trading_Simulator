# StockVibe Trading Simulator

A realistic stock trading simulator that lets you practice buying and selling stocks with virtual money, featuring live price updates, dynamic charts, and persistent local storage for your portfolio and transaction history.

---

Check out the [Trading Simulator](https://fangxpc.github.io/Trading_Simulator/#) for a realistic stock trading experience.

## 🚀 Features

- **Simulated Stock Market:** Trade popular stocks (AAPL, GOOGL, MSFT, TSLA, AMZN, META, and more) with realistic price movements and volatility.
- **Live Price Updates:** Enhanced live update system with momentum, volatility, and random market events for immersive trading.
- **Dynamic Charts:** Visualize real-time and historical price trends using animated, responsive charts.
- **Portfolio Management:** Track your holdings, average cost, current value, and profit/loss.
- **Transaction History:** Every buy/sell action is recorded and displayed for review.
- **Persistent Storage:** All data (portfolio, balance, transaction history) is saved in your browser’s localStorage—resume where you left off, even after closing the browser.
- **Reset Functionality:** Easily reset your simulator to start fresh.
- **Modern UI:** Clean, responsive interface with animated price changes and intuitive navigation.

---

## 🖥️ Demo

*Open `index.html` in your browser to start trading instantly. No backend or server required.*

---

## 🗂️ Project Structure

| File                | Purpose                                                         |
|---------------------|-----------------------------------------------------------------|
| `index.html`        | Main HTML structure and UI elements                             |
| `app.js`            | Core simulator logic: trading, state management, UI updates     |
| `storage.js`        | Handles saving/loading/clearing data in localStorage            |
| `live-updates.js`   | Enhanced live price update system with reliability features     |
| `simple-chart.js`   | Chart rendering and animation logic                             |
| `styles.css`        | Main styling for layout, tables, buttons, and dashboard         |
| `price-animations.css` | Animations for price changes and chart updates               |

---

## 🛠️ How It Works

- **State Persistence:**  
  - On load, the app checks for saved portfolio, balance, and transaction history in localStorage.
  - All changes (trades, price updates) are automatically saved every 30 seconds and before closing the page.
  - Use the **Reset** button to clear all saved data and restart with default values.

- **Live Market Simulation:**  
  - Stock prices update every few seconds, simulating real-world market volatility, trends, and news events.
  - Charts and tables update in real time for an engaging trading experience.

- **Trading:**  
  - Buy or sell stocks using the trade form.
  - Portfolio and transaction history update instantly.

---

## 🏁 Getting Started

1. **Clone or Download the Repository**
2. **Open `index.html` in your browser**
   - No build step, server, or dependencies required.
3. **Start Trading!**
   - Use the dashboard to buy/sell, view your portfolio, and watch live price changes.

---

## 📝 Customization

- **Tracked Stocks:**  
  - Edit the `defaultTrackedSymbols` array in `app.js` to add or remove stocks.
- **Price Simulation:**  
  - Adjust volatility and momentum factors in `app.js` or `live-updates.js` for different market behaviors.
- **Styling:**  
  - Customize `styles.css` and `price-animations.css` for a unique look.

---

## 🧩 Dependencies

- [Chart.js](https://www.chartjs.org/) (for chart rendering, included via CDN or npm if you extend the project)

---

## ⚠️ Notes

- **No real money or real stock trading is involved.**  
  This is an educational tool for learning and practicing trading strategies.
- **Browser Support:**  
  Requires a modern browser with JavaScript and localStorage support.


## 🙌 Credits

- UI and chart inspiration from modern trading dashboards.
- Developed by Md Sadique Imam.
- AI tools have been used in making of this project.

---

## 💡 Contributing

Pull requests and suggestions are welcome! Open an issue or submit a PR to help improve StockVibe.

---

*Happy Trading!*
