import { useState, useEffect } from 'react';
import { icpblockfarmapp_backend } from 'declarations/icpblockfarmapp_backend';

function App() {
  const [greeting, setGreeting] = useState('');
  const [advice, setAdvice] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [marketPrices, setMarketPrices] = useState(null);
  const [diseaseAlerts, setDiseaseAlerts] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [livestockHealth, setLivestockHealth] = useState(null);
  const [useLLM, setUseLLM] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from backend when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Add a connection status check
        let isConnected = false;
        try {
          // Simple check to see if we can reach the backend
          if (typeof icpblockfarmapp_backend.greet === 'function') {
            await icpblockfarmapp_backend.greet("connection_test");
            isConnected = true;
          }
        } catch (connectionError) {
          console.error("Backend connection error:", connectionError);
          setAiRecommendation("⚠️ Cannot connect to the backend canister. Please ensure the local replica is running with 'dfx start' in a terminal window.");
          // Continue with fallback data
        }

        if (!isConnected) {
          // Load all fallback data if not connected
          setWeatherData({
            current: '24°C, Sunny',
            tomorrow: '22°C, Partly Cloudy',
            wednesday: '19°C, Rain'
          });
          
          setMarketPrices([
            { crop: 'Corn', price: '$5.20/bushel', trend: 'up', change: '(+2.3%)' },
            { crop: 'Wheat', price: '$6.75/bushel', trend: 'down', change: '(-1.5%)' },
            { crop: 'Soybeans', price: '$13.40/bushel', trend: 'up', change: '(+3.1%)' },
            { crop: 'Rice', price: '$14.25/cwt', trend: 'up', change: '(+0.8%)' }
          ]);
          
          setDiseaseAlerts([
            { 
              crop: 'Tomatoes', 
              disease: 'Late Blight', 
              risk: 'high',
              recommendation: 'Apply fungicide immediately and monitor closely.'
            },
            { 
              crop: 'Corn', 
              disease: 'Corn Leaf Blight', 
              risk: 'medium',
              recommendation: 'Monitor conditions and prepare preventative measures.'
            }
          ]);
          
          if (!aiRecommendation) {
            setAiRecommendation("⚠️ DEMO MODE: Backend canister not connected. Start the local replica with 'dfx start' to enable live data and AI features.\n\nBased on current soil moisture levels, weather forecast, and crop growth stage, we recommend irrigation in the next 48 hours. Approximately 1.5 inches of water is optimal for your corn fields.");
          }
          
          setLivestockHealth([
            { animal: 'Cattle', info: 'Good condition, continue regular vaccination schedule.' },
            { animal: 'Poultry', info: 'Attention needed, possible respiratory issues. Check ventilation in coops, monitor for symptoms.' }
          ]);
          
          setIsLoading(false);
          return; // Skip the rest of the function
        }

        // Original fetch code continues here for when connection is successful
        // Check if backend functions exist before calling them
        // Fetch weather data
        if (typeof icpblockfarmapp_backend.getWeatherForecast === 'function') {
          const weatherResponse = await icpblockfarmapp_backend.getWeatherForecast();
          const weatherLines = weatherResponse.split('\n');
          const parsedWeather = {
            current: weatherLines[0].replace('Current: ', ''),
            tomorrow: weatherLines[1].replace('Tomorrow: ', ''),
            wednesday: weatherLines[2].replace('Wednesday: ', '')
          };
          setWeatherData(parsedWeather);
        } else {
          // Fallback data
          setWeatherData({
            current: '24°C, Sunny',
            tomorrow: '22°C, Partly Cloudy',
            wednesday: '19°C, Rain'
          });
          console.log("Warning: getWeatherForecast function not available in backend");
        }

        // Fetch market prices
        if (typeof icpblockfarmapp_backend.getMarketPrices === 'function') {
          const pricesResponse = await icpblockfarmapp_backend.getMarketPrices();
          const priceLines = pricesResponse.split('\n');
          const parsedPrices = priceLines.map(line => {
            const [crop, priceWithTrend] = line.split(': ');
            const [price, trend] = priceWithTrend.split(' ');
            return {
              crop,
              price,
              trend: trend.includes('+') ? 'up' : 'down',
              change: trend
            };
          });
          setMarketPrices(parsedPrices);
        } else {
          // Fallback data
          setMarketPrices([
            { crop: 'Corn', price: '$5.20/bushel', trend: 'up', change: '(+2.3%)' },
            { crop: 'Wheat', price: '$6.75/bushel', trend: 'down', change: '(-1.5%)' },
            { crop: 'Soybeans', price: '$13.40/bushel', trend: 'up', change: '(+3.1%)' },
            { crop: 'Rice', price: '$14.25/cwt', trend: 'up', change: '(+0.8%)' }
          ]);
          console.log("Warning: getMarketPrices function not available in backend");
        }

        // Fetch disease alerts
        if (typeof icpblockfarmapp_backend.getDiseaseAlerts === 'function') {
          const diseaseResponse = await icpblockfarmapp_backend.getDiseaseAlerts();
          const diseaseLines = diseaseResponse.split('\n');
          const parsedDiseases = diseaseLines.map(line => {
            const [crop, diseaseInfo] = line.split(': ');
            const [disease, risk] = diseaseInfo.split(' - ');
            return {
              crop,
              disease,
              risk: risk.toLowerCase().includes('high') ? 'high' : 'medium',
              recommendation: risk.includes('HIGH') 
                ? 'Apply fungicide immediately and monitor closely.' 
                : 'Monitor conditions and prepare preventative measures.'
            };
          });
          setDiseaseAlerts(parsedDiseases);
        } else {
          // Fallback data
          setDiseaseAlerts([
            { 
              crop: 'Tomatoes', 
              disease: 'Late Blight', 
              risk: 'high',
              recommendation: 'Apply fungicide immediately and monitor closely.'
            },
            { 
              crop: 'Corn', 
              disease: 'Corn Leaf Blight', 
              risk: 'medium',
              recommendation: 'Monitor conditions and prepare preventative measures.'
            }
          ]);
          console.log("Warning: getDiseaseAlerts function not available in backend");
        }

        // Fetch AI recommendation
        if (typeof icpblockfarmapp_backend.getComprehensiveFarmingAdvice === 'function') {
          const aiResponse = await icpblockfarmapp_backend.getComprehensiveFarmingAdvice("Give me a general farming recommendation based on best practices");
          setAiRecommendation(aiResponse);
        } else {
          // Fallback data
          setAiRecommendation("Based on current soil moisture levels, weather forecast, and crop growth stage, we recommend irrigation in the next 48 hours. Approximately 1.5 inches of water is optimal for your corn fields.");
          console.log("Warning: getComprehensiveFarmingAdvice function not available in backend");
        }

        // Fetch livestock health
        if (typeof icpblockfarmapp_backend.getLivestockHealth === 'function') {
          const livestockResponse = await icpblockfarmapp_backend.getLivestockHealth();
          const livestockLines = livestockResponse.split('\n');
          const parsedLivestock = livestockLines.map(line => {
            const [animal, info] = line.split(': ');
            return {
              animal,
              info
            };
          });
          setLivestockHealth(parsedLivestock);
        } else {
          // Fallback data
          setLivestockHealth([
            { animal: 'Cattle', info: 'Good condition, continue regular vaccination schedule.' },
            { animal: 'Poultry', info: 'Attention needed, possible respiratory issues. Check ventilation in coops, monitor for symptoms.' }
          ]);
          console.log("Warning: getLivestockHealth function not available in backend");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set fallback data if not already set
        if (!weatherData) {
          setWeatherData({
            current: '24°C, Sunny',
            tomorrow: '22°C, Partly Cloudy',
            wednesday: '19°C, Rain'
          });
        }
        // ... set other fallback data if needed ...
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  function handleCropAdvice(event) {
    event.preventDefault();
    const crop = selectedCrop.toLowerCase();
    
    if (typeof icpblockfarmapp_backend.getFarmingAdvice === 'function') {
      icpblockfarmapp_backend.getFarmingAdvice(crop).then((advice) => {
        setAdvice(advice);
      }).catch(error => {
        console.error("Error getting farming advice:", error);
        setAdvice("Sorry, we couldn't retrieve advice for this crop at the moment. Please try again later.");
      });
    } else {
      // Fallback advice
      const fallbackAdvice = {
        "corn": "Corn needs full sun and well-drained soil. Plant in spring when soil temperature reaches 60°F. Space rows 30-36 inches apart.",
        "tomatoes": "Tomatoes thrive in warm soil and full sun. Plant seedlings after last frost. Water deeply and regularly.",
        "wheat": "Wheat requires cool weather for early growth. Plant in fall for winter wheat or early spring for spring wheat. Needs well-drained soil.",
        "rice": "Rice needs flooded conditions and warm temperatures. Maintain 2-4 inches of water throughout growing season.",
        "potatoes": "Potatoes grow best in loose, well-drained soil. Plant seed potatoes 12 inches apart and 4 inches deep.",
        "soybeans": "Soybeans perform best with full sun exposure and well-drained soil with pH 6.0-6.8. Plant after soil temperatures reach 60°F."
      };
      
      setAdvice(fallbackAdvice[crop] || `We don't have specific advice for ${crop} in our database yet.`);
      console.log("Warning: getFarmingAdvice function not available in backend");
    }
    
    return false;
  }

  function handleSearch(event) {
    event.preventDefault();
    setAiRecommendation("Analyzing your query: " + searchQuery + "...");
    
    // Check if we should use the real LLM or simulated LLM
    if (useLLM) {
      if (typeof icpblockfarmapp_backend.getLLMFarmingAdvice === 'function') {
        // Use the real LLM backend function
        icpblockfarmapp_backend.getLLMFarmingAdvice(searchQuery).then((response) => {
          setAiRecommendation(response);
        }).catch(error => {
          console.error("Error getting LLM recommendation:", error);
          // If there's an error with the real LLM, fall back to simulation
          simulateLLMResponse(searchQuery);
        });
      } else {
        // If the backend function isn't available, use simulation
        simulateLLMResponse(searchQuery);
      }
      return;
    }
    
    // Standard AI processing with a delay (unchanged)
    setTimeout(() => {
      if (typeof icpblockfarmapp_backend.getComprehensiveFarmingAdvice === 'function') {
        // Use getComprehensiveFarmingAdvice instead of getAIRecommendation
        // This is a shared method that calls the LLM
        icpblockfarmapp_backend.getComprehensiveFarmingAdvice(searchQuery).then((response) => {
          setAiRecommendation(response);
        }).catch(error => {
          console.error("Error getting AI recommendation:", error);
          // Check if it's a connection error
          if (error.toString().includes("502") || error.toString().includes("connection")) {
            setAiRecommendation("⚠️ Cannot connect to the backend canister. Please ensure the local replica is running with 'dfx start' in a terminal window.\n\nFor now, here's a general response:\n\nBased on your query about \"" + 
              searchQuery + "\", consider monitoring soil moisture and weather conditions. For more specific advice, please ensure the backend is running.");
          } else {
            setAiRecommendation("I'm sorry, I couldn't process your query at this time. Please try again later.");
          }
        });
      } else {
        // Generate a fallback response
        setAiRecommendation(`Based on your query about "${searchQuery}", I recommend monitoring soil moisture levels and considering irrigation if dry conditions persist. For more specific advice, please check the crop management section.`);
        console.log("Warning: getComprehensiveFarmingAdvice function not available in backend");
      }
    }, 1500);
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your farm data...</p>
      </div>
    );
  }

  // Add toggle for LLM mode
  const toggleLLMMode = () => {
    setUseLLM(!useLLM);
  };

  return (
    <main>
      <header className="app-header">
        <h1>AI-Powered Farm Advisor</h1>
        <p className="tagline">Intelligent farming solutions for optimal yield and sustainability</p>
        <div className="llm-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={useLLM} 
              onChange={toggleLLMMode} 
            />
            Use Advanced AI (LLM)
          </label>
        </div>
      </header>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="tab-icon dashboard-icon"></i>
          Dashboard
        </div>
        <div 
          className={`tab ${activeTab === 'crops' ? 'active' : ''}`} 
          onClick={() => setActiveTab('crops')}
        >
          <i className="tab-icon crops-icon"></i>
          Crop Management
        </div>
        <div 
          className={`tab ${activeTab === 'livestock' ? 'active' : ''}`} 
          onClick={() => setActiveTab('livestock')}
        >
          <i className="tab-icon livestock-icon"></i>
          Livestock
        </div>
        <div 
          className={`tab ${activeTab === 'market' ? 'active' : ''}`} 
          onClick={() => setActiveTab('market')}
        >
          <i className="tab-icon market-icon"></i>
          Market Prices
        </div>
        <div 
          className={`tab ${activeTab === 'weather' ? 'active' : ''}`} 
          onClick={() => setActiveTab('weather')}
        >
          <i className="tab-icon weather-icon"></i>
          Weather
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Ask anything about your farm..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch}>
            <i className="search-icon"></i>
            Ask AI
          </button>
        </div>
        
        <div className="card ai-card">
          <h3><i className="ai-icon"></i> AI Recommendation</h3>
          <div className="ai-response">{aiRecommendation}</div>
        </div>
        
        <div className="dashboard">
          <div className="card weather-card">
            <h3><i className="weather-icon"></i> Weather Forecast</h3>
            <div className="weather-display">
              {weatherData?.current.includes('Sunny') && <div className="weather-icon-large">☀️</div>}
              {weatherData?.current.includes('Cloudy') && <div className="weather-icon-large">⛅</div>}
              {weatherData?.current.includes('Rain') && <div className="weather-icon-large">🌧️</div>}
              <div className="weather-details">
                <p className="current-weather">Current: {weatherData?.current}</p>
                <p>Humidity: 65%</p>
                <p><strong>Tomorrow:</strong> {weatherData?.tomorrow}</p>
              </div>
            </div>
          </div>
          
          <div className="card disease-card">
            <h3><i className="alert-icon"></i> Disease Alerts</h3>
            {diseaseAlerts?.map((alert, index) => (
              <div key={index} className={`disease-alert ${alert.risk === 'high' ? 'high-risk' : ''}`}>
                <div className="alert-header">
                  <span className="crop-name">{alert.crop}</span>
                  <span className={`risk-badge ${alert.risk}`}>{alert.risk.toUpperCase()} RISK</span>
                </div>
                <p className="disease-name">{alert.disease}</p>
                <p className="recommendation">{alert.recommendation}</p>
              </div>
            ))}
          </div>
          
          <div className="card market-card">
            <h3><i className="market-icon"></i> Market Prices</h3>
            {marketPrices?.slice(0, 3).map((item, index) => (
              <div key={index} className="price-item">
                <div className="crop-info">
                  <span className="crop-name">{item.crop}</span>
                  <span className="crop-price">{item.price}</span>
                </div>
                <span className={`price-trend ${item.trend}`}>
                  {item.trend === 'up' ? '↑' : '↓'} {item.change}
                </span>
              </div>
            ))}
            <button className="view-all-btn" onClick={() => setActiveTab('market')}>
              View All Prices
            </button>
          </div>
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'crops' ? 'active' : ''}`}>
        <h2>Crop Management</h2>
        
        <div className="crop-grid">
          {['Corn', 'Wheat', 'Soybeans', 'Tomatoes', 'Potatoes', 'Rice'].map((crop) => (
            <div 
              key={crop} 
              className={`crop-item ${selectedCrop.toLowerCase() === crop.toLowerCase() ? 'selected' : ''}`}
              onClick={() => setSelectedCrop(crop.toLowerCase())}
            >
              <div className="crop-icon">{getCropIcon(crop)}</div>
              <p>{crop}</p>
            </div>
          ))}
        </div>
        
        <div className="advisor-section">
          <h3>Farming Advisor</h3>
          <p>Select a crop above or use the dropdown to get AI-powered farming advice:</p>
          <form action="#" onSubmit={handleCropAdvice}>
            <select 
              value={selectedCrop} 
              onChange={(e) => setSelectedCrop(e.target.value)}
              required
            >
              <option value="">-- Select a crop --</option>
              <option value="corn">Corn</option>
              <option value="tomatoes">Tomatoes</option>
              <option value="wheat">Wheat</option>
              <option value="rice">Rice</option>
              <option value="potatoes">Potatoes</option>
              <option value="soybeans">Soybeans</option>
              <option value="other">Other</option>
            </select>
            {selectedCrop === 'other' && (
              <input 
                type="text" 
                placeholder="Enter crop name" 
                onChange={(e) => setSelectedCrop(e.target.value)}
              />
            )}
            <button type="submit">Get Advice</button>
          </form>
          <section id="farming-advice" className={advice ? 'active' : ''}>
            {advice && (
              <>
                <h4>AI Advice for {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)}</h4>
                <p>{advice}</p>
              </>
            )}
          </section>
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'livestock' ? 'active' : ''}`}>
        <h2>Livestock Management</h2>
        
        <div className="dashboard">
          {livestockHealth?.map((animal, index) => (
            <div key={index} className="card livestock-card">
              <h3>{getAnimalIcon(animal.animal)} {animal.animal}</h3>
              <p>{animal.info}</p>
              <div className="action-buttons">
                <button className="action-btn">Health Records</button>
                <button className="action-btn">Feeding Schedule</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'market' ? 'active' : ''}`}>
        <h2>Market Prices & Trends</h2>
        
        <div className="card">
          <h3>Current Market Prices</h3>
          <div className="price-table">
            <div className="price-header">
              <span>Crop</span>
              <span>Price</span>
              <span>Change</span>
              <span>Trend</span>
            </div>
            {marketPrices?.map((item, index) => (
              <div key={index} className="price-row">
                <span>{item.crop}</span>
                <span>{item.price}</span>
                <span className={`price-${item.trend}`}>{item.change}</span>
                <span className="trend-chart">
                  {item.trend === 'up' ? '📈' : '📉'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <h3>AI Market Analysis</h3>
          <div className="market-analysis">
            <p>Based on current trends and historical data, corn prices are expected to rise over the next 3 weeks. Consider delaying sales if storage is available.</p>
            <p>Wheat demand is projected to decrease slightly in the coming month due to international market conditions.</p>
            <div className="market-chart-placeholder">
              <p>Price Forecast Chart</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'weather' ? 'active' : ''}`}>
        <h2>Weather Forecast & Analysis</h2>
        
        <div className="weather-dashboard">
          <div className="card weather-card-large">
            <h3>5-Day Forecast</h3>
            <div className="forecast-grid">
              <div className="forecast-day">
                <p className="day-name">Today</p>
                <div className="weather-icon-large">
                  {weatherData?.current.includes('Sunny') && '☀️'}
                  {weatherData?.current.includes('Cloudy') && '⛅'}
                  {weatherData?.current.includes('Rain') && '🌧️'}
                </div>
                <p className="temperature">{weatherData?.current.split(',')[0]}</p>
                <p className="condition">{weatherData?.current.split(',')[1]}</p>
              </div>
              <div className="forecast-day">
                <p className="day-name">Tomorrow</p>
                <div className="weather-icon-large">
                  {weatherData?.tomorrow.includes('Sunny') && '☀️'}
                  {weatherData?.tomorrow.includes('Cloudy') && '⛅'}
                  {weatherData?.tomorrow.includes('Rain') && '🌧️'}
                </div>
                <p className="temperature">{weatherData?.tomorrow.split(',')[0]}</p>
                <p className="condition">{weatherData?.tomorrow.split(',')[1]}</p>
              </div>
              <div className="forecast-day">
                <p className="day-name">Wednesday</p>
                <div className="weather-icon-large">
                  {weatherData?.wednesday.includes('Sunny') && '☀️'}
                  {weatherData?.wednesday.includes('Cloudy') && '⛅'}
                  {weatherData?.wednesday.includes('Rain') && '🌧️'}
                </div>
                <p className="temperature">{weatherData?.wednesday.split(',')[0]}</p>
                <p className="condition">{weatherData?.wednesday.split(',')[1]}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3>AI Weather Impact Analysis</h3>
            <div className="weather-impact">
              <p>The upcoming rain on Wednesday will provide approximately 0.8 inches of precipitation, which is beneficial for your current corn growth stage.</p>
              <p>Consider harvesting mature tomatoes before Wednesday to prevent potential disease spread from increased humidity.</p>
              <div className="impact-severity">
                <span className="impact-label">Impact on Crops:</span>
                <div className="impact-meter">
                  <div className="impact-level" style={{width: '65%'}}></div>
                </div>
                <span className="impact-value">Moderate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="app-footer">
        <p>© 2023 AI-Powered Farm Advisor | Running on Internet Computer Protocol</p>
      </footer>
    </main>
  );
}

// Helper functions for icons
function getCropIcon(crop) {
  const icons = {
    'Corn': '🌽',
    'Wheat': '🌾',
    'Soybeans': '🫘',
    'Tomatoes': '🍅',
    'Potatoes': '🥔',
    'Rice': '🍚'
  };
  return icons[crop] || '🌱';
}

function getAnimalIcon(animal) {
  const icons = {
    'Cattle': '🐄',
    'Poultry': '🐔',
    'Pigs': '🐖',
    'Sheep': '🐑',
    'Goats': '🐐'
  };
  return icons[animal] || '🐾';
}

export default App;
