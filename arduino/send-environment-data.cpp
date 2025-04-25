#include <WiFiS3.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Vee_2.4GHz";
const char* password = "B7lyE9&L";

// MQTT Broker settings
const char* mqtt_server = "broker.hivemq.com";

// Define a WiFi client and an MQTT client
WiFiClient wifiClient;
PubSubClient client(wifiClient);

// Variables to hold the "time" values received from the backend commands
float fanTime = 0.0;
float foggyTime = 0.0;
float valveTime = 0.0;

// ACK topic updated to match the web app requirement
const char* ackTopic = "plantique/ack/cGxhbnRpcXVl";

// Function to send an ACK message back to the backend
void sendAck(const char* context) {
  // Construct a JSON string for the acknowledgment
  String ackMessage = "{";
  ackMessage += "\"context\":\"";
  ackMessage += context;
  ackMessage += "\",\"status\":\"received\"}";
  
  // Publish the acknowledgment message on the ack topic
  client.publish(ackTopic, ackMessage.c_str());
  Serial.println("✅ Sent ACK for " + String(context));
}

// MQTT callback to process incoming messages
void callback(char* topic, byte* payload, unsigned int length) {
//  Serial.print("Message arrived on topic: ");
//  Serial.println(topic);

  // Convert payload to a String
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
//  Serial.println("Received message: " + message);

  // Parse the JSON payload using ArduinoJson
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Read the "context" field from the received JSON
  const char* context = doc["context"];

  // Process the command messages by context and send an ACK with the matching name
  if (strcmp(context, "fan") == 0) {
    fanTime = doc["contextData"]["time"];
    Serial.println("Updated fanTime: " + String(fanTime));
    sendAck("fan");  // ACK sent with singular context name
  } 
  else if (strcmp(context, "foggy") == 0) {
    foggyTime = doc["contextData"]["time"];
    Serial.println("Updated foggyTime: " + String(foggyTime));
    sendAck("foggy");
  } 
  else if (strcmp(context, "valve") == 0) {
    valveTime = doc["contextData"]["time"];
    Serial.println("Updated valveTime: " + String(valveTime));
    sendAck("valve");
  } 
  else {
    Serial.println("Unknown context received.");
    Serial.println("Received message: " + message);
  }
}

// Function to (re)connect to the MQTT broker
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ArduinoClient")) {
      Serial.println("✅ Connected to MQTT broker!");
      // Subscribe to the topic where the backend publishes commands
      client.subscribe("plantique/commands/cGxhbnRpcXVl");
    } 
    else {
      Serial.print("❌ Failed, rc=");
      Serial.print(client.state());
      Serial.println(" – trying again in 2 seconds");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nConnected to WiFi!");

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  reconnect();
}

unsigned long lastPublish = 0;
const unsigned long publishInterval = 2000; // 2 seconds

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  // Always process incoming MQTT messages
  client.loop();

  // Check if it's time to publish the environment data
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;

    // Publish environment data
    float airTemp = random(180, 300) / 10.0;
    float airPercentHumidity = random(400, 800) / 10.0;
    float soilTemp = random(150, 250) / 10.0;
    float soilPercentHumidity = random(300, 700) / 10.0;
    String topic = "plantique/cGxhbnRpcXVl";
    String message = "{"
                     "\"context\": \"environment\","
                     "\"contextData\": {"
                     "\"airTemp\": " + String(airTemp, 1) + ","
                     "\"airPercentHumidity\": " + String(airPercentHumidity, 1) + ","
                     "\"soilTemp\": " + String(soilTemp, 1) + ","
                     "\"soilPercentHumidity\": " + String(soilPercentHumidity, 1) +
                     "}}";
    client.publish(topic.c_str(), message.c_str());
    // Optionally, uncomment if you want to see the log:
    // Serial.println("📡 Published environment data: " + message);
  }
}
