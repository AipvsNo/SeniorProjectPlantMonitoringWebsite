#include <WiFiS3.h>
#define WiFiClientSecure WiFiSSLClient   // Use WiFiSSLClient for secure connections
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Vee_2.4GHz";
const char* password = "B7lyE9&L";

// Production server details and endpoints
const char* server = "api-plantique.veeraprachx.dev"; // Production domain
const int port = 443;                                  // HTTPS port
const char* commandPath = "/commands/arduino";
const char* environmentPath = "/environments";

// Logging helper
void logMessage(String message) {
  Serial.print("[LOG] ");
  Serial.print(millis());
  Serial.print(" ms: ");
  Serial.println(message);
}

void resetWiFiConnection() {
  logMessage("Resetting WiFi connection...");
  WiFi.disconnect();
  delay(1000);  // Wait a moment before reconnecting
  WiFi.begin(ssid, password);
  
  // Optionally wait until reconnected
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(500);
    logMessage("Waiting for WiFi connection...");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    logMessage("WiFi reconnected");
  } else {
    logMessage("WiFi reconnection failed");
  }
}


// Function to send environment data via POST request
void sendEnvironmentData() {
  // Create a new secure client instance
  WiFiClientSecure secureClient;
  
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
  HttpClient http(secureClient, server, port);
  http.beginRequest();
  http.post(environmentPath);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("Content-Length", String(jsonString.length()));
  http.sendHeader("Connection", "close");  // Force connection close
  http.beginBody();
  http.print(jsonString);
  http.endRequest();
  
  int statusCode = http.responseStatusCode();
  String response = http.responseBody();

  logMessage("Env POST Response Code: " + String(statusCode));
  logMessage("Env POST Response Body: " + response);

  if (statusCode < 0) {
    logMessage("Error in POST request, resetting WiFi connection.");
    resetWiFiConnection();
  }
  
  http.stop();
  logMessage("Connection closed");
}

void pollCommand() {
  // Create a new secure client instance for this request
  WiFiClientSecure secureClient;
  
  logMessage("Polling for command via GET...");
  HttpClient http(secureClient, server, port);
  http.beginRequest();
  http.get(commandPath);
  http.sendHeader("Connection", "close");  // Force the connection to close after response
  http.endRequest();
  
  int statusCode = http.responseStatusCode();
  String response = http.responseBody();
  
  logMessage("GET command response status: " + String(statusCode));
  logMessage("GET command response body: " + response);
  
  if (statusCode == 200) {
    logMessage("Command received: " + response);
    // Process the command as needed.
  } else {
    logMessage("GET command error, status code: " + String(statusCode));
    // Handle the error if necessary (e.g., reset WiFi connection or log additional info)
  }
  
  if (statusCode < 0) {
  // If an error code indicates a connection failure, reset the connection.
  resetWiFiConnection();
  }

  http.stop(); // Ensure the connection is properly closed.
}


// Timing variables
unsigned long lastCommandPoll = 0;
const unsigned long commandPollInterval = 7000; // 10 seconds

unsigned long lastEnvPublish = 0;
const unsigned long envPublishInterval = 14000; // 14 seconds

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
  
  // Debug DNS resolution
  IPAddress serverIP;
  if (WiFi.hostByName(server, serverIP)) {
    Serial.print("Resolved server IP: ");
    Serial.println(serverIP);
  } else {
    Serial.println("DNS lookup failed!");
  }
}

void loop() {
  // Poll for commands every commandPollInterval milliseconds.
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
