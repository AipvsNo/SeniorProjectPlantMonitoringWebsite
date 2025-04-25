#include <WiFiS3.h>
// Remove or comment out the following line since we’re using plain HTTP
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Vee_2.4GHz";
const char* password = "B7lyE9&L";

// Server details and endpoints for local HTTP testing
const char* server = "192.168.0.88";  // Your computer's local IP
const int port = 5000;                // Plain HTTP port on your local server
const char* commandPath = "/commands/arduino";
const char* environmentPath = "/environments";

// Use a plain WiFi client
WiFiClient client;

// Logging helper
void logMessage(String message) {
  Serial.print("[LOG] ");
  Serial.print(millis());
  Serial.print(" ms: ");
  Serial.println(message);
}

// Function to send environment data via POST request
void sendEnvironmentData() {
  // Simulate sensor data
  float airTemp = random(180, 300) / 10.0;
  float airPercentHumidity = random(400, 800) / 10.0;
  float soilTemp = random(150, 250) / 10.0;
  float soilPercentHumidity = random(300, 700) / 10.0;
  
  DynamicJsonDocument doc(256);
  doc["airTemp"] = airTemp;
  doc["airPercentHumidity"] = airPercentHumidity;
  doc["soilTemp"] = soilTemp;
  doc["soilPercentHumidity"] = soilPercentHumidity;
  String jsonString;
  serializeJson(doc, jsonString);
  
  logMessage("Sending environment data via POST...");
  HttpClient http(client, server, port);
  http.beginRequest();
  http.post(environmentPath);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("Content-Length", String(jsonString.length()));
  http.beginBody();
  http.print(jsonString);
  http.endRequest();
  
  int statusCode = http.responseStatusCode();
  String response = http.responseBody();
  logMessage("Env POST Response Code: " + String(statusCode));
  logMessage("Env POST Response Body: " + response);
}





// Function to continuously poll for a command until no command is available
void pollCommand() {
  while (true) {
    logMessage("Polling for command via GET...");
    HttpClient http(client, server, port);
    http.beginRequest();
    http.get(commandPath);
    http.endRequest();
    
    int statusCode = http.responseStatusCode();
    String response = http.responseBody();
    
    if (statusCode == 200) {
      logMessage("Command received: " + response);
      // Process the command as needed here.
      // Immediately poll again.
    } else if (statusCode == 204) {
      logMessage("No command available (204)");
      break; // Exit the loop when no command is available.
    } else {
      logMessage("GET command error, status code: " + String(statusCode));
      break; // Exit on error.
    }
  }
}

// Timing variables
unsigned long lastCommandPoll = 0;
const unsigned long commandPollInterval = 10000; // 10 seconds (for testing)

unsigned long lastEnvPublish = 0;
const unsigned long envPublishInterval = 20000; // 10 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("Starting up...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println();
  logMessage("Connected to WiFi!");
  
  // Debug DNS resolution (should work since server is an IP)
  IPAddress serverIP;
  if (WiFi.hostByName(server, serverIP)) {
    Serial.print("Resolved server IP: ");
    Serial.println(serverIP);
  } else {
    Serial.println("DNS lookup failed!");
  }
}

void loop() {
  // Poll for command every commandPollInterval milliseconds.
  if (millis() - lastCommandPoll >= commandPollInterval) {
    lastCommandPoll = millis();
    pollCommand();
  }
  
  // Send environment data every envPublishInterval milliseconds.
  if (millis() - lastEnvPublish >= envPublishInterval) {
    lastEnvPublish = millis();
    sendEnvironmentData();
  }

}
