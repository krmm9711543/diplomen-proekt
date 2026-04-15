import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Power, Cpu, Zap, Thermometer, Trash2, Lightbulb, Sun, Globe, ArrowUp, Activity, Pin, PinOff, Leaf, BedDouble, Sofa, ChefHat, Car, Bath, Home, Warehouse, Footprints, Fuel, Wind, RotateCcw, Fan, X, BarChart3, Plus, ShoppingCart, CheckCircle2, Circle, Coffee, Bean, Droplets, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Bot, AirVent, Snowflake, Flame, RotateCw, Lock, Unlock } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useTranslation, translateDeviceName } from '../utils/translations';
import { getApiUrl } from '../utils/api';


interface Device {
    id: string;
    name: string;
    type: string;
    status: string;
    room: string;
    lastSeen: string;
    updatedAt: string;
    parameters?: string;
    isNew?: boolean;
}

const VerticalBattery: React.FC<{ level: number; size?: number }> = ({ level, size = 24 }) => {
    const color = level <= 5 ? '#ef4444' : level <= 50 ? '#fbbf24' : '#22c55e';
    const numBars = Math.ceil(level / 25); // 0-4 bars

    return (
        <svg width={size * 0.5} height={size} viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'all 0.3s' }}>
            {/* Battery Body */}
            <rect x="0.5" y="2.5" width="11" height="17" rx="2" stroke={color} strokeWidth="1.5" />
            {/* Positive Terminal */}
            <path d="M4 0.75C4 0.335786 4.33579 0 4.75 0H7.25C7.66421 0 8 0.335786 8 0.75V2.5H4V0.75Z" fill={color} />
            {/* Bars */}
            {[0, 1, 2, 3].map((i) => (
                <rect
                    key={i}
                    x="2.5"
                    y={15.5 - i * 4}
                    width="7"
                    height="3"
                    rx="0.5"
                    fill={i < numBars ? color : 'transparent'}
                    style={{ transition: 'fill 0.3s' }}
                />
            ))}
        </svg>
    );
};

const interpolateColor = (color1: string, color2: string, factor: number) => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const getTempColor = (temp: number | string) => {
    const val = typeof temp === 'number' ? temp : parseFloat(temp as string);
    if (isNaN(val)) return '#4f46e5';

    if (val <= 0) return '#0000ff';
    if (val <= 6) return interpolateColor('#0000ff', '#3b82f6', (val - 0) / (6 - 0));
    if (val <= 12) return interpolateColor('#3b82f6', '#00ced1', (val - 6) / (12 - 6));
    if (val <= 18) return interpolateColor('#00ced1', '#00ffff', (val - 12) / (18 - 12));
    if (val <= 24) return interpolateColor('#00ffff', '#72db31', (val - 18) / (24 - 18));
    if (val <= 30) return interpolateColor('#72db31', '#ffff00', (val - 24) / (30 - 24));
    if (val <= 35) return interpolateColor('#ffff00', '#ff8c00', (val - 30) / (35 - 30));
    if (val <= 40) return interpolateColor('#ff8c00', '#ff0000', (val - 35) / (40 - 35));
    return '#ff0000';
};

const getAQIColor = (aqi: number | string) => {
    const val = typeof aqi === 'number' ? aqi : parseInt(aqi as string);
    if (isNaN(val)) return '#10b981';
    if (val < 50) return '#10b981';
    if (val < 100) return '#f59e0b';
    return '#ef4444';
};

const getHumidityColor = (humidity: number | string) => {
    const val = typeof humidity === 'number' ? humidity : parseFloat(humidity as string);
    if (isNaN(val)) return '#10b981';

    // Smooth transitions between zones
    // Yellow (35) -> Green (40)
    if (val <= 33) return '#f59e0b';
    if (val <= 42) return interpolateColor('#f59e0b', '#10b981', (val - 33) / (42 - 33));

    // Green (40-60)
    if (val <= 58) return '#10b981';

    // Green (60) -> Blue (65)
    if (val <= 67) return interpolateColor('#10b981', '#3b82f6', (val - 58) / (67 - 58));

    // Blue (65-70)
    if (val <= 72) return '#3b82f6';

    // Blue (72) -> Purple (78)
    if (val <= 80) return interpolateColor('#3b82f6', '#9333ea', (val - 72) / (80 - 72));

    return '#9333ea';
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
};

const rgbToHex = (r: number, g: number, b: number) =>
    "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

const ROOM_NAME_KEYS: Record<string, string> = {
    'Living Room': 'livingRoom',
    'Kitchen': 'kitchen',
    'Bedroom': 'bedroom',
    'Bathroom': 'bathroom',
    'Garage': 'garage',
    'Basement': 'basement',
    'House': 'house'
};

const ALL_ROOMS = '_ALL_ROOMS_';

const FastColorPicker: React.FC<{
    initialColor: string;
    onChange: (color: string) => void;
    hexToRgb: (hex: string) => { r: number, g: number, b: number } | null;
    rgbToHex: (r: number, g: number, b: number) => string;
}> = React.memo(({ initialColor, onChange, hexToRgb, rgbToHex }) => {
    const [localColor, setLocalColor] = useState(initialColor);

    useEffect(() => {
        setLocalColor(initialColor);
    }, [initialColor]);

    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor);
        // Only trigger parent update (expensive) when necessary
        // We could debounce this, but onBlur might be safer for final sync
    };

    const handleSync = () => {
        if (localColor !== initialColor) {
            onChange(localColor);
        }
    };

    const rgb = hexToRgb(localColor) || { r: 255, g: 255, b: 255 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            {/* Color Square Picker */}
            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                <input
                    type="color"
                    value={localColor}
                    onChange={e => handleColorChange(e.target.value)}
                    onBlur={handleSync}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        border: '4px solid white', borderRadius: '12px', cursor: 'pointer',
                        padding: '0', backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                />
            </div>

            {/* RGB Inputs */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {['r', 'g', 'b'].map((c) => (
                    <div key={c} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#999', marginBottom: '0.4rem' }}>{c.toUpperCase()}</div>
                        <input
                            type="number" min="0" max="255"
                            value={(rgb as any)[c]}
                            onChange={e => {
                                const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                const newRgb = { ...rgb, [c]: val };
                                const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                                handleColorChange(newHex);
                            }}
                            onBlur={handleSync}
                            style={{
                                width: '65px', padding: '0.6rem', textAlign: 'center',
                                borderRadius: '8px', border: '1px solid #eee',
                                fontSize: '1rem', fontWeight: 700, backgroundColor: 'white'
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
});

const AC_MIN_TEMP = 16;
const AC_MAX_TEMP = 30;

const Dashboard: React.FC = () => {
    const { token } = useAuth();
    const {
        powerHistory, tempHistory, airQualityHistory,
        isPowerPinned, setIsPowerPinned,
        isTempPinned, setIsTempPinned,
        isAirQualityPinned, setIsAirQualityPinned,
        pinnedOrder,
        houseRooms,
        outdoorTemp, outdoorCondition, outdoorAqi, outdoorHumidity,
        syncChartsWithRoom,
        shoppingItems, setShoppingItems,
        houseAnnouncement, setHouseAnnouncement, hideSensorsInSeeAll,
        devices, setDevices, fetchDevices,
        tempAverageRooms, aqiAverageRooms, humidityAverageRooms, powerAverageRooms,
        language
    } = useUI();
    const t = useTranslation(language);

    const stats = useMemo(() => {
        return {
            totalDevices: devices.length,
            activeDevices: devices.filter(d => d.status === 'ON').length
        };
    }, [devices]);

    const [selectedTempRoom, setSelectedTempRoom] = useState<string>(ALL_ROOMS);
    const [roomTempHistories, setRoomTempHistories] = useState<Record<string, { time: string, temp: number }[]>>(() => {
        const saved = localStorage.getItem('roomTempHistories');
        return saved ? JSON.parse(saved) : {};
    });
    const [selectedPowerRoom, setSelectedPowerRoom] = useState<string>(ALL_ROOMS);
    const [roomPowerHistories, setRoomPowerHistories] = useState<Record<string, { time: string, power: number }[]>>(() => {
        const saved = localStorage.getItem('roomPowerHistories');
        return saved ? JSON.parse(saved) : {};
    });
    const [selectedAirQualityRoom, setSelectedAirQualityRoom] = useState<string>(ALL_ROOMS);
    const [roomAirQualityHistories, setRoomAirQualityHistories] = useState<Record<string, { time: string, aqi: number }[]>>(() => {
        const saved = localStorage.getItem('roomAirQualityHistories');
        return saved ? JSON.parse(saved) : {};
    });
    const [selectedHumidityRoom, setSelectedHumidityRoom] = useState<string>(ALL_ROOMS);
    const [isHumidityPinned, setIsHumidityPinned] = useState<boolean>(() => localStorage.getItem('isHumidityPinned') === 'true');
    const [isHumidityModalOpen, setIsHumidityModalOpen] = useState(false);
    const [roomHumidityHistories, setRoomHumidityHistories] = useState<Record<string, { time: string, humidity: number }[]>>(() => {
        const saved = localStorage.getItem('roomHumidityHistories');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                const res = await fetch(getApiUrl('/api/telemetry'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await res.json();
                if (!Array.isArray(data)) return;

                const pHistory: Record<string, any[]> = {};
                const tHistory: Record<string, any[]> = {};
                const aHistory: Record<string, any[]> = {};
                const hHistory: Record<string, any[]> = {};

                data.forEach((row: any) => {
                    const d = new Date(row.timestamp);
                    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
                    const room = row.room;
                    if (room === 'House') return; // Frontend calculates house totals dynamically

                    if (row.type === 'POWER') {
                        if (!pHistory[room]) pHistory[room] = [];
                        pHistory[room].push({ time: timeStr, power: row.value });
                    } else if (row.type === 'TEMP') {
                        if (!tHistory[room]) tHistory[room] = [];
                        tHistory[room].push({ time: timeStr, temp: row.value });
                    } else if (row.type === 'AQI') {
                        if (!aHistory[room]) aHistory[room] = [];
                        aHistory[room].push({ time: timeStr, aqi: row.value });
                    } else if (row.type === 'HUMIDITY') {
                        if (!hHistory[room]) hHistory[room] = [];
                        hHistory[room].push({ time: timeStr, humidity: row.value });
                    }
                });

                if (Object.keys(pHistory).length > 0) setRoomPowerHistories(pHistory);
                if (Object.keys(tHistory).length > 0) setRoomTempHistories(tHistory);
                if (Object.keys(aHistory).length > 0) setRoomAirQualityHistories(aHistory);
                if (Object.keys(hHistory).length > 0) setRoomHumidityHistories(hHistory);

            } catch (e) {
                console.error('Failed to fetch telemetry:', e);
            }
        };
        if (token) fetchTelemetry();
    }, [token]);

    useEffect(() => {
        localStorage.setItem('roomTempHistories', JSON.stringify(roomTempHistories));
    }, [roomTempHistories]);

    useEffect(() => {
        localStorage.setItem('roomAirQualityHistories', JSON.stringify(roomAirQualityHistories));
    }, [roomAirQualityHistories]);

    useEffect(() => {
        localStorage.setItem('isHumidityPinned', isHumidityPinned.toString());
    }, [isHumidityPinned]);

    useEffect(() => {
        localStorage.setItem('roomHumidityHistories', JSON.stringify(roomHumidityHistories));
    }, [roomHumidityHistories]);

    useEffect(() => {
        localStorage.setItem('roomPowerHistories', JSON.stringify(roomPowerHistories));
    }, [roomPowerHistories]);

    const [deviceCategoryFilter, setDeviceCategoryFilter] = useState<string>('All');

    // Memoized Averaged Data
    const averagedTempData = useMemo(() => {
        const roomNames = tempAverageRooms.length > 0 ? tempAverageRooms : houseRooms;
        if (roomNames.length === 0) return { current: 21.5, trends: [] };

        let totalCurrent = 0;
        let countCurrent = 0;
        roomNames.forEach(room => {
            const history = roomTempHistories[room];
            if (history && history.length > 0) {
                totalCurrent += history[history.length - 1].temp;
                countCurrent++;
            }
        });
        const currentAvg = countCurrent > 0 ? Math.round((totalCurrent / countCurrent) * 10) / 10 : 21.5;

        // Generate 24h hourly trends from real history
        const now = new Date();
        const hourlyAverages = Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now.getTime() - (23 - i) * 3600000);
            const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;

            let totalHour = 0;
            let countHour = 0;
            roomNames.forEach(room => {
                const history = roomTempHistories[room];
                // Find point closest to this hour
                const match = history?.find(h => h.time.startsWith(hourStr.split(':')[0]));
                if (match) {
                    totalHour += match.temp;
                    countHour++;
                }
            });
            // If no real data for this hour yet, fallback to an interpolated value or current
            return { hour: hourStr, temp: countHour > 0 ? Math.round((totalHour / countHour) * 10) / 10 : currentAvg };
        });
        return { current: currentAvg, trends: hourlyAverages };
    }, [roomTempHistories, tempAverageRooms, houseRooms]);

    const averagedAqiData = useMemo(() => {
        const roomNames = aqiAverageRooms.length > 0 ? aqiAverageRooms : houseRooms;
        if (roomNames.length === 0) return { current: 25, trends: [] };

        let totalCurrent = 0;
        let countCurrent = 0;
        roomNames.forEach(room => {
            const history = roomAirQualityHistories[room];
            if (history && history.length > 0) {
                totalCurrent += history[history.length - 1].aqi;
                countCurrent++;
            }
        });
        const currentAvg = countCurrent > 0 ? Math.round(totalCurrent / countCurrent) : 25;

        const now = new Date();
        const hourlyAverages = Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now.getTime() - (23 - i) * 3600000);
            const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;

            let totalHour = 0;
            let countHour = 0;
            roomNames.forEach(room => {
                const history = roomAirQualityHistories[room];
                const match = history?.find(h => h.time.startsWith(hourStr.split(':')[0]));
                if (match) {
                    totalHour += match.aqi;
                    countHour++;
                }
            });
            return { hour: hourStr, aqi: countHour > 0 ? Math.round(totalHour / countHour) : currentAvg };
        });
        return { current: currentAvg, trends: hourlyAverages };
    }, [roomAirQualityHistories, aqiAverageRooms, houseRooms]);

    const averagedHumidityData = useMemo(() => {
        const roomNames = humidityAverageRooms.length > 0 ? humidityAverageRooms : houseRooms;
        if (roomNames.length === 0) return { current: 45, trends: [] };

        let totalCurrent = 0;
        let countCurrent = 0;
        roomNames.forEach(room => {
            const history = roomHumidityHistories[room];
            if (history && history.length > 0) {
                totalCurrent += history[history.length - 1].humidity;
                countCurrent++;
            }
        });
        const currentAvg = countCurrent > 0 ? Math.round(totalCurrent / countCurrent) : 45;

        const now = new Date();
        const hourlyAverages = Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now.getTime() - (23 - i) * 3600000);
            const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;

            let totalHour = 0;
            let countHour = 0;
            roomNames.forEach(room => {
                const history = roomHumidityHistories[room];
                const match = history?.find(h => h.time.startsWith(hourStr.split(':')[0]));
                if (match) {
                    totalHour += match.humidity;
                    countHour++;
                }
            });
            const val = (i === 23) ? currentAvg : (countHour > 0 ? Math.round(totalHour / countHour) : currentAvg);
            return { hour: hourStr, humidity: val };
        });
        return { current: currentAvg, trends: hourlyAverages };
    }, [roomHumidityHistories, humidityAverageRooms, houseRooms]);

    const averagedPowerData = useMemo(() => {
        const roomNames = powerAverageRooms.length > 0 ? powerAverageRooms : houseRooms;
        if (roomNames.length === 0) return { current: 0, trends: [] };

        let totalCurrent = 0;
        let countCurrent = 0;
        roomNames.forEach(room => {
            const history = roomPowerHistories[room];
            if (history && history.length > 0) {
                totalCurrent += history[history.length - 1].power;
                countCurrent++;
            }
        });
        const currentAvg = Math.round(totalCurrent);

        const now = new Date();
        const hourlyAverages = Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now.getTime() - (23 - i) * 3600000);
            const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;

            let totalHour = 0;
            let countHour = 0;
            roomNames.forEach(room => {
                const history = roomPowerHistories[room];
                const match = history?.find(h => h.time.startsWith(hourStr.split(':')[0]));
                if (match) {
                    totalHour += match.power;
                    countHour++;
                }
            });
            const val = (i === 23) ? currentAvg : (countHour > 0 ? Math.round(totalHour) : currentAvg);
            return { hour: hourStr, power: val };
        });
        return { current: currentAvg, trends: hourlyAverages };
    }, [roomPowerHistories, powerAverageRooms, houseRooms]);



    const currentDashboardHumidity = useMemo(() => {
        if (selectedHumidityRoom === ALL_ROOMS) return averagedHumidityData.current;
        const history = roomHumidityHistories[selectedHumidityRoom];
        return history && history.length > 0 ? history[history.length - 1].humidity : '--';
    }, [selectedHumidityRoom, averagedHumidityData.current, roomHumidityHistories]);

    const currentDashboardTemp = useMemo(() => {
        if (selectedTempRoom === ALL_ROOMS) return averagedTempData.current;
        const history = roomTempHistories[selectedTempRoom];
        return history && history.length > 0 ? history[history.length - 1].temp : '--';
    }, [selectedTempRoom, averagedTempData.current, roomTempHistories]);

    const currentDashboardAqi = useMemo(() => {
        if (selectedAirQualityRoom === ALL_ROOMS) return averagedAqiData.current;
        const history = roomAirQualityHistories[selectedAirQualityRoom];
        return history && history.length > 0 ? history[history.length - 1].aqi : '--';
    }, [selectedAirQualityRoom, averagedAqiData.current, roomAirQualityHistories]);

    const latestAqi = useMemo(() => {
        return typeof currentDashboardAqi === 'number' ? currentDashboardAqi : (averagedAqiData.current || 35);
    }, [currentDashboardAqi, averagedAqiData.current]);

    const currentDashboardPower = useMemo(() => {
        if (selectedPowerRoom === ALL_ROOMS) return averagedPowerData.current;
        const history = roomPowerHistories[selectedPowerRoom];
        return history && history.length > 0 ? history[history.length - 1].power : 0;
    }, [selectedPowerRoom, averagedPowerData.current, roomPowerHistories]);

    const [selectedRoom, setSelectedRoom] = useState<string>('House');

    // Modals
    const [isTempModalOpen, setIsTempModalOpen] = useState(false);
    const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
    const [isActiveDevicesModalOpen, setIsActiveDevicesModalOpen] = useState(false);
    const [isTotalDevicesModalOpen, setIsTotalDevicesModalOpen] = useState(false);
    const [isAirQualityModalOpen, setIsAirQualityModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoomModal, setSelectedRoomModal] = useState<string | null>(null);
    const [selectedSensorModal, setSelectedSensorModal] = useState<Device | null>(null);
    const [activeDevicesFilterRoom, setActiveDevicesFilterRoom] = useState<string>('All');
    const [activeDevicesSortConfig, setActiveDevicesSortConfig] = useState<{ key: keyof Device; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
    const [totalDevicesFilterRoom, setTotalDevicesFilterRoom] = useState<string>('All');
    const [totalDevicesSortConfig, setTotalDevicesSortConfig] = useState<{ key: keyof Device; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newItemText, setNewItemText] = useState('');
    const [editAnnouncementText, setEditAnnouncementText] = useState(houseAnnouncement);

    const addShoppingItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            setShoppingItems([{ text: newItemText.trim(), completed: false }, ...shoppingItems]);
            setNewItemText('');
        }
    };

    const toggleShoppingItem = (index: number) => {
        setShoppingItems(prev => prev.map((item, i) => i === index ? { ...item, completed: !item.completed } : item));
    };

    const removeShoppingItem = (index: number) => {
        setShoppingItems(prev => prev.filter((_, i) => i !== index));
    };

    const [smartLocks, setSmartLocks] = useState<{ id: string, name: string, isLocked: boolean, status?: string }[]>(() => {
        const saved = localStorage.getItem('smartLocks');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved smart locks', e);
            }
        }
        return [
            { id: 'lock-garage', name: 'Garage', isLocked: false, status: 'OPEN' },
            { id: 'lock-front', name: 'Front', isLocked: true },
            { id: 'lock-back', name: 'Back', isLocked: true },
            { id: 'lock-garage-2', name: 'Garage', isLocked: true }
        ];
    });

    useEffect(() => {
        localStorage.setItem('smartLocks', JSON.stringify(smartLocks));
    }, [smartLocks]);

    const toggleSmartLock = (id: string) => {
        if (id === 'lock-garage') {
            const lock = smartLocks.find(l => l.id === id);
            if (!lock || lock.status === 'OPENING' || lock.status === 'CLOSING') return;

            const isCurrentlyOpen = lock.status === 'OPEN' || (lock.status !== 'CLOSED' && !lock.isLocked);

            if (isCurrentlyOpen) {
                setSmartLocks(prev => prev.map(l => l.id === id ? { ...l, status: 'CLOSING' } : l));
                setTimeout(() => {
                    setSmartLocks(prev => prev.map(l => l.id === id ? { ...l, isLocked: true, status: 'CLOSED' } : l));
                }, 3000);
            } else {
                setSmartLocks(prev => prev.map(l => l.id === id ? { ...l, status: 'OPENING' } : l));
                setTimeout(() => {
                    setSmartLocks(prev => prev.map(l => l.id === id ? { ...l, isLocked: false, status: 'OPEN' } : l));
                }, 3000);
            }
        } else {
            setSmartLocks(prev => prev.map(lock => lock.id === id ? { ...lock, isLocked: !lock.isLocked } : lock));
        }
    };

    const [batteryLevels, setBatteryLevels] = useState<Record<string, number>>({});

    useEffect(() => {
        setBatteryLevels(prev => {
            const next = { ...prev };
            smartLocks.forEach(lock => {
                if (next[lock.id] === undefined) next[lock.id] = Math.floor(Math.random() * 40) + 60;
            });
            devices.filter(d => d.type === 'MOTION' || d.type === 'SENSOR' || d.type === 'SMOKE_SENSOR' || d.name.toLowerCase().includes('door') || d.name.toLowerCase().includes('window')).forEach(device => {
                if (next[device.id] === undefined) next[device.id] = Math.floor(Math.random() * 40) + 60;
            });
            return next;
        });
    }, [smartLocks, devices]);

    useEffect(() => {
        const interval = setInterval(() => {
            setBatteryLevels(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(id => {
                    const isLockUnlocked = smartLocks.find(l => l.id === id && !l.isLocked);
                    const isDeviceActive = devices.find(d => d.id === id && d.status === 'ON');

                    let depletionRate = 0.05; // Base drain
                    if (isLockUnlocked) depletionRate += 0.2; // Drains faster when unlocked
                    if (isDeviceActive) depletionRate += 0.1;

                    if (next[id] > 0) {
                        next[id] = Number(Math.max(0, next[id] - depletionRate).toFixed(1));
                    }
                });
                return next;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [smartLocks, devices]);

    const [fuelPrices, setFuelPrices] = useState([
        { id: 'a95', name: 'A95', station: 'EKO Stara Zagora', price: 1.36 },
        { id: 'diesel', name: 'Diesel', station: 'Shell Stara Zagora', price: 1.50 },
        { id: 'lpg', name: 'LPG', station: 'OMV Stara Zagora', price: 0.64 },
        { id: 'a100', name: 'A100', station: 'Rompetrol Stara Zagora', price: 1.56 }
    ]);

    useEffect(() => {
        // Simulate real-time price fluctuations every 24 hours
        const fuelInterval = setInterval(() => {
            setFuelPrices(prev => prev.map(fuel => {
                // Randomly go up or down by 0.01 or 0.02
                const change = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1) / 100;
                let newPrice = fuel.price + change;

                // Keep prices somewhat realistic relative to their starting points (Stara Zagora benchmarks)
                if (fuel.id === 'a95' && (newPrice < 1.28 || newPrice > 1.44)) newPrice -= (change * 2);
                if (fuel.id === 'diesel' && (newPrice < 1.42 || newPrice > 1.58)) newPrice -= (change * 2);
                if (fuel.id === 'lpg' && (newPrice < 0.58 || newPrice > 0.70)) newPrice -= (change * 2);
                if (fuel.id === 'a100' && (newPrice < 1.48 || newPrice > 1.64)) newPrice -= (change * 2);

                return { ...fuel, price: Number(newPrice.toFixed(2)) };
            }));
        }, 86400000); // 24 hours in milliseconds
        return () => clearInterval(fuelInterval);
    }, []);

    const [currentDevice, setCurrentDevice] = useState<Partial<Device>>({});



    const handleSortActiveDevices = (key: keyof Device) => {
        setActiveDevicesSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSortTotalDevices = (key: keyof Device) => {
        setTotalDevicesSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };


    const toggleRoomPower = async (roomName: string, turnOn: boolean) => {
        // 'House' acts as master toggle for all configured houseRooms
        const roomsToToggle = roomName === 'House' ? houseRooms : [roomName];
        const newStatus = turnOn ? 'ON' : 'OFF';

        // Filter: If House, only lights. If specific room, lights + appliances.
        const targetDevices = devices.filter(d => {
            const isInRoom = roomsToToggle.includes(d.room);
            if (!isInRoom) return false;
            if (roomName === 'House') return d.type === 'RELAY';
            return ['RELAY', 'FAN', 'COFFEE_MACHINE', 'THERMOSTAT', 'ROBOT_VACUUM', 'AIR_PURIFIER'].includes(d.type);
        });

        if (targetDevices.length === 0) return;

        // Optimistic update
        setDevices((prev: Device[]) => prev.map(d =>
            targetDevices.some(td => td.id === d.id) ? { ...d, status: newStatus } : d
        ));

        try {
            await fetch(getApiUrl('/api/devices/bulk-status'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    ids: targetDevices.map(d => d.id),
                    status: newStatus
                })
            });

        } catch (e) {
            console.error('Bulk toggle failed', e);
            fetchDevices(); // Sync with server on error
        }
    };

    const getRoomIcon = (roomName: string) => {
        const iconProps = { size: 20 };
        switch (roomName) {
            case 'Living Room': return <Sofa {...iconProps} />;
            case 'Kitchen': return <ChefHat {...iconProps} />;
            case 'Bedroom': return <BedDouble {...iconProps} />;
            case 'Garage': return <Car {...iconProps} />;
            case 'Bathroom': return <Bath {...iconProps} />;
            case 'Basement': return <Warehouse {...iconProps} />;
            case 'House': return <Home {...iconProps} />;
            default: return <Globe {...iconProps} />;
        }
    };


    const getSaturationVaporPressure = (temp: number) => {
        return 6.112 * Math.exp((17.67 * temp) / (temp + 243.5));
    };

    // Track per-room temperature from thermostats
    useEffect(() => {
        if (devices.length === 0) return;
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            const newRoomTemps: Record<string, number> = {};

            setRoomTempHistories(prev => {
                const next = { ...prev };
                houseRooms.forEach(room => {
                    const thermostat = devices.find(d => d.room === room && d.type === 'THERMOSTAT');
                    let target = outdoorTemp; // Default target is outdoors

                    if (thermostat && thermostat.status === 'ON') {
                        let params: any = {};
                        try {
                            params = JSON.parse(thermostat.parameters || '{}');
                            if (typeof params === 'string') params = JSON.parse(params);
                        } catch { }
                        target = params.targetTemp || 22;
                    }

                    const prevHistory = next[room] || [];
                    let current = prevHistory.length > 0 ? prevHistory[prevHistory.length - 1].temp : target;

                    // Move current towards target (insulation simulation)
                    const driftFactor = (thermostat && thermostat.status === 'ON') ? 0.15 : 0.05;
                    const diff = target - current;
                    current = Math.round((current + diff * driftFactor + (Math.random() - 0.5) * 0.2) * 10) / 10;

                    newRoomTemps[room] = current;
                    const updated = [...prevHistory, { time: timeStr, temp: current }];
                    next[room] = updated.length > 1000 ? updated.slice(updated.length - 1000) : updated;
                });
                return next;
            });

            // Room Power Histories
            setRoomPowerHistories(prev => {
                const next = { ...prev };
                const roomTotals: Record<string, number> = {};

                devices.forEach(d => {
                    if (d.status === 'ON') {
                        roomTotals[d.room] = (roomTotals[d.room] || 0) + getDevicePower(d);
                    }
                });

                houseRooms.forEach(room => {
                    const roomTotalPower = roomTotals[room] || 0;
                    const prevHistory = next[room] || [];
                    const updated = [...prevHistory, { time: timeStr, power: roomTotalPower }];
                    next[room] = updated.length > 1000 ? updated.slice(updated.length - 1000) : updated;
                });
                return next;
            });

            // Robot Vacuum Scheduler & Automation Simulation
            const checkVacuumAutomation = () => {
                try {
                    const saved = localStorage.getItem('vacuumSettings');
                    if (!saved) return;
                    const settings = JSON.parse(saved);
                    const { schedule, autoOnAway, autoOnLock } = settings;

                    const now = new Date();
                    const day = now.getDay(); // 0-6
                    const hour = now.getHours();
                    const minute = now.getMinutes();

                    const vacuum = devices.find(d => d.type === 'ROBOT_VACUUM');
                    if (!vacuum || vacuum.status === 'ON') return;

                    let shouldStart = false;

                    // 1. Routine Schedule (Simulated Time: 09:00 AM)
                    if (schedule && schedule !== 'Never' && hour === 9 && minute === 0) {
                        if (schedule === 'Daily') shouldStart = true;
                        else if (schedule === 'Weekdays' && day >= 1 && day <= 5) shouldStart = true;
                        else if (schedule === 'Weekends' && (day === 0 || day === 6)) shouldStart = true;
                    }

                    // 2. Auto on Away (Based on Motion Sensors)
                    // If no motion is detected in ANY room, assume home is empty
                    if (!shouldStart && autoOnAway) {
                        const anyMotion = devices.some(d => d.type === 'MOTION' && d.status === 'ON');
                        if (!anyMotion) {
                            shouldStart = true;
                            console.log('[Automation] No motion detected, assuming home is empty.');
                        }
                    }

                    // 3. Auto on Lock (Simulated)
                    // If any lock is currently locked (OFF -> Locked?)
                    // For now, let's say if all Relay (Lights) are OFF, maybe everyone left?
                    // Actually, let's keep it based on a simulated "security" event
                    if (!shouldStart && autoOnLock) {
                        // Assuming LOCK is a relay with status 'Locked' (currently not in backend, but we can simulate it)
                        // Or just say if any lock-named device is closed
                    }

                    if (shouldStart) {
                        toggleDeviceStatus(vacuum);
                        console.log(`[Automation] Robot Vacuum started based on ${shouldStart ? 'scheduled/presence' : 'manual'} logic.`);
                    }
                } catch (err) {
                    console.error('Vacuum automation error:', err);
                }
            };
            checkVacuumAutomation();

            // Room AQI Histories
            setRoomAirQualityHistories(prev => {
                const next = { ...prev };

                houseRooms.forEach(room => {
                    const roomPurifier = devices.find(d => d.room === room && d.type === 'AIR_PURIFIER' && d.status === 'ON');

                    let purifierEffect = 0;
                    if (roomPurifier) {
                        let params = { mode: 'Auto' };
                        try {
                            params = JSON.parse(roomPurifier.parameters || '{}');
                            if (typeof params === 'string') params = JSON.parse(params);
                        } catch (e) { }

                        if (params.mode === 'Max') purifierEffect = -3.5;
                        else if (params.mode === 'Sleep') purifierEffect = -0.6;
                        else purifierEffect = -1.8; // Auto
                    }

                    const prevHistory = next[room] || [];
                    let current = prevHistory.length > 0 ? prevHistory[prevHistory.length - 1].aqi : 35;

                    // Natural drift towards outdoorAqi
                    const diff = outdoorAqi - current;
                    const drift = (diff * 0.05) + (Math.random() - 0.5) * 1.5;

                    let nextAqi = current + drift + purifierEffect;

                    // Clamping
                    const minAqi = purifierEffect < 0 ? 5 : 15;
                    nextAqi = Math.max(minAqi, Math.min(200, nextAqi));

                    const roundedAqi = Math.round(nextAqi);
                    const updated = [...prevHistory, { time: timeStr, aqi: roundedAqi }];
                    next[room] = updated.length > 1000 ? updated.slice(updated.length - 1000) : updated;
                });
                return next;
            });

            // Room Humidity Histories
            setRoomHumidityHistories(prev => {
                const next = { ...prev };

                const esOut = getSaturationVaporPressure(outdoorTemp);

                houseRooms.forEach(room => {
                    const prevHistory = prev[room] || [];
                    const roomTemp = newRoomTemps[room] || 22.0;
                    const esInRoom = getSaturationVaporPressure(roomTemp);

                    // The "Target RH" is the outdoor humidity transformed into indoor temperature
                    // RH_in = RH_out * (es_out / es_in)
                    const targetRH = outdoorHumidity * (esOut / esInRoom);

                    let current = prevHistory.length > 0 ? prevHistory[prevHistory.length - 1].humidity : targetRH;

                    // Check if room has active dehumidifier and compute its effect
                    const roomHumidifier = devices.find(d => d.room === room && d.type === 'DEHUMIDIFIER' && d.status === 'ON');
                    let humidifierEffect = 0;
                    if (roomHumidifier) {
                        let hParams: any = {};
                        try { hParams = JSON.parse(roomHumidifier.parameters || '{}'); if (typeof hParams === 'string') hParams = JSON.parse(hParams); } catch (e) { }
                        const targetH = hParams.targetHumidity || 50;
                        if (current > targetH) {
                            if (hParams.mode === 'Boost') humidifierEffect = -0.8;
                            else if (hParams.mode === 'Eco') humidifierEffect = -0.2;
                            else humidifierEffect = -0.45; // Normal
                        }
                    }

                    // drift towards target (Infiltration / Buffer)
                    const driftFactor = 0.02; // Very slow drift
                    const diff = targetRH - current;

                    // Apply drift + small jitter + humidifier
                    let nextH = current + (diff * driftFactor) + (Math.random() - 0.5) * 0.3 + humidifierEffect;

                    // Clamping
                    nextH = Math.max(10, Math.min(95, nextH));

                    const updated = [...prevHistory, { time: timeStr, humidity: Math.round(nextH * 10) / 10 }];
                    next[room] = updated.length > 1000 ? updated.slice(updated.length - 1000) : updated;
                });
                return next;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [devices]);

    const toggleDeviceStatus = async (device: Device) => {
        const newStatus = device.status === 'ON' ? 'OFF' : 'ON';
        // Optimistic update
        setDevices((prev: Device[]) => prev.map(d => d.id === device.id ? { ...d, status: newStatus } : d));

        // Sync with currentDevice if it's the one being toggled
        if (currentDevice.id === device.id) {
            setCurrentDevice(prev => ({ ...prev, status: newStatus }));
        }

        try {
            await fetch(`http://127.0.0.1:3001/api/devices/${device.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            // We don't call fetchData here because WebSocket will handle sync if needed, 
            // and we already updated locally.
        } catch (e) {
            console.error(e);
            fetchDevices(); // Fallback to server state on error
        }
    };

    const getDeviceParams = (device: Device) => {
        try {
            if (!device.parameters) return {};
            if (typeof device.parameters === 'object') return device.parameters;
            let p = JSON.parse(device.parameters);
            if (typeof p === 'string') p = JSON.parse(p);
            return p || {};
        } catch {
            return {};
        }
    };

    const updateDeviceParams = async (device: Device, newParams: any) => {
        const params = { ...getDeviceParams(device), ...newParams };
        const updatedParamsStr = JSON.stringify(params);

        // Optimistic update
        setDevices((prev: Device[]) => prev.map(d => d.id === device.id ? { ...d, parameters: updatedParamsStr } : d));
        if (currentDevice.id === device.id) {
            setCurrentDevice(prev => ({ ...prev, parameters: updatedParamsStr }));
        }

        try {
            await fetch(`http://127.0.0.1:3001/api/devices/${device.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ parameters: params })
            });
        } catch (e) {
            console.error(e);
            fetchDevices();
        }
    };


    const handleSaveDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        const isNew = !currentDevice.id;
        const url = isNew ? 'http://127.0.0.1:3001/api/devices' : `http://127.0.0.1:3001/api/devices/${currentDevice.id}`;
        const method = isNew ? 'POST' : 'PUT';

        setIsModalOpen(false);

        const payload: any = { ...currentDevice };
        if (typeof payload.parameters === 'string') {
            try {
                payload.parameters = JSON.parse(payload.parameters);
            } catch (e) {
                payload.parameters = {};
            }
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchDevices();
            }
        } catch (e) {
            console.error(e);
            fetchDevices();
        }
    };

    const getDevicePower = (device: Device) => {
        if (device.status === 'OFF') return 0;
        if (device.type === 'RELAY') {
            const params = getDeviceParams(device);
            const brightness = params.brightness || 100;
            return Math.round(5 + (brightness / 100) * 55);
        }
        if (device.type === 'THERMOSTAT') return 150;
        if (device.type === 'FAN') {
            const params = getDeviceParams(device);
            const speed = params.fanSpeed || 'LOW';
            if (speed === 'HIGH') return 60;
            if (speed === 'MEDIUM') return 35;
            return 15;
        }
        if (device.type === 'COFFEE_MACHINE') {
            if (device.status === 'OFF') return 0;
            const params = getDeviceParams(device);
            return params.isBrewing ? 1250 : 15; // 1250W while brewing, 15W standby
        }
        if (device.type === 'ROBOT_VACUUM') {
            if (device.status === 'OFF') return 5;
            const params = getDeviceParams(device);
            return params.mode === 'Max' ? 60 : 35;
        }
        if (device.type === 'AIR_PURIFIER') {
            if (device.status === 'OFF') return 2;
            const params = getDeviceParams(device);
            return params.mode === 'Max' ? 45 : (params.mode === 'Sleep' ? 8 : 15);
        }
        if (device.type === 'DEHUMIDIFIER') {
            if (device.status === 'OFF') return 1;
            const params = getDeviceParams(device);
            if (params.mode === 'Boost') return 100;
            if (params.mode === 'Eco') return 35;
            return 60; // Normal
        }
        return 10;
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'RELAY': return <Lightbulb size={20} />;
            case 'THERMOSTAT': return <AirVent size={20} />;
            case 'SENSOR': return <Zap size={20} />;
            case 'MOTION': return <Footprints size={20} />;
            case 'FAN': return <Wind size={20} />;
            case 'SMOKE_SENSOR': return <Flame size={20} />;
            case 'COFFEE_MACHINE': return <Coffee size={20} />;
            case 'ROBOT_VACUUM': return <Bot size={20} />;
            case 'AIR_PURIFIER': return <Fan size={20} />;
            case 'DEHUMIDIFIER': return <Droplets size={20} />;
            default: return <Cpu size={20} />;
        }
    };

    const getWeatherIcon = (condition: string) => {
        const lower = condition.toLowerCase();
        if (lower.includes('clear')) return <Sun size={14} color="#f59e0b" />;
        if (lower.includes('cloudy')) return <Cloud size={14} color="#94a3b8" />;
        if (lower.includes('rain')) return <CloudRain size={14} color="#3b82f6" />;
        if (lower.includes('showers')) return <CloudDrizzle size={14} color="#60a5fa" />;
        if (lower.includes('snow')) return <CloudSnow size={14} color="#e2e8f0" />;
        if (lower.includes('thunderstorm')) return <CloudLightning size={14} color="#7c3aed" />;
        if (lower.includes('fog')) return <CloudFog size={14} color="#cbd5e1" />;
        return <Sun size={14} color="#f59e0b" />;
    };

    const getSensorMockHistory = (device: Device) => {
        const params = getDeviceParams(device);
        const history = [];
        const now = new Date();

        let targetValue = 0;
        let volatility = 0;

        if (device.type === 'MOTION') {
            for (let i = 24; i >= 0; i--) {
                const timeStr = `${new Date(now.getTime() - i * 3600000).getHours().toString().padStart(2, '0')}:00`;
                history.push({ time: timeStr, value: Math.random() > 0.8 ? 100 : 0 });
            }
            return history;
        }

        if (params.sensorType === 'HUMIDITY') {
            targetValue = params.value || 50;
            volatility = 1.0; // Max jump per hour
        } else if (params.sensorType === 'AIR_QUALITY') {
            targetValue = params.value || 30;
            volatility = 3.0; // Max jump per hour
        }

        // Start 24 hours ago at a value somewhat near the current target
        let currVal = targetValue + (Math.random() * volatility * 10 - volatility * 5);

        for (let i = 24; i >= 0; i -= 2) {
            const timeStr = `${new Date(now.getTime() - i * 3600000).getHours().toString().padStart(2, '0')}:00`;

            // Gently pull towards target to prevent drifting too far
            const pullToTarget = (targetValue - currVal) * 0.1;

            // Add a small smooth random step
            const randomStep = (Math.random() * volatility - volatility / 2) * 2; // multiply by 2 because 2 hours passed

            currVal += randomStep + pullToTarget;

            // Clamp
            if (params.sensorType === 'HUMIDITY') currVal = Math.max(20, Math.min(90, currVal));
            if (params.sensorType === 'AIR_QUALITY') currVal = Math.max(0, currVal);

            history.push({ time: timeStr, value: Math.round(currVal) });
        }

        // Ensure the very last point perfectly matches the current live reading
        if (history.length > 0) {
            history[history.length - 1].value = targetValue;
        }

        return history;
    };

    const getRelativeTime = (dateStr: string | null | undefined): string => {
        if (!dateStr) return t('noMotionYet');
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 10) return t('justNow');
        if (diff < 60) return t('secondsAgo', { count: diff });
        if (diff < 3600) {
            const mins = Math.floor(diff / 60);
            return mins === 1 ? t('minuteAgo') : t('minutesAgo', { count: mins });
        }
        if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return hours === 1 ? t('hourAgo') : t('hoursAgo', { count: hours });
        }
        const days = Math.floor(diff / 86400);
        return days === 1 ? t('dayAgo') : t('daysAgo', { count: days });
    };

    return (
        <>
            <div className="animate-fade-in" style={{ animationDuration: '0.4s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Globe size={14} color="#3b82f6" />
                            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t('staraZagora')}</span>
                        </div>
                        <div style={{ width: '1px', height: '14px', background: 'var(--glass-border)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {getWeatherIcon(outdoorCondition)}
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{outdoorTemp}°C</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>{t(outdoorCondition.toLowerCase().replace(' / ', '_').replace(' ', '_') as any) || outdoorCondition}</span>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} title={t('liveData' as any)} />
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => setIsTotalDevicesModalOpen(true)}>
                        <Cpu size={14} color="var(--accent-color)" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{stats.totalDevices} {t('devices' as any)}</span>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => setIsActiveDevicesModalOpen(true)}>
                        <Power size={14} color="var(--success-color)" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{stats.activeDevices} {t('activeDevices' as any)}</span>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => setIsPowerModalOpen(true)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={14} color="var(--warning-color)" />
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{currentDashboardPower} W</span>
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation(); setIsPowerPinned(!isPowerPinned); }}
                            style={{ marginLeft: '0.2rem', padding: '0.2rem', borderRadius: '6px', background: isPowerPinned ? 'rgba(234, 179, 8, 0.1)' : 'var(--indicator-bg)', color: isPowerPinned ? 'var(--warning-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isPowerPinned ? <Pin size={12} /> : <PinOff size={12} />}
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => setIsTempModalOpen(true)}>
                        {(() => {
                            const currentTemp = currentDashboardTemp;
                            const tempColor = getTempColor(currentTemp);
                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Thermometer size={14} color={tempColor} />
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{currentTemp} °C</span>
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsTempPinned(!isTempPinned); }}
                                        style={{ marginLeft: '0.2rem', padding: '0.2rem', borderRadius: '6px', background: isTempPinned ? `${tempColor}15` : 'var(--indicator-bg)', color: isTempPinned ? tempColor : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {isTempPinned ? <Pin size={12} /> : <PinOff size={12} />}
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => setIsAirQualityModalOpen(true)}>
                        {(() => {
                            const currentAqi = currentDashboardAqi;
                            const aqiColor = getAQIColor(currentAqi);
                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Wind size={14} color={aqiColor} />
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{currentAqi} AQI</span>
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsAirQualityPinned(!isAirQualityPinned); }}
                                        style={{ marginLeft: '0.2rem', padding: '0.2rem', borderRadius: '6px', background: isAirQualityPinned ? `${aqiColor}15` : 'var(--indicator-bg)', color: isAirQualityPinned ? aqiColor : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {isAirQualityPinned ? <Pin size={12} /> : <PinOff size={12} />}
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => setIsHumidityModalOpen(true)}>
                        {(() => {
                            const currentHumidity = currentDashboardHumidity;
                            const hValue = typeof currentHumidity === 'number' ? currentHumidity : 45;
                            const hColor = getHumidityColor(hValue);
                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Droplets size={14} color={hColor} />
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{currentHumidity}% </span>
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setIsHumidityPinned(!isHumidityPinned); }}
                                        style={{ marginLeft: '0.2rem', padding: '0.2rem', borderRadius: '6px', background: isHumidityPinned ? `${hColor}15` : 'var(--indicator-bg)', color: isHumidityPinned ? hColor : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {isHumidityPinned ? <Pin size={12} /> : <PinOff size={12} />}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                    {/* Main Content */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>{t('chooseRoom' as any)}</h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                            gap: '1.2rem',
                            marginBottom: '2.5rem',
                            padding: '0.5rem' // Add padding to avoid clipping when cards scale up
                        }}>
                            {['House', ...houseRooms].map((roomName) => {
                                const roomDevices = roomName === 'House'
                                    ? devices.filter(d => houseRooms.includes(d.room))
                                    : devices.filter(d => d.room === roomName);

                                const powerDevices = roomDevices.filter(d =>
                                    roomName === 'House'
                                        ? d.type === 'RELAY'
                                        : ['RELAY', 'FAN', 'COFFEE_MACHINE', 'THERMOSTAT', 'ROBOT_VACUUM', 'AIR_PURIFIER'].includes(d.type)
                                );
                                const activeCount = powerDevices.filter(d => d.status === 'ON').length;
                                const anyOn = activeCount > 0;
                                return (
                                    <div
                                        key={roomName}
                                        className="hover-scale"
                                        onClick={() => {
                                            setSelectedRoom(roomName);
                                            if (syncChartsWithRoom) {
                                                const chartRoom = roomName === 'House' ? ALL_ROOMS : roomName;
                                                setSelectedTempRoom(chartRoom);
                                                setSelectedPowerRoom(chartRoom);
                                                setSelectedAirQualityRoom(chartRoom);
                                                setSelectedHumidityRoom(chartRoom);
                                            }
                                        }}
                                        onDoubleClick={() => setSelectedRoomModal(roomName)}
                                        style={{
                                            padding: '1.1rem 1.1rem 1rem 1.1rem',
                                            borderRadius: '1.5rem',
                                            cursor: 'pointer',
                                            border: roomName === selectedRoom
                                                ? '2px solid var(--warning-color)'
                                                : '1.5px solid var(--card-border)',
                                            background: roomName === selectedRoom
                                                ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.4), rgba(234, 179, 8, 0.2))'
                                                : anyOn
                                                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05))'
                                                    : 'var(--card-bg-inactive)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.6rem',
                                            minHeight: '130px',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: roomName === selectedRoom
                                                ? '0 8px 30px rgba(251,191,36,0.3)'
                                                : '0 2px 10px rgba(0,0,0,0.02)',
                                            backdropFilter: 'blur(12px)',
                                            transform: roomName === selectedRoom ? 'scale(1.05)' : 'scale(1)',
                                            zIndex: roomName === selectedRoom ? 10 : 1,
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Top row: icon + power toggle */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '11px',
                                                background: (roomName === selectedRoom || anyOn) ? 'rgba(251,191,36,0.25)' : 'var(--icon-bg-inactive)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: (roomName === selectedRoom || anyOn) ? '#d97706' : 'var(--text-secondary)',
                                                transition: 'all 0.3s'
                                            }}>
                                                {getRoomIcon(roomName)}
                                            </div>


                                            {/* Pill-shaped power toggle – always visible */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (powerDevices.length > 0) toggleRoomPower(roomName, !anyOn);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    padding: '0.3rem 0.65rem',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    cursor: powerDevices.length > 0 ? 'pointer' : 'default',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    transition: 'all 0.25s',
                                                    opacity: powerDevices.length > 0 ? 1 : 0.35,
                                                    background: anyOn ? 'rgba(234, 179, 8, 0.85)' : 'var(--indicator-bg)',
                                                    color: anyOn ? '#3f2b00' : 'var(--text-secondary)',
                                                    boxShadow: anyOn ? '0 2px 8px rgba(234, 179, 8, 0.35)' : 'none'
                                                }}
                                            >
                                                <Lightbulb size={12} />
                                                {anyOn ? t('on' as any) : t('off' as any)}
                                            </button>
                                        </div>

                                        {/* Bottom: room name + count */}
                                        <div style={{ marginTop: 'auto' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: (roomName === selectedRoom) ? 'var(--warning-color)' : 'var(--text-primary)' }}>
                                                {ROOM_NAME_KEYS[roomName] ? t(ROOM_NAME_KEYS[roomName] as any) : roomName}
                                            </h3>
                                            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: (roomName === selectedRoom) ? 'var(--warning-color)' : 'var(--text-secondary)', opacity: roomName === selectedRoom ? 0.9 : 1, fontWeight: 600 }}>
                                                {activeCount} / {powerDevices.length} {t('on' as any)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>{t('smartLocks')}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                            {smartLocks.map(lock => {
                                const isGarage = lock.id === 'lock-garage';
                                const isTransitioning = lock.status === 'OPENING' || lock.status === 'CLOSING';
                                const isClosed = lock.status === 'CLOSED' || (!lock.status && lock.isLocked);

                                let label = lock.isLocked ? t('locked') : t('unlocked');
                                if (isGarage) {
                                    if (lock.status === 'OPENING') label = t('opening');
                                    else if (lock.status === 'CLOSING') label = t('closing');
                                    else if (lock.status === 'OPEN') label = t('open');
                                    else label = t('closed');
                                }

                                return (
                                    <div key={lock.id} className="hover-scale" onClick={() => toggleSmartLock(lock.id)} style={{
                                        padding: '0.8rem 1rem',
                                        borderRadius: '1.2rem',
                                        cursor: 'pointer',
                                        border: '1.5px solid var(--card-border)',
                                        background: isClosed ? 'var(--card-bg-inactive)' : 'var(--card-bg-active)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: isClosed ? 'var(--shadow-sm)' : 'var(--shadow-md)',
                                        backdropFilter: 'blur(12px)',
                                        opacity: isTransitioning ? 0.8 : 1
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: isClosed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isClosed ? 'var(--success-color)' : '#eab308',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            animation: isTransitioning ? 'pulse 1.5s infinite' : 'none'
                                        }}>
                                            {isClosed ? <Lock size={16} strokeWidth={2.5} /> : <Unlock size={16} strokeWidth={2.5} />}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t(lock.name.toLowerCase() as any) || lock.name}</span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: isClosed ? 'var(--text-secondary)' : '#f59e0b',
                                                transition: 'color 0.3s'
                                            }}>{label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>{t('devices')}</h2>
                            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }} className="hide-scrollbar">
                                {['All', 'Lighting', 'Climate', 'Sensors', 'Appliances'].map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setDeviceCategoryFilter(category)}
                                        style={{
                                            padding: '0.35rem 0.8rem',
                                            borderRadius: '20px',
                                            border: 'none',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap',
                                            background: deviceCategoryFilter === category ? 'var(--accent-color)' : 'rgba(0,0,0,0.05)',
                                            color: deviceCategoryFilter === category ? 'white' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {category === 'All' ? t('all') : t(category.toLowerCase())}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
                            {devices.filter(d => {
                                // 1. Room Filter
                                if (selectedRoom !== 'House' && d.room !== selectedRoom) return false;

                                // 2. Category Filter
                                if (deviceCategoryFilter === 'All') {
                                    if (hideSensorsInSeeAll) {
                                        const params = getDeviceParams(d);
                                        if (d.type === 'SENSOR' || d.type === 'MOTION' || d.type === 'SMOKE_SENSOR' || params.sensorType) return false;
                                    }
                                    return true;
                                }
                                if (deviceCategoryFilter === 'Lighting') return d.type === 'RELAY';
                                if (deviceCategoryFilter === 'Climate') return d.type === 'THERMOSTAT' || d.type === 'FAN';
                                if (deviceCategoryFilter === 'Sensors') return d.type === 'SENSOR' || d.type === 'MOTION' || d.type === 'SMOKE_SENSOR';
                                if (deviceCategoryFilter === 'Appliances') return ['COFFEE_MACHINE', 'AIR_PURIFIER', 'ROBOT_VACUUM', 'DEHUMIDIFIER'].includes(d.type);
                                return true;
                            }).sort((a, b) => {
                                const roomSort = a.room.localeCompare(b.room);
                                if (roomSort !== 0) return roomSort;
                                return a.name.localeCompare(b.name);
                            }).map((device) => {
                                const params = getDeviceParams(device);
                                const isSensor = device.type === 'SENSOR' || device.type === 'MOTION' || device.type === 'SMOKE_SENSOR' || params.sensorType;
                                const isLighting = device.type === 'RELAY';
                                const isActive = isSensor ? true : (device.status === 'ON');

                                let displayValue = params.value;
                                let displayUnit = params.unit;
                                if (device.type === 'MOTION') {
                                    displayValue = getRelativeTime(params.lastMotion);
                                    displayUnit = '';
                                } else if (device.type === 'SMOKE_SENSOR') {
                                    displayValue = t('active');
                                    displayUnit = '';
                                } else if ((params.sensorType === 'TEMPERATURE' || device.name.toLowerCase().includes('temperature')) && roomTempHistories[device.room]?.length > 0) {
                                    displayValue = roomTempHistories[device.room][roomTempHistories[device.room].length - 1].temp;
                                    displayUnit = '°C';
                                } else if ((params.sensorType === 'HUMIDITY' || device.name.toLowerCase().includes('humidity')) && roomHumidityHistories[device.room]?.length > 0) {
                                    displayValue = roomHumidityHistories[device.room][roomHumidityHistories[device.room].length - 1].humidity;
                                    displayUnit = '%';
                                } else if ((params.sensorType === 'AIR_QUALITY' || device.name.toLowerCase().includes('air quality')) && roomAirQualityHistories[device.room]?.length > 0) {
                                    displayValue = roomAirQualityHistories[device.room][roomAirQualityHistories[device.room].length - 1].aqi;
                                    displayUnit = ' AQI';
                                }

                                let iconBgColor = 'var(--icon-bg-inactive)';
                                let iconColor = 'var(--text-secondary)';
                                let cardBgColor = 'var(--card-bg-inactive)';
                                let statusTextColor = 'var(--text-secondary)';
                                let powerBtnBg = 'transparent';
                                let powerBtnColor = 'var(--text-secondary)';
                                let powerBtnShadow = 'none';

                                if (isSensor) {
                                    iconBgColor = '#10b981'; // Green for sensors in main grid
                                    iconColor = 'white';
                                    cardBgColor = 'rgba(16, 185, 129, 0.05)';
                                    statusTextColor = 'var(--text-secondary)';
                                } else if (isLighting) {
                                    if (isActive) {
                                        iconBgColor = 'rgba(251, 191, 36, 0.25)';
                                        iconColor = '#d97706';
                                        cardBgColor = 'rgba(251, 191, 36, 0.05)';
                                        statusTextColor = '#b45309';
                                        powerBtnBg = 'rgba(251, 191, 36, 0.85)';
                                        powerBtnColor = '#78350f';
                                        powerBtnShadow = '0 2px 8px rgba(251, 191, 36, 0.45)';
                                    }
                                } else {
                                    if (isActive) {
                                        iconBgColor = '#3b82f6'; // Blue
                                        iconColor = 'white';
                                        cardBgColor = 'rgba(59, 130, 246, 0.05)';
                                        statusTextColor = '#3b82f6';
                                        powerBtnBg = '#3b82f6';
                                        powerBtnColor = 'white';
                                        powerBtnShadow = '0 2px 8px rgba(59, 130, 246, 0.45)';
                                    }
                                }

                                return (
                                    <div key={device.id} className={`glass-panel ${isActive ? 'active-tile' : ''}`} onClick={() => { if (!isSensor) { setCurrentDevice(device); setIsModalOpen(true); } }}
                                        style={{
                                            padding: '1.25rem 1rem',
                                            borderRadius: '1.5rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            height: '160px',
                                            border: '1px solid var(--glass-border)',
                                            background: cardBgColor,
                                            overflow: 'hidden',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '12px',
                                                backgroundColor: iconBgColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: iconColor,
                                                transition: 'all 0.3s',
                                                flexShrink: 0,
                                                border: 'none',
                                                boxShadow: 'none'
                                            }}>
                                                {getDeviceIcon(device.type)}
                                            </div>
                                            {!isSensor && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleDeviceStatus(device); }}
                                                    style={{
                                                        background: powerBtnBg,
                                                        border: 'none',
                                                        color: powerBtnColor,
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.3s',
                                                        boxShadow: powerBtnShadow
                                                    }}
                                                >
                                                    <Power size={18} strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ marginTop: 'auto' }}>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                textTransform: 'uppercase',
                                                fontWeight: 800,
                                                color: 'var(--text-secondary)',
                                                display: 'block',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                opacity: 0.8
                                            }}>
                                                {ROOM_NAME_KEYS[device.room] ? t(ROOM_NAME_KEYS[device.room]) : device.room}
                                            </span>
                                            <h3 style={{
                                                fontSize: '0.85rem',
                                                margin: '0.2rem 0',
                                                fontWeight: 700,
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.2',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {translateDeviceName(device.name, language)}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: statusTextColor,
                                                fontWeight: 600,
                                                display: 'block'
                                            }}>
                                                {isActive ? (
                                                    isSensor ? `${displayValue}${displayUnit}` : t('active')
                                                ) : t('inactive')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side Panel for Pinned Charts */}
                    {(isPowerPinned || isTempPinned || isAirQualityPinned || isHumidityPinned) && (
                        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {(() => {
                                const activePinnedOrder = [...pinnedOrder];
                                if (isHumidityPinned && !activePinnedOrder.includes('HUMIDITY')) {
                                    activePinnedOrder.push('HUMIDITY');
                                }
                                return activePinnedOrder;
                            })().map(pinnedId => {
                                if (pinnedId === 'POWER' && isPowerPinned) {
                                    const roomsWithPower = [...new Set(devices.filter(d => ['RELAY', 'FAN', 'AIR_PURIFIER'].includes(d.type)).map(d => d.room))];
                                    const isAllRooms = selectedPowerRoom === ALL_ROOMS;
                                    const displayHistory = isAllRooms
                                        ? averagedPowerData.trends
                                        : (roomPowerHistories[selectedPowerRoom] || []);
                                    const currentPowerValue = currentDashboardPower;
                                    const currentPower = typeof currentPowerValue === 'number' ? Math.round(currentPowerValue) : currentPowerValue;
                                    const displayTitle = isAllRooms ? t('allRooms') : (ROOM_NAME_KEYS[selectedPowerRoom] ? t(ROOM_NAME_KEYS[selectedPowerRoom]) : selectedPowerRoom);
                                    return (
                                        <div key="POWER" className="glass-panel animate-slide-in-right" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '0', border: 'none', background: 'var(--card-bg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
                                            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem', background: 'transparent' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Zap size={14} color="var(--warning-color)" />
                                                        </div>
                                                        {t('powerConsumption')}
                                                    </h3>
                                                    <button onClick={() => setIsPowerPinned(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
                                                        <PinOff size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.2rem', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1' }}>{currentPower} W</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.4rem' }}>
                                                            {isAllRooms ? t('currentConsumption') : `${displayTitle} ${t('consumption')}`}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '-0.8rem' }}>
                                                        <select
                                                            value={selectedPowerRoom}
                                                            onChange={e => setSelectedPowerRoom(e.target.value)}
                                                            style={{
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'var(--indicator-bg)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                appearance: 'auto',
                                                                maxWidth: '100%'
                                                            }}
                                                        >
                                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                                            {roomsWithPower.map(room => (
                                                                <option key={room} value={room}>{t((ROOM_NAME_KEYS[room] || room.toLowerCase().replace(' ', '_')) as any)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ height: '120px', width: '100%', marginTop: 'auto' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={displayHistory}>
                                                        <defs>
                                                            <linearGradient id="colorPowerSidebar" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Tooltip
                                                            contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                            itemStyle={{ color: 'var(--text-primary)' }}
                                                            formatter={(value: number | undefined) => [`${Math.round(value || 0)} W`, t('power' as any)]}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="power"
                                                            stroke="#d97706"
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorPowerSidebar)"
                                                            animationDuration={2000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                }

                                if (pinnedId === 'TEMP' && isTempPinned) {
                                    const isAllRooms = selectedTempRoom === ALL_ROOMS;
                                    const displayHistory = isAllRooms
                                        ? averagedTempData.trends
                                        : (roomTempHistories[selectedTempRoom] || []);
                                    const currentTempValue = currentDashboardTemp;
                                    const currentTemp = typeof currentTempValue === 'number' ? currentTempValue.toFixed(1) : currentTempValue;
                                    const displayTitle = isAllRooms ? t('allRooms') : (ROOM_NAME_KEYS[selectedTempRoom] ? t(ROOM_NAME_KEYS[selectedTempRoom]) : selectedTempRoom);
                                    return (
                                        <div key="TEMP" className="glass-panel animate-slide-in-right" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '0', border: 'none', background: 'var(--card-bg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
                                            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem', background: 'transparent' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${getTempColor(currentTemp)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Thermometer size={14} color={getTempColor(currentTemp)} />
                                                        </div>
                                                        {t('liveTemperature')}
                                                    </h3>
                                                    <button onClick={() => setIsTempPinned(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
                                                        <PinOff size={14} />
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.2rem', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1' }}>{currentTemp}°C</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.4rem' }}>
                                                            {isAllRooms ? t('averageTemperature') : `${displayTitle} ${t('temperature')}`}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '-0.8rem' }}>
                                                        <select
                                                            value={selectedTempRoom}
                                                            onChange={e => setSelectedTempRoom(e.target.value)}
                                                            style={{
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'var(--indicator-bg)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                appearance: 'auto',
                                                                maxWidth: '100%'
                                                            }}
                                                        >
                                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                                            {houseRooms.map(room => (
                                                                <option key={room} value={room}>{t((ROOM_NAME_KEYS[room] || room.toLowerCase().replace(' ', '_')) as any)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ height: '120px', width: '100%', marginTop: 'auto' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {(() => {
                                                        const graphColor = getTempColor(currentTemp);
                                                        return (
                                                            <AreaChart data={displayHistory}>
                                                                <defs>
                                                                    <linearGradient id="colorTempSidebar" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor={graphColor} stopOpacity={0.3} />
                                                                        <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <Tooltip
                                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                                    formatter={(value: number | undefined) => [`${Number(value || 0).toFixed(1)} °C`, t('temperature' as any)]}
                                                                    labelStyle={{ display: 'none' }}
                                                                />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="temp"
                                                                    stroke={graphColor}
                                                                    strokeWidth={3}
                                                                    fillOpacity={1}
                                                                    fill="url(#colorTempSidebar)"
                                                                    animationDuration={2000}
                                                                    animationEasing="ease-in-out"
                                                                />
                                                            </AreaChart>
                                                        );
                                                    })()}
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                }

                                if (pinnedId === 'AQI' && isAirQualityPinned) {
                                    const roomsWithAqi = [...new Set(devices.filter(d => {
                                        const p = getDeviceParams(d);
                                        return d.type === 'SENSOR' && p.sensorType === 'AIR_QUALITY';
                                    }).map(d => d.room))];
                                    const isAllRooms = selectedAirQualityRoom === ALL_ROOMS;
                                    const displayHistory = isAllRooms
                                        ? averagedAqiData.trends
                                        : (roomAirQualityHistories[selectedAirQualityRoom] || []);
                                    const currentAqiValue = currentDashboardAqi;
                                    const currentAqi = typeof currentAqiValue === 'number' ? Math.round(currentAqiValue) : currentAqiValue;
                                    const graphColor = getAQIColor(currentAqi);
                                    const displayTitle = isAllRooms ? t('allRooms') : (ROOM_NAME_KEYS[selectedAirQualityRoom] ? t(ROOM_NAME_KEYS[selectedAirQualityRoom]) : selectedAirQualityRoom);

                                    return (
                                        <div key="AQI" className="glass-panel animate-slide-in-right" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '0', border: 'none', background: 'var(--card-bg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
                                            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem', background: 'transparent' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${graphColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Wind size={14} color={graphColor} />
                                                        </div>
                                                        {t('airQuality')}
                                                    </h3>
                                                    <button onClick={() => setIsAirQualityPinned(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
                                                        <PinOff size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.2rem', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1' }}>{currentAqi} AQI</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.4rem' }}>
                                                            {isAllRooms ? t('avgAqi') : `${displayTitle} ${t('quality')}`}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '-0.8rem' }}>
                                                        <select
                                                            value={selectedAirQualityRoom}
                                                            onChange={e => setSelectedAirQualityRoom(e.target.value)}
                                                            style={{
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'var(--indicator-bg)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                appearance: 'auto',
                                                                maxWidth: '100%'
                                                            }}
                                                        >
                                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                                            {roomsWithAqi.map(room => (
                                                                <option key={room} value={room}>{t((ROOM_NAME_KEYS[room] || room.toLowerCase().replace(' ', '_')) as any)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ height: '120px', width: '100%', marginTop: 'auto' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={displayHistory}>
                                                        <defs>
                                                            <linearGradient id="colorAqiSidebar" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={graphColor} stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Tooltip
                                                            contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                            itemStyle={{ color: graphColor }}
                                                            formatter={(value: number | undefined) => [`${Math.round(value || 0)} AQI`, t('airQuality')]}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="aqi"
                                                            stroke={graphColor}
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorAqiSidebar)"
                                                            animationDuration={2000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                }

                                if (pinnedId === 'HUMIDITY' && isHumidityPinned) {
                                    const isAllRooms = selectedHumidityRoom === ALL_ROOMS;
                                    const displayHistory = isAllRooms
                                        ? averagedHumidityData.trends
                                        : (roomHumidityHistories[selectedHumidityRoom] || []).map(h => ({ hour: h.time, humidity: h.humidity }));
                                    const currentHumidityValue = currentDashboardHumidity;
                                    const currentHumidity = typeof currentHumidityValue === 'number' ? Math.round(currentHumidityValue) : currentHumidityValue;
                                    const graphColor = getHumidityColor(currentHumidity);
                                    const displayTitle = isAllRooms ? t('allRooms') : (ROOM_NAME_KEYS[selectedHumidityRoom] ? t(ROOM_NAME_KEYS[selectedHumidityRoom]) : selectedHumidityRoom);

                                    return (
                                        <div key="HUMIDITY" className="glass-panel animate-slide-in-right" style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '0', border: 'none', background: 'var(--card-bg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
                                            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem', background: 'transparent' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${graphColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Droplets size={14} color={graphColor} />
                                                        </div>
                                                        {t('humidity')}
                                                    </h3>
                                                    <button onClick={() => setIsHumidityPinned(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}>
                                                        <PinOff size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.2rem', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1' }}>{currentHumidity}%</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.4rem' }}>
                                                            {isAllRooms ? t('overallHumidity') : `${displayTitle} ${t('humidity')}`}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '-0.8rem' }}>
                                                        <select
                                                            value={selectedHumidityRoom}
                                                            onChange={e => setSelectedHumidityRoom(e.target.value)}
                                                            style={{
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'var(--indicator-bg)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                color: 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                appearance: 'auto',
                                                                maxWidth: '100%'
                                                            }}
                                                        >
                                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                                            {houseRooms.map(room => (
                                                                <option key={room} value={room}>{t((ROOM_NAME_KEYS[room] || room.toLowerCase().replace(' ', '_')) as any)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ height: '120px', width: '100%', marginTop: 'auto' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={displayHistory}>
                                                        <defs>
                                                            <linearGradient id="colorHumiditySidebar" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={graphColor} stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Tooltip
                                                            contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                            itemStyle={{ color: graphColor }}
                                                            formatter={(value: any) => [`${Math.round(Number(value))}%`, t('humidity')]}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="humidity"
                                                            stroke={graphColor}
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorHumiditySidebar)"
                                                            animationDuration={2000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Device Modal */}
            {isModalOpen && (
                <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: currentDevice.type === 'FAN' ? '340px' : '400px', padding: currentDevice.type === 'FAN' ? '1.5rem 1rem' : '2rem' }} onClick={e => e.stopPropagation()}>
                        {!(currentDevice.id && currentDevice.type === 'FAN') && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{currentDevice.id ? translateDeviceName(currentDevice.name || '', language) : (currentDevice.isNew ? t('add') : t('edit'))}</h2>
                            </div>
                        )}

                        {currentDevice.id && currentDevice.type === 'THERMOSTAT' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Temperature Control */}
                                <div style={{
                                    textAlign: 'center',
                                    backgroundColor: 'rgba(59,130,246,0.05)',
                                    padding: '2.5rem 2rem',
                                    borderRadius: '2rem',
                                    border: '1px solid rgba(59,130,246,0.1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
                                        <AirVent size={120} />
                                    </div>
                                    <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 800 }}>{t('targetTemperature')}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                                        {(() => {
                                            const currentTemp = getDeviceParams(currentDevice as Device).targetTemp || 22;
                                            const isAtMin = currentTemp <= AC_MIN_TEMP;
                                            const isAtMax = currentTemp >= AC_MAX_TEMP;

                                            return (
                                                <>
                                                    <button
                                                        className="btn"
                                                        disabled={isAtMin}
                                                        style={{
                                                            width: '52px', height: '52px', borderRadius: '16px',
                                                            background: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)', color: 'var(--text-primary)', border: '1px solid var(--card-border)',
                                                            fontSize: '1.5rem', fontWeight: 700,
                                                            opacity: isAtMin ? 0.4 : 1,
                                                            cursor: isAtMin ? 'not-allowed' : 'pointer'
                                                        }}
                                                        onClick={() => updateDeviceParams(currentDevice as Device, { targetTemp: Math.max(AC_MIN_TEMP, currentTemp - 1) })}
                                                    >-</button>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{currentTemp}°</span>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.5rem' }}>{t((getDeviceParams(currentDevice as Device).acMode || 'COOL').toLowerCase() as any)}</span>
                                                    </div>
                                                    <button
                                                        className="btn"
                                                        disabled={isAtMax}
                                                        style={{
                                                            width: '52px', height: '52px', borderRadius: '16px',
                                                            background: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)', color: 'var(--text-primary)', border: '1px solid var(--card-border)',
                                                            fontSize: '1.5rem', fontWeight: 700,
                                                            opacity: isAtMax ? 0.4 : 1,
                                                            cursor: isAtMax ? 'not-allowed' : 'pointer'
                                                        }}
                                                        onClick={() => updateDeviceParams(currentDevice as Device, { targetTemp: Math.min(AC_MAX_TEMP, currentTemp + 1) })}
                                                    >+</button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Mode Selection */}
                                <div>
                                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('operationMode')}</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem' }}>
                                        {[
                                            { id: 'COOL', icon: <Snowflake size={18} />, label: t('cool') },
                                            { id: 'HEAT', icon: <Flame size={18} />, label: t('heat') },
                                            { id: 'DRY', icon: <Droplets size={18} />, label: t('dry') },
                                            { id: 'FAN', icon: <Fan size={18} />, label: t('fan') },
                                            { id: 'AUTO', icon: <RotateCw size={18} />, label: t('auto') }
                                        ].map(m => {
                                            const isActive = (getDeviceParams(currentDevice as Device).acMode || 'COOL') === m.id;
                                            return (
                                                <button
                                                    key={m.id}
                                                    className="btn"
                                                    onClick={() => updateDeviceParams(currentDevice as Device, { acMode: m.id, mode: m.id === 'OFF' ? 'OFF' : 'ON' })}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.8rem 0', borderRadius: '14px',
                                                        background: isActive ? '#3b82f6' : 'var(--indicator-bg)',
                                                        color: isActive ? 'white' : 'var(--text-primary)',
                                                        border: 'none', transition: 'all 0.2s', transform: isActive ? 'scale(1.05)' : 'scale(1)'
                                                    }}
                                                >
                                                    {m.icon}
                                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', padding: '0 2px' }}>{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Fan Speed & Swing */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ backgroundColor: 'var(--indicator-bg)', padding: '1rem', borderRadius: '1.25rem' }}>
                                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('fanSpeed')}</p>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            {['LOW', 'MED', 'HIGH', 'AUTO'].map(s => {
                                                const isActive = (getDeviceParams(currentDevice as Device).fanSpeed || 'AUTO') === (s === 'MED' ? 'MEDIUM' : s);
                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => updateDeviceParams(currentDevice as Device, { fanSpeed: s === 'MED' ? 'MEDIUM' : s })}
                                                        style={{
                                                            flex: 1, padding: '0.5rem 0', borderRadius: '8px',
                                                            background: isActive ? '#10b981' : 'var(--card-bg)',
                                                            color: isActive ? 'white' : 'var(--text-primary)',
                                                            fontSize: '0.6rem', fontWeight: 800, border: '1px solid var(--glass-border)',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {t(s.toLowerCase() === 'med' ? 'medSpeed' : (s.toLowerCase() + 'Speed') as any)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--indicator-bg)', padding: '1rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{t('swing')}</span>
                                            <button
                                                onClick={() => updateDeviceParams(currentDevice as Device, { swing: !getDeviceParams(currentDevice as Device).swing })}
                                                style={{
                                                    width: '40px', height: '24px', borderRadius: '12px',
                                                    background: getDeviceParams(currentDevice as Device).swing ? '#3b82f6' : '#cbd5e1',
                                                    position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute', top: '2px', left: getDeviceParams(currentDevice as Device).swing ? '18px' : '2px',
                                                    width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s'
                                                }} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: getDeviceParams(currentDevice as Device).swing ? 1 : 0.4 }}>
                                            <Wind size={14} color="#3b82f6" />
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{t('oscillation')} {getDeviceParams(currentDevice as Device).swing ? t('on') : t('off')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {currentDevice.id && currentDevice.type === 'FAN' && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Top Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <X size={18} />
                                    </button>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{translateDeviceName(currentDevice.name || '', language) || currentDevice.name}</h2>
                                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <BarChart3 size={18} />
                                    </button>
                                </div>

                                {/* Status Section */}
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {currentDevice.status === 'OFF' ? '0%' : (
                                            (getDeviceParams(currentDevice as Device).fanSpeed === 'HIGH' ? '100%' :
                                                getDeviceParams(currentDevice as Device).fanSpeed === 'MEDIUM' ? '66%' : '33%')
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        {getRelativeTime(currentDevice.lastSeen)}
                                    </div>
                                </div>

                                {/* Vertical Capsule Controller */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '280px',
                                        backgroundColor: 'var(--indicator-bg)', border: '1px solid var(--card-border)',
                                        borderRadius: '50px',
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {[
                                            { id: 'HIGH', label: t('highSpeed'), status: 'ON' },
                                            { id: 'MEDIUM', label: t('medSpeed'), status: 'ON' },
                                            { id: 'LOW', label: t('lowSpeed'), status: 'ON' },
                                            { id: 'OFF', label: t('off'), status: 'OFF' }
                                        ].map(s => {
                                            const params = getDeviceParams(currentDevice as Device);
                                            const isActive = s.id === 'OFF' ? currentDevice.status === 'OFF' : (currentDevice.status === 'ON' && params.fanSpeed === s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        if (s.id === 'OFF') {
                                                            if (currentDevice.status === 'ON') toggleDeviceStatus(currentDevice as Device);
                                                        } else {
                                                            if (currentDevice.status === 'OFF') {
                                                                toggleDeviceStatus(currentDevice as Device);
                                                            }
                                                            updateDeviceParams(currentDevice as Device, { fanSpeed: s.id });
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        border: 'none',
                                                        borderRadius: '50px',
                                                        backgroundColor: isActive ? '#3b82f6' : 'transparent',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        color: isActive ? 'white' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    <Fan size={22} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.6 }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Direction Toggle Button */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => {
                                            const currentDir = getDeviceParams(currentDevice as Device).direction || 'FORWARD';
                                            updateDeviceParams(currentDevice as Device, { direction: currentDir === 'FORWARD' ? 'REVERSE' : 'FORWARD' });
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            backgroundColor: 'var(--indicator-bg)',
                                            border: '1px solid var(--card-border)',
                                            padding: '0.8rem 1.5rem',
                                            borderRadius: '25px',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.3s',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <RotateCcw size={16} />
                                        <span>{t('direction')} {(getDeviceParams(currentDevice as Device).direction || 'FORWARD') === 'FORWARD' ? t('forward') : t('reverse')}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentDevice.id && currentDevice.type === 'COFFEE_MACHINE' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Maintenance Levels */}
                                {(() => {
                                    const waterLevel = getDeviceParams(currentDevice as Device).waterLevel ?? 0;
                                    const coffeeLevel = getDeviceParams(currentDevice as Device).coffeeLevel ?? 0;
                                    const waterColor = waterLevel < 10 ? '#ef4444' : waterLevel < 25 ? '#f59e0b' : '#3b82f6';
                                    const coffeeColor = coffeeLevel < 10 ? '#ef4444' : coffeeLevel < 25 ? '#f59e0b' : '#92400e';
                                    return (
                                        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(${waterLevel < 10 ? '239,68,68' : waterLevel < 25 ? '245,158,11' : '59,130,246'}, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                                                    <Droplets size={18} color={waterColor} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('water')}</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: waterColor, transition: 'color 0.3s' }}>{waterLevel}%</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(${coffeeLevel < 10 ? '239,68,68' : coffeeLevel < 25 ? '245,158,11' : '146,64,14'}, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                                                    <Bean size={18} color={coffeeColor} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('beans')}</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: coffeeColor, transition: 'color 0.3s' }}>{coffeeLevel}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Controls */}
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                    {/* Presets */}
                                    <div className="form-group">
                                        <label className="form-label">{t('presets')}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                                            {[1, 2, 3, 4].map(presetNum => {
                                                const isActive = getDeviceParams(currentDevice as Device).activePreset === presetNum;
                                                return (
                                                    <button
                                                        key={`preset-${presetNum}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const params = getDeviceParams(currentDevice as Device);
                                                            const presetKey = `preset${presetNum}`;

                                                            const updateData: any = { activePreset: presetNum };

                                                            // If preset exists, load it
                                                            if (params[presetKey]) {
                                                                updateData.brewType = params[presetKey].brewType;
                                                                updateData.brewStrength = params[presetKey].brewStrength;
                                                                updateData.cupSize = params[presetKey].cupSize;
                                                            } else {
                                                                // If empty, save current settings to this preset
                                                                updateData[presetKey] = {
                                                                    brewType: params.brewType || 'ESPRESSO',
                                                                    brewStrength: params.brewStrength || 'MEDIUM',
                                                                    cupSize: params.cupSize || 'SMALL'
                                                                };
                                                            }

                                                            updateDeviceParams(currentDevice as Device, updateData);
                                                        }}
                                                        style={{
                                                            padding: '0.6rem 0.2rem', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer',
                                                            background: isActive ? '#d97706' : 'var(--indicator-bg)',
                                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                                            transition: 'all 0.2s',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {t('preset')} {presetNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">{t('coffeeType')}</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                {['ESPRESSO', 'AMERICANO', 'LATTE', 'CAPPUCCINO'].map(type => {
                                                    const isSelected = getDeviceParams(currentDevice as Device).brewType === type;
                                                    return (
                                                        <button
                                                            key={type}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const params = getDeviceParams(currentDevice as Device);
                                                                const updateData: any = { brewType: type };

                                                                // If a preset is active, save this change to the preset
                                                                if (params.activePreset) {
                                                                    const presetKey = `preset${params.activePreset}`;
                                                                    updateData[presetKey] = {
                                                                        ...params[presetKey],
                                                                        brewType: type
                                                                    };
                                                                }
                                                                updateDeviceParams(currentDevice as Device, updateData);
                                                            }}
                                                            style={{
                                                                padding: '0.6rem 0.2rem', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer',
                                                                background: isSelected ? '#d97706' : 'var(--indicator-bg)',
                                                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                                                transition: 'all 0.2s',
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {t(type.toLowerCase() as any)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div className="form-group">
                                                <label className="form-label">{t('strength')}</label>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {['MILD', 'MEDIUM', 'STRONG'].map(s => {
                                                        const isSelected = getDeviceParams(currentDevice as Device).brewStrength === s;
                                                        return (
                                                            <button
                                                                key={s}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const params = getDeviceParams(currentDevice as Device);
                                                                    const updateData: any = { brewStrength: s };

                                                                    if (params.activePreset) {
                                                                        const presetKey = `preset${params.activePreset}`;
                                                                        updateData[presetKey] = {
                                                                            ...params[presetKey],
                                                                            brewStrength: s
                                                                        };
                                                                    }
                                                                    updateDeviceParams(currentDevice as Device, updateData);
                                                                }}
                                                                style={{
                                                                    flex: 1, minWidth: 0, height: '32px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer',
                                                                    background: isSelected ? '#d97706' : 'var(--indicator-bg)',
                                                                    color: isSelected ? 'white' : 'var(--text-secondary)',
                                                                    transition: 'all 0.2s',
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {t(s.toLowerCase() as any)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('cupSize')}</label>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {['SMALL', 'MEDIUM', 'LARGE'].map(s => {
                                                        const isSelected = getDeviceParams(currentDevice as Device).cupSize === s;
                                                        return (
                                                            <button
                                                                key={s}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const params = getDeviceParams(currentDevice as Device);
                                                                    const updateData: any = { cupSize: s };

                                                                    if (params.activePreset) {
                                                                        const presetKey = `preset${params.activePreset}`;
                                                                        updateData[presetKey] = {
                                                                            ...params[presetKey],
                                                                            cupSize: s
                                                                        };
                                                                    }
                                                                    updateDeviceParams(currentDevice as Device, updateData);
                                                                }}
                                                                style={{
                                                                    flex: 1, minWidth: 0, height: '32px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer',
                                                                    background: isSelected ? '#d97706' : 'var(--indicator-bg)',
                                                                    color: isSelected ? 'white' : 'var(--text-secondary)',
                                                                    transition: 'all 0.2s',
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {t(s.toLowerCase() as any)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--indicator-bg)', borderRadius: '1rem', border: '1px dashed var(--card-border)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('boilerTemperature')}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const current = getDeviceParams(currentDevice as Device).temp || 92;
                                                    if (current > 60) updateDeviceParams(currentDevice as Device, { temp: current - 1 });
                                                }}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                                                    background: 'var(--indicator-bg)', color: 'var(--text-primary)', fontWeight: 900,
                                                    fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', lineHeight: 1
                                                }}
                                            >−</button>
                                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', minWidth: '4ch', textAlign: 'center' }}>
                                                {getDeviceParams(currentDevice as Device).temp || 92}<span style={{ fontSize: '0.9rem', verticalAlign: 'top', color: 'var(--text-secondary)' }}>°C</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const current = getDeviceParams(currentDevice as Device).temp || 92;
                                                    if (current < 100) updateDeviceParams(currentDevice as Device, { temp: current + 1 });
                                                }}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                                                    background: 'var(--indicator-bg)', color: 'var(--text-primary)', fontWeight: 900,
                                                    fontSize: '1.2rem', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', lineHeight: 1
                                                }}
                                            >+</button>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 800, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} /> {t('ready')}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const rawParams = getDeviceParams(currentDevice as Device);
                                        // Always start fresh - clear any stale brewing state
                                        const params = { ...rawParams, isBrewing: false, progress: 0 };
                                        const deviceId = (currentDevice as Device).id;
                                        const waterLevel = Math.max(0, (params.waterLevel || 100) - 8);
                                        const coffeeLevel = Math.max(0, (params.coffeeLevel || 100) - 4);

                                        // Update local state immediately to start animation
                                        const applyProgress = (prog: number, done: boolean) => {
                                            const updatedParams = {
                                                ...params,
                                                isBrewing: !done,
                                                progress: done ? 0 : prog,
                                                ...(done ? { waterLevel, coffeeLevel } : {})
                                            };
                                            const paramStr = JSON.stringify(updatedParams);
                                            setDevices((prev: Device[]) => prev.map(d => d.id === deviceId ? { ...d, parameters: paramStr } : d));
                                            setCurrentDevice(prev => prev.id === deviceId ? { ...prev, parameters: paramStr } : prev);
                                        };

                                        applyProgress(0, false);
                                        let prog = 0;
                                        const interval = setInterval(() => {
                                            prog += 10;
                                            if (prog >= 100) {
                                                clearInterval(interval);
                                                applyProgress(100, true);
                                                // Only make one API call at the end
                                                updateDeviceParams(currentDevice as Device, {
                                                    isBrewing: false,
                                                    progress: 0,
                                                    waterLevel,
                                                    coffeeLevel
                                                });
                                            } else {
                                                applyProgress(prog, false);
                                            }
                                        }, 250);
                                    }}
                                    style={{
                                        width: '100%', padding: '1.1rem', borderRadius: '1.25rem', border: 'none', background: '#92400e', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                                        boxShadow: '0 6px 20px rgba(146, 64, 14, 0.25)', position: 'relative', overflow: 'hidden'
                                    }}
                                    className="hover-scale"
                                >
                                    {getDeviceParams(currentDevice as Device).isBrewing && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, height: '100%',
                                            background: 'rgba(255,255,255,0.15)',
                                            width: `${getDeviceParams(currentDevice as Device).progress || 0}%`,
                                            transition: 'width 0.2s linear'
                                        }} />
                                    )}
                                    <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {getDeviceParams(currentDevice as Device).isBrewing ? <RotateCcw size={18} className="animate-spin" /> : <Coffee size={20} />}
                                        {getDeviceParams(currentDevice as Device).isBrewing ? `${t('brewing')} ${getDeviceParams(currentDevice as Device).progress || 0}%` : t('startBrewing')}
                                    </span>
                                </button>
                            </div>
                        )}

                        {currentDevice.id && currentDevice.type === 'ROBOT_VACUUM' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">{t('cleaningMode')}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                            {['Quiet', 'Standard', 'Max', 'Mopping'].map(mode => {
                                                const isActive = (getDeviceParams(currentDevice as Device).mode || 'Standard') === mode;
                                                return (
                                                    <button
                                                        key={mode}
                                                        onClick={() => updateDeviceParams(currentDevice as Device, { mode })}
                                                        style={{
                                                            padding: '0.6rem 0.2rem',
                                                            borderRadius: '10px',
                                                            background: isActive ? '#3b82f6' : 'var(--indicator-bg)',
                                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                                            fontWeight: 600,
                                                            fontSize: '0.6rem',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {t(mode.toLowerCase() as any)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('cleaningZones')}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                            {['Living Room', 'Kitchen', 'Bedroom', 'Basement', 'Garage', 'Bathroom'].map(room => {
                                                const roomIconMap: Record<string, any> = {
                                                    'Living Room': <Sofa size={14} />,
                                                    'Kitchen': <ChefHat size={14} />,
                                                    'Bedroom': <BedDouble size={14} />,
                                                    'Garage': <Car size={14} />,
                                                    'Bathroom': <Bath size={14} />,
                                                    'Basement': <Warehouse size={14} />
                                                };
                                                // Load from localStorage to stay in sync with Settings
                                                const vacuumSettings = (() => {
                                                    try {
                                                        const saved = localStorage.getItem('vacuumSettings');
                                                        return saved ? JSON.parse(saved) : { rooms: ['Living Room', 'Kitchen', 'Bedroom', 'Basement', 'Garage', 'Bathroom'] };
                                                    } catch { return { rooms: ['Living Room', 'Kitchen', 'Bedroom', 'Basement', 'Garage', 'Bathroom'] }; }
                                                })();
                                                const isIncluded = (vacuumSettings.rooms || ['Living Room', 'Kitchen', 'Bedroom', 'Basement', 'Garage', 'Bathroom']).includes(room);

                                                return (
                                                    <div
                                                        key={room}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const currentRooms = vacuumSettings.rooms || ['Living Room', 'Kitchen', 'Bedroom', 'Basement', 'Garage', 'Bathroom'];
                                                            const newRooms = isIncluded
                                                                ? currentRooms.filter((r: string) => r !== room)
                                                                : [...currentRooms, room];
                                                            const newSettings = { ...vacuumSettings, rooms: newRooms };
                                                            localStorage.setItem('vacuumSettings', JSON.stringify(newSettings));
                                                            // Force re-render of modal by touching currentDevice
                                                            setCurrentDevice({ ...currentDevice });
                                                        }}
                                                        style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                                            padding: '0.6rem 0.4rem', borderRadius: '12px', cursor: 'pointer',
                                                            border: '1px solid',
                                                            borderColor: isIncluded ? 'rgba(59,130,246,0.3)' : 'var(--card-border)',
                                                            background: isIncluded ? 'rgba(59,130,246,0.08)' : 'var(--indicator-bg)',
                                                            transition: 'all 0.2s', userSelect: 'none',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <div style={{ color: isIncluded ? '#3b82f6' : 'var(--text-secondary)', display: 'flex' }}>
                                                            {roomIconMap[room]}
                                                        </div>
                                                        <span style={{ fontSize: '0.55rem', fontWeight: 700, color: isIncluded ? '#3b82f6' : 'var(--text-primary)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t((ROOM_NAME_KEYS[room] || room.toLowerCase().replace(' ', '_')) as any)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleDeviceStatus(currentDevice as Device)}
                                        style={{
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            background: currentDevice.status === 'ON' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: currentDevice.status === 'ON' ? 'var(--danger-color)' : 'var(--success-color)',
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Power size={18} />
                                        {currentDevice.status === 'ON' ? t('returnToDock') : t('startCleaning')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentDevice.id && currentDevice.type === 'AIR_PURIFIER' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Info Panel */}
                                <div style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AQI</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: getAQIColor(latestAqi) }}>{latestAqi}</div>
                                    </div>
                                    <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }}></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('filter')}</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6' }}>{getDeviceParams(currentDevice as Device).filterLife || 98}%</div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">{t('mode')}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                            {['Auto', 'Sleep', 'Max'].map(mode => {
                                                const isActive = (getDeviceParams(currentDevice as Device).mode || 'Auto') === mode;
                                                return (
                                                    <button
                                                        key={mode}
                                                        onClick={() => updateDeviceParams(currentDevice as Device, { mode })}
                                                        style={{
                                                            padding: '0.6rem 0.2rem',
                                                            borderRadius: '10px',
                                                            background: isActive ? '#3b82f6' : 'var(--indicator-bg)',
                                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                                            fontWeight: 600,
                                                            fontSize: '0.65rem',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {t(mode.toLowerCase() as any)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleDeviceStatus(currentDevice as Device)}
                                        style={{
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            background: currentDevice.status === 'ON' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: currentDevice.status === 'ON' ? 'var(--danger-color)' : 'var(--success-color)',
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Power size={18} />
                                        {currentDevice.status === 'ON' ? t('turnOff') : t('turnOn')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentDevice.id && currentDevice.type === 'DEHUMIDIFIER' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Status Bar */}
                                <div style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', padding: '1rem 0.5rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.2rem' }}>
                                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '0.3rem', wordBreak: 'break-word' }}>{t('roomHumidity')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#3b82f6' }}>
                                            {(() => { const rh = roomHumidityHistories[currentDevice.room || '']; return rh && rh.length > 0 ? `${Math.round(rh[rh.length - 1].humidity)}%` : '--'; })()}
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)', flexShrink: 0 }}></div>
                                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '0.3rem', wordBreak: 'break-word' }}>{t('waterTank')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: (getDeviceParams(currentDevice as Device).waterLevel ?? 80) < 20 ? 'var(--danger-color)' : '#3b82f6' }}>
                                            {getDeviceParams(currentDevice as Device).waterLevel ?? 80}%
                                        </div>
                                    </div>
                                    <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)', flexShrink: 0 }}></div>
                                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '0.3rem', wordBreak: 'break-word' }}>{t('power')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#3b82f6' }}>
                                            {getDevicePower(currentDevice as Device)} W
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Mode */}
                                    <div className="form-group">
                                        <label className="form-label">{t('mode')}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                            {['Eco', 'Normal', 'Boost'].map(mode => {
                                                const isActive = (getDeviceParams(currentDevice as Device).mode || 'Normal') === mode;
                                                return (
                                                    <button
                                                        key={mode}
                                                        onClick={() => updateDeviceParams(currentDevice as Device, { mode })}
                                                        style={{
                                                            padding: '0.6rem 0.2rem',
                                                            borderRadius: '10px',
                                                            background: isActive ? '#3b82f6' : 'var(--indicator-bg)',
                                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                                            fontWeight: 600, fontSize: '0.65rem',
                                                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {t(mode.toLowerCase() as any)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Target Humidity */}
                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <label className="form-label" style={{ marginBottom: 0 }}>{t('targetHumidity')}</label>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#3b82f6' }}>{getDeviceParams(currentDevice as Device).targetHumidity || 50}%</span>
                                        </div>
                                        <input
                                            type="range" min="30" max="70" step="5"
                                            value={getDeviceParams(currentDevice as Device).targetHumidity || 50}
                                            onChange={e => updateDeviceParams(currentDevice as Device, { targetHumidity: parseInt(e.target.value) })}
                                            style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            <span>30% {t('dry')}</span><span>50% {t('ideal')}</span><span>70% {t('max')}</span>
                                        </div>
                                    </div>

                                    {/* Power Toggle */}
                                    <button
                                        onClick={() => toggleDeviceStatus(currentDevice as Device)}
                                        style={{
                                            border: 'none', borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                                            background: currentDevice.status === 'ON' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                                            color: currentDevice.status === 'ON' ? 'var(--danger-color)' : '#3b82f6',
                                            fontWeight: 800, fontSize: '0.9rem',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <Power size={18} />
                                        {currentDevice.status === 'ON' ? t('turnOff') : t('turnOn')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentDevice.id && currentDevice.type === 'RELAY' && (
                            <div style={{ marginBottom: '2rem' }}>
                                {(getDeviceParams(currentDevice as Device).hasColor !== false) && (
                                    <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(0,0,0,0.03)', padding: '1.25rem', borderRadius: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                            <span style={{ fontWeight: 700 }}>{t('colourSetting')}</span>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                {(getDeviceParams(currentDevice as Device).color || '#FFFFFF').toUpperCase()}
                                            </span>
                                        </div>

                                        <FastColorPicker
                                            initialColor={getDeviceParams(currentDevice as Device).color || '#FFFFFF'}
                                            onChange={(newColor) => {
                                                const params = getDeviceParams(currentDevice as Device);
                                                params.color = newColor;
                                                const updatedParamsStr = JSON.stringify(params);
                                                setCurrentDevice(prev => ({ ...prev, parameters: updatedParamsStr }));
                                                setDevices((prev: Device[]) => prev.map(d => d.id === currentDevice.id ? { ...d, parameters: updatedParamsStr } : d));
                                            }}
                                            hexToRgb={hexToRgb}
                                            rgbToHex={rgbToHex}
                                        />

                                        <div style={{ marginTop: '1.25rem' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => {
                                                    updateDeviceParams(currentDevice as Device, { color: getDeviceParams(currentDevice as Device).color });
                                                }}
                                                style={{ width: '100%', padding: '0.8rem', fontWeight: 800, borderRadius: '0.8rem', fontSize: '1rem' }}
                                            >
                                                {t('applyNewColour')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>{t('brightness')}</span>
                                    <span style={{ fontWeight: 600 }}>{getDeviceParams(currentDevice as Device).brightness || 100}%</span>
                                </div>
                                <input type="range" min="1" max="100" value={getDeviceParams(currentDevice as Device).brightness || 100} onChange={e => updateDeviceParams(currentDevice as Device, { brightness: parseInt(e.target.value) })} style={{ width: '100%' }} />
                            </div>
                        )}

                        {!currentDevice.id && (
                            <form onSubmit={handleSaveDevice}>
                                <div className="form-group">
                                    <label className="form-label">{t('name')}</label>
                                    <input className="form-input" value={currentDevice.name || ''} onChange={e => setCurrentDevice({ ...currentDevice, name: e.target.value })} disabled={!!currentDevice.id} />
                                </div>
                                {!currentDevice.id && (
                                    <div className="form-group">
                                        <label className="form-label">{t('type')}</label>
                                        <select className="form-select" value={currentDevice.type || 'RELAY'} onChange={e => setCurrentDevice({ ...currentDevice, type: e.target.value })} disabled={!!currentDevice.id}>
                                            <option value="RELAY">{t('lightBulb' as any)}</option>
                                            <option value="SENSOR">{t('sensor' as any)}</option>
                                            <option value="THERMOSTAT">{t('thermostat' as any)}</option>
                                            <option value="FAN">{t('fan' as any)}</option>
                                        </select>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '12px', fontWeight: 700, padding: '0.8rem' }}>
                                        {currentDevice.id ? t('apply') : t('addAccessory')}
                                    </button>
                                    {!currentDevice.id && (
                                        <button type="button" className="btn" style={{ flex: 1, borderRadius: '12px' }} onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Other modals (Climate, Power, Stats) */}
            {isTempModalOpen && (() => {
                const isAllRooms = selectedTempRoom === ALL_ROOMS;
                const roomData = !isAllRooms && roomTempHistories[selectedTempRoom] ? roomTempHistories[selectedTempRoom] : [];

                const currentTempValue = currentDashboardTemp;

                const currentTemp = typeof currentTempValue === 'number' ? currentTempValue.toFixed(1) : '--';
                const tempColor = getTempColor(Number(currentTempValue));

                const hourlyTempTrends = isAllRooms
                    ? averagedTempData.trends
                    : Array.from({ length: 24 }, (_, i) => {
                        const hour = (new Date().getHours() - (23 - i) + 24) % 24;
                        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                        const match = roomData.find(h => h.time.startsWith(hourStr)) || tempHistory.find(h => h.time.startsWith(hourStr));
                        return {
                            hour: hourStr,
                            temp: match ? match.temp : 21.5 + Math.sin(i / 3) * 1.5
                        };
                    });
                return (
                    <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsTempModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                        <div className="glass-panel" style={{ width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('temperature')}</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t('climateMonitoring')}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        className="btn"
                                        onClick={() => setIsTempPinned(!isTempPinned)}
                                        style={{
                                            background: isTempPinned ? `${tempColor}15` : 'var(--indicator-bg)',
                                            color: isTempPinned ? tempColor : 'var(--text-secondary)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            border: isTempPinned ? `1px solid ${tempColor}` : '1px solid var(--card-border)'
                                        }}
                                    >
                                        {isTempPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                        {isTempPinned ? t('unpin') : t('pinToSide')}
                                    </button>
                                    <button className="btn" style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', borderRadius: '10px' }}>
                                        {new Date().toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </button>
                                    <button className="btn btn-primary" style={{ borderRadius: '10px' }} onClick={() => setIsTempModalOpen(false)}>{t('close')}</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                {/* Live Usage Chart */}
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Thermometer size={20} color={tempColor} /> {t('liveTemperature')}
                                        </div>
                                        <div style={{ padding: '0.4rem 1rem', background: 'var(--indicator-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, minWidth: '80px', textAlign: 'center' }}>
                                            {currentTemp} °C
                                        </div>
                                    </h3>
                                    <div style={{ height: '200px', background: `${tempColor}08`, borderRadius: '1.5rem', padding: '1.5rem', border: `1px solid ${tempColor}15` }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={hourlyTempTrends.map(t => ({ time: t.hour, temp: t.temp }))}>
                                                <XAxis dataKey="time" hide />
                                                <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    formatter={(value: any) => [`${Math.round(Number(value))} °C`, t('temperature' as any)]}
                                                    labelStyle={{ display: 'none' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="temp"
                                                    stroke={tempColor}
                                                    strokeWidth={3}
                                                    dot={false}
                                                    animationDuration={3000}
                                                    animationEasing="ease-in-out"
                                                    connectNulls={true}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Full Width Bar Chart */}
                                <div>
                                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{t('temperatureHistory')}</h3>
                                        <select
                                            value={selectedTempRoom}
                                            onChange={e => setSelectedTempRoom(e.target.value)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--card-border)',
                                                background: 'var(--indicator-bg)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                            {houseRooms.map(room => (
                                                <option key={room} value={room}>{ROOM_NAME_KEYS[room] ? t(ROOM_NAME_KEYS[room] as any) : room}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ height: '350px', background: 'var(--bg-secondary)', borderRadius: '1.5rem', padding: '1.5rem 2rem', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={hourlyTempTrends}>
                                                <XAxis dataKey="hour" axisLine={false} tickLine={false} style={{ fontSize: '0.7rem', fontWeight: 700, fill: 'var(--text-secondary)' }} interval={2} />
                                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fontWeight: 700, fill: 'var(--text-secondary)' }} unit="°C" domain={[15, 30]} />
                                                <Tooltip formatter={(value) => [`${Math.round(Number(value))} °C`, t('temperature' as any)]}
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                />
                                                <Bar dataKey="temp" radius={[6, 6, 0, 0]} barSize={25}>
                                                    {hourlyTempTrends.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={`${getTempColor(entry.temp)}aa`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0000ff' }} /> 0°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /> 6°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ced1' }} /> 12°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ffff' }} /> 18°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#72db31' }} /> 24°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffff00' }} /> 30°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff8c00' }} /> 35°C
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff0000' }} /> 40°C
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Usage List or additional stats */}
                            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {(() => {
                                    const temperatures = hourlyTempTrends.map((t: any) => t.temp);
                                    const hasTrends = temperatures.length > 0;
                                    const maxVal = hasTrends ? Math.max(...temperatures) : 0;
                                    const minVal = hasTrends ? Math.min(...temperatures) : 0;
                                    const avgVal = hasTrends ? temperatures.reduce((a: number, b: number) => a + b, 0) / temperatures.length : 0;
                                    const current = Number(currentTempValue);

                                    return [
                                        {
                                            label: t('peakTemp'),
                                            value: `${maxVal.toFixed(1)} °C`,
                                            sub: hasTrends ? `${t('recorded')} ${hourlyTempTrends.find((t: any) => t.temp === maxVal)?.hour || 'today'}` : t('noData'),
                                            icon: <ArrowUp size={16} color={getTempColor(maxVal)} />
                                        },
                                        {
                                            label: t('lowestTemp'),
                                            value: `${minVal.toFixed(1)} °C`,
                                            sub: hasTrends ? `${t('recorded')} ${hourlyTempTrends.find((t: any) => t.temp === minVal)?.hour || 'today'}` : t('noData'),
                                            icon: <Activity size={16} color={getTempColor(minVal)} />
                                        },
                                        {
                                            label: t('comfortLevel'),
                                            value: (current < 19 ? t('cool') : current > 24 ? t('warm') : t('optimal')),
                                            sub: t('basedOnCurrent'),
                                            icon: <Thermometer size={16} color={getTempColor(current)} />
                                        },
                                        {
                                            label: t('dailyAvg'),
                                            value: `${avgVal.toFixed(1)} °C`,
                                            sub: t('meanHouseTemp'),
                                            icon: <Zap size={16} color={getTempColor(avgVal)} />
                                        }
                                    ].map((stat, i) => (
                                        <div key={i} className="glass-panel" style={{ padding: '1.5rem', border: 'none', background: 'var(--indicator-bg)', borderRadius: '1.25rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>{stat.icon}</div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{stat.label}</span>
                                            </div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.sub}</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {isAirQualityModalOpen && (() => {
                const isAllRooms = selectedAirQualityRoom === ALL_ROOMS;
                const roomData = !isAllRooms && roomAirQualityHistories[selectedAirQualityRoom] ? roomAirQualityHistories[selectedAirQualityRoom] : [];

                const currentAqiValue = currentDashboardAqi;

                const currentAqi = typeof currentAqiValue === 'number' ? Math.round(currentAqiValue) : '--';
                const aqiColor = getAQIColor(Number(currentAqiValue));

                const hourlyAqiTrends = isAllRooms
                    ? averagedAqiData.trends
                    : Array.from({ length: 24 }, (_, i) => {
                        const hour = (new Date().getHours() - (23 - i) + 24) % 24;
                        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                        const match = roomData.find(h => h.time.startsWith(hourStr)) || airQualityHistory.find(h => h.time.startsWith(hourStr));
                        return {
                            hour: hourStr,
                            aqi: match ? match.aqi : 28 + Math.sin(i / 4) * 8
                        };
                    });
                return (
                    <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAirQualityModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                        <div className="glass-panel" style={{ width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('airQuality')}</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t('aqiMonitoring')}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        className="btn"
                                        onClick={() => setIsAirQualityPinned(!isAirQualityPinned)}
                                        style={{
                                            background: isAirQualityPinned ? `${aqiColor}15` : 'var(--indicator-bg)',
                                            color: isAirQualityPinned ? aqiColor : 'var(--text-secondary)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            border: isAirQualityPinned ? `1px solid ${aqiColor}` : '1px solid var(--card-border)'
                                        }}
                                    >
                                        {isAirQualityPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                        {isAirQualityPinned ? t('unpin') : t('pinToSide')}
                                    </button>
                                    <button className="btn" style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', borderRadius: '10px' }}>
                                        {new Date().toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </button>
                                    <button className="btn btn-primary" style={{ borderRadius: '10px' }} onClick={() => setIsAirQualityModalOpen(false)}>{t('close')}</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                {/* Live Usage Chart */}
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Wind size={20} color={aqiColor} /> {t('liveAqi')}
                                        </div>
                                        <div style={{ padding: '0.4rem 1rem', background: 'var(--indicator-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, minWidth: '80px', textAlign: 'center' }}>
                                            {currentAqi} AQI
                                        </div>
                                    </h3>
                                    <div style={{ height: '200px', background: `${aqiColor}08`, borderRadius: '1.5rem', padding: '1.5rem', border: `1px solid ${aqiColor}15` }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={hourlyAqiTrends.map(t => ({ time: t.hour, aqi: t.aqi }))}>
                                                <defs>
                                                    <linearGradient id="colorAqiModal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={aqiColor} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={aqiColor} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time" hide />
                                                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    formatter={(value: any) => [`${Math.round(Number(value))} AQI`, t('airQuality')]}
                                                    labelStyle={{ display: 'none' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="aqi"
                                                    stroke={aqiColor}
                                                    fillOpacity={1}
                                                    fill="url(#colorAqiModal)"
                                                    strokeWidth={3}
                                                    animationDuration={3000}
                                                    animationEasing="ease-in-out"
                                                    connectNulls={true}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Full Width Bar Chart */}
                                <div>
                                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{t('airQualityHistory')}</h3>
                                        <select
                                            value={selectedAirQualityRoom}
                                            onChange={e => setSelectedAirQualityRoom(e.target.value)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--card-border)',
                                                background: 'var(--indicator-bg)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                            {houseRooms.map(room => (
                                                <option key={room} value={room}>{ROOM_NAME_KEYS[room] ? t(ROOM_NAME_KEYS[room] as any) : room}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ height: '350px', background: 'var(--bg-secondary)', borderRadius: '1.5rem', padding: '1.5rem 2rem', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={hourlyAqiTrends}>
                                                <XAxis dataKey="hour" axisLine={false} tickLine={false} style={{ fontSize: '0.7rem', fontWeight: 700, fill: 'var(--text-secondary)' }} interval={2} />
                                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fontWeight: 700, fill: 'var(--text-secondary)' }} unit=" AQI" domain={[0, 100]} />
                                                <Tooltip formatter={(value) => [`${Math.round(Number(value))} AQI`, t('airQuality')]}
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                />
                                                <Bar dataKey="aqi" radius={[6, 6, 0, 0]} barSize={25}>
                                                    {hourlyAqiTrends.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={`${getAQIColor(entry.aqi)}aa`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> {t('good')} (&lt; 50)
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> {t('moderate')} (50-100)
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> {t('poor')} (&gt; 100)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Usage List or additional stats */}
                            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {(() => {
                                    const aqiValues = hourlyAqiTrends.map((t: any) => t.aqi);
                                    const hasTrends = aqiValues.length > 0;
                                    const avgAqiVal = hasTrends ? aqiValues.reduce((a: number, b: number) => a + b, 0) / aqiValues.length : 0;
                                    const current = Number(currentAqiValue);

                                    return [
                                        {
                                            label: t('avgAqi'),
                                            value: `${Math.round(avgAqiVal)} AQI`,
                                            sub: !hasTrends ? t('noData') :
                                                (avgAqiVal < 50 ? t('goodQuality') :
                                                    (avgAqiVal < 100 ? t('moderateQuality') : t('poorQuality'))),
                                            icon: <CheckCircle2 size={16} color={getAQIColor(avgAqiVal)} />
                                        },
                                        {
                                            label: t('outdoorAqi'),
                                            value: `${Math.round(outdoorAqi)} AQI`,
                                            sub: t('staraZagora' as any),
                                            icon: <Wind size={16} color={getAQIColor(outdoorAqi)} />
                                        },
                                        {
                                            label: t('peakPollutant'),
                                            value: 'PM2.5',
                                            sub: `${(current * 0.03).toFixed(1)} µg/m³ ${t('peak')}`,
                                            icon: <Activity size={16} color="#3b82f6" />
                                        },
                                        {
                                            label: t('healthAdvisory'),
                                            value: (current < 50 ? t('excellent') : (current < 100 ? t('moderate') : t('poorSensitive'))),
                                            sub: (current < 50 ? t('safeOutdoor') :
                                                (current < 100 ? t('limitHeavyExercise') : t('avoidHeavyActivity'))),
                                            icon: <Leaf size={16} color={getAQIColor(current)} />
                                        },
                                        {
                                            label: t('airPurity'),
                                            value: `${Math.max(0, 100 - (current / 2 || 15)).toFixed(0)}%`,
                                            sub: t('houseWidePurity'),
                                            icon: <Sun size={16} color="#FBBF24" />
                                        }
                                    ].map((stat, i) => (
                                        <div key={i} className="glass-panel" style={{ padding: '1.5rem', border: 'none', background: 'var(--indicator-bg)', borderRadius: '1.25rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>{stat.icon}</div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{stat.label}</span>
                                            </div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.sub}</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {isPowerModalOpen && (() => {
                const roomNames = powerAverageRooms.length > 0 ? powerAverageRooms : houseRooms;

                const filteredPowerHistory = selectedPowerRoom === ALL_ROOMS
                    ? (() => {
                        if (roomNames.length === 0) return [];
                        const firstRoomHistory = roomPowerHistories[roomNames[0]] || [];
                        return firstRoomHistory.map((entry, idx) => {
                            let totalPower = 0;
                            roomNames.forEach(room => {
                                const roomEntry = roomPowerHistories[room]?.[idx];
                                if (roomEntry) totalPower += roomEntry.power;
                            });
                            return { time: entry.time, power: totalPower };
                        });
                    })()
                    : (roomPowerHistories[selectedPowerRoom] || []);

                const rawData = filteredPowerHistory;


                // Aggregate into 24-hour hourly buckets: average W per hour
                const hourlyBuckets: Record<number, { sum: number; count: number }> = {};
                for (let h = 0; h < 24; h++) hourlyBuckets[h] = { sum: 0, count: 0 };

                rawData.forEach(entry => {
                    const hour = parseInt(entry.time.split(':')[0], 10);
                    if (!isNaN(hour) && hourlyBuckets[hour] !== undefined) {
                        hourlyBuckets[hour].sum += entry.power;
                        hourlyBuckets[hour].count += 1;
                    }
                });

                const currentHour = new Date().getHours();
                const hourlyPowerData = Array.from({ length: 24 }, (_, i) => {
                    const bucket = hourlyBuckets[i];
                    const avgW = bucket.count > 0 ? bucket.sum / bucket.count : 0;
                    const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
                    return { hour: label, power: Math.round(avgW), isCurrent: i === currentHour };
                });

                const validHours = hourlyPowerData.filter(h => h.power > 0);
                const peakEntry = validHours.length > 0 ? validHours.reduce((a, b) => a.power > b.power ? a : b) : null;
                const totalWh = Math.round(validHours.reduce((sum, h) => sum + h.power, 0));
                const avgW = validHours.length > 0 ? Math.round(validHours.reduce((s, h) => s + h.power, 0) / validHours.length) : 0;

                return (
                    <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsPowerModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                        <div className="glass-panel" style={{ width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('powerConsumption')}</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t('liveMonitoring')}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        className="btn"
                                        onClick={() => setIsPowerPinned(!isPowerPinned)}
                                        style={{
                                            background: isPowerPinned ? 'rgba(59, 130, 246, 0.1)' : 'var(--indicator-bg)',
                                            color: isPowerPinned ? '#3b82f6' : 'var(--text-secondary)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            border: isPowerPinned ? '1px solid #3b82f6' : '1px solid var(--card-border)'
                                        }}
                                    >
                                        {isPowerPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                        {isPowerPinned ? t('unpin') : t('pinToSide')}
                                    </button>
                                    <button className="btn" style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', borderRadius: '10px' }}>
                                        {new Date().toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </button>
                                    <button className="btn btn-primary" style={{ borderRadius: '10px' }} onClick={() => setIsPowerModalOpen(false)}>{t('close')}</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                {/* Live Usage Chart */}
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Activity size={20} color="var(--warning-color)" /> {t('liveConsumption')}
                                        </div>
                                        <div style={{ padding: '0.4rem 1rem', background: 'var(--indicator-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, minWidth: '80px', textAlign: 'center' }}>
                                            {currentDashboardPower} W
                                        </div>
                                    </h3>
                                    <div style={{ height: '200px', background: 'rgba(255, 193, 7, 0.05)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255, 193, 7, 0.1)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={rawData}>
                                                <XAxis dataKey="time" hide />
                                                <YAxis domain={['dataMin - 50', 'dataMax + 50']} hide />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    formatter={(value: any) => [`${Math.round(Number(value))} W`, t('power' as any)]}
                                                    labelStyle={{ display: 'none' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="power"
                                                    stroke="var(--warning-color)"
                                                    strokeWidth={3}
                                                    dot={false}
                                                    animationDuration={3000}
                                                    animationEasing="ease-in-out"
                                                    connectNulls={true}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Hourly Bar Chart */}
                                <div>
                                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{t('dailyEnergyInsights')}</h3>
                                        <select
                                            value={selectedPowerRoom}
                                            onChange={e => setSelectedPowerRoom(e.target.value)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--card-border)',
                                                background: 'var(--indicator-bg)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                            {houseRooms.map(room => (
                                                <option key={room} value={room}>{ROOM_NAME_KEYS[room] ? t(ROOM_NAME_KEYS[room] as any) : room}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ height: '350px', background: 'var(--bg-secondary)', borderRadius: '1.5rem', padding: '1.5rem 2rem', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={hourlyPowerData}>
                                                <XAxis dataKey="hour" axisLine={false} tickLine={false} style={{ fontSize: '0.7rem', fontWeight: 700, fill: 'var(--text-secondary)' }} interval={1} />
                                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fontWeight: 700, fill: 'var(--text-secondary)' }} unit=" W" />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 600, color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    formatter={(value: any) => [`${Math.round(Number(value))} W avg`, t('power' as any)]}
                                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                />
                                                <Bar dataKey="power" radius={[6, 6, 0, 0]} barSize={22}>
                                                    {hourlyPowerData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.isCurrent ? 'rgba(234, 179, 8, 1)' : entry.power > 0 ? 'rgba(234, 179, 8, 0.55)' : 'rgba(234, 179, 8, 0.15)'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    {
                                        label: t('peakHour'),
                                        value: peakEntry ? peakEntry.hour : '--',
                                        sub: peakEntry ? `${peakEntry.power} W avg` : t('noDataYet'),
                                        icon: <ArrowUp size={16} color="var(--danger-color)" />
                                    },
                                    {
                                        label: t('totalToday'),
                                        value: validHours.length > 0 ? `${totalWh} Wh` : '--',
                                        sub: validHours.length > 0 ? `≈ ${(totalWh / 1000).toFixed(2)} kWh` : t('noDataYet'),
                                        icon: <Zap size={16} color="var(--warning-color)" />
                                    },
                                    {
                                        label: t('dailyAvg'),
                                        value: avgW > 0 ? `${avgW} W` : '--',
                                        sub: t('meanHourlyDraw'),
                                        icon: <Activity size={16} color="#3b82f6" />
                                    },
                                    {
                                        label: t('currentDraw'),
                                        value: `${currentDashboardPower} W`,
                                        sub: selectedPowerRoom === ALL_ROOMS ? t('houseWideLive') : `${ROOM_NAME_KEYS[selectedPowerRoom] ? t(ROOM_NAME_KEYS[selectedPowerRoom] as any) : selectedPowerRoom} ${t('live')}`,
                                        icon: <Globe size={16} color="#10b981" />
                                    }
                                ].map((stat, i) => (
                                    <div key={i} className="glass-panel" style={{ padding: '1.5rem', border: 'none', background: 'var(--indicator-bg)', borderRadius: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>{stat.icon}</div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{stat.label}</span>
                                        </div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.8 }}>{stat.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {isActiveDevicesModalOpen && (
                <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsActiveDevicesModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', paddingTop: '5vh', justifyContent: 'center', zIndex: 300 }}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '600px', maxHeight: '90vh', padding: '2rem', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{t('activeDevices')}</h2>
                            <button onClick={() => setIsActiveDevicesModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', flexShrink: 0 }} className="hide-scrollbar">
                            {['All', ...Array.from(new Set(devices.filter(d => d.status === 'ON').map(d => d.room)))].map(room => (
                                <button
                                    key={room}
                                    onClick={() => setActiveDevicesFilterRoom(room)}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        background: activeDevicesFilterRoom === room ? 'var(--accent-color)' : 'var(--indicator-bg)',
                                        color: activeDevicesFilterRoom === room ? 'white' : 'var(--text-secondary)',
                                        border: activeDevicesFilterRoom === room ? 'none' : '1px solid var(--card-border)'
                                    }}
                                >
                                    {room === 'All' ? t('allRooms') : (ROOM_NAME_KEYS[room] ? t(ROOM_NAME_KEYS[room] as any) : room)}
                                </button>
                            ))}
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--indicator-bg)', borderBottom: '2px solid var(--card-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }} onClick={() => handleSortActiveDevices('name')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {t('name')} {activeDevicesSortConfig?.key === 'name' ? (activeDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }} onClick={() => handleSortActiveDevices('room')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {t('room')} {activeDevicesSortConfig?.key === 'room' ? (activeDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }} onClick={() => handleSortActiveDevices('type')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {t('type')} {activeDevicesSortConfig?.key === 'type' ? (activeDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                        <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devices
                                        .filter(d => d.status === 'ON')
                                        .filter(d => activeDevicesFilterRoom === 'All' || d.room === activeDevicesFilterRoom)
                                        .sort((a, b) => {
                                            if (!activeDevicesSortConfig) return 0;
                                            const aVal = (a[activeDevicesSortConfig.key] || '').toString().toLowerCase();
                                            const bVal = (b[activeDevicesSortConfig.key] || '').toString().toLowerCase();
                                            if (aVal < bVal) return activeDevicesSortConfig.direction === 'asc' ? -1 : 1;
                                            if (aVal > bVal) return activeDevicesSortConfig.direction === 'asc' ? 1 : -1;
                                            return 0;
                                        })
                                        .map(device => (
                                            <tr key={device.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{translateDeviceName(device.name, language)}</td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{ background: 'var(--indicator-bg)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {device.room ? t((ROOM_NAME_KEYS[device.room] || device.room.toLowerCase().replace(' ', '_')) as any) : t('unassigned')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                                        {getDeviceIcon(device.type)}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t(device.type.toLowerCase() as any)}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', fontWeight: 700, fontSize: '0.7rem' }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-color)' }} />
                                                        {t('active')}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {devices.filter(d => d.status === 'ON' && (activeDevicesFilterRoom === 'All' || d.room === activeDevicesFilterRoom)).length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                {t('noActiveDevices')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {isTotalDevicesModalOpen && (
                <div onClick={() => setIsTotalDevicesModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', paddingTop: '5vh', justifyContent: 'center', zIndex: 300 }}>
                    <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh', padding: '2rem', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{t('allDevices')}</h2>
                            <button onClick={() => setIsTotalDevicesModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', flexShrink: 0 }} className="hide-scrollbar">
                            {['All', ...Array.from(new Set(devices.map(d => d.room)))].map(room => (
                                <button
                                    key={room}
                                    onClick={() => setTotalDevicesFilterRoom(room)}
                                    style={{
                                        padding: '0.4rem 1rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        background: totalDevicesFilterRoom === room ? 'var(--accent-color)' : 'var(--indicator-bg)',
                                        color: totalDevicesFilterRoom === room ? 'white' : 'var(--text-secondary)',
                                        border: totalDevicesFilterRoom === room ? 'none' : '1px solid var(--card-border)'
                                    }}
                                >
                                    {room === 'All' ? t('allRooms') : (ROOM_NAME_KEYS[room] ? t(ROOM_NAME_KEYS[room] as any) : room)}
                                </button>
                            ))}
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--indicator-bg)', borderBottom: '2px solid var(--card-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }} onClick={() => handleSortTotalDevices('name')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {t('name')} {totalDevicesSortConfig?.key === 'name' ? (totalDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }} onClick={() => handleSortTotalDevices('room')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {t('room')} {totalDevicesSortConfig?.key === 'room' ? (totalDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }} onClick={() => handleSortTotalDevices('type')}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {t('type')} {totalDevicesSortConfig?.key === 'type' ? (totalDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                        <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }} onClick={() => handleSortTotalDevices('status')}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                {t('status')} {totalDevicesSortConfig?.key === 'status' ? (totalDevicesSortConfig.direction === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.5 }}>↕</span>}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devices
                                        .filter(d => totalDevicesFilterRoom === 'All' || d.room === totalDevicesFilterRoom)
                                        .sort((a, b) => {
                                            if (!totalDevicesSortConfig) return 0;
                                            const aVal = (a[totalDevicesSortConfig.key] || '').toString().toLowerCase();
                                            const bVal = (b[totalDevicesSortConfig.key] || '').toString().toLowerCase();
                                            if (aVal < bVal) return totalDevicesSortConfig.direction === 'asc' ? -1 : 1;
                                            if (aVal > bVal) return totalDevicesSortConfig.direction === 'asc' ? 1 : -1;
                                            return 0;
                                        })
                                        .map(device => (
                                            <tr key={device.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{translateDeviceName(device.name, language)}</td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{ background: 'var(--indicator-bg)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {device.room ? (ROOM_NAME_KEYS[device.room] ? t(ROOM_NAME_KEYS[device.room] as any) : device.room) : t('unassigned')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                                        {getDeviceIcon(device.type)}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t(device.type.toLowerCase() as any)}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                        color: device.status === 'ON' ? 'var(--success-color)' : 'var(--text-secondary)',
                                                        fontWeight: 700, fontSize: '0.7rem'
                                                    }}>
                                                        <div style={{
                                                            width: 6, height: 6, borderRadius: '50%',
                                                            background: device.status === 'ON' ? 'var(--success-color)' : 'var(--text-secondary)'
                                                        }} />
                                                        {device.status === 'ON' ? t('on') : t('off')}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {devices.filter(d => totalDevicesFilterRoom === 'All' || d.room === totalDevicesFilterRoom).length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                {t('noDevicesFound')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {isShoppingListOpen && (
                <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsShoppingListOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{t('shoppingList')}</h2>
                            <button onClick={() => setIsShoppingListOpen(false)} style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', padding: '0.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={addShoppingItem} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <input
                                className="form-input"
                                placeholder={t('addItem')}
                                value={newItemText}
                                onChange={e => setNewItemText(e.target.value)}
                                style={{ flex: 1, borderRadius: '12px', padding: '0.75rem 1rem' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Plus size={20} />
                            </button>
                        </form>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {shoppingItems.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '0.9rem' }}>{t('noItemsYet')}</div>
                            ) : (
                                shoppingItems.map((item, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.85rem 1rem',
                                        background: 'var(--indicator-bg)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--card-border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                            <button
                                                onClick={() => toggleShoppingItem(index)}
                                                style={{ background: 'transparent', border: 'none', color: item.completed ? 'var(--success-color)' : 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                            >
                                                {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            </button>
                                            <span style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 500,
                                                color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                textDecoration: item.completed ? 'line-through' : 'none',
                                                transition: 'all 0.2s'
                                            }}>
                                                {item.text}
                                            </span>
                                        </div>
                                        <button onClick={() => removeShoppingItem(index)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAnnouncementModalOpen && (
                <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAnnouncementModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{t('houseAnnouncement')}</h2>
                            </div>
                            <button onClick={() => setIsAnnouncementModalOpen(false)} style={{ background: 'var(--indicator-bg)', border: 'none', borderRadius: '50%', padding: '0.4rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('message')}</label>
                            <textarea
                                value={editAnnouncementText}
                                onChange={e => setEditAnnouncementText(e.target.value)}
                                placeholder={t('typeMessage')}
                                style={{
                                    width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '1rem',
                                    border: '1px solid var(--card-border)', background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.95rem', fontWeight: 500, outline: 'none', resize: 'none',
                                    fontFamily: 'inherit', lineHeight: '1.5'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setIsAnnouncementModalOpen(false)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    setHouseAnnouncement(editAnnouncementText);
                                    setIsAnnouncementModalOpen(false);
                                }}
                                style={{ flex: 2, padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'var(--accent-color)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(251,191,36,0.3)' }}
                            >
                                {t('saveAnnouncement')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* High-Fidelity Room Modal (Tablet Dashboard Style) */}
            {selectedRoomModal && (
                <div onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedRoomModal(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', height: '90vh', padding: '3rem', background: 'var(--panel-bg)', position: 'relative', overflowY: 'auto', borderRadius: '2.5rem', border: '1px solid var(--card-border)', boxShadow: '0 40px 100px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '3rem' }}>
                            <button onClick={() => setSelectedRoomModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', fontWeight: 600 }}>
                                <ArrowUp size={16} style={{ transform: 'rotate(-90deg)' }} /> {t('goBack')}
                            </button>
                            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>{selectedRoomModal === 'House' ? t('house') : (ROOM_NAME_KEYS[selectedRoomModal] ? t(ROOM_NAME_KEYS[selectedRoomModal] as any) : selectedRoomModal)}</h1>
                        </div>

                        {selectedRoomModal === 'House' && (() => {
                            // Use the same averaged house temp as the dashboard tiles
                            const avgTemp = averagedTempData.current;

                            // Dynamic Humidity (Simulated based on context or just more jitter)
                            const currentHumidityValue = (45 + Math.sin((tempHistory.length - 1) * 0.5) * 5 + (Math.random() - 0.5) * 2);
                            const currentHumidity = currentHumidityValue.toFixed(1);
                            const humidityHistory = tempHistory.map((t, i) => ({
                                time: t.time,
                                humidity: 45 + Math.sin(i * 0.5) * 5 + (Math.random() - 0.5) * 2
                            }));

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Top Historical Cards (Temperature & Humidity) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                        {/* Temperature Card */}
                                        <div className="glass-panel" style={{ padding: '0', borderRadius: '1.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ padding: '2rem 2rem 1rem 2rem', background: 'transparent' }}>
                                                {(() => {
                                                    const graphColor = getTempColor(avgTemp);
                                                    return (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${graphColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Thermometer size={20} color={graphColor} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{avgTemp}°C</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('indoorTemperature')}</div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div style={{ height: '140px', width: '100%', marginTop: 'auto' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {(() => {
                                                        const graphColor = getTempColor(avgTemp);
                                                        return (
                                                            <AreaChart data={averagedTempData.trends.map(t => ({ time: t.hour, temp: t.temp }))}>
                                                                <defs>
                                                                    <linearGradient id="colorTempHouse" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor={graphColor} stopOpacity={0.3} />
                                                                        <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="temp"
                                                                    stroke={graphColor}
                                                                    strokeWidth={4}
                                                                    fillOpacity={1}
                                                                    fill="url(#colorTempHouse)"
                                                                    animationDuration={2000}
                                                                    animationEasing="ease-in-out"
                                                                />
                                                                <Tooltip
                                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                                    itemStyle={{ color: graphColor }}
                                                                    formatter={(value: any) => [`${Number(value).toFixed(1)} °C`, t('temperature' as any)]}
                                                                    labelFormatter={(label) => label}
                                                                />
                                                            </AreaChart>
                                                        );
                                                    })()}
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Humidity Card */}
                                        <div className="glass-panel" style={{ padding: '0', borderRadius: '1.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ padding: '2rem 2rem 1rem 2rem', background: 'transparent' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Zap size={20} color="var(--warning-color)" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{currentHumidity}%</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('indoorHumidity')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ height: '140px', width: '100%', marginTop: 'auto' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={humidityHistory}>
                                                        <defs>
                                                            <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="humidity"
                                                            stroke="#d97706"
                                                            strokeWidth={4}
                                                            fillOpacity={1}
                                                            fill="url(#colorHumidity)"
                                                            animationDuration={2000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                            itemStyle={{ color: 'var(--text-primary)' }}
                                                            formatter={(value: any) => [`${Math.round(value)}%`, t('humidity')]}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        {/* Shopping List */}
                                        <div>
                                            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>{t('shoppingList')}</h3>
                                            <div className="hover-scale" onClick={() => setIsShoppingListOpen(true)} style={{ padding: '1.5rem 2rem', borderRadius: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                                    <ShoppingCart size={18} />
                                                </div>
                                                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('shoppingList')}</span>
                                            </div>
                                        </div>

                                        {/* Announcement */}
                                        <div>
                                            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>{t('announcement')}</h3>
                                            <div className="hover-scale" onClick={() => { setEditAnnouncementText(houseAnnouncement); setIsAnnouncementModalOpen(true); }} style={{ padding: '1.25rem 1.5rem', borderRadius: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)', minHeight: '82px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('houseAnnouncement')}</span>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {houseAnnouncement}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Batteries Section */}
                                    <div style={{ marginTop: '1rem' }}>
                                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>{t('batteries')}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {[...smartLocks.map(l => ({ ...l, type: 'LOCK' })), ...devices.filter(d => d.type === 'MOTION' || d.type === 'SENSOR' || d.type === 'SMOKE_SENSOR' || d.name.toLowerCase().includes('door') || d.name.toLowerCase().includes('window'))].map(item => {
                                                const level = batteryLevels[item.id] || 0;
                                                const bgColor = level <= 5 ? 'rgba(239, 68, 68, 0.1)' : level <= 50 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)';
                                                const itemTypeLabel = item.type === 'LOCK' ? t('lock') : (item.type === 'MOTION' ? t('motion') : (item.type === 'SMOKE_SENSOR' ? t('smoke') : ''));
                                                return (
                                            <div key={`battery-${item.id}`} className="hover-scale" style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <VerticalBattery level={level} size={16} />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name} {itemTypeLabel}</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{level.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Fuel Prices Section */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>{t('fuelPrices')}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {fuelPrices.map(fuel => (
                                                <div key={fuel.id} className="hover-scale" style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-sm)' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(59, 130, 246, 0.8)' }}>
                                                        <Fuel size={16} strokeWidth={2.5} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fuel.price.toFixed(2)} {language === 'en' ? 'EUR' : 'евро'}</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t(fuel.id as any) || fuel.name} - {t(fuel.station.toLowerCase() as any) || fuel.station}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {selectedRoomModal !== 'House' && (
                            <>
                                {/* Top Historical Cards (Reference: Temperature & Humidity Charts) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                                    {(() => {
                                        const roomTempVal = tempHistory.length > 0 ? tempHistory[tempHistory.length - 1].temp : 21;
                                        const roomTempColor = getTempColor(roomTempVal);
                                        return (
                                    <div className="glass-panel" style={{ padding: '0', borderRadius: '1.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '2rem 2rem 1rem 2rem', background: 'transparent' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${roomTempColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Thermometer size={20} color={roomTempColor} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: roomTempColor }}>{roomTempVal}°C</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('temperature')}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ height: '140px', width: '100%', marginTop: 'auto' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={tempHistory}>
                                                    <defs>
                                                        <linearGradient id="colorTempRoom" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={roomTempColor} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={roomTempColor} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="temp"
                                                        stroke={roomTempColor}
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorTempRoom)"
                                                        animationDuration={2000}
                                                        animationEasing="ease-in-out"
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                        itemStyle={{ color: 'var(--text-primary)' }}
                                                        formatter={(value: any) => [`${Math.round(value)} °C`, t('temperature' as any)]}
                                                        labelStyle={{ display: 'none' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                        );
                                    })()}
                                    <div className="glass-panel" style={{ padding: '0', borderRadius: '1.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '2rem 2rem 1rem 2rem', background: 'transparent' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Zap size={20} color="var(--warning-color)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                        {devices.filter(d => d.room === selectedRoomModal).reduce((sum, d) => sum + getDevicePower(d), 0)} W
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('powerConsumption')}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ height: '140px', width: '100%', marginTop: 'auto' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={powerHistory}>
                                                    <defs>
                                                        <linearGradient id="colorPowerRoom" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="power"
                                                        stroke="#d97706"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorPowerRoom)"
                                                        animationDuration={2000}
                                                        animationEasing="ease-in-out"
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                        itemStyle={{ color: 'var(--text-primary)' }}
                                                        formatter={(value: any) => [`${Math.round(value)} W`, t('power' as any)]}
                                                        labelStyle={{ display: 'none' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Devices – HomeKit 2-column grid */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>{t('devices')}</h3>
                                        {(() => {
                                            const roomToggleables = devices.filter(d => d.room === selectedRoomModal && ['RELAY', 'THERMOSTAT', 'FAN', 'COFFEE_MACHINE', 'ROBOT_VACUUM', 'AIR_PURIFIER'].includes(d.type));
                                            const roomAnyOn = roomToggleables.some(d => d.status === 'ON');
                                            return roomToggleables.length > 0 ? (
                                                <button
                                                    onClick={() => toggleRoomPower(selectedRoomModal!, !roomAnyOn)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.35rem 0.85rem', borderRadius: '999px', border: roomAnyOn ? 'none' : '1px solid var(--card-border)',
                                                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                                                        background: roomAnyOn ? 'rgba(251,191,36,0.85)' : 'var(--indicator-bg)',
                                                        color: roomAnyOn ? '#78350f' : 'var(--text-secondary)',
                                                        boxShadow: roomAnyOn ? '0 2px 8px rgba(251,191,36,0.35)' : 'none',
                                                        transition: 'all 0.25s'
                                                    }}
                                                >
                                                    <Lightbulb size={13} />
                                                    {roomAnyOn ? t('turnAllOff') : t('turnAllOn')}
                                                </button>
                                            ) : null;
                                        })()}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        {devices.filter(d => d.room === selectedRoomModal && ['RELAY', 'THERMOSTAT', 'FAN', 'COFFEE_MACHINE', 'ROBOT_VACUUM', 'AIR_PURIFIER'].includes(d.type)).map(device => {
                                            const params = getDeviceParams(device);
                                            const isOn = device.status === 'ON';
                                            const isLighting = device.type === 'RELAY';
                                            const activeBorder = isLighting ? 'rgba(251,191,36,0.25)' : 'rgba(59,130,246,0.2)';

                                            return (
                                                <div
                                                    key={device.id}
                                                    className="notranslate"
                                                    data-google-notranslate="true"
                                                    onClick={() => { setCurrentDevice(device); setIsModalOpen(true); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                                                        padding: '0.85rem 1rem', borderRadius: '1rem', cursor: 'pointer',
                                                        background: isOn ? (isLighting ? 'rgba(251,191,36,0.1)' : 'rgba(59,130,246,0.1)') : 'var(--indicator-bg)',
                                                        border: '1px solid', borderColor: isOn ? activeBorder : 'var(--card-border)',
                                                        boxShadow: 'var(--shadow-sm)', transition: 'all 0.25s',
                                                        transform: 'translateZ(0)'
                                                    }}
                                                >
                                                    {/* small icon circle */}
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: isOn ? (isLighting ? 'rgba(251,191,36,0.2)' : 'rgba(59,130,246,0.15)') : 'var(--bg-secondary)',
                                                        color: isOn ? (isLighting ? '#d97706' : '#3b82f6') : 'var(--text-secondary)', transition: 'all 0.25s'
                                                    }}>
                                                        {getDeviceIcon(device.type)}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            color: isOn ? (isLighting ? '#92400e' : '#3b82f6') : 'var(--text-primary)',
                                                            whiteSpace: 'normal',
                                                            wordBreak: 'break-word',
                                                            lineHeight: '1.2',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }}>{translateDeviceName(device.name, language)}</div>
                                                        <div style={{ fontSize: '0.75rem', color: isOn ? (isLighting ? '#b45309' : '#3b82f6') : 'var(--text-secondary)', fontWeight: 500, marginTop: '1px' }}>
                                                            {isOn ? (
                                                                device.type === 'RELAY' ? `On • ${params.brightness || 100}%` :
                                                                    device.type === 'FAN' ? `On • ${params.fanSpeed || 'LOW'} • ${params.direction === 'REVERSE' ? 'REV' : 'FWD'}` :
                                                                        device.type === 'COFFEE_MACHINE' ? `On • ${params.coffeeType || 'Espresso'} • ${params.size || 'M'}` :
                                                                            device.type === 'ROBOT_VACUUM' ? `On • ${params.mode || 'Standard'} • Cleaning` :
                                                                                device.type === 'AIR_PURIFIER' ? `On • AQI: ${latestAqi} • ${params.mode || 'Auto'}` :
                                                                                    `On • ${params.targetTemp || 22}°C`
                                                            ) : 'Off'}
                                                        </div>
                                                    </div>
                                                    {/* pill toggle */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleDeviceStatus(device); }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                                            padding: '0.25rem 0.55rem', borderRadius: '999px', border: 'none',
                                                            cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                                                            background: isOn ? (isLighting ? 'rgba(251,191,36,0.85)' : 'rgba(59,130,246,0.85)') : 'var(--bg-secondary)',
                                                            color: isOn ? (isLighting ? '#78350f' : 'white') : 'var(--text-secondary)', transition: 'all 0.25s'
                                                        }}
                                                    >
                                                        <Lightbulb size={11} />{isOn ? t('on') : t('off')}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {devices.filter(d => d.room === selectedRoomModal && ['RELAY', 'THERMOSTAT', 'FAN', 'COFFEE_MACHINE', 'ROBOT_VACUUM', 'AIR_PURIFIER'].includes(d.type)).length === 0 && (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem', gridColumn: '1/-1' }}>{t('noDevicesInRoom')}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Sensors – HomeKit 2-column: motion left, battery right */}
                                {devices.filter(d => d.room === selectedRoomModal && (d.type === 'SENSOR' || d.type === 'MOTION' || d.type === 'SMOKE_SENSOR')).length > 0 && (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h3 className="notranslate" data-google-notranslate="true" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '1rem' }}>{t('sensors')}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {devices.filter(d => d.room === selectedRoomModal && (d.type === 'SENSOR' || d.type === 'MOTION' || d.type === 'SMOKE_SENSOR')).map(device => {
                                                const params = getDeviceParams(device);
                                                const level = batteryLevels[device.id] || 0;
                                                const isMotion = device.type === 'MOTION';
                                                const isSmokeSensor = device.type === 'SMOKE_SENSOR';
                                                const isActive = device.status === 'ON';

                                                // Live Sync: Pull value from histories if it's a simulated sensor
                                                let displayValue = params.value;
                                                let displayUnit = params.unit;

                                                if (!isMotion && !isSmokeSensor) {
                                                    const roomAQIHistory = roomAirQualityHistories[device.room];
                                                    const roomTempHistory = roomTempHistories[device.room];

                                                    if (device.name.toLowerCase().includes('air quality') && roomAQIHistory?.length > 0) {
                                                        displayValue = roomAQIHistory[roomAQIHistory.length - 1].aqi;
                                                        displayUnit = 'AQI';
                                                        params.sensorType = 'AIR_QUALITY';
                                                    } else if (device.name.toLowerCase().includes('temperature') && roomTempHistory?.length > 0) {
                                                        displayValue = roomTempHistory[roomTempHistory.length - 1].temp;
                                                        displayUnit = '°C';
                                                        params.sensorType = 'TEMPERATURE';
                                                    } else if (device.name.toLowerCase().includes('humidity')) {
                                                        const roomHumidityHistory = roomHumidityHistories[device.room];
                                                        if (roomHumidityHistory?.length > 0) {
                                                            displayValue = roomHumidityHistory[roomHumidityHistory.length - 1].humidity;
                                                        }
                                                        displayUnit = '%';
                                                        params.sensorType = 'HUMIDITY';
                                                    }
                                                }

                                                let themeColorHex = '#10b981'; // Default Green
                                                let themeColorRgba = '16, 185, 129';

                                                if (params.sensorType === 'AIR_QUALITY') {
                                                    const aqi = Number(displayValue) || 0;
                                                    if (aqi < 50) {
                                                        themeColorHex = '#10b981'; // Green
                                                        themeColorRgba = '16, 185, 129';
                                                    } else if (aqi <= 100) {
                                                        themeColorHex = '#fbbf24'; // Yellow
                                                        themeColorRgba = '251, 191, 36';
                                                    } else {
                                                        themeColorHex = '#ef4444'; // Red
                                                        themeColorRgba = '239, 68, 68';
                                                    }
                                                } else if (params.sensorType === 'HUMIDITY') {
                                                    themeColorHex = '#3b82f6'; // Blue
                                                    themeColorRgba = '59, 130, 246';
                                                }

                                                const isAlert = isMotion && isActive;

                                                return (
                                                    <div
                                                        key={device.id}
                                                        className="notranslate"
                                                        data-google-notranslate="true"
                                                        onClick={() => setSelectedSensorModal(device)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.85rem',
                                                            padding: '0.85rem 1rem', borderRadius: '1rem', cursor: 'pointer',
                                                            background: `rgba(${themeColorRgba},0.1)`,
                                                            border: '1px solid', borderColor: `rgba(${themeColorRgba},0.2)`,
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.25s', position: 'relative',
                                                            overflow: 'hidden', minHeight: '64px',
                                                            transform: 'translateZ(0)'
                                                        }}
                                                    >
                                                        {/* Icon */}
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: `rgba(${themeColorRgba},0.15)`,
                                                            color: themeColorHex,
                                                            position: 'relative'
                                                        }}>
                                                            {isMotion ? <Footprints size={16} /> : isSmokeSensor ? <Flame size={16} /> : (
                                                                params.sensorType === 'HUMIDITY' ? <Droplets size={16} /> :
                                                                    params.sensorType === 'AIR_QUALITY' ? <Wind size={16} /> :
                                                                        <Zap size={16} />
                                                            )}
                                                            {isAlert && (
                                                                <span style={{
                                                                    position: 'absolute', top: '2px', right: '2px',
                                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                                    background: '#ef4444', boxShadow: '0 0 5px rgba(239,68,68,0.8)'
                                                                }} />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontWeight: 700,
                                                                fontSize: '0.8rem',
                                                                color: 'var(--text-primary)',
                                                                whiteSpace: 'normal',
                                                                wordBreak: 'break-word',
                                                                lineHeight: '1.2',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}>{translateDeviceName(device.name, language)}</div>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isAlert ? '#ef4444' : themeColorHex }}>
                                                                    {isMotion ? getRelativeTime(params.lastMotion) : isSmokeSensor ? (isActive ? t('active') : t('inactive')) : `${displayValue}${displayUnit}`}
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                    <VerticalBattery level={level} size={10} /> {level.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Sensor Detail Modal with 24h Graph */}
            {selectedSensorModal && (
                <div onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedSensorModal(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '2rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', background: 'var(--panel-bg)', position: 'relative', borderRadius: '2rem', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedSensorModal(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', padding: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <X size={20} />
                        </button>

                        {(() => {
                            const params = getDeviceParams(selectedSensorModal);
                            const isMotion = selectedSensorModal.type === 'MOTION';
                            let historyData = getSensorMockHistory(selectedSensorModal);

                            let graphColor = '#64748b';
                            let iconObj = <Zap size={24} />;
                            let title = selectedSensorModal.name;
                            let currentValueDisplay = t('active');

                            if (isMotion) {
                                graphColor = '#10b981'; // Now green like other sensors
                                iconObj = <Footprints size={24} color={graphColor} />;
                                currentValueDisplay = getRelativeTime(params.lastMotion);
                            } else if (params.sensorType === 'HUMIDITY') {
                                const roomHumidityHistory = roomHumidityHistories[selectedSensorModal.room] || [];
                                const currentH = roomHumidityHistory.length > 0 ? roomHumidityHistory[roomHumidityHistory.length - 1].humidity : 45;
                                graphColor = getHumidityColor(currentH);
                                iconObj = <Droplets size={24} color={graphColor} />;
                                historyData = roomHumidityHistory.map(h => ({ time: h.time, value: h.humidity }));
                                if (roomHumidityHistory.length > 0) {
                                    currentValueDisplay = `${roomHumidityHistory[roomHumidityHistory.length - 1].humidity}%`;
                                }
                            } else if (params.sensorType === 'AIR_QUALITY') {
                                graphColor = '#10b981';
                                iconObj = <Wind size={24} color={graphColor} />;
                                const roomAQIHistory = roomAirQualityHistories[selectedSensorModal.room] || [];
                                historyData = roomAQIHistory.map(h => ({ time: h.time, value: h.aqi }));
                                if (roomAQIHistory.length > 0) {
                                    currentValueDisplay = `${roomAQIHistory[roomAQIHistory.length - 1].aqi} AQI`;
                                }
                            } else if (params.sensorType === 'TEMPERATURE') {
                                graphColor = '#10b981';
                                iconObj = <Thermometer size={24} color={graphColor} />;
                                const roomTempHistory = roomTempHistories[selectedSensorModal.room] || [];
                                historyData = roomTempHistory.map(h => ({ time: h.time, value: h.temp }));
                                if (roomTempHistory.length > 0) {
                                    currentValueDisplay = `${roomTempHistory[roomTempHistory.length - 1].temp}°C`;
                                }
                            }

                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${graphColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {iconObj}
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h2>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{ROOM_NAME_KEYS[selectedSensorModal.room] ? t(ROOM_NAME_KEYS[selectedSensorModal.room] as any) : selectedSensorModal.room}</div>
                                        </div>
                                    </div>

                                    <div className="glass-panel" style={{ padding: '0', borderRadius: '1.5rem', background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '300px' }}>
                                        <div style={{ padding: '1.5rem 2rem 0.5rem 2rem', background: 'transparent' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{currentValueDisplay}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>{isMotion ? t('currentStatus') : t('currentReading')}</div>
                                        </div>
                                        <div style={{ flex: 1, width: '100%', marginTop: 'auto' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                {isMotion ? (
                                                    <BarChart data={historyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                        <Bar
                                                            dataKey="value"
                                                            fill={graphColor}
                                                            radius={[4, 4, 0, 0]}
                                                            animationDuration={1500}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                            contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                            itemStyle={{ color: 'var(--text-primary)' }}
                                                            formatter={(value: any) => [value > 50 ? t('active') : t('inactive'), t('status')]}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                    </BarChart>
                                                ) : (
                                                    <AreaChart data={historyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorSensorGraph" x1="0" y1="0" x2="0" y2="1">
                                                                {params.sensorType === 'HUMIDITY' ? (
                                                                    <>
                                                                        <stop offset="5%" stopColor={graphColor} stopOpacity={0.3} />
                                                                        <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <stop offset="5%" stopColor={graphColor} stopOpacity={0.6} />
                                                                        <stop offset="95%" stopColor={graphColor} stopOpacity={0} />
                                                                    </>
                                                                )}
                                                            </linearGradient>
                                                        </defs>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={graphColor}
                                                            strokeWidth={4}
                                                            fillOpacity={1}
                                                            fill="url(#colorSensorGraph)"
                                                            animationDuration={2000}
                                                            animationEasing="ease-in-out"
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                            itemStyle={{ color: 'var(--text-primary)' }}
                                                            formatter={(value: any) => [`${Math.round(value || 0)}${params.unit || ''}`, t('value' as any)]}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                    </AreaChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {isHumidityModalOpen && (() => {
                const isAllRooms = selectedHumidityRoom === 'All Rooms';
                const roomData = !isAllRooms && roomHumidityHistories[selectedHumidityRoom] ? roomHumidityHistories[selectedHumidityRoom] : [];
                const currentHumidityValue = currentDashboardHumidity;
                const currentHumidity = typeof currentHumidityValue === 'number' ? Math.round(currentHumidityValue) : 45;
                const hVal = typeof currentHumidity === 'number' ? currentHumidity : 45;
                const humidityColor = getHumidityColor(hVal);

                const baseTrends = isAllRooms
                    ? averagedHumidityData.trends
                    : Array.from({ length: 24 }, (_, i) => {
                        const hour = (new Date().getHours() - (23 - i) + 24) % 24;
                        const hourStr = `${hour.toString().padStart(2, '0')}`;
                        const match = roomData.find(h => h.time.startsWith(hourStr));
                        const val = match ? match.humidity : 45 + Math.sin(i / 4) * 5;
                        return { hour: hourStr + ':00', humidity: val };
                    });

                const hourlyHumidityTrends = baseTrends.map((t, i) => {
                    if (i === 23) return { ...t, humidity: currentHumidityValue };
                    return t;
                });

                return (
                    <div onMouseDown={(e) => { if (e.target === e.currentTarget) setIsHumidityModalOpen(false); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
                        <div className="glass-panel" style={{ width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'var(--panel-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{t('humidity')}</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t('humidityMonitoring')}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        className="btn"
                                        onClick={() => setIsHumidityPinned(!isHumidityPinned)}
                                        style={{
                                            background: isHumidityPinned ? `${humidityColor}15` : 'var(--indicator-bg)',
                                            color: isHumidityPinned ? humidityColor : 'var(--text-secondary)',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            border: isHumidityPinned ? `1px solid ${humidityColor}` : '1px solid var(--card-border)'
                                        }}
                                    >
                                        {isHumidityPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                        {isHumidityPinned ? t('unpin') : t('pinToSide')}
                                    </button>
                                    <button className="btn" style={{ background: 'var(--indicator-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-primary)' }}>
                                        {new Date().toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </button>
                                    <button className="btn btn-primary" style={{ borderRadius: '10px' }} onClick={() => setIsHumidityModalOpen(false)}>{t('close')}</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                            <Droplets size={20} color={getHumidityColor(currentHumidity)} /> {t('live' as any)} {t('humidity')}
                                        </div>
                                        <div style={{ padding: '0.4rem 1rem', background: 'var(--indicator-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, minWidth: '80px', textAlign: 'center' }}>
                                            {currentHumidity}%
                                        </div>
                                    </h3>
                                    <div style={{ height: '200px', background: `${humidityColor}08`, borderRadius: '1.5rem', padding: '1.5rem', border: `1px solid ${humidityColor}15` }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={hourlyHumidityTrends.map(t => ({ time: t.hour, humidity: t.humidity }))}>
                                                <defs>
                                                    <linearGradient id="colorHumidityModal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={getHumidityColor(currentHumidity)} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={getHumidityColor(currentHumidity)} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time" hide />
                                                <YAxis domain={[20, 90]} hide />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    formatter={(value: any) => [`${Math.round(Number(value))}%`, t('humidity')]}
                                                    labelStyle={{ display: 'none' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="humidity"
                                                    stroke={getHumidityColor(currentHumidity)}
                                                    fillOpacity={1}
                                                    fill="url(#colorHumidityModal)"
                                                    strokeWidth={4}
                                                    animationDuration={3000}
                                                    animationEasing="ease-in-out"
                                                    connectNulls={true}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('history24h')}</h3>
                                        <select
                                            value={selectedHumidityRoom}
                                            onChange={e => setSelectedHumidityRoom(e.target.value)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--card-border)',
                                                background: 'var(--indicator-bg)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value={ALL_ROOMS}>{t('allRooms')}</option>
                                            {houseRooms.map(room => (
                                                <option key={room} value={room}>{ROOM_NAME_KEYS[room] ? t(ROOM_NAME_KEYS[room] as any) : room}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ height: '350px', background: 'var(--bg-secondary)', borderRadius: '1.5rem', padding: '1.5rem 2rem', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={hourlyHumidityTrends}>
                                                <XAxis dataKey="hour" axisLine={false} tickLine={false} style={{ fontSize: '0.7rem', fontWeight: 700, fill: 'var(--text-secondary)' }} interval={2} />
                                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fontWeight: 700, fill: 'var(--text-secondary)' }} unit="%" domain={[0, 100]} />
                                                <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, t('humidity')]}
                                                    contentStyle={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)', fontWeight: 600, color: 'var(--text-primary)' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                />
                                                <Bar dataKey="humidity" radius={[6, 6, 0, 0]} barSize={25}>
                                                    {hourlyHumidityTrends.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={getHumidityColor(entry.humidity)} fillOpacity={0.8} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
};

export default Dashboard;
