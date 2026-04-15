import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useTranslation, translateDeviceName } from '../utils/translations';
import {
    Plus, Cpu, Zap, Search, RefreshCcw,
    Settings2, Lightbulb, Footprints, Wind, Droplets, Coffee, Bot,
    X, ArrowUpDown, Trash, Filter, AirVent, Flame,
    ArrowUp, ArrowDown
} from 'lucide-react';
import { getApiUrl } from '../utils/api';


interface Device {
    id: string;
    name: string;
    type: string;
    status: string;
    parameters: string;
    room: string;
    lastSeen: string;
    updatedAt: string;
}

const DEVICE_TYPES = [
    { id: 'THERMOSTAT',    label: 'airConditioner', icon: <AirVent size={16} />, color: '#3b82f6' },
    { id: 'AIR_PURIFIER',  label: 'airPurifier',  icon: <Wind size={16} />,        color: '#10b981' },
    { id: 'COFFEE_MACHINE',label: 'coffeeMachine', icon: <Coffee size={16} />,      color: '#92400e' },
    { id: 'DEHUMIDIFIER',  label: 'dehumidifier', icon: <Droplets size={16} />,   color: '#3b82f6' },
    { id: 'FAN',           label: 'fan',          icon: <Wind size={16} />,        color: '#06b6d4' },
    { id: 'RELAY',         label: 'lighting',    icon: <Lightbulb size={16} />,   color: '#f59e0b' },
    { id: 'SENSOR',        label: 'sensor',      icon: <Zap size={16} />,         color: '#10b981' },
    { id: 'ROBOT_VACUUM',  label: 'vacuum',       icon: <Bot size={16} />,         color: '#ec4899' },
];

// For the table display (all types)
const ALL_DEVICE_TYPES = [
    ...DEVICE_TYPES,
    { id: 'MOTION',        label: 'motionSensor', icon: <Footprints size={16} />,  color: '#8b5cf6' },
    { id: 'SMOKE_SENSOR',  label: 'smokeSensor',  icon: <Flame size={16} />,       color: '#ef4444' },
];

const SENSOR_TYPES = [
    { id: 'AIR_QUALITY', label: 'airQuality' },
    { id: 'HUMIDITY',    label: 'humidity' },
    { id: 'MOTION',      label: 'motion' },
    { id: 'SMOKE',       label: 'smoke' },
    { id: 'TEMPERATURE', label: 'temperature' },
];

const SENSOR_GROUP = ['SENSOR', 'MOTION', 'SMOKE_SENSOR'];

const ROOM_NAME_KEYS: Record<string, any> = {
    'Living Room': 'livingRoom',
    'Kitchen': 'kitchen',
    'Basement': 'basement',
    'Bedroom': 'bedroom',
    'Garage': 'garage',
    'Bathroom': 'bathroom',
    'House': 'house'
};

const ROOMS = ['Living Room', 'Kitchen', 'Basement', 'Bedroom', 'Garage', 'Bathroom', 'House'];
const CATEGORIES = ['All', 'Lighting', 'Sensors', 'Climate', 'Motion', 'Appliances'];

interface DeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (device: Partial<Device>) => Promise<void>;
    device: Partial<Device>;
    isAdmin?: boolean;
}

const DeviceModal: React.FC<DeviceModalProps> = ({ isOpen, onClose, onSave, device: initialDevice, isAdmin = true }) => {
    const { language } = useUI();
    const t = useTranslation(language);
    const [formData, setFormData] = React.useState<Partial<Device>>(initialDevice);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        setFormData(initialDevice);
    }, [initialDevice, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
            <div className="glass-panel" style={{ width: '90%', maxWidth: '440px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>{formData.id ? (isAdmin ? t('editHardware') : t('hardwareDetails')) : t('newAccessory')}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{t('displayName')}</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            required 
                            disabled={!isAdmin}
                            value={formData.name || ''} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                            style={!isAdmin ? { background: 'var(--indicator-bg)', cursor: 'not-allowed', color: 'var(--text-secondary)' } : { background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{t('assignedRoom')}</label>
                        <select 
                            className="form-input" 
                            value={formData.room || 'Living Room'} 
                            onChange={e => setFormData({ ...formData, room: e.target.value })} 
                            disabled={!isAdmin}
                            style={!isAdmin ? { background: 'var(--indicator-bg)', cursor: 'not-allowed', color: 'var(--text-secondary)' } : { background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            {ROOMS.filter(r => r !== 'House').map(r => <option key={r} value={r}>{t(ROOM_NAME_KEYS[r] as any)}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{t('hardwareType')}</label>
                        <select 
                            className="form-input" 
                            value={SENSOR_GROUP.includes(formData.type!) ? 'SENSOR' : (formData.type || 'RELAY')}
                            onChange={e => setFormData({ ...formData, type: e.target.value })} 
                            disabled={!!formData.id}
                        >
                            {DEVICE_TYPES
                                .map(t_type => ({ ...t_type, translated: t(t_type.label as any) }))
                                .sort((a,b) => a.translated.localeCompare(b.translated, language === 'bg' ? 'bg' : 'en'))
                                .map(t_type => <option key={t_type.id} value={t_type.id}>{t_type.translated}</option>)}
                        </select>
                    </div>

                    {SENSOR_GROUP.includes(formData.type!) && (
                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{t('sensorType')}</label>
                            <select 
                                className="form-input" 
                                value={(() => { 
                                    if (formData.type === 'MOTION') return 'MOTION';
                                    if (formData.type === 'SMOKE_SENSOR') return 'SMOKE';
                                    try { return JSON.parse(formData.parameters || '{}').sensorType || 'TEMPERATURE'; } catch { return 'TEMPERATURE'; } 
                                })()}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'MOTION') {
                                        setFormData({ ...formData, type: 'MOTION' });
                                    } else if (val === 'SMOKE') {
                                        setFormData({ ...formData, type: 'SMOKE_SENSOR' });
                                    } else {
                                        const params = (() => { try { return JSON.parse(formData.parameters || '{}'); } catch { return { sensorType: 'TEMPERATURE' }; } })();
                                        params.sensorType = val;
                                        setFormData({ ...formData, type: 'SENSOR', parameters: JSON.stringify(params) });
                                    }
                                }}
                            >
                                {SENSOR_TYPES
                                    .map(st => ({ ...st, translated: t(st.label as any) }))
                                    .sort((a,b) => a.translated.localeCompare(b.translated, language === 'bg' ? 'bg' : 'en'))
                                    .map(st => <option key={st.id} value={st.id}>{st.translated}</option>)}
                            </select>
                        </div>
                    )}

                    {formData.type === 'RELAY' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input 
                                type="checkbox" 
                                id="hasColor" 
                                checked={(() => { try { return JSON.parse(formData.parameters || '{}').hasColor !== false; } catch { return true; } })()}
                                onChange={e => {
                                    const params = (() => { try { return JSON.parse(formData.parameters || '{}'); } catch { return {}; } })();
                                    params.hasColor = e.target.checked;
                                    setFormData({ ...formData, parameters: JSON.stringify(params) });
                                }}
                            />
                            <label htmlFor="hasColor" style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('supportsColor')}</label>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {isAdmin ? (
                            <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', fontWeight: 700, opacity: isSaving ? 0.7 : 1 }}>
                                {isSaving ? (language === 'bg' ? 'Запазване...' : 'Saving...') : t('saveChanges')}
                            </button>
                        ) : (
                            <button type="button" className="btn btn-primary" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', fontWeight: 700 }}>{t('closeView')}</button>
                        )}
                        <button type="button" className="btn" onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', fontWeight: 600 }}>{isAdmin ? t('cancel') : t('exit')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Devices: React.FC = () => {
    const { token, user } = useAuth();
    const { devices, fetchDevices, setDevices, language } = useUI();
    const t = useTranslation(language);
    const isAdmin = user?.role === 'ADMIN';

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDevice, setCurrentDevice] = useState<Partial<Device>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Administrative Filters
    const [filterRoom, setFilterRoom] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Device; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
    
    // Bulk Operations
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchDevices();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleSaveDevice = async (deviceData: Partial<Device>) => {
        const isNew = !deviceData.id;
        const url = isNew ? getApiUrl('/api/devices') : getApiUrl(`/api/devices/${deviceData.id}`);
        
        try {
            // Ensure parameters is sent as an object if it's currently a string in state
            const payload: any = { ...deviceData };
            if (typeof payload.parameters === 'string') {
                try { payload.parameters = JSON.parse(payload.parameters); } catch { payload.parameters = {}; }
            }

            // Optimistic pre-close
            setIsModalOpen(false);

            const res = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            
            if (!res.ok) {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to save device'}`);
                setIsModalOpen(true); // Re-open on error
                // The UI Context will eventually resync over WS or fetchDevices
            } else if (!isNew) {
                // Optimistic UI update logic (WebSocket will confirm it shortly, but this makes it visibly instant on this page)
                const savedData = await res.json();
                setDevices((prev: Device[]) => prev.map(d => d.id === savedData.id ? savedData : d));
            }
        } catch (e) { 
            console.error(e); 
            alert('Error: Network failure or server is down.');
            setIsModalOpen(true);
        }
    };

    const deleteDevice = async (id: string) => {
        if (!confirm(t('confirmDeleteUser'))) return;
        try {
            const res = await fetch(getApiUrl(`/api/devices/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) { 
                setIsModalOpen(false); 
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                fetchDevices(); 
            }
        } catch (e) { console.error(e); }
    };

    const bulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} devices?`)) return;
        for (const id of Array.from(selectedIds)) {
            await fetch(getApiUrl(`/api/devices/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        setSelectedIds(new Set());
        fetchDevices();
    };

    const toggleDeviceStatus = async (device: Device) => {
        const newStatus = device.status === 'ON' ? 'OFF' : 'ON';
        setDevices((prev: Device[]) => prev.map(d => d.id === device.id ? { ...d, status: newStatus } : d));
        try {
            await fetch(getApiUrl(`/api/devices/${device.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...device, status: newStatus })
            });

        } catch (e) { console.error(e); fetchDevices(); }
    };

    const getCategoryForType = (type: string) => {
        switch (type) {
            case 'RELAY': return 'Lighting';
            case 'SENSOR': return 'Sensors';
            case 'THERMOSTAT':
            case 'FAN': return 'Climate';
            case 'MOTION': return 'Motion';
            case 'COFFEE_MACHINE': 
            case 'ROBOT_VACUUM': 
            case 'AIR_PURIFIER': return 'Appliances';
            default: return 'Other';
        }
    };

    const handleSort = (key: keyof Device) => {
        setSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedDevices.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSortedDevices.map(d => d.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredAndSortedDevices = useMemo(() => {
        let result = devices.filter(d => {
            const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.type.toLowerCase().includes(searchTerm.toLowerCase());
            const matchRoom = filterRoom === 'All' || d.room === filterRoom;
            const matchCategory = filterCategory === 'All' || getCategoryForType(d.type) === filterCategory;
            return matchSearch && matchRoom && matchCategory;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                const key = sortConfig.key;
                const aVal = a[key];
                const bVal = b[key];

                // Special handling for dates
                if (key === 'updatedAt' || key === 'lastSeen') {
                    const aDate = aVal ? new Date(aVal as string).getTime() : 0;
                    const bDate = bVal ? new Date(bVal as string).getTime() : 0;
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }

                const aStr = (aVal || '').toString().toLowerCase();
                const bStr = (bVal || '').toString().toLowerCase();
                if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [devices, searchTerm, filterRoom, filterCategory, sortConfig]);

    const typeIcons: Record<string, React.ReactNode> = {
        'RELAY': <Lightbulb size={14} />,
        'SENSOR': <Zap size={14} />,
        'THERMOSTAT': <AirVent size={14} />,
        'MOTION': <Footprints size={14} />,
        'FAN': <Wind size={14} />,
        'COFFEE_MACHINE': <Coffee size={14} />,
        'ROBOT_VACUUM': <Bot size={14} />,
        'AIR_PURIFIER': <Wind size={14} />,
        'SMOKE_SENSOR': <Flame size={14} />
    };

    const SortIcon = ({ column }: { column: keyof Device }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} opacity={0.5} />;
        return sortConfig.direction === 'asc' ? 
            <ArrowUp size={12} color="var(--accent-color)" /> : 
            <ArrowDown size={12} color="var(--accent-color)" />;
    };

    return (
        <>
            <div className="animate-fade-in" style={{ padding: '0 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('deviceAdministration')}</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('manageInventory')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleManualRefresh} className="btn" style={{ background: 'var(--card-bg)', borderRadius: '10px', padding: '0.6rem' }}>
                        <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    {isAdmin && (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => { setCurrentDevice({ type: 'RELAY', room: 'Living Room' }); setIsModalOpen(true); }}
                            style={{ borderRadius: '10px', fontWeight: 700, padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> {t('addAccessory')}
                        </button>
                    )}
                </div>
            </div>

            {/* Admin Toolbar */}
            <div className="glass-panel" style={{ padding: '1rem', border: 'none', background: 'var(--panel-bg)', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                        type="text" 
                        placeholder={t('filterPlaceholder')}
                        style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Dropdowns */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={14} color="var(--text-secondary)" />
                    <select 
                        style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, outline: 'none', minWidth: '120px' }}
                        value={filterRoom}
                        onChange={e => setFilterRoom(e.target.value)}
                    >
                        <option value="All">{t('allRooms')}</option>
                        {ROOMS.filter(r => r !== 'House').map(r => <option key={r} value={r}>{t(ROOM_NAME_KEYS[r] as any)}</option>)}
                    </select>
                    <select 
                        style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, outline: 'none', minWidth: '120px' }}
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{t(c.toLowerCase() as any)}</option>)}
                    </select>
                </div>

                {/* Bulk Actions */}
                {selectedIds.size > 0 && isAdmin && (
                    <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>{selectedIds.size} selected</span>
                        <button 
                            onClick={bulkDelete}
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger-color)', border: 'none', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Trash size={14} /> {t('delete')}
                        </button>
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--indicator-bg)', borderBottom: '2px solid var(--card-border)', zIndex: 5 }}>
                        <tr>
                            <th style={{ padding: '1rem', width: '40px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedDevices.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: sortConfig?.key === 'name' ? 'var(--accent-color)' : 'inherit' }} onClick={() => handleSort('name')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {t('name')} <SortIcon column="name" />
                                </div>
                            </th>
                            <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: sortConfig?.key === 'room' ? 'var(--accent-color)' : 'inherit' }} onClick={() => handleSort('room')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {t('room')} <SortIcon column="room" />
                                </div>
                            </th>
                            <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: sortConfig?.key === 'type' ? 'var(--accent-color)' : 'inherit' }} onClick={() => handleSort('type')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {t('type')} <SortIcon column="type" />
                                </div>
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 700 }}>{t('status')}</th>
                            <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: sortConfig?.key === 'updatedAt' ? 'var(--accent-color)' : 'inherit' }} onClick={() => handleSort('updatedAt')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {t('lastEdited')} <SortIcon column="updatedAt" />
                                </div>
                            </th>
                            <th style={{ padding: '1rem', cursor: 'pointer', fontWeight: 700, color: sortConfig?.key === 'lastSeen' ? 'var(--accent-color)' : 'inherit' }} onClick={() => handleSort('lastSeen')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {t('lastActive')} <SortIcon column="lastSeen" />
                                </div>
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody style={{ color: 'var(--text-primary)' }}>
                        {filteredAndSortedDevices.map(device => (
                            <tr key={device.id} style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: selectedIds.has(device.id) ? 'rgba(59,130,246,0.03)' : 'transparent', transition: 'background 0.1s' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(device.id)}
                                        onChange={() => toggleSelect(device.id)}
                                    />
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{translateDeviceName(device.name, language)}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ background: 'var(--indicator-bg)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t(ROOM_NAME_KEYS[device.room] as any || 'unassigned')}</span>
                                </td>
                                 <td style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                        {typeIcons[device.type] || <Cpu size={14} />}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t(ALL_DEVICE_TYPES.find(t_type => t_type.id === device.type)?.label as any || device.type)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {['MOTION', 'SENSOR'].includes(device.type) ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', fontWeight: 700, fontSize: '0.7rem' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-color)' }} />
                                            {t('connectedStatus')}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => toggleDeviceStatus(device)}
                                            style={{
                                                padding: '0.25rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                fontSize: '0.7rem', fontWeight: 800,
                                                background: device.status === 'ON' ? 'rgba(52,199,89,0.15)' : 'var(--indicator-bg)',
                                                color: device.status === 'ON' ? 'var(--success-color)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {device.status}
                                        </button>
                                    )}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    {device.updatedAt ? new Date(device.updatedAt).toLocaleString(language === 'bg' ? 'bg-BG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : t('never')}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString(language === 'bg' ? 'bg-BG' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : t('never')}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => { setCurrentDevice(device); setIsModalOpen(true); }}
                                            className="btn" style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.03)', borderRadius: '6px' }}
                                            title={isAdmin ? t('editHardware') : t('hardwareDetails')}
                                        >
                                            <Settings2 size={16} color="var(--text-secondary)" />
                                        </button>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => deleteDevice(device.id)}
                                                className="btn" style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.05)', borderRadius: '6px' }}
                                            >
                                                <Trash size={16} color="var(--danger-color)" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAndSortedDevices.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontWeight: 600 }}>{t('noResultsFound')}</p>
                    </div>
                )}
            </div>

            {/* Pagination / Total count footler */}
            <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t('showingDevices', { count: filteredAndSortedDevices.length, total: devices.length })}
                </span>
            </div>
            </div>

            <DeviceModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveDevice}
                device={currentDevice}
                isAdmin={isAdmin}
            />
        </>
    );
};

export default Devices;
