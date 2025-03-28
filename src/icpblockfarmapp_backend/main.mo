import Text "mo:base/Text";
import LLM "mo:llm";
// Keep only the imports we need
import Blob "mo:base/Blob";
import IC "ic:aaaaa-aa";

actor {

  let model = #Llama3_1_8B;
 

  let baseSystemPrompt = 
    "You are a helpful farming assistant with expertise in agriculture, crop care, livestock management, and weather forecasting. " #
    "Be concise, practical, and friendly. Limit answers to under 200 words.";

  // === Helper ===

  func chatWithLLM(prompt : Text) : async Text {
    await LLM.chat(model, [
      { role = #system_; content = baseSystemPrompt },
      { role = #user; content = prompt }
    ])
  };
  
  // Format AI responses to be more human-friendly
  func formatAIResponse(response : Text) : Text {
    var formatted = response;
    
    // Add formatting for better readability with Unicode emphasis
    formatted := "\n📊 𝗙𝗔𝗥𝗠 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 𝗔𝗜 📊\n\n" # formatted;
    
    // Add a friendly closing with Unicode emphasis
    formatted := formatted # "\n\n[𝗡𝗲𝗲𝗱 𝗺𝗼𝗿𝗲 𝗱𝗲𝘁𝗮𝗶𝗹𝘀? Just ask!]";
    
    return formatted;
  };

  // === Public Methods ===

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "! Welcome to your AI-powered farming assistant.";
  };

  
  // Keep the transform function to maintain interface compatibility
  public query func transform({
    context : Blob;  // Rename to _context to indicate it's unused
    response : IC.http_request_result;
  }) : async IC.http_request_result {
    {
      response with headers = []; // not interested in the headers
    };
  };

  public func getWeather(city : Text) : async Text {
    // Use LLM to generate weather data instead of API calls
    let prompt = "Generate realistic current weather data for " # city # " in a readable format. Include temperature, conditions, humidity, and wind speed.";
    let weatherData = await chatWithLLM(prompt);
    return formatAIResponse("Weather data for " # city # ":\n" # weatherData);
  };

 

  public func getWeatherForecast() : async Text {
    let prompt = "Provide a 3-day weather forecast suitable for farmers. Include temperature and conditions for each day.";
    let forecast = await chatWithLLM(prompt);
    return formatAIResponse(forecast);
  };

  public func getMarketPrices() : async Text {
    let prompt = "List current market prices for corn, wheat, soybeans, and rice. Include any recent price trends.";
    return await chatWithLLM(prompt);
  };

  public func getDiseaseAlerts() : async Text {
    let prompt = "List current crop disease alerts. Include affected crops, regions, and preventive measures.";
    return await chatWithLLM(prompt);
  };

  public func getLivestockHealth() : async Text {
    let prompt = "Give a health update for common farm animals (cattle, poultry, goats). Mention seasonal risks and care tips.";
    return await chatWithLLM(prompt);
  };

  // Existing methods
  public shared func getLLMGreeting(name : Text) : async Text {
    let prompt = "Greet a farmer named " # name # " in a warm and helpful tone.";
    return await chatWithLLM(prompt);
  };

  public shared func getLLMFarmingAdvice(crop : Text) : async Text {
    let prompt = "Give expert advice for growing " # crop # ". Include soil preferences, planting time, spacing, irrigation, and disease considerations.";
    return await chatWithLLM(prompt);
  };

  public shared func getLLMWeatherForecast() : async Text {
    let prompt = "Provide a 3-day weather forecast suitable for farmers. Include temperature and conditions.";
    return await chatWithLLM(prompt);
  };

  public shared func getLLMMarketPrices() : async Text {
    let prompt = "List current market prices for corn, wheat, soybeans, and rice. Include any recent price trends.";
    return await chatWithLLM(prompt);
  };

  public shared func getLLMDiseaseAlerts() : async Text {
    let prompt = "List current crop disease alerts. Include affected crops, regions, and preventive measures.";
    return await chatWithLLM(prompt);
  };

  public shared func getLLMLivestockHealth() : async Text {
    let prompt = "Give a health update for common farm animals (cattle, poultry, goats). Mention seasonal risks and care tips.";
    return await chatWithLLM(prompt);
  };

  public shared func getLLMAIRecommendation(farmData : Text) : async Text {
    let prompt = "Analyze the following farm data and provide recommendations for improving yield or reducing risk:\n" # farmData;
    return await chatWithLLM(prompt);
  };

  public shared func getComprehensiveFarmingAdvice(userQuery : Text) : async Text {
    let prompt = "A farmer is asking: \"" # userQuery # "\". Provide detailed and useful farming advice.";
    let response = await chatWithLLM(prompt);
    return formatAIResponse(response);
  };

  // Add this method to match what's being called in the frontend
  public func getFarmingAdvice(crop : Text) : async Text {
    let prompt = "Give expert advice for growing " # crop # ". Include soil preferences, planting time, spacing, irrigation, and disease considerations.";
    let response = await chatWithLLM(prompt);
    return formatAIResponse(response);
  };
};

