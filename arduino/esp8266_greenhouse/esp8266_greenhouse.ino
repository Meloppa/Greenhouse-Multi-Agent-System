/*
 * ESP8266 Greenhouse Node — Zentra Flora
 * ───────────────────────────────────────
 * Photoresistor : A0  (ADC, 0–1023)
 * LED D1        : GPIO5
 * LED D2        : GPIO4
 * LED D3        : GPIO0  — boot-mode pin; keep LOW during power-on
 *
 * Backend API
 *   POST /api/esp8266/sensor  ← node pushes sensor + LED state every PUSH_INTERVAL_MS
 *                                backend replies with desired LED states
 *   POST /api/esp8266/led     ← dashboard endpoint (sets desired LED states on backend)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ── Configuration ─────────────────────────────────────────────────────────────
const char* ssid         = "FREAKY";
const char* password     = "anasbabi";

const char* BACKEND_IP   = "192.168.137.1";  // Windows Mobile Hotspot fixed IP
const int   BACKEND_PORT = 8000;

const unsigned long PUSH_INTERVAL_MS = 2000;

// ── Pin Definitions ───────────────────────────────────────────────────────────
const int PHOTO_PIN = A0;
const int LED_D1    = 5;   // GPIO5 (D1)
const int LED_D2    = 4;   // GPIO4 (D2)
const int LED_D3    = 0;   // GPIO0 (D3) — keep LOW at boot

// ── State ─────────────────────────────────────────────────────────────────────
bool led1_state          = false;
bool led2_state          = false;
bool led3_state          = false;
int  photoresistor_value = 0;

unsigned long lastPushMs = 0;

ESP8266WebServer server(80);

// ── Forward declarations ──────────────────────────────────────────────────────
void connectToWiFi();
void pushToBackend();
void setLed(int led, bool state);
void handleRoot();
void handleSensor();
void handleStatus();

// ── Helpers ───────────────────────────────────────────────────────────────────

String backendUrl(const char* path) {
  return String("http://") + BACKEND_IP + ":" + BACKEND_PORT + path;
}

String buildSensorPayload() {
  String j = "{";
  j += "\"photoresistor\":"  + String(photoresistor_value)             + ",";
  j += "\"led1\":"           + String(led1_state ? "true" : "false")   + ",";
  j += "\"led2\":"           + String(led2_state ? "true" : "false")   + ",";
  j += "\"led3\":"           + String(led3_state ? "true" : "false");
  j += "}";
  return j;
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

// ── LED helper — led=0 means all ─────────────────────────────────────────────
void setLed(int led, bool state) {
  if (led == 1 || led == 0) { led1_state = state; digitalWrite(LED_D1, state ? HIGH : LOW); }
  if (led == 2 || led == 0) { led2_state = state; digitalWrite(LED_D2, state ? HIGH : LOW); }
  if (led == 3 || led == 0) { led3_state = state; digitalWrite(LED_D3, state ? HIGH : LOW); }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(LED_D1, OUTPUT); digitalWrite(LED_D1, LOW);
  pinMode(LED_D2, OUTPUT); digitalWrite(LED_D2, LOW);
  pinMode(LED_D3, OUTPUT); digitalWrite(LED_D3, LOW);

  Serial.println("\n\nZentra Flora — ESP8266 Node starting...");
  connectToWiFi();

  server.on("/",            handleRoot);
  server.on("/sensor",      handleSensor);
  server.on("/status",      handleStatus);

  server.on("/led1/on",     []() { setLed(1, true);  server.send(200, "text/plain", "LED D1 ON");    Serial.println("[Local] LED D1 ON");    });
  server.on("/led1/off",    []() { setLed(1, false); server.send(200, "text/plain", "LED D1 OFF");   Serial.println("[Local] LED D1 OFF");   });
  server.on("/led2/on",     []() { setLed(2, true);  server.send(200, "text/plain", "LED D2 ON");    Serial.println("[Local] LED D2 ON");    });
  server.on("/led2/off",    []() { setLed(2, false); server.send(200, "text/plain", "LED D2 OFF");   Serial.println("[Local] LED D2 OFF");   });
  server.on("/led3/on",     []() { setLed(3, true);  server.send(200, "text/plain", "LED D3 ON");    Serial.println("[Local] LED D3 ON");    });
  server.on("/led3/off",    []() { setLed(3, false); server.send(200, "text/plain", "LED D3 OFF");   Serial.println("[Local] LED D3 OFF");   });
  server.on("/led/all/on",  []() { setLed(0, true);  server.send(200, "text/plain", "All LEDs ON");  Serial.println("[Local] All LEDs ON");  });
  server.on("/led/all/off", []() { setLed(0, false); server.send(200, "text/plain", "All LEDs OFF"); Serial.println("[Local] All LEDs OFF"); });

  server.onNotFound([]() { server.send(404, "text/plain", "404 Not Found"); });

  server.begin();
  Serial.println("Local HTTP server started on port 80");
  Serial.print("ESP8266 IP : "); Serial.println(WiFi.localIP());
  Serial.print("Backend    : "); Serial.println(backendUrl(""));
}

// ── Main Loop ─────────────────────────────────────────────────────────────────
void loop() {
  server.handleClient();

  if (millis() - lastPushMs >= PUSH_INTERVAL_MS) {
    lastPushMs = millis();
    pushToBackend();
  }
}

// ── POST /api/esp8266/sensor ──────────────────────────────────────────────────
void pushToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected — reconnecting...");
    connectToWiFi();
    return;
  }

  photoresistor_value = analogRead(PHOTO_PIN);

  WiFiClient client;
  HTTPClient http;

  if (!http.begin(client, backendUrl("/api/esp8266/sensor"))) {
    Serial.println("[Backend] Failed to open connection");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);

  int httpCode = http.POST(buildSensorPayload());

  if (httpCode == 200) {
    String response = http.getString();

    bool d1 = parseJsonBool(response, "led1", led1_state);
    bool d2 = parseJsonBool(response, "led2", led2_state);
    bool d3 = parseJsonBool(response, "led3", led3_state);

    if (d1 != led1_state) { setLed(1, d1); Serial.printf("[Backend] LED D1 -> %s\n", d1 ? "ON" : "OFF"); }
    if (d2 != led2_state) { setLed(2, d2); Serial.printf("[Backend] LED D2 -> %s\n", d2 ? "ON" : "OFF"); }
    if (d3 != led3_state) { setLed(3, d3); Serial.printf("[Backend] LED D3 -> %s\n", d3 ? "ON" : "OFF"); }

    Serial.printf("[Backend] Photo=%4d  L1=%d L2=%d L3=%d\n",
      photoresistor_value, led1_state, led2_state, led3_state);

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
    Serial.println("Continuing in local-only mode.");
  }
}

// ── Local Web Server Handlers ─────────────────────────────────────────────────
void handleRoot() {
  photoresistor_value = analogRead(PHOTO_PIN);
  int lightPct = map(photoresistor_value, 0, 1023, 0, 100);

  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<title>ESP8266 Node</title>";
  html += "<style>body{font-family:Arial,sans-serif;margin:20px;background:#111;color:#eee;}";
  html += "h1{color:#4ade80;margin:0 0 4px}h2{font-size:14px;color:#6b7280;margin:0 0 20px}";
  html += ".card{background:#1f2937;border-radius:10px;padding:16px;margin:12px 0}";
  html += ".val{font-size:38px;font-weight:800;color:#fff;letter-spacing:-1px}";
  html += ".sub{font-size:12px;color:#6b7280;margin-top:2px}";
  html += ".bar-bg{background:#374151;border-radius:4px;height:8px;margin:8px 0}";
  html += ".bar-fill{background:linear-gradient(90deg,#16a34a,#4ade80);height:8px;border-radius:4px;transition:width .4s}";
  html += "button{padding:10px 18px;margin:4px;font-size:13px;font-weight:600;cursor:pointer;border:none;border-radius:6px}";
  html += ".btn-on{background:#4ade80;color:#000}.btn-off{background:#374151;color:#eee}";
  html += ".btn-all-on{background:#3b82f6;color:#fff}.btn-all-off{background:#ef4444;color:#fff}</style>";
  html += "</head><body>";
  html += "<h1>Zentra Flora</h1><h2>ESP8266 Greenhouse Node — " + WiFi.localIP().toString() + "</h2>";
  html += "<div class='card'><div style='font-size:13px;font-weight:700;color:#9ca3af;margin-bottom:8px'>PHOTORESISTOR (A0)</div>";
  html += "<div class='val' id='photo'>" + String(photoresistor_value) + "</div>";
  html += "<div class='sub'>raw ADC / 1023 &nbsp;&middot;&nbsp; <span id='pct'>" + String(lightPct) + "</span>% light level</div>";
  html += "<div class='bar-bg'><div class='bar-fill' id='bar' style='width:" + String(lightPct) + "%'></div></div></div>";
  html += "<div class='card'><div style='font-size:13px;font-weight:700;color:#9ca3af;margin-bottom:10px'>LED CONTROL</div>";
  html += "<div>D1 (GPIO5)&nbsp;<button class='btn-on' onclick=\"fetch('/led1/on')\">ON</button><button class='btn-off' onclick=\"fetch('/led1/off')\">OFF</button></div><br>";
  html += "<div>D2 (GPIO4)&nbsp;<button class='btn-on' onclick=\"fetch('/led2/on')\">ON</button><button class='btn-off' onclick=\"fetch('/led2/off')\">OFF</button></div><br>";
  html += "<div>D3 (GPIO0)&nbsp;<button class='btn-on' onclick=\"fetch('/led3/on')\">ON</button><button class='btn-off' onclick=\"fetch('/led3/off')\">OFF</button></div><br>";
  html += "<hr style='border-color:#374151'>";
  html += "<button class='btn-all-on' onclick=\"fetch('/led/all/on')\">ALL ON</button>";
  html += "<button class='btn-all-off' onclick=\"fetch('/led/all/off')\">ALL OFF</button></div>";
  html += "<script>setInterval(()=>{fetch('/sensor').then(r=>r.text()).then(v=>{";
  html += "document.getElementById('photo').textContent=v;";
  html += "let p=Math.round(v/1023*100);";
  html += "document.getElementById('pct').textContent=p;";
  html += "document.getElementById('bar').style.width=p+'%';";
  html += "})},1000);</script>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleSensor() {
  photoresistor_value = analogRead(PHOTO_PIN);
  server.send(200, "text/plain", String(photoresistor_value));
}

void handleStatus() {
  photoresistor_value = analogRead(PHOTO_PIN);
  String json = "{";
  json += "\"photoresistor\":"  + String(photoresistor_value)             + ",";
  json += "\"led1\":"           + String(led1_state ? "true" : "false")   + ",";
  json += "\"led2\":"           + String(led2_state ? "true" : "false")   + ",";
  json += "\"led3\":"           + String(led3_state ? "true" : "false")   + ",";
  json += "\"ip\":\""           + WiFi.localIP().toString()               + "\"";
  json += "}";
  server.send(200, "application/json", json);
}
