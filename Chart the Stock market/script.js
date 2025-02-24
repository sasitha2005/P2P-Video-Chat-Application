// Define stockData at the beginning
let stockData = {};

// Sample data for the chart
const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
const data = {
  labels: labels,
  datasets: [{
    label: 'Sample Stock Data',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
    data: [65, 59, 80, 81, 56, 55, 40],
  }]
};

// Config for the chart
const config = {
  type: 'line',
  data: data,
  options: {
    scales: {
      xAxes: [{
        gridLines: {
          color: '#999'
        },
        ticks: {
          fontColor: 'black'
        }
      }],
      yAxes: [{
        gridLines: {
          color: '#999'
        },
        ticks: {
          fontColor: 'black'
        },
        scaleLabel: {
          display: true,
          labelString: 'Price (USD)'
        }
      }]
    },
    responsive: false,
    legend: {
      display: true,
      labels: {
        fontColor: 'black'
      }
    },
    hover: {
      onHover: function () {
        document.getElementById('stockCanvas').style.cursor = 'pointer';
      }
    }
  }
};

// Render the chart
const ctx = document.getElementById('stockCanvas').getContext('2d');
const chart = new Chart(ctx, config);

// Function to generate dummy stock data for a new stock
function generateStockData(symbol) {
  const data = [];
  const date = new Date();
  for (let i = 0; i < 10; i++) {
    data.push({
      date: new Date(date.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.random() * 100
    });
  }
  return data;
}

// Query DOM
const symbolInput = document.getElementById('symbolInput');
const getStockBtn = document.getElementById('getStockBtn');
const removeStockBtn = document.getElementById('removeStockBtn');

// Mock WebSocket server using BroadcastChannel
const channel = new BroadcastChannel('stock_channel');

// Emit new stock and handle stock data
function emitNewStock() {
  const symbol = symbolInput.value.toUpperCase();
  if (symbol && !stockData[symbol]) {
    const newData = generateStockData(symbol);
    stockData[symbol] = newData;
    channel.postMessage({ type: 'add', symbol, data: newData });
    updateChart();
    symbolInput.value = '';
  }
}

getStockBtn.addEventListener('click', emitNewStock);
symbolInput.addEventListener('keyup', function(e) {
  if (e.keyCode === 13) {
    emitNewStock();
  }
});

// Handle removing stock data
function handleRemoveStock() {
  const symbol = symbolInput.value.toUpperCase();
  if (symbol && stockData[symbol]) {
    channel.postMessage({ type: 'remove', symbol });
    deleteStock(symbol);
    symbolInput.value = '';
  }
}

removeStockBtn.addEventListener('click', handleRemoveStock);

function updateChart() {
  const stockSymbols = Object.keys(stockData);
  const datasets = stockSymbols.map((symbol, i) => {
    const data = stockData[symbol].map(point => ({ x: new Date(point.date), y: point.price }));
    return {
      label: symbol,
      data,
      borderColor: `hsl(${i * 60}, 70%, 50%)`,
      fill: false
    };
  });

  chart.data.labels = stockData[stockSymbols[0]] ? stockData[stockSymbols[0]].map(point => point.date) : [];
  chart.data.datasets = datasets;
  chart.update();
}

// Handle messages from BroadcastChannel
channel.onmessage = function(event) {
  const message = event.data;
  if (message.type === 'add') {
    stockData[message.symbol] = message.data;
    updateChart();
  } else if (message.type === 'remove') {
    deleteStock(message.symbol);
  }
};

function deleteStock(symbol) {
  if (stockData[symbol]) {
    delete stockData[symbol];
    updateChart();
  }
}
// Save stock data to local storage
function saveStockData() {
  localStorage.setItem('stockData', JSON.stringify(stockData));
}

// Load stock data from local storage
function loadStockData() {
  const data = localStorage.getItem('stockData');
  if (data) {
    stockData = JSON.parse(data);
    updateChart();
  }
}

// Call loadStockData when the page loads
document.addEventListener('DOMContentLoaded', loadStockData);

// Modify emitNewStock and handleRemoveStock to save stock data
function emitNewStock() {
  const symbol = symbolInput.value.toUpperCase();
  if (symbol && !stockData[symbol]) {
    const newData = generateStockData(symbol);
    stockData[symbol] = newData;
    saveStockData();
    channel.postMessage({ type: 'add', symbol, data: newData });
    updateChart();
    symbolInput.value = '';
  }
}

function handleRemoveStock() {
  const symbol = symbolInput.value.toUpperCase();
  if (symbol && stockData[symbol]) {
    deleteStock(symbol);
    saveStockData();
    channel.postMessage({ type: 'remove', symbol });
    symbolInput.value = '';
  }
}

