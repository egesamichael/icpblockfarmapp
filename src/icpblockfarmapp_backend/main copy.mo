// Remove or fix the problematic import on line 3
// Make sure imports are at the top of the file before any other declarations

// Proper import syntax for Motoko - all imports must be at the top of the file
import Text "mo:base/Text";
import _Array "mo:base/Array";
import _Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import _Int "mo:base/Int";
import _Time "mo:base/Time";
import Principal "mo:base/Principal";

// Your actor definition should follow
actor {
  // LLM canister interface
  type LLMCanister = actor {
    complete : shared (params : CompleteParams) -> async CompleteResponse;
  };

  type CompleteParams = {
    prompt : Text;
    systemPrompt : ?Text; // Renamed from 'system' to 'systemPrompt'
    max_tokens : ?Nat;
    temperature : ?Float;
  };

  type CompleteResponse = {
    completion : Text;
  };

  // LLM canister principal - replace with the actual canister ID
  let llmCanisterId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai"); // Use a valid test principal
  let llmCanister : LLMCanister = actor(Principal.toText(llmCanisterId));
  
  // Function to call the LLM canister with improved error handling
  public shared func askLLM(prompt : Text, systemPrompt : Text) : async Text {
    let params : CompleteParams = {
      prompt = prompt;
      systemPrompt = ?systemPrompt;
      max_tokens = ?512;
      temperature = ?0.7;
    };
    
    try {
      let response = await llmCanister.complete(params);
      return response.completion;
    } catch (err) {
      _Debug.print("LLM Service Error: " # debug_show(err));
      return "I'm currently unable to process your request. Please try again in a few moments. If the issue persists, contact support.";
    };
  };

  // Base system prompt for all farming queries
  private let baseFarmingSystemPrompt = "You are a helpful farming assistant with expertise in agriculture, weather patterns, crop diseases, and livestock management. Provide concise, practical advice to farmers. Keep responses under 200 words and focus on actionable information.";

  // Keep these as query functions for compatibility with frontend
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "! Welcome to your farm assistant.";
  };

  public query func getFarmingAdvice(crop : Text) : async Text {
    let advice = switch (crop) {
      case "corn" { 
        "Corn needs full sun and well-drained soil. Plant in spring when soil temperature reaches 60°F. Space rows 30-36 inches apart. Based on current weather patterns, consider applying nitrogen fertilizer within the next 7 days for optimal growth." 
      };
      case "tomatoes" { 
        "Tomatoes thrive in warm soil and full sun. Plant seedlings after last frost. Water deeply and regularly. Our analysis indicates a moderate risk of late blight in your region - consider preventative copper-based fungicide application." 
      };
      case "wheat" { 
        "Wheat requires cool weather for early growth. Plant in fall for winter wheat or early spring for spring wheat. Needs well-drained soil. Current market trends suggest storing harvested wheat for 3-4 weeks for better prices." 
      };
      case "rice" { 
        "Rice needs flooded conditions and warm temperatures. Maintain 2-4 inches of water throughout growing season. Soil analysis indicates your fields may benefit from additional potassium supplements." 
      };
      case "potatoes" { 
        "Potatoes grow best in loose, well-drained soil. Plant seed potatoes 12 inches apart and 4 inches deep. Based on regional disease reports, watch for early signs of potato blight and consider preventative fungicide rotation." 
      };
      case "soybeans" { 
        "Soybeans perform best with full sun exposure and well-drained soil with pH 6.0-6.8. Plant after soil temperatures reach 60°F. Current market analysis shows strong demand - consider forward contracting a portion of your expected yield." 
      };
      case _ { 
        "I don't have specific advice for " # crop # " in my knowledge base. Try asking about common crops like corn, tomatoes, wheat, rice, potatoes, or soybeans." 
      };
    };
    
    return advice;
  };

  public query func getWeatherForecast() : async Text {
    return "Current: 24°C, Sunny\nTomorrow: 22°C, Partly Cloudy\nWednesday: 19°C, Rain";
  };

  public query func getMarketPrices() : async Text {
    return "Corn: $5.20/bushel (+2.3%)\nWheat: $6.75/bushel (-1.5%)\nSoybeans: $13.40/bushel (+3.1%)\nRice: $14.25/cwt (+0.8%)";
  };

  public query func getDiseaseAlerts() : async Text {
    return "Tomatoes: Late Blight - HIGH RISK\nCorn: Corn Leaf Blight - MEDIUM RISK";
  };

  public shared func getAIRecommendation(farmData : Text) : async Text {
    let prompt = "Analyze this farm data and provide specific recommendations: " # farmData;
    let systemPrompt = baseFarmingSystemPrompt # " Focus on irrigation, fertilization, and pest management recommendations based on the provided data.";
    return await askLLM(prompt, systemPrompt);
  };

  public query func getLivestockHealth() : async Text {
    return "Cattle: Good condition, continue regular vaccination schedule.\nPoultry: Attention needed, possible respiratory issues. Check ventilation in coops, monitor for symptoms.";
  };

  // Add LLM versions with different names
  public shared func getLLMGreeting(name : Text) : async Text {
    let prompt = "Greet a farmer named " # name # " in a friendly, professional way.";
    return await askLLM(prompt, baseFarmingSystemPrompt);
  };

  public shared func getLLMFarmingAdvice(crop : Text) : async Text {
    let prompt = "Provide specific farming advice for growing " # crop # ". Include information about soil requirements, planting times, spacing, and any current seasonal considerations.";
    return await askLLM(prompt, baseFarmingSystemPrompt);
  };

  public shared func getLLMWeatherForecast() : async Text {
    let prompt = "Generate a 3-day weather forecast for a farming region. Include temperature, conditions, and any weather warnings relevant to agriculture.";
    let systemPrompt = baseFarmingSystemPrompt # " When discussing weather forecasts, format them clearly with dates and temperatures.";
    return await askLLM(prompt, systemPrompt);
  };

  public shared func getLLMMarketPrices() : async Text {
    let prompt = "Provide current market prices for common agricultural commodities (corn, wheat, soybeans, rice). Include price trends (up or down).";
    let systemPrompt = baseFarmingSystemPrompt # " When discussing market prices, include the price per unit and percentage changes.";
    return await askLLM(prompt, systemPrompt);
  };

  public shared func getLLMDiseaseAlerts() : async Text {
    let prompt = "Generate current disease alerts for common crops. Include risk levels and prevention recommendations.";
    let systemPrompt = baseFarmingSystemPrompt # " When discussing crop diseases, clearly indicate risk levels (HIGH, MEDIUM, LOW) and provide specific prevention measures.";
    return await askLLM(prompt, systemPrompt);
  };

  public shared func getLLMAIRecommendation(farmData : Text) : async Text {
    let prompt = "Based on this farm data: " # farmData # ", provide a specific recommendation for irrigation, fertilization, or pest management.";
    return await askLLM(prompt, baseFarmingSystemPrompt);
  };

  public shared func getLLMLivestockHealth() : async Text {
    let prompt = "Provide a health status update for common farm livestock (cattle, poultry). Include any seasonal health concerns and preventative measures.";
    let systemPrompt = baseFarmingSystemPrompt # " When discussing livestock health, provide specific monitoring guidelines and early warning signs of common issues.";
    return await askLLM(prompt, systemPrompt);
  };

  // Comprehensive farming advice with LLM
  public shared func getComprehensiveFarmingAdvice(userQuery : Text) : async Text {
    let prompt = "The farmer is asking: \"" # userQuery # "\". Provide comprehensive farming advice addressing this specific query.";
    let systemPrompt = baseFarmingSystemPrompt # " Analyze the query carefully and provide information that directly addresses the farmer's specific question or concern.";
    return await askLLM(prompt, systemPrompt);
  };
};
