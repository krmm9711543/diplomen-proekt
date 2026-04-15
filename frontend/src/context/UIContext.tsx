import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl, getWsUrl } from '../utils/api';


interface UIContextType {
    isPowerPinned: boolean;
    setIsPowerPinned: (pinned: boolean) => void;
    isTempPinned: boolean;
    setIsTempPinned: (pinned: boolean) => void;
    isAirQualityPinned: boolean;
    setIsAirQualityPinned: (pinned: boolean) => void;
    pinnedOrder: string[];
    powerHistory: { time: string, power: number }[];
    tempHistory: { time: string, temp: number }[];
    airQualityHistory: { time: string, aqi: number }[];
    houseRooms: string[];
    setHouseRooms: (rooms: string[]) => void;
    outdoorTemp: number;
    outdoorCondition: string;
    outdoorAqi: number;
    outdoorHumidity: number;
    syncChartsWithRoom: boolean;
    setSyncChartsWithRoom: (sync: boolean) => void;
    shoppingItems: { text: string, completed: boolean }[];
    setShoppingItems: React.Dispatch<React.SetStateAction<{ text: string, completed: boolean }[]>>;
    houseAnnouncement: string;
    setHouseAnnouncement: React.Dispatch<React.SetStateAction<string>>;
    hideSensorsInSeeAll: boolean;
    setHideSensorsInSeeAll: React.Dispatch<React.SetStateAction<boolean>>;
    devices: any[];
    setDevices: React.Dispatch<React.SetStateAction<any[]>>;
    fetchDevices: () => Promise<void>;
    tempAverageRooms: string[];
    setTempAverageRooms: (rooms: string[]) => void;
    aqiAverageRooms: string[];
    setAqiAverageRooms: (rooms: string[]) => void;
    humidityAverageRooms: string[];
    setHumidityAverageRooms: (rooms: string[]) => void;
    powerAverageRooms: string[];
    setPowerAverageRooms: (rooms: string[]) => void;
    language: 'en' | 'bg';
    setLanguage: (lang: 'en' | 'bg') => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [isPowerPinned, setIsPowerPinnedState] = useState(() => {
        return localStorage.getItem('isPowerPinned') === 'true';
    });
    const [isTempPinned, setIsTempPinnedState] = useState(() => {
        return localStorage.getItem('isTempPinned') === 'true';
    });
    const [isAirQualityPinned, setIsAirQualityPinnedState] = useState(() => {
        // Default to true so they see it immediately when added
        const item = localStorage.getItem('isAirQualityPinned');
        return item !== null ? item === 'true' : true; 
    });

    const [pinnedOrder, setPinnedOrderState] = useState<string[]>(() => {
        const saved = localStorage.getItem('pinnedOrder');
        if (saved) return JSON.parse(saved);
        
        // Default order if none saved, based on current pinned states
        const initial: string[] = [];
        if (localStorage.getItem('isPowerPinned') === 'true') initial.push('POWER');
        if (localStorage.getItem('isTempPinned') === 'true') initial.push('TEMP');
        const aqi = localStorage.getItem('isAirQualityPinned');
        if (aqi === null || aqi === 'true') initial.push('AQI');
        return initial;
    });

    const [powerHistory, setPowerHistory] = useState<{ time: string, power: number }[]>([]);
    const [tempHistory, setTempHistory] = useState<{ time: string, temp: number }[]>([]);
    const [airQualityHistory, setAirQualityHistory] = useState<{ time: string, aqi: number }[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [syncChartsWithRoom, setSyncChartsWithRoomState] = useState(() => {
        return localStorage.getItem('syncChartsWithRoom') !== 'false';
    });

    const setSyncChartsWithRoom = (sync: boolean) => {
        setSyncChartsWithRoomState(sync);
        localStorage.setItem('syncChartsWithRoom', sync.toString());
    };

    const ALL_ROOMS = ['Living Room', 'Kitchen', 'Basement', 'Bedroom', 'Garage', 'Bathroom'];

    const [houseRooms, setHouseRoomsState] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('houseRooms');
            if (saved) {
                // Migrate: replace 'Office' with 'Bathroom' if still present
                const parsed: string[] = JSON.parse(saved);
                const migrated = parsed.map(r => r === 'Office' ? 'Bathroom' : r);
                // deduplicate
                return [...new Set(migrated)];
            }
            return ALL_ROOMS;
        } catch { return ALL_ROOMS; }
    });

    const setHouseRooms = (rooms: string[]) => {
        setHouseRoomsState(rooms);
        localStorage.setItem('houseRooms', JSON.stringify(rooms));
    };

    const [shoppingItems, setShoppingItems] = useState<{ text: string, completed: boolean }[]>(() => {
        const saved = localStorage.getItem('shoppingItems');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
                    return parsed.map(text => ({ text, completed: false }));
                }
                return parsed;
            } catch { }
        }
        return [
            { text: 'Milk', completed: false },
            { text: 'Eggs', completed: false },
            { text: 'Bread', completed: false }
        ];
    });

    useEffect(() => {
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    }, [shoppingItems]);

    const [houseAnnouncement, setHouseAnnouncement] = useState(() => {
        return localStorage.getItem('houseAnnouncement') || 'Welcome to your Smart Home! Tap here to change this message.';
    });

    useEffect(() => {
        localStorage.setItem('houseAnnouncement', houseAnnouncement);
    }, [houseAnnouncement]);
    
    const [hideSensorsInSeeAll, setHideSensorsInSeeAll] = useState(() => {
        return localStorage.getItem('hideSensorsInSeeAll') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('hideSensorsInSeeAll', hideSensorsInSeeAll.toString());
    }, [hideSensorsInSeeAll]);

    const [tempAverageRooms, setTempAverageRoomsState] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('tempAverageRooms');
            return saved ? JSON.parse(saved) : ALL_ROOMS;
        } catch { return ALL_ROOMS; }
    });

    const setTempAverageRooms = (rooms: string[]) => {
        setTempAverageRoomsState(rooms);
        localStorage.setItem('tempAverageRooms', JSON.stringify(rooms));
    };

    const [aqiAverageRooms, setAqiAverageRoomsState] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('aqiAverageRooms');
            return saved ? JSON.parse(saved) : ALL_ROOMS;
        } catch { return ALL_ROOMS; }
    });

    const setAqiAverageRooms = (rooms: string[]) => {
        setAqiAverageRoomsState(rooms);
        localStorage.setItem('aqiAverageRooms', JSON.stringify(rooms));
    };

    const [humidityAverageRooms, setHumidityAverageRoomsState] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('humidityAverageRooms');
            return saved ? JSON.parse(saved) : ALL_ROOMS;
        } catch { return ALL_ROOMS; }
    });

    const setHumidityAverageRooms = (rooms: string[]) => {
        setHumidityAverageRoomsState(rooms);
        localStorage.setItem('humidityAverageRooms', JSON.stringify(rooms));
    };

    const [powerAverageRooms, setPowerAverageRoomsState] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('powerAverageRooms');
            return saved ? JSON.parse(saved) : ALL_ROOMS;
        } catch { return ALL_ROOMS; }
    });

    const setPowerAverageRooms = (rooms: string[]) => {
        setPowerAverageRoomsState(rooms);
        localStorage.setItem('powerAverageRooms', JSON.stringify(rooms));
    };

    const [language, setLanguageState] = useState<'en' | 'bg'>(() => {
        return (localStorage.getItem('language') as 'en' | 'bg') || 'en';
    });

    const setLanguage = (lang: 'en' | 'bg') => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    });

    const setTheme = (t: 'light' | 'dark') => {
        setThemeState(t);
        localStorage.setItem('theme', t);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('isPowerPinned', isPowerPinned.toString());
        if (isPowerPinned) {
            if (!pinnedOrder.includes('POWER')) setPinnedOrderState(prev => [...prev, 'POWER']);
        } else {
            setPinnedOrderState(prev => prev.filter(id => id !== 'POWER'));
        }
    }, [isPowerPinned]);

    useEffect(() => {
        localStorage.setItem('isTempPinned', isTempPinned.toString());
        if (isTempPinned) {
            if (!pinnedOrder.includes('TEMP')) setPinnedOrderState(prev => [...prev, 'TEMP']);
        } else {
            setPinnedOrderState(prev => prev.filter(id => id !== 'TEMP'));
        }
    }, [isTempPinned]);

    useEffect(() => {
        localStorage.setItem('isAirQualityPinned', isAirQualityPinned.toString());
        if (isAirQualityPinned) {
            if (!pinnedOrder.includes('AQI')) setPinnedOrderState(prev => [...prev, 'AQI']);
        } else {
            setPinnedOrderState(prev => prev.filter(id => id !== 'AQI'));
        }
    }, [isAirQualityPinned]);

    const fetchDevices = async () => {
        if (!token) return;
        try {
            const res = await fetch(getApiUrl('/api/devices'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setDevices(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!token) return;
        
        fetchDevices();
        
        const ws = new WebSocket(getWsUrl());
        ws.onmessage = (event) => {

            try {
                const data = JSON.parse(event.data);
                // For simple sync, we can just refetch on any change
                // or we could surgically update the 'devices' state
                if (data.type === 'DEVICE_UPDATED') {
                    setDevices(prev => prev.map(d => d.id === data.payload.id ? data.payload : d));
                } else if (data.type === 'DEVICES_UPDATED') {
                    const updates = data.payload;
                    setDevices(prev => prev.map(d => {
                        const update = updates.find((u: any) => u.id === d.id);
                        return update ? update : d;
                    }));
                } else if (['DEVICE_ADDED', 'DEVICE_DELETED'].includes(data.type)) {
                    fetchDevices();
                }
            } catch (e) { }
        };

        const interval = setInterval(fetchDevices, 10000); // Background refresh every 10s
        
        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, [token]);

    const [outdoorTemp, setOutdoorTemp] = useState(11.0);
    const [outdoorCondition, setOutdoorCondition] = useState('Partly Sunny');
    const [outdoorAqi, setOutdoorAqi] = useState(35.0);
    const [outdoorHumidity, setOutdoorHumidity] = useState(65.0);

    const fetchWeatherData = async () => {
        try {
            // Latitude/Longitude for Stara Zagora
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=42.4258&longitude=25.6345&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto');
            if (res.ok) {
                const data = await res.json();
                
                const currentRel = data.current;
                if (currentRel) {
                    if (currentRel.temperature_2m !== undefined) setOutdoorTemp(currentRel.temperature_2m);
                    if (currentRel.relative_humidity_2m !== undefined) setOutdoorHumidity(currentRel.relative_humidity_2m);
                }
                
                // Map weather codes to simple conditions
                const code = currentRel ? currentRel.weather_code : 0;
                let condition = 'Clear';
                if (code === 0) condition = 'Clear Sky';
                else if (code <= 3) condition = 'Partly Cloudy';
                else if (code <= 48) condition = 'Cloudy / Fog';
                else if (code <= 67) condition = 'Rainy';
                else if (code <= 77) condition = 'Snowy';
                else if (code <= 82) condition = 'Showers';
                else if (code <= 99) condition = 'Thunderstorm';
                
                setOutdoorCondition(condition);
            }

            const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=42.4258&longitude=25.6345&current=european_aqi');
            if (aqiRes.ok) {
                const aqiData = await aqiRes.json();
                if (aqiData.current && aqiData.current.european_aqi !== undefined) {
                    setOutdoorAqi(aqiData.current.european_aqi);
                }
            }
        } catch (e) {
            console.error("Failed to fetch weather data:", e);
        }
    };

    useEffect(() => {
        fetchWeatherData();
        const interval = setInterval(fetchWeatherData, 3600000); // Update every hour
        return () => clearInterval(interval);
    }, []);

    // Simulation logic (Power & Temp)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            setPowerHistory(prev => {
                let totalPower = 0;
                devices.forEach(device => {
                    if (device.status === 'ON') {
                        if (device.type === 'RELAY') {
                            let params = { brightness: 100 };
                            try {
                                params = JSON.parse(device.parameters || '{}');
                                if (typeof params === 'string') params = JSON.parse(params);
                            } catch (e) { }
                            const brightness = params.brightness || 100;
                            // A bulb uses between 5W and 60W depending on brightness
                            totalPower += 5 + (brightness / 100) * 55;
                        } else if (device.type === 'THERMOSTAT') {
                            totalPower += 150; // AC/Heater uses more power
                        } else if (device.type === 'COFFEE_MACHINE') {
                            let params = { isBrewing: false };
                            try { params = JSON.parse(device.parameters || '{}'); if (typeof params === 'string') params = JSON.parse(params); } catch(e){}
                            totalPower += params.isBrewing ? 1250 : 15;
                        } else if (device.type === 'ROBOT_VACUUM') {
                            let params = { mode: 'Standard' };
                            try { params = JSON.parse(device.parameters || '{}'); if (typeof params === 'string') params = JSON.parse(params); } catch(e){}
                            totalPower += params.mode === 'Max' ? 60 : 35;
                        } else if (device.type === 'AIR_PURIFIER') {
                            let params = { mode: 'Auto' };
                            try { params = JSON.parse(device.parameters || '{}'); if (typeof params === 'string') params = JSON.parse(params); } catch(e){}
                            totalPower += params.mode === 'Max' ? 45 : (params.mode === 'Sleep' ? 8 : 15);
                        } else if (device.type === 'DEHUMIDIFIER') {
                            let params: any = { mode: 'Normal' };
                            try { params = JSON.parse(device.parameters || '{}'); if (typeof params === 'string') params = JSON.parse(params); } catch(e){}
                            if (params.mode === 'Boost') totalPower += 100;
                            else if (params.mode === 'Eco') totalPower += 35;
                            else totalPower += 60;
                        } else if (device.type === 'FAN') {
                            let params: any = { fanSpeed: 'LOW' };
                            try { params = JSON.parse(device.parameters || '{}'); if (typeof params === 'string') params = JSON.parse(params); } catch(e){}
                            if (params.fanSpeed === 'HIGH') totalPower += 60;
                            else if (params.fanSpeed === 'MEDIUM') totalPower += 35;
                            else totalPower += 15;
                        } else {
                            totalPower += 10;
                        }
                    }
                });

                if (totalPower > 0) {
                    totalPower += Math.round((Math.random() - 0.5) * 10);
                }

                const newHistory = [...prev, { time: timeString, power: Math.max(0, Math.round(totalPower)) }];
                if (newHistory.length > 1000) return newHistory.slice(newHistory.length - 1000);
                return newHistory;
            });

            setTempHistory(prev => {
                let currentTemp = 22.0;
                if (prev.length > 0) currentTemp = prev[prev.length - 1].temp;

                let targetSum = 0;
                let activeThermostats = 0;

                devices.forEach(device => {
                    if (device.type === 'THERMOSTAT' && device.status === 'ON') {
                        let params = { targetTemp: 22, mode: 'AUTO' };
                        try {
                            params = JSON.parse(device.parameters || '{}');
                            if (typeof params === 'string') params = JSON.parse(params);
                        } catch (e) { }

                        // Only influence if mode is not OFF
                        if (params.mode !== 'OFF') {
                            targetSum += params.targetTemp || 22;
                            activeThermostats++;
                        }
                    }
                });

                let finalTarget = outdoorTemp; // Base drift target is now the outdoor temperature!
                
                if (activeThermostats > 0) {
                    // If thermostats are on, the target is the average of thermostat settings
                    // but modified slightly by outdoor temperature (simulating insulation leak)
                    const thermostatAvg = targetSum / activeThermostats;
                    const insulationFactor = 0.05; // 5% influence from outside even when thermostats are on
                    finalTarget = (thermostatAvg * (1 - insulationFactor)) + (outdoorTemp * insulationFactor);
                }

                // Move currentTemp towards finalTarget
                const diff = finalTarget - currentTemp;
                const step = diff * 0.15; // Move 15% of the way each 4 seconds
                const jitter = (Math.random() - 0.5) * 0.2;
                const newTemp = Math.max(10, Math.min(35, parseFloat((currentTemp + step + jitter).toFixed(1))));

                const newHistory = [...prev, { time: timeString, temp: newTemp }];
                if (newHistory.length > 1000) return newHistory.slice(newHistory.length - 1000);
                return newHistory;
            });

            setAirQualityHistory(prev => {
                let currentAqi = 35.0; // Base good air quality
                if (prev.length > 0) currentAqi = prev[prev.length - 1].aqi;
                
                let activePurifiersEffect = 0;
                devices.forEach(device => {
                    if (device.type === 'AIR_PURIFIER' && device.status === 'ON') {
                        let params = { mode: 'Auto' };
                        try {
                            params = JSON.parse(device.parameters || '{}');
                            if (typeof params === 'string') params = JSON.parse(params);
                        } catch(e) {}
                        
                        // Purifiers aggressively lower AQI
                        if (params.mode === 'Max') activePurifiersEffect -= 3.0;
                        else if (params.mode === 'Sleep') activePurifiersEffect -= 0.5;
                        else activePurifiersEffect -= 1.5; // Auto
                    }
                });

                // Natural drift: moves towards outdoorAQI
                const indoorOutdoorDiff = outdoorAqi - currentAqi;
                const naturalStep = indoorOutdoorDiff * 0.05; // Move 5% towards outside AQI every tick
                const naturalDrift = naturalStep + (Math.random() - 0.5) * 1.5; // Add some jitter
                
                let newAqi = currentAqi + naturalDrift + activePurifiersEffect;
                
                // Allow low AQI if purifiers are actively cleaning
                const minAqi = activePurifiersEffect < 0 ? 5 : 15;
                newAqi = Math.max(minAqi, Math.min(200, newAqi));
                
                const newHistory = [...prev, { time: timeString, aqi: Math.round(newAqi) }];
                if (newHistory.length > 1000) return newHistory.slice(newHistory.length - 1000);
                return newHistory;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [devices, outdoorTemp, outdoorAqi]);

    return (
        <UIContext.Provider value={{
            isPowerPinned, setIsPowerPinned: setIsPowerPinnedState,
            isTempPinned, setIsTempPinned: setIsTempPinnedState,
            isAirQualityPinned, setIsAirQualityPinned: setIsAirQualityPinnedState,
            pinnedOrder,
            powerHistory, tempHistory, airQualityHistory,
            houseRooms, setHouseRooms,
            outdoorTemp, outdoorCondition, outdoorAqi, outdoorHumidity,
            syncChartsWithRoom, setSyncChartsWithRoom,
            shoppingItems, setShoppingItems,
            houseAnnouncement, setHouseAnnouncement,
            hideSensorsInSeeAll, setHideSensorsInSeeAll,
            devices, setDevices,
            fetchDevices,
            tempAverageRooms, setTempAverageRooms,
            aqiAverageRooms, setAqiAverageRooms,
            humidityAverageRooms, setHumidityAverageRooms,
            powerAverageRooms, setPowerAverageRooms,
            language, setLanguage,
            theme, setTheme
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
