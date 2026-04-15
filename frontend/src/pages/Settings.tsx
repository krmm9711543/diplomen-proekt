import React, { useState, useEffect } from "react";
import { useUI } from "../context/UIContext";
import { useAuth } from "../context/AuthContext";
import {
  SlidersHorizontal,
  Home,
  Sofa,
  ChefHat,
  BedDouble,
  Car,
  Bath,
  CheckSquare,
  Square,
  Info,
  Bot,
  Lock,
  UserX,
  Calendar,
  Settings,
  EyeOff,
  Thermometer,
  Wind,
  Droplets,
  Users,
  ShieldAlert,
  Shield,
  Trash2,
  Zap,
  Languages,
  Palette,
  Moon,
  Sun as SunIcon,
  Copy,
  Cpu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "../utils/translations";
import { getApiUrl } from "../utils/api";

const ALL_ROOMS = ["Living Room", "Kitchen", "Basement", "Bedroom", "Garage", "Bathroom"];

const ROOM_ICONS: Record<string, React.ReactNode> = {
  "Living Room": <Sofa size={18} />,
  "Kitchen": <ChefHat size={18} />,
  "Basement": <Home size={18} />,
  "Bedroom": <BedDouble size={18} />,
  "Garage": <Car size={18} />,
  "Bathroom": <Bath size={18} />,
};

const ROOM_NAME_KEYS: Record<string, string> = {
  "Living Room": "livingRoom",
  "Kitchen": "kitchen",
  "Basement": "basement",
  "Bedroom": "bedroom",
  "Garage": "garage",
  "Bathroom": "bathroom",
};

const esp32Code = "#include <WiFi.h>\n#include <WiFiClient.h>\n#include <HTTPClient.h>\n\nconst char* ssid = \"YOUR_WIFI_SSID\";\nconst char* password = \"YOUR_WIFI_PASSWORD\";\n\n// Replace with your server IP and Device API Key\nconst char* serverUrl = \"http://YOUR_SERVER_IP:3001/api/hardware/update\";\n\nvoid setup() {\n  Serial.begin(115200);\n  WiFi.begin(ssid, password);\n  \n  while (WiFi.status() != WL_CONNECTED) {\n    delay(1000);\n    Serial.println(\"Connecting to WiFi...\");\n  }\n  Serial.println(\"Connected!\");\n}\n\nvoid loop() {\n  if (WiFi.status() == WL_CONNECTED) {\n    HTTPClient http;\n    http.begin(serverUrl);\n    \n    // Set headers\n    http.addHeader(\"Content-Type\", \"application/json\");\n    \n    // To use this, get your API Key from the Hardware Integration section in Settings\n    http.addHeader(\"X-API-Key\", \"YOUR_DEVICE_API_KEY\");\n    \n    // Example: sending status update\n    int httpResponseCode = http.POST(\"{\\\"status\\\":\\\"ON\\\",\\\"parameters\\\":{\\\"brightness\\\":100}}\");\n    \n    if (httpResponseCode > 0) {\n      String response = http.getString();\n      Serial.println(httpResponseCode);\n      Serial.println(response);\n    } else {\n      Serial.print(\"Error on sending POST: \");\n      Serial.println(httpResponseCode);\n    }\n    http.end();\n  }\n  delay(10000); // Send data every 10 seconds\n}";

const UserManagementPanel: React.FC = () => {
  const { language } = useUI();
  const t = useTranslation(language);
  const { token, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl("/api/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      setError("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleRoleToggle = async (id: string, currentRole: string) => {
    if (!token || id === user?.id) return;
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch(getApiUrl(`/api/users/${id}/role`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      setError("Failed to update role");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || id === user?.id) return;
    if (!window.confirm(t("confirmDeleteUser") || "Are you sure?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/users/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      setError("Failed to delete user");
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: "2rem",
        borderRadius: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b5cf6",
          }}
        >
          <Users size={22} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
            {t("userManagement")}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {t("manageAccess")}
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            fontSize: "0.875rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1rem",
              background: "var(--indicator-bg)",
              borderRadius: "1rem",
              border: "1px solid var(--glass-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: u.avatar
                    ? "transparent"
                    : u.role === "ADMIN"
                      ? "rgba(139,92,246,0.1)"
                      : "var(--indicator-bg)",
                  color:
                    u.role === "ADMIN" ? "#8b5cf6" : "var(--text-secondary)",
                  border: "2px solid",
                  borderColor:
                    u.role === "ADMIN"
                      ? "rgba(139,92,246,0.3)"
                      : "var(--glass-border)",
                }}
              >
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : u.role === "ADMIN" ? (
                  <ShieldAlert size={18} />
                ) : (
                  <Shield size={18} />
                )}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>
                  {u.username}
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color:
                      u.role === "ADMIN" ? "#8b5cf6" : "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {u.role}
                </p>
              </div>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <button
                onClick={() => handleRoleToggle(u.id, u.role)}
                disabled={u.id === user?.id}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  cursor: u.id === user?.id ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  opacity: u.id === user?.id ? 0.5 : 1,
                }}
              >
                {u.role === "ADMIN" ? t("demote") : t("promote")}
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                disabled={u.id === user?.id}
                style={{
                  padding: "0.4rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(239,68,68,0.1)",
                  cursor: u.id === user?.id ? "not-allowed" : "pointer",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: u.id === user?.id ? 0.5 : 1,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const {
    houseRooms,
    setHouseRooms,
    syncChartsWithRoom,
    setSyncChartsWithRoom,
    hideSensorsInSeeAll,
    setHideSensorsInSeeAll,
    tempAverageRooms,
    setTempAverageRooms,
    aqiAverageRooms,
    setAqiAverageRooms,
    humidityAverageRooms,
    setHumidityAverageRooms,
    powerAverageRooms,
    setPowerAverageRooms,
    language,
    setLanguage,
    theme,
    setTheme,
    devices,
  } = useUI();
  const { user } = useAuth();
  const t = useTranslation(language);
  const [saved, setSaved] = useState(false);

  const [vacuumSettings, setVacuumSettingsState] = useState(() => {
    try {
      const savedItem = localStorage.getItem("vacuumSettings");
      const defaults = {
        autoOnLock: false,
        autoOnAway: false,
        mode: "Standard",
        schedule: "Never",
        rooms: ALL_ROOMS,
      };
      if (!savedItem) return defaults;
      const settings = JSON.parse(savedItem);
      if (!settings.rooms) settings.rooms = ALL_ROOMS;
      return settings;
    } catch {
      return {
        autoOnLock: false,
        autoOnAway: false,
        mode: "Standard",
        schedule: "Never",
        rooms: ALL_ROOMS,
      };
    }
  });

  const setVacuumSettings = (newSettings: any) => {
    setVacuumSettingsState(newSettings);
    localStorage.setItem("vacuumSettings", JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleRoom = (room: string) => {
    const next = houseRooms.includes(room)
      ? houseRooms.filter((r) => r !== room)
      : [...houseRooms, room];
    setHouseRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAll = () => {
    const next = houseRooms.length === ALL_ROOMS.length ? [] : [...ALL_ROOMS];
    setHouseRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTempRoom = (room: string) => {
    const next = tempAverageRooms.includes(room)
      ? tempAverageRooms.filter((r) => r !== room)
      : [...tempAverageRooms, room];
    setTempAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAllTemp = () => {
    const next =
      tempAverageRooms.length === ALL_ROOMS.length ? [] : [...ALL_ROOMS];
    setTempAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAqiRoom = (room: string) => {
    const next = aqiAverageRooms.includes(room)
      ? aqiAverageRooms.filter((r) => r !== room)
      : [...aqiAverageRooms, room];
    setAqiAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAllAqi = () => {
    const next =
      aqiAverageRooms.length === ALL_ROOMS.length ? [] : [...ALL_ROOMS];
    setAqiAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleHumidityRoom = (room: string) => {
    const next = humidityAverageRooms.includes(room)
      ? humidityAverageRooms.filter((r) => r !== room)
      : [...humidityAverageRooms, room];
    setHumidityAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAllHumidity = () => {
    const next =
      humidityAverageRooms.length === ALL_ROOMS.length ? [] : [...ALL_ROOMS];
    setHumidityAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePowerRoom = (room: string) => {
    const next = powerAverageRooms.includes(room)
      ? powerAverageRooms.filter((r) => r !== room)
      : [...powerAverageRooms, room];
    setPowerAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleAllPower = () => {
    const next =
      powerAverageRooms.length === ALL_ROOMS.length ? [] : [...ALL_ROOMS];
    setPowerAverageRooms(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [showHardwareDetails, setShowHardwareDetails] = useState(false);

  return (
    <div
      className="animate-fade-in"
      style={{
        animationDuration: "0.4s",
        padding: "0 1.5rem",
        maxWidth: "1200px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--accent-color)",
            fontWeight: 600,
            fontSize: "0.875rem",
            marginBottom: "0.5rem",
          }}
        >
          <SlidersHorizontal size={16} />
          {t("preferences")}
        </div>
        <h2
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          {t("settings")}
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* COLUMN 1 */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Appearance & Language Section */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-color)",
                }}
              >
                <Palette size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  {t("appearanceLanguage")}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {t("personalizeExperience")}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label
                  className="form-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Languages size={14} /> {t("language")}
                </label>
                <div
                  style={{
                    display: "flex",
                    background: "var(--indicator-bg)",
                    padding: "4px",
                    borderRadius: "10px",
                  }}
                >
                  <button
                    onClick={() => setLanguage("en")}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        language === "en" ? "var(--card-bg)" : "transparent",
                      color:
                        language === "en"
                          ? "var(--accent-color)"
                          : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow:
                        language === "en"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage("bg")}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        language === "bg" ? "var(--card-bg)" : "transparent",
                      color:
                        language === "bg"
                          ? "var(--accent-color)"
                          : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow:
                        language === "bg"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                    }}
                  >
                    Български
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label
                  className="form-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {theme === "dark" ? (
                    <Moon size={14} />
                  ) : (
                    <SunIcon size={14} />
                  )}{" "}
                  {t("theme")}
                </label>
                <div
                  style={{
                    display: "flex",
                    background: "var(--indicator-bg)",
                    padding: "4px",
                    borderRadius: "10px",
                  }}
                >
                  <button
                    onClick={() => setTheme("light")}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        theme === "light" ? "var(--card-bg)" : "transparent",
                      color:
                        theme === "light"
                          ? "var(--accent-color)"
                          : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow:
                        theme === "light"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <SunIcon size={14} /> {t("lightMode")}
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        theme === "dark" ? "var(--card-bg)" : "transparent",
                      color:
                        theme === "dark"
                          ? "var(--accent-color)"
                          : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow:
                        theme === "dark"
                          ? "0 2px 4px rgba(0,0,0,0.05)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Moon size={14} /> {t("darkMode")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* House Master Toggle Section */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#d97706",
                  }}
                >
                  <Home size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("houseMasterToggle")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("houseMasterDesc")} <strong>{t("house")}</strong>{" "}
                    {t("tile")}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {houseRooms.length === ALL_ROOMS.length ? (
                  <Square size={14} />
                ) : (
                  <CheckSquare size={14} />
                )}
                {houseRooms.length === ALL_ROOMS.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "0.75rem",
                background: "rgba(59,130,246,0.06)",
                marginBottom: "1.5rem",
                border: "1px solid rgba(59,130,246,0.12)",
              }}
            >
              <Info
                size={16}
                color="var(--accent-color)"
                style={{ flexShrink: 0, marginTop: "1px" }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {language === "bg" ? (
                  <span>
                    Когато натиснете <strong>{t("onOff")}</strong> на плочката{" "}
                    <strong>{t("house")}</strong>, ще превключите всички
                    устройства в избраните стаи отдолу.
                  </span>
                ) : (
                  <span>
                    When you press <strong>{t("onOff")}</strong> on the{" "}
                    <strong>{t("house")}</strong> {t("tile")}, it will toggle
                    all devices in the selected rooms below.
                  </span>
                )}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {ALL_ROOMS.map((room) => {
                const included = houseRooms.includes(room);
                return (
                  <div
                    key={room}
                    onClick={() => toggleRoom(room)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "1rem",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: included
                        ? "rgba(251,191,36,0.5)"
                        : "var(--glass-border)",
                      background: included
                        ? "linear-gradient(135deg, rgba(234, 179, 8, 0.18), rgba(234, 179, 8, 0.08))"
                        : "var(--indicator-bg)",
                      transition: "all 0.2s",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        flexShrink: 0,
                        background: included
                          ? "rgba(251,191,36,0.2)"
                          : "var(--indicator-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: included ? "#d97706" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ROOM_ICONS[room]}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        flex: 1,
                        color: included
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {t(ROOM_NAME_KEYS[room])}
                    </span>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        flexShrink: 0,
                        border: "2px solid",
                        transition: "all 0.2s",
                        borderColor: included
                          ? "#d97706"
                          : "var(--glass-border)",
                        background: included ? "#d97706" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {included && (
                        <svg
                          width="11"
                          height="9"
                          viewBox="0 0 11 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "1.5rem",
                textAlign: "right",
                height: "20px",
                transition: "opacity 0.4s",
                opacity: saved ? 1 : 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--success-color)",
                  fontWeight: 700,
                }}
              >
                 {t("settingsSaved")}
              </span>
            </div>
          </div>

          {/* Temperature Graph Selection */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                  }}
                >
                  <Thermometer size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("tempGraphSelection")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("selectionOfRoomsForAvg")}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAllTemp}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {tempAverageRooms.length === ALL_ROOMS.length ? (
                  <Square size={14} />
                ) : (
                  <CheckSquare size={14} />
                )}
                {tempAverageRooms.length === ALL_ROOMS.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {ALL_ROOMS.map((room) => {
                const included = tempAverageRooms.includes(room);
                return (
                  <div
                    key={room}
                    onClick={() => toggleTempRoom(room)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "1rem",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: included
                        ? "rgba(59,130,246,0.5)"
                        : "var(--glass-border)",
                      background: included
                        ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))"
                        : "var(--indicator-bg)",
                      transition: "all 0.2s",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        flexShrink: 0,
                        background: included
                          ? "rgba(59,130,246,0.2)"
                          : "var(--indicator-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: included ? "#2563eb" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ROOM_ICONS[room]}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        flex: 1,
                        color: included
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {t(ROOM_NAME_KEYS[room])}
                    </span>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        flexShrink: 0,
                        border: "2px solid",
                        transition: "all 0.2s",
                        borderColor: included
                          ? "#2563eb"
                          : "var(--glass-border)",
                        background: included ? "#2563eb" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {included && (
                        <svg
                          width="11"
                          height="9"
                          viewBox="0 0 11 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Power Graph Selection */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(234,179,8,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ca8a04",
                  }}
                >
                  <Zap size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("powerGraphSelection")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("selectionOfRoomsForAvg")}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAllPower}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {powerAverageRooms.length === ALL_ROOMS.length ? (
                  <Square size={14} />
                ) : (
                  <CheckSquare size={14} />
                )}
                {powerAverageRooms.length === ALL_ROOMS.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {ALL_ROOMS.map((room) => {
                const included = powerAverageRooms.includes(room);
                return (
                  <div
                    key={room}
                    onClick={() => togglePowerRoom(room)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "1rem",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: included
                        ? "rgba(234,179,8,0.5)"
                        : "var(--glass-border)",
                      background: included
                        ? "linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.08))"
                        : "var(--indicator-bg)",
                      transition: "all 0.2s",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        flexShrink: 0,
                        background: included
                          ? "rgba(234,179,8,0.2)"
                          : "var(--indicator-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: included ? "#ca8a04" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ROOM_ICONS[room]}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        flex: 1,
                        color: included
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {t(ROOM_NAME_KEYS[room])}
                    </span>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        flexShrink: 0,
                        border: "2px solid",
                        transition: "all 0.2s",
                        borderColor: included
                          ? "#ca8a04"
                          : "var(--glass-border)",
                        background: included ? "#ca8a04" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {included && (
                        <svg
                          width="11"
                          height="9"
                          viewBox="0 0 11 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dashboard Behavior Section */}
          <div
            className="glass-panel"
            style={{
              padding: "2rem",
              borderRadius: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                  }}
                >
                  <Bot size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("autoSyncCharts")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("autoSyncDesc")}
                  </p>
                </div>
              </div>

              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                }}
              >
                <input
                  type="checkbox"
                  style={{ opacity: 0, width: 0, height: 0 }}
                  checked={syncChartsWithRoom}
                  onChange={() => {
                    setSyncChartsWithRoom(!syncChartsWithRoom);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: syncChartsWithRoom
                      ? "var(--accent-color)"
                      : "var(--toggle-bg-off)",
                    transition: ".44s",
                    borderRadius: "24px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: syncChartsWithRoom ? "22px" : "3px",
                      bottom: "3px",
                      backgroundColor: syncChartsWithRoom
                        ? "white"
                        : "var(--toggle-knob-off, white)",
                      transition: ".44s",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                </span>
              </label>
            </div>

            <div
              style={{
                height: "1px",
                background: "var(--glass-border)",
                opacity: 0.5,
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10b981",
                  }}
                >
                  <EyeOff size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("hideSensorsSeeAll")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("hideSensorsDesc")}
                  </p>
                </div>
              </div>

              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                }}
              >
                <input
                  type="checkbox"
                  style={{ opacity: 0, width: 0, height: 0 }}
                  checked={hideSensorsInSeeAll}
                  onChange={() => {
                    setHideSensorsInSeeAll(!hideSensorsInSeeAll);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: hideSensorsInSeeAll
                      ? "var(--accent-color)"
                      : "var(--toggle-bg-off)",
                    transition: ".44s",
                    borderRadius: "24px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "18px",
                      width: "18px",
                      left: hideSensorsInSeeAll ? "22px" : "3px",
                      bottom: "3px",
                      backgroundColor: hideSensorsInSeeAll
                        ? "white"
                        : "var(--toggle-knob-off, white)",
                      transition: ".44s",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          {user?.role === "ADMIN" && <UserManagementPanel />}
        </div>
        {/* COLUMN 2 */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Robot Vacuum Automations Section */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, rgba(236,72,153,0.25), rgba(236,72,153,0.1))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#db2777",
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  {t("robotVacuumAutomations")}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {t("robotVacuumDesc")}
                </p>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  background: "var(--indicator-bg)",
                  borderRadius: "1rem",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#db2777",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4
                      style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}
                    >
                      {t("cleanOnLock")}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t("cleanOnLockDesc")}
                    </p>
                  </div>
                </div>
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "44px",
                    height: "24px",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ opacity: 0, width: 0, height: 0 }}
                    checked={vacuumSettings.autoOnLock}
                    onChange={(e) =>
                      setVacuumSettings({
                        ...vacuumSettings,
                        autoOnLock: e.target.checked,
                      })
                    }
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: vacuumSettings.autoOnLock
                        ? "#ec4899"
                        : "var(--toggle-bg-off)",
                      transition: ".4s",
                      borderRadius: "24px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "18px",
                        width: "18px",
                        left: vacuumSettings.autoOnLock ? "22px" : "3px",
                        bottom: "3px",
                        backgroundColor: vacuumSettings.autoOnLock
                          ? "white"
                          : "var(--toggle-knob-off, white)",
                        transition: ".4s",
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                  </span>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  background: "var(--indicator-bg)",
                  borderRadius: "1rem",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#db2777",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <UserX size={18} />
                  </div>
                  <div>
                    <h4
                      style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}
                    >
                      {t("cleanOnAway")}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t("cleanOnAwayDesc")}
                    </p>
                  </div>
                </div>
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "44px",
                    height: "24px",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ opacity: 0, width: 0, height: 0 }}
                    checked={vacuumSettings.autoOnAway}
                    onChange={(e) =>
                      setVacuumSettings({
                        ...vacuumSettings,
                        autoOnAway: e.target.checked,
                      })
                    }
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: vacuumSettings.autoOnAway
                        ? "#ec4899"
                        : "var(--toggle-bg-off)",
                      transition: ".4s",
                      borderRadius: "24px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "18px",
                        width: "18px",
                        left: vacuumSettings.autoOnAway ? "22px" : "3px",
                        bottom: "3px",
                        backgroundColor: vacuumSettings.autoOnAway
                          ? "white"
                          : "var(--toggle-knob-off, white)",
                        transition: ".4s",
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                  </span>
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--indicator-bg)",
                    borderRadius: "1rem",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Settings size={16} color="var(--text-secondary)" />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      {t("defaultMode")}
                    </h4>
                  </div>
                  <select
                    value={vacuumSettings.mode}
                    onChange={(e) =>
                      setVacuumSettings({
                        ...vacuumSettings,
                        mode: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid var(--glass-border)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Quiet">{t("quiet")}</option>
                    <option value="Standard">{t("standard")}</option>
                    <option value="Max">{t("max")}</option>
                    <option value="Mopping">{t("mopping")}</option>
                  </select>
                </div>

                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--indicator-bg)",
                    borderRadius: "1rem",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Calendar size={16} color="var(--text-secondary)" />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      {t("routineSchedule")}
                    </h4>
                  </div>
                  <select
                    value={vacuumSettings.schedule}
                    onChange={(e) =>
                      setVacuumSettings({
                        ...vacuumSettings,
                        schedule: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid var(--glass-border)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Never">{t("manualOnly")}</option>
                    <option value="Daily">{t("daily")}</option>
                    <option value="Weekdays">{t("weekdaysOnly")}</option>
                    <option value="Weekends">{t("weekendsOnly")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Air Quality Graph Selection */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669",
                  }}
                >
                  <Wind size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("aqiGraphSelection")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("aqiSelectionDesc")}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAllAqi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {aqiAverageRooms.length === ALL_ROOMS.length ? (
                  <Square size={14} />
                ) : (
                  <CheckSquare size={14} />
                )}
                {aqiAverageRooms.length === ALL_ROOMS.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {ALL_ROOMS.map((room) => {
                const included = aqiAverageRooms.includes(room);
                return (
                  <div
                    key={room}
                    onClick={() => toggleAqiRoom(room)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "1rem",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: included
                        ? "rgba(16,185,129,0.5)"
                        : "var(--glass-border)",
                      background: included
                        ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))"
                        : "var(--indicator-bg)",
                      transition: "all 0.2s",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        flexShrink: 0,
                        background: included
                          ? "rgba(16,185,129,0.2)"
                          : "var(--indicator-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: included ? "#059669" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ROOM_ICONS[room]}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        flex: 1,
                        color: included
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {t(ROOM_NAME_KEYS[room])}
                    </span>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        flexShrink: 0,
                        border: "2px solid",
                        transition: "all 0.2s",
                        borderColor: included
                          ? "#059669"
                          : "var(--glass-border)",
                        background: included ? "#059669" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {included && (
                        <svg
                          width="11"
                          height="9"
                          viewBox="0 0 11 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Humidity Graph Selection */}
          <div
            className="glass-panel"
            style={{ padding: "2rem", borderRadius: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                  }}
                >
                  <Droplets size={22} />
                </div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {t("humidityGraphSelection")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {t("humiditySelectionDesc")}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAllHumidity}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {humidityAverageRooms.length === ALL_ROOMS.length ? (
                  <Square size={14} />
                ) : (
                  <CheckSquare size={14} />
                )}
                {humidityAverageRooms.length === ALL_ROOMS.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {ALL_ROOMS.map((room) => {
                const included = humidityAverageRooms.includes(room);
                return (
                  <div
                    key={room}
                    onClick={() => toggleHumidityRoom(room)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "1rem",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: included
                        ? "rgba(59,130,246,0.5)"
                        : "var(--glass-border)",
                      background: included
                        ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))"
                        : "var(--indicator-bg)",
                      transition: "all 0.2s",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        flexShrink: 0,
                        background: included
                          ? "rgba(59,130,246,0.2)"
                          : "var(--indicator-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: included ? "#2563eb" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}
                    >
                      {ROOM_ICONS[room]}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        flex: 1,
                        color: included
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {t(
                        ROOM_NAME_KEYS[room] ||
                          room.toLowerCase().replace(" ", "_"),
                      )}
                    </span>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        flexShrink: 0,
                        border: "2px solid",
                        transition: "all 0.2s",
                        borderColor: included
                          ? "#2563eb"
                          : "var(--glass-border)",
                        background: included ? "#2563eb" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {included && (
                        <svg
                          width="11"
                          height="9"
                          viewBox="0 0 11 9"
                          fill="none"
                        >
                          <path
                            d="M1 4L4 7L10 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hardware Integration Section */}
          {user?.role === "ADMIN" && (
            <div
              className="glass-panel"
              style={{
                padding: "2rem",
                borderRadius: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.1))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                    }}
                  >
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h3
                      style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}
                    >
                      {language === "bg"
                        ? "Хардуерна Интеграция"
                        : "Hardware Integration"}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {language === "bg"
                        ? "Свържи ESP32 или Arduino"
                        : "Connect ESP32 or Arduino devices"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHardwareDetails(!showHardwareDetails)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: "10px",
                    padding: "0.5rem 1rem",
                    color: "#10b981",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {showHardwareDetails
                    ? (language === "bg" ? "Скрий" : "Show Less")
                    : (language === "bg" ? "Още" : "Show More")}
                  {showHardwareDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {showHardwareDetails && (
                <>

              <div
                style={{
                  background: "#1e1e1e",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  border: "1px solid #333",
                  position: "relative",
                  marginBottom: "1.5rem",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontSize: "0.85rem",
                    color: "#e2e8f0",
                    fontFamily: "'Fira Code', monospace",
                    lineHeight: 1.5,
                  }}
                >
                  {esp32Code.trim()}
                </pre>
                <button
                  onClick={() => copyToClipboard(esp32Code.trim())}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <Copy size={16} /> {t("copy")}
                </button>
              </div>

              <div
                style={{
                  padding: "1rem",
                  background: "rgba(16,185,129,0.1)",
                  borderRadius: "1rem",
                  border: "1px solid rgba(16,185,129,0.2)",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <Info size={18} color="#10b981" />
                <span style={{ flex: 1 }}>
                  {language === "bg"
                    ? "Можете да копирате API ключа за всяко устройство от списъка по-долу."
                    : "You can copy the API key for each device from the list below."}
                </span>
              </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {(devices || []).map((device: any) => (
                    <div
                      key={device.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem",
                        background: "var(--indicator-bg)",
                        borderRadius: "0.75rem",
                        border: "1px solid var(--glass-border)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          {device.name}
                        </div>
                        <div
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.7rem",
                          }}
                        >
                          {device.room}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <code
                          style={{
                            fontSize: "0.75rem",
                            color: "#10b981",
                            border: "1px solid rgba(16,185,129,0.2)",
                            padding: "0.2rem 0.4rem",
                            borderRadius: "0.3rem",
                          }}
                        >
                          {device.apiKey
                            ? `${device.apiKey.substring(0, 8)}...`
                            : "N/A"}
                        </code>
                        <button
                          disabled={!device.apiKey}
                          onClick={() => copyToClipboard(device.apiKey)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: device.apiKey ? "pointer" : "default",
                            color: "var(--text-secondary)",
                            padding: "0.4rem",
                          }}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default SettingsPage;