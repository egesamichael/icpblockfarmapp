import Text "mo:base/Text";
import LLM "mo:llm";
import Blob "mo:base/Blob";
import IC "ic:aaaaa-aa";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Int "mo:base/Int";

actor {
  // Subscription types
  type Subscription = {
    plan: Text;
    startTime: Time.Time;
    endTime: Time.Time;
    transactionId: ?Text; // Optional transaction ID
  };

  // Subscription storage
  private stable var subscriptionEntries : [(Principal, Subscription)] = [];
  private var subscriptions = HashMap.HashMap<Principal, Subscription>(0, Principal.equal, Principal.hash);
  
  // User wallet storage
  private stable var walletEntries : [(Principal, Text)] = [];
  private var userWallets = HashMap.HashMap<Principal, Text>(0, Principal.equal, Principal.hash);
  
  // Admin wallet configuration
  private let ADMIN_WALLET : Text = "rrkah-fqaaa-aaaaa-aaaaq-cai"; // Replace with your admin wallet

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
   // var formatted = response;
    
    // Add formatting for better readability with Unicode emphasis
   // formatted := "\n📊 𝗙𝗔𝗥𝗠 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 𝗔𝗜 📊\n\n" # formatted;
    
    // Add a friendly closing with Unicode emphasis
   // formatted := formatted # "\n\n[𝗡𝗲𝗲𝗱 𝗺𝗼𝗿𝗲 𝗱𝗲𝘁𝗮𝗶𝗹𝘀? Just ask!]";
    // return formatted;
    return response;
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

  // Wallet management methods
  public shared(msg) func setUserWallet(walletAddress : Text) : async Bool {
    let caller = msg.caller;
    userWallets.put(caller, walletAddress);
    return true;
  };

  public shared(msg) func getUserWallet() : async ?Text {
    let caller = msg.caller;
    return userWallets.get(caller);
  };

  public shared(msg) func clearUserWallet() : async Bool {
    let caller = msg.caller;
    userWallets.delete(caller);
    return true;
  };

  // Subscription methods
  public shared(msg) func processSubscription(planId : Text) : async {success : Bool; message : Text; transactionId : ?Text} {
    let caller = msg.caller;
    
    // Check if user has connected a wallet
    switch (userWallets.get(caller)) {
      case (null) {
        return {
          success = false; 
          message = "No wallet connected. Please connect your wallet first.";
          transactionId = null;
        };
      };
      case (?userWallet) {
        // In a real implementation, you would:
        // 1. Process ICP token transfer using the Ledger canister
        // 2. Verify the payment was successful
        // 3. Then update the subscription
        
        // For playground purposes, we'll simulate a transaction
        let transactionId = Principal.toText(caller) # "-" # Int.toText(Time.now());
        
        // Update subscription
        let now = Time.now();
        let oneMonth = 30 * 24 * 60 * 60 * 1000000000; // 30 days in nanoseconds
        
        let subscription : Subscription = {
          plan = planId;
          startTime = now;
          endTime = now + oneMonth;
          transactionId = ?transactionId;
        };
        
        subscriptions.put(caller, subscription);
        
        return {
          success = true; 
          message = "Subscription activated successfully!";
          transactionId = ?transactionId;
        };
      };
    };
  };

  public shared(msg) func getUserSubscription() : async ?Text {
    let caller = msg.caller;
    
    switch (subscriptions.get(caller)) {
      case (null) { return null; };
      case (?subscription) {
        if (Time.now() > subscription.endTime) {
          // Subscription expired
          subscriptions.delete(caller);
          return null;
        };
        return ?subscription.plan;
      };
    };
  };
  
  // Initialize storage from stable variables
  system func preupgrade() {
    subscriptionEntries := Iter.toArray(subscriptions.entries());
    walletEntries := Iter.toArray(userWallets.entries());
  };

  system func postupgrade() {
    subscriptions := HashMap.fromIter<Principal, Subscription>(subscriptionEntries.vals(), 10, Principal.equal, Principal.hash);
    subscriptionEntries := [];
    
    userWallets := HashMap.fromIter<Principal, Text>(walletEntries.vals(), 10, Principal.equal, Principal.hash);
    walletEntries := [];
  };
}

