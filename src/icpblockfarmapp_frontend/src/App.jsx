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
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Check backend connection when component mounts
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        // Simple ping to check if backend is available
        await icpblockfarmapp_backend.greet("connection_test");
        setBackendAvailable(true);
        setConnectionStatus('connected');
      } catch (error) {
        console.error("Backend connection error:", error);
        setBackendAvailable(false);
        setConnectionStatus('disconnected');
        loadFallbackData();
      }
    };

    // Start loading the UI immediately
    setWeatherData({
      current: 'Loading...',
      tomorrow: 'Loading...',
      wednesday: 'Loading...'
    });
    
    setMarketPrices([
      { crop: 'Corn', price: 'Loading...', trend: 'up', change: '...' },
      { crop: 'Wheat', price: 'Loading...', trend: 'down', change: '...' },
      { crop: 'Soybeans', price: 'Loading...', trend: 'up', change: '...' },
      { crop: 'Rice', price: 'Loading...', trend: 'up', change: '...' }
    ]);
    
    setDiseaseAlerts([
      { 
        crop: 'Loading...', 
        disease: 'Loading...', 
        risk: 'medium',
        recommendation: 'Loading...'
      }
    ]);
    
    setLivestockHealth([
      { animal: 'Loading...', info: 'Loading...' }
    ]);

    checkBackendConnection();
  }, []);

  // Load fallback data when backend is not available
  const loadFallbackData = () => {
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
    
    setAiRecommendation("Based on current soil moisture levels, weather forecast, and crop growth stage, we recommend irrigation in the next 48 hours. Approximately 1.5 inches of water is optimal for your corn fields.");
    
    setLivestockHealth([
      { animal: 'Cattle', info: 'Good condition, continue regular vaccination schedule.' },
      { animal: 'Poultry', info: 'Attention needed, possible respiratory issues. Check ventilation in coops, monitor for symptoms.' }
    ]);
  };

  // Fetch data from backend when component mounts and backend is available
  useEffect(() => {
    if (!backendAvailable) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch weather data using the LLM-based function
        const weatherResponse = await icpblockfarmapp_backend.getWeatherForecast();
        
        // Parse the weather data - adjust this based on the actual format returned
        // Since we're using LLM, the format might be different
        const weatherLines = weatherResponse.split('\n');
        let parsedWeather = {
          current: 'Loading weather data...',
          tomorrow: 'Loading forecast...',
          wednesday: 'Loading forecast...'
        };
        
        // Extract weather information from the LLM response
        // This is a simple parsing approach - you might need to adjust based on actual responses
        for (const line of weatherLines) {
          if (line.toLowerCase().includes('today') || line.toLowerCase().includes('current')) {
            parsedWeather.current = line;
          } else if (line.toLowerCase().includes('tomorrow')) {
            parsedWeather.tomorrow = line;
          } else if (line.toLowerCase().includes('day after') || line.toLowerCase().includes('wednesday')) {
            parsedWeather.wednesday = line;
          }
        }
        
        setWeatherData(parsedWeather);
        
        // Fetch market prices
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

        // Generate random disease alerts using LLM
        const crops = ['Corn', 'Wheat', 'Soybeans', 'Tomatoes', 'Rice', 'Potatoes'];
        const randomCrops = crops.sort(() => 0.5 - Math.random()).slice(0, 2);
        const diseasePrompt = `Generate 2 realistic crop disease alerts for ${randomCrops.join(' and ')}. For each, include the crop name, disease name, risk level (HIGH or MEDIUM), and a brief recommendation. Format each alert as "CropName: DiseaseName - RISK_LEVEL"`;
        
        const diseaseResponse = await icpblockfarmapp_backend.getLLMFarmingAdvice(diseasePrompt);
        const diseaseLines = diseaseResponse.split('\n').filter(line => line.trim() !== '');
        
        const parsedDiseases = diseaseLines.map(line => {
          // Try to extract information from the LLM response
          let crop = '', disease = '', risk = 'medium', recommendation = '';
          
          // First try to parse with the expected format
          const colonSplit = line.split(':');
          if (colonSplit.length >= 2) {
            crop = colonSplit[0].trim();
            const remainingText = colonSplit.slice(1).join(':').trim();
            
            const dashSplit = remainingText.split('-');
            if (dashSplit.length >= 2) {
              disease = dashSplit[0].trim();
              const riskText = dashSplit[1].trim();
              risk = riskText.toLowerCase().includes('high') ? 'high' : 'medium';
              
              // Generate appropriate recommendation based on risk
              recommendation = risk === 'high' 
                ? 'Apply fungicide immediately and monitor closely.' 
                : 'Monitor conditions and prepare preventative measures.';
            } else {
              disease = remainingText;
            }
          } else {
            // If we can't parse properly, try to extract what we can
            const words = line.split(' ');
            crop = words[0] || 'Unknown Crop';
            disease = words.slice(1, 3).join(' ') || 'Unknown Disease';
          }
          
          return {
            crop,
            disease,
            risk,
            recommendation: recommendation || 'Consult with a local agricultural extension for specific treatment options.'
          };
        });
        
        // If we couldn't parse any diseases from the LLM response, use fallback
        if (parsedDiseases.length === 0) {
          setDiseaseAlerts([
            { 
              crop: randomCrops[0] || 'Corn', 
              disease: 'Fungal Infection', 
              risk: 'high',
              recommendation: 'Apply fungicide immediately and monitor closely.'
            },
            { 
              crop: randomCrops[1] || 'Wheat', 
              disease: 'Rust', 
              risk: 'medium',
              recommendation: 'Monitor conditions and prepare preventative measures.'
            }
          ]);
        } else {
          setDiseaseAlerts(parsedDiseases);
        }

        // Fetch AI recommendation
        const aiResponse = await icpblockfarmapp_backend.getComprehensiveFarmingAdvice("Give me a general farming recommendation based on best practices");
        setAiRecommendation(aiResponse);

        // Fetch livestock health
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
      } catch (error) {
        console.error("Error fetching data:", error);
        // If there's an error during fetch, load fallback data
        loadFallbackData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [backendAvailable]);

  function handleCropAdvice(event) {
    event.preventDefault();
    const crop = selectedCrop.toLowerCase();
    
    if (backendAvailable) {
      setIsLoading(true); // Changed from false to true
      icpblockfarmapp_backend.getFarmingAdvice(crop).then((advice) => {
        setAdvice(advice);
        setIsLoading(false);
      }).catch(error => {
        console.error("Error getting farming advice:", error);
        setAdvice(getFallbackAdvice(crop));
        setIsLoading(false);
      });
    } else {
      setAdvice(getFallbackAdvice(crop));
    }
    
    return false;
  }

  function getFallbackAdvice(crop) {
    const fallbackAdvice = {
      "corn": "Corn needs full sun and well-drained soil. Plant in spring when soil temperature reaches 60°F. Space rows 30-36 inches apart.",
      "tomatoes": "Tomatoes thrive in warm soil and full sun. Plant seedlings after last frost. Water deeply and regularly.",
      "wheat": "Wheat requires cool weather for early growth. Plant in fall for winter wheat or early spring for spring wheat. Needs well-drained soil.",
      "rice": "Rice needs flooded conditions and warm temperatures. Maintain 2-4 inches of water throughout growing season.",
      "potatoes": "Potatoes grow best in loose, well-drained soil. Plant seed potatoes 12 inches apart and 4 inches deep.",
      "soybeans": "Soybeans perform best with full sun exposure and well-drained soil with pH 6.0-6.8. Plant after soil temperatures reach 60°F."
    };
    
    return fallbackAdvice[crop] || `We don't have specific advice for ${crop} in our database yet.`;
  }

  function handleSearch(event) {
    event.preventDefault();
    setAiRecommendation("Analyzing your query: " + searchQuery + "...");
    
    if (useLLM) {
      if (backendAvailable) {
        setIsLoading(true); // Changed from false to true
        icpblockfarmapp_backend.getLLMFarmingAdvice(searchQuery).then((response) => {
          setAiRecommendation(response);
          setIsLoading(false);
        }).catch(error => {
          console.error("Error getting LLM recommendation:", error);
          simulateLLMResponse(searchQuery);
        });
      } else {
        simulateLLMResponse(searchQuery);
      }
      return;
    }
    
    // Standard AI processing
    setTimeout(() => {
      if (backendAvailable) {
        icpblockfarmapp_backend.getComprehensiveFarmingAdvice(searchQuery).then((response) => {
          setAiRecommendation(response);
        }).catch(error => {
          console.error("Error getting AI recommendation:", error);
          simulateLLMResponse(searchQuery);
        });
      } else {
        simulateLLMResponse(searchQuery);
      }
    }, 1500);
  }

  function simulateLLMResponse(query) {
    setIsLoading(false);
    
    setTimeout(() => {
      const responses = {
        "corn": "Based on your query about corn, I recommend:\n\n1. For optimal yield, ensure soil pH is between 5.8-6.8\n2. Apply nitrogen fertilizer in split applications\n3. Monitor for corn rootworm and European corn borer\n4. Maintain soil moisture especially during tasseling\n\nCurrent market trends suggest storing corn until mid-season if storage facilities permit.",
        "tomato": "For tomato cultivation:\n\n1. Prune suckers regularly to improve airflow\n2. Consider calcium supplementation to prevent blossom end rot\n3. Implement drip irrigation to reduce foliar diseases\n4. Monitor for early blight and septoria leaf spot\n\nHeirloom varieties are showing increased market demand this season.",
        "wheat": "Wheat management recommendations:\n\n1. Apply fungicide at flag leaf emergence for disease prevention\n2. Monitor nitrogen levels with tissue testing\n3. Scout for aphids and rust infections weekly\n4. Consider growth regulators if lodging is a concern\n\nGlobal wheat prices are projected to increase 4-7% by harvest time.",
        "irrigation": "Irrigation optimization strategies:\n\n1. Implement soil moisture sensors at multiple depths\n2. Consider deficit irrigation during less sensitive growth stages\n3. Adjust irrigation timing to early morning to reduce evaporation\n4. Evaluate water quality, particularly for sodium and bicarbonate levels\n\nNew precision irrigation technologies show 15-20% water savings potential.",
        "pest": "Integrated pest management approach:\n\n1. Establish action thresholds for key pests in your region\n2. Implement beneficial insect habitat around field borders\n3. Rotate pesticide modes of action to prevent resistance\n4. Consider pheromone traps for monitoring pest populations\n\nBiological control agents are showing increased efficacy for specific crop-pest combinations.",
        "soil": "Soil health improvement strategies:\n\n1. Implement multi-species cover crops between cash crops\n2. Consider reduced tillage practices to maintain soil structure\n3. Apply compost or manure to increase organic matter\n4. Test for micronutrient deficiencies, particularly zinc and boron\n\nHealthy soils can reduce fertilizer requirements by up to 30% over time.",
        "market": "Current agricultural market analysis:\n\n1. Commodity futures indicate strengthening prices for corn and soybeans\n2. Consider forward contracting 30-40% of expected production\n3. Specialty crop markets show increased demand for organic certification\n4. Input costs are projected to increase 5-8% next season\n\nDiversifying marketing channels can improve overall farm profitability."
      };
      
      let response = "Based on your query about \"" + query + "\", here are my recommendations:\n\n" +
        "1. Monitor soil moisture levels and adjust irrigation accordingly\n" +
        "2. Implement integrated pest management practices\n" +
        "3. Consider crop rotation to improve soil health\n" +
        "4. Stay updated on weather forecasts to plan field operations\n\n" +
        "For more specific advice, please provide details about your location, current crops, and specific challenges.";
      
      for (const [keyword, specificResponse] of Object.entries(responses)) {
        if (query.toLowerCase().includes(keyword)) {
          response = specificResponse;
          break;
        }
      }
      
      setAiRecommendation(response);
      setIsLoading(false);
    }, 2000);
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your farm data...</p>
      </div>
    );
  }

  const toggleLLMMode = () => {
    setUseLLM(!useLLM);
  };

  return (
    <main>
      <header className="app-header">
        <h1>AI-Powered Farm Advisor</h1>
        <p className="tagline">Intelligent farming solutions for optimal yield and sustainability</p>
        {connectionStatus === 'disconnected' && (
          <div className="connection-warning">
            ⚠️ Running in Demo Mode - Backend not connected. Start the local replica with 'dfx start' in a terminal.
          </div>
        )}
        <div className="llm-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={useLLM} 
              onChange={toggleLLMMode} 
              disabled={!backendAvailable}
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
          <div className="ai-response">
            {aiRecommendation.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
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
                  <span className="disease-crop-name">{alert.crop}</span>
                  <span className={`risk-badge ${alert.risk}`}>{alert.risk.toUpperCase()} RISK</span>
                </div>
                <p className="disease-crop-name">{alert.disease}</p>
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
        <p>© 2025 AI-Powered Farm Advisor | Running on Internet Computer Protocol</p>
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
