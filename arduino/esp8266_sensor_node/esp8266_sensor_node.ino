/*
 * ESP8266 Greenhouse Sensor Node — Zentra Flora
 * ──────────────────────────────────────────────
 * Soil Moisture : A0   (ADC, 0–1023  →  0–100 % wet)
 * DHT11/22      : D1   (GPIO5)
 * Water Pump    : D5   (GPIO14)  — relay / MOSFET, active HIGH
 * Fan           : D2   (GPIO4)   — relay / MOSFET, active HIGH
 *
 * Backend API
 *   POST /api/sensors  ← node pushes DHT + soil data every PUSH_INTERVAL_MS
 *                         backend's ActuatorControlAgent decides pump / fan state
 *                         and returns {"actuators":{"pump":bool,"fan":bool,...}}
 *
 * Library required: Adafruit DHT sensor library
 *   Arduino IDE → Sketch → Include Library → Manage Libraries → search "DHT sensor library" → Install
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <DHT.h>

// ── Configuration ─────────────────────────────────────────────────────────────
const char* ssid         = "mel";
const char* password     = "amincomel";

const char* BACKEND_IP   = "192.168.137.1";
const int   BACKEND_PORT = 8000;

const unsigned long PUSH_INTERVAL_MS = 2000;

// ── Pin Definitions ───────────────────────────────────────────────────────────
const int SOIL_PIN  = A0;   // Soil moisture sensor (analog)
const int DHT_PIN   = 5;    // D1 = GPIO5
const int FAN_PIN   = 4;    // D2 = GPIO4
const int PUMP_PIN  = 14;   // D5 = GPIO14

#define DHT_TYPE DHT11      // Change to DHT22 if you use DHT22

// ── State ─────────────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);

bool pump_state   = false;
bool fan_state    = false;

float temperature  = 0.0;
float humidity     = 0.0;
int   soil_raw     = 0;
int   soil_pct     = 0;     // 0 = dry, 100 = wet

unsigned long lastPushMs = 0;

ESP8266WebServer server(80);

// ── Forward declarations ──────────────────────────────────────────────────────
void connectToWiFi();
void readSensors();
void pushToBackend();
void applyActuator(int pin, bool& stateVar, bool desired, const char* label);
bool parseJsonBool(const String& json, const char* key, bool fallback);
void handleRoot();
void handleStatus();

// ── Helpers ───────────────────────────────────────────────────────────────────

String backendUrl(const char* path) {
  return String("http://") + BACKEND_IP + ":" + BACKEND_PORT + path;
}

void applyActuator(int pin, bool& stateVar, bool desired, const char* label) {
  if (desired == stateVar) return;
  stateVar = desired;
  digitalWrite(pin, desired ? HIGH : LOW);
  Serial.printf("[Actuator] %s -> %s\n", label, desired ? "ON" : "OFF");
}

bool parseJsonBool(const String& json, const char* key, bool fallback) {
  String token = String("\"") + key + "\":";
  int idx = json.indexOf(token);
  if (idx < 0) return fallback;
  int valStart = idx + token.length();
  while (valStart < (int)json.length() && json[valStart] == ' ') valStart++;
  if (json.indexOf("true",  valStart) == valStart) return true;
  if (json.indexOf("false", valStart) == valStart) return false;
  return fallback;
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(PUMP_PIN, OUTPUT); digitalWrite(PUMP_PIN, LOW);
  pinMode(FAN_PIN,  OUTPUT); digitalWrite(FAN_PIN,  LOW);

  dht.begin();

  Serial.println("\n\nZentra Flora — Sensor Node starting...");
  connectToWiFi();

  server.on("/",       handleRoot);
  server.on("/status", handleStatus);
  server.onNotFound([]() { server.send(404, "text/plain", "404 Not Found"); });

  server.begin();
  Serial.println("Local HTTP server started on port 80");
  Serial.print("Node IP  : "); Serial.println(WiFi.localIP());
  Serial.print("Backend  : "); Serial.println(backendUrl(""));
}

// ── Main Loop ─────────────────────────────────────────────────────────────────
void loop() {
  server.handleClient();

  if (millis() - lastPushMs >= PUSH_INTERVAL_MS) {
    lastPushMs = millis();
    readSensors();
    pushToBackend();
  }
}

// ── Read All Sensors ──────────────────────────────────────────────────────────
void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t)) temperature = t;
  if (!isnan(h)) humidity    = h;

  // Resistive sensor: high ADC = dry, low ADC = wet → invert to % wet
  soil_raw = analogRead(SOIL_PIN);
  soil_pct = map(soil_raw, 1023, 0, 0, 100);
  soil_pct = constrain(soil_pct, 0, 100);

  Serial.printf("[Sensors] Temp=%.1f°C  Hum=%.1f%%  Soil=%d (%d%%)\n",
    temperature, humidity, soil_raw, soil_pct);
}

// ── POST /api/sensors ─────────────────────────────────────────────────────────
void pushToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected — reconnecting...");
    connectToWiFi();
    return;
  }

  WiFiClient client;
  HTTPClient http;

  if (!http.begin(client, backendUrl("/api/sensors"))) {
    Serial.println("[Backend] Failed to open connection");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);

  String payload = "{";
  payload += "\"temperature\":"   + String(temperature, 1) + ",";
  payload += "\"humidity\":"      + String(humidity, 1)    + ",";
  payload += "\"light\":"         + String(0.0, 1)         + ",";
  payload += "\"soil_moisture\":" + String(soil_pct);
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    String response = http.getString();

    bool desired_pump = parseJsonBool(response, "pump", pump_state);
    bool desired_fan  = parseJsonBool(response, "fan",  fan_state);

    applyActuator(PUMP_PIN, pump_state, desired_pump, "Pump");
    applyActuator(FAN_PIN,  fan_state,  desired_fan,  "Fan");

    Serial.printf("[Backend] OK — Pump=%d  Fan=%d\n", pump_state, fan_state);

  } else if (httpCode < 0) {
    Serial.printf("[Backend] Connection error: %s\n", http.errorToString(httpCode).c_str());
  } else {
    Serial.printf("[Backend] HTTP %d: %s\n", httpCode, http.getString().c_str());
  }

  http.end();
}

// ── WiFi Connection ───────────────────────────────────────────────────────────
void connectToWiFi() {
  Serial.printf("Connecting to: %s\n", ssid);
  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    int s = WiFi.status();
    Serial.printf("WiFi failed (status=%d) --- ", s);
    if      (s == WL_NO_SSID_AVAIL)  Serial.println("SSID not found. Switch hotspot to 2.4 GHz.");
    else if (s == WL_CONNECT_FAILED) Serial.println("Wrong password.");
    else                              Serial.println("Unknown error. ESP8266 only supports 2.4 GHz.");
    Serial.println("Continuing in offline mode.");
  }
}

// ── Local Web Server Handlers ─────────────────────────────────────────────────
void handleRoot() {
  readSensors();

  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<meta http-equiv='refresh' content='2'>";
  html += "<title>Sensor Node</title>";
  html += "<style>body{font-family:Arial,sans-serif;margin:20px;background:#111;color:#eee;}";
  html += "h1{color:#4ade80;margin:0 0 4px}h2{font-size:14px;color:#6b7280;margin:0 0 20px}";
  html += ".card{background:#1f2937;border-radius:10px;padding:16px;margin:12px 0}";
  html += ".row{display:flex;gap:12px;flex-wrap:wrap}";
  html += ".metric{flex:1;min-width:120px;background:#111827;border-radius:8px;padding:12px}";
  html += ".val{font-size:32px;font-weight:800;color:#fff}.unit{font-size:13px;color:#6b7280}";
  html += ".label{font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase}";
  html += ".on{color:#4ade80;font-weight:700}.off{color:#6b7280}</style>";
  html += "</head><body>";
  html += "<h1>Zentra Flora</h1><h2>Sensor Node — " + WiFi.localIP().toString() + "</h2>";

  html += "<div class='card'><div class='row'>";
  html += "<div class='metric'><div class='label'>Temperature</div><div class='val'>" + String(temperature, 1) + "<span class='unit'> °C</span></div></div>";
  html += "<div class='metric'><div class='label'>Humidity</div><div class='val'>" + String(humidity, 1) + "<span class='unit'> %</span></div></div>";
  html += "<div class='metric'><div class='label'>Soil Moisture</div><div class='val'>" + String(soil_pct) + "<span class='unit'> %</span></div></div>";
  html += "<div class='metric'><div class='label'>Soil Raw ADC</div><div class='val'>" + String(soil_raw) + "<span class='unit'> /1023</span></div></div>";
  html += "</div></div>";

  html += "<div class='card'><b>Actuators</b><br><br>";
  html += "Water Pump: <span class='" + String(pump_state ? "on" : "off") + "'>" + String(pump_state ? "ON" : "OFF") + "</span><br>";
  html += "Fan: <span class='" + String(fan_state ? "on" : "off") + "'>" + String(fan_state ? "ON" : "OFF") + "</span>";
  html += "</div>";

  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleStatus() {
  readSensors();
  String json = "{";
  json += "\"temperature\":"   + String(temperature, 1)             + ",";
  json += "\"humidity\":"      + String(humidity, 1)                + ",";
  json += "\"soil_raw\":"      + String(soil_raw)                   + ",";
  json += "\"soil_moisture\":" + String(soil_pct)                   + ",";
  json += "\"pump\":"          + String(pump_state ? "true":"false") + ",";
  json += "\"fan\":"           + String(fan_state  ? "true":"false") + ",";
  json += "\"ip\":\""          + WiFi.localIP().toString()           + "\"";
  json += "}";
  server.send(200, "application/json", json);
}
