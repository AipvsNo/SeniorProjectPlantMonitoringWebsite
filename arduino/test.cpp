#include <WiFiS3.h>
// Remove or comment out the following line since we’re using plain HTTP
// #define WiFiClientSecure WiFiSSLClient
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "MHost";
const char* password = "musicmusic";

// Server details and endpoints for local HTTP testing
const char* server = "192.168.245.193";  // Your computer's local IP
const int port = 5000;                // Plain HTTP port on your local server
const char* commandPath = "/commands/arduino";
const char* environmentPath = "/environments";

// Use a plain WiFi client
WiFiClient client;

// Relay pins (global)
int relayPin_1 = 2;  // foggy
int relayPin_2 = 4;  // water

float h = 0;
float t = 0;

#include "DHT.h"

#define DHTPIN 3
#define DHTTYPE DHT22  // DHT 22 (AM2302), AM2321

DHT dht(DHTPIN, DHTTYPE);

// Logging helper
void logMessage(String message) {
  Serial.print("[LOG] ");
  Serial.print(millis());
  Serial.print(" ms: ");
  Serial.println(message);
}


void TempRead(){

    h = dht.readHumidity();
    t = dht.readTemperature();
    if (isnan(h) || isnan(t)) {
       Serial.println(F("Failed to read from DHT sensor!"));
    } 
     else {
     delay(2000);
     Serial.print(F("Humidity: "));
     Serial.print(h);
     Serial.print(F("%  Temperature: "));
     Serial.print(t);
     Serial.println(F("°C"));
     }
  }

// Function to send environment data via POST request
void sendEnvironmentData() {
  // Simulate sensor data
  TempRead();
  float airTemp = t;
  float airPercentHumidity = h;
  float soilTemp = 0;
  float soilPercentHumidity = 0;
  
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

void processCommand(String response) {
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, response);
  if (error) {
    logMessage("Failed to parse JSON command: " + String(error.c_str()));
    return;
  }
  
  // Check for the command context
  const char* context = doc["context"];
  if (!context) {
    logMessage("No context found in the command.");
    return;
  }
  
  // Retrieve the time duration from contextData
  int duration = doc["contextData"]["time"];
  if (duration <= 0) {
    logMessage("Invalid or missing duration in command.");
    return;
  }
  
  logMessage("Processing command: " + String(context) + " for duration: " + String(duration) + " ms");

  // Respond based on the context
  if (strcmp(context, "foggy") == 0) {
    digitalWrite(relayPin_1, HIGH);
    delay(duration);
    digitalWrite(relayPin_1, LOW);
  } 
  else if (strcmp(context, "water") == 0) {
    digitalWrite(relayPin_2, HIGH);
    delay(duration);
    digitalWrite(relayPin_2, LOW);
  } 
  else {
    logMessage("Unknown command context: " + String(context));
  }
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
      processCommand(response);
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

    // Initialize relay pins
  pinMode(relayPin_1, OUTPUT);
  pinMode(relayPin_2, OUTPUT);
  dht.begin();

  
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