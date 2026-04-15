import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
import { WebSocketServer } from 'ws';
import http from 'http';
import crypto from 'crypto';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const prisma = new PrismaClient();
const JWT_SECRET = 'super-secret-key-for-diploma';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auto-migrate: add avatar column to User if it doesn't exist yet
prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "avatar" TEXT').catch(() => {
    // Column already exists - that's fine
});

// Auto-populate missing apiKeys for existing devices
prisma.$executeRawUnsafe(`UPDATE "Device" SET apiKey = lower(hex(randomblob(16))) WHERE apiKey IS NULL OR apiKey = ''`).catch(e => console.error(e));

const getParams = (params: any): any => {
    try {
        if (!params) return {};
        if (typeof params === 'object') return params;
        let p = JSON.parse(params);
        // Handle potential double/triple stringification
        while (typeof p === 'string') {
            p = JSON.parse(p);
        }
        return p || {};
    } catch { 
        return typeof params === 'object' ? params : {}; 
    }
};

// --- Authentication Middleware ---
const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.decode(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const requireApiKey = async (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API Key missing' });
    
    try {
        const device = await prisma.device.findUnique({ where: { apiKey: String(apiKey) } });
        if (!device) return res.status(401).json({ error: 'Invalid API Key' });
        req.device = device;
        next();
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        // Every new user MUST be a USER. Admin is manually assigned.
        const userRole = 'USER';

        const user = await prisma.user.create({
            data: { username, passwordHash, role: userRole }
        });

        res.json({ id: user.id, username: user.username, role: user.role });
    } catch (e) {
        res.status(400).json({ error: 'Username might already exist.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.encode({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, avatar: user.avatar } });
});

// --- User Management Routes (Admin only) ---
app.get('/api/users', requireAuth, requireAdmin, async (req: any, res: any) => {
    const users = await prisma.$queryRawUnsafe<any[]>(
        'SELECT id, username, role, avatar FROM "User" ORDER BY username ASC'
    );
    res.json(users);
});

// Get my own profile (including avatar)
app.get('/api/users/me', requireAuth, async (req: any, res: any) => {
    try {
        const rows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT id, username, role, avatar FROM "User" WHERE id = ?',
            req.user.id
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update my own avatar
app.patch('/api/users/me/avatar', requireAuth, async (req: any, res: any) => {
    const { avatar } = req.body; // base64 string or null
    try {
        await prisma.$executeRawUnsafe(
            'UPDATE "User" SET avatar = ? WHERE id = ?',
            avatar ?? null,
            req.user.id
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Failed to update avatar:', e);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

app.patch('/api/users/:id/role', requireAuth, requireAdmin, async (req: any, res: any) => {
    const { role } = req.body;
    if (role !== 'ADMIN' && role !== 'USER') {
        return res.status(400).json({ error: 'Invalid role. Must be ADMIN or USER.' });
    }
    try {
        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, username: true, role: true }
        });
        res.json(updated);
    } catch (e) {
        res.status(404).json({ error: 'User not found' });
    }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(404).json({ error: 'User not found' });
    }
});

// --- Device Routes ---
app.get('/api/devices', requireAuth, async (req, res) => {
    const devices = await prisma.device.findMany({
        orderBy: { name: 'asc' }
    });
    // Ensure all devices have apiKeys populated if they somehow missed it
    for (let d of devices) {
        if (!d.apiKey) {
            d = await prisma.device.update({
                where: { id: d.id },
                data: { apiKey: crypto.randomUUID() }
            });
        }
    }
    res.json(devices);
});

app.post('/api/devices', requireAuth, requireAdmin, async (req, res) => {
    const { name, type, room, parameters } = req.body;
    const deviceParams = parameters || {};
    if (type === 'SENSOR' && deviceParams.battery === undefined) {
        deviceParams.battery = Math.floor(Math.random() * 50) + 50;
    }
    if (type === 'MOTION') {
        // Motion sensors start with no recent activity
        deviceParams.lastMotion = null;
    }
    if (type === 'THERMOSTAT') {
        if (deviceParams.targetTemp === undefined) deviceParams.targetTemp = 22;
        if (deviceParams.mode === undefined) deviceParams.mode = 'AUTO';
        if (deviceParams.acMode === undefined) deviceParams.acMode = 'COOL';
        if (deviceParams.fanSpeed === undefined) deviceParams.fanSpeed = 'AUTO';
        if (deviceParams.swing === undefined) deviceParams.swing = false;
        if (deviceParams.eco === undefined) deviceParams.eco = false;
    }
    if (type === 'FAN') {
        if (deviceParams.fanSpeed === undefined) deviceParams.fanSpeed = 'LOW';
        if (deviceParams.direction === undefined) deviceParams.direction = 'FORWARD';
    }
    if (type === 'COFFEE_MACHINE') {
        if (deviceParams.brewType === undefined) deviceParams.brewType = 'ESPRESSO';
        if (deviceParams.brewStrength === undefined) deviceParams.brewStrength = 'MEDIUM';
        if (deviceParams.cupSize === undefined) deviceParams.cupSize = 'MEDIUM';
        if (deviceParams.waterLevel === undefined) deviceParams.waterLevel = 100;
        if (deviceParams.coffeeLevel === undefined) deviceParams.coffeeLevel = 100;
        if (deviceParams.temp === undefined) deviceParams.temp = 92;
    }

    try {
        const device = await prisma.device.create({
            data: {
                name,
                type,
                room: room || 'Living Room',
                status: 'OFF', // Default status
                parameters: JSON.stringify(deviceParams)
            }
        });

        broadcast({ type: 'DEVICE_ADDED', payload: device });
        res.json(device);
    } catch (e) {
        console.error('Failed to create device:', e);
        res.status(500).json({ error: 'Failed to create device' });
    }
});

app.put('/api/devices/bulk-status', requireAuth, async (req, res) => {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || !status) {
        return res.status(400).json({ error: 'Invalid request. Provide an array of ids and a status.' });
    }

    try {
        const updatedDevices = await prisma.device.updateMany({
            where: {
                id: { in: ids }
            },
            data: { status }
        });

        // Log the event for each device
        for (const id of ids) {
            await prisma.eventLog.create({
                data: {
                    deviceId: id,
                    eventType: 'STATE_CHANGE',
                    description: `Bulk status change to ${status}`
                }
            });
        }

        broadcast({ type: 'DEVICE_UPDATED', payload: { ids, status, bulk: true } });
        res.json({ success: true, count: updatedDevices.count });
    } catch (e) {
        console.error('Bulk update failed', e);
        res.status(500).json({ error: 'Bulk update failed' });
    }
});

app.put('/api/devices/:id', requireAuth, async (req: any, res: any) => {
    try {
        const { status, parameters, name, room } = req.body;
        const data: any = {};
        if (status !== undefined) data.status = status;
        if (parameters !== undefined) {
            // Ensure parameters is an object for logic
            const paramObj = getParams(parameters);
            
            // Enforce realistic limits for AC units (Thermostats)
            const currentDevice = await prisma.device.findUnique({ where: { id: req.params.id } });
            if (currentDevice?.type === 'THERMOSTAT' && paramObj.targetTemp !== undefined) {
                paramObj.targetTemp = Math.max(16, Math.min(30, paramObj.targetTemp));
            }
            data.parameters = JSON.stringify(paramObj);
        }
        if (name !== undefined || room !== undefined) {
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Only admins can change device name or room.' });
            }
            if (name !== undefined) data.name = name;
            if (room !== undefined) data.room = room;
        }

        const device = await prisma.device.update({
            where: { id: req.params.id },
            data
        });

        // Log the event if status changed
        if (status !== undefined) {
            await prisma.eventLog.create({
                data: {
                    deviceId: device.id,
                    eventType: 'STATE_CHANGE',
                    description: `Status changed to ${status}`
                }
            });
        }

        broadcast({ type: 'DEVICE_UPDATED', payload: device });
        res.json(device);
    } catch (e: any) {
        console.error('Failed to update device:', e);
        res.status(500).json({ error: 'Failed to update device: ' + e?.message });
    }
});

app.delete('/api/devices/:id', requireAuth, requireAdmin, async (req, res) => {
    await prisma.device.delete({ where: { id: req.params.id } });
    broadcast({ type: 'DEVICE_DELETED', payload: { id: req.params.id } });
    res.json({ success: true });
});

app.get('/api/events', requireAuth, async (req, res) => {
    const events = await prisma.eventLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: { device: { select: { name: true } } }
    });
    res.json(events);
});



app.get('/api/dashboard', requireAuth, async (req, res) => {
    const totalDevices = await prisma.device.count();
    const activeDevices = await prisma.device.count({ where: { status: 'ON' } });
    res.json({ totalDevices, activeDevices });
});

// --- Hardware/IoT Integration Routes ---
app.post('/api/hardware/update', requireApiKey, async (req: any, res: any) => {
    const device = req.device;
    const { status, parameters } = req.body;
    
    try {
        const dataToUpdate: any = { lastSeen: new Date() };
        if (status !== undefined) dataToUpdate.status = status;
        
        let shouldLogEvent = false;
        
        if (parameters !== undefined) {
             const currentParams = getParams(device.parameters);
             const newParams = getParams(parameters);
             dataToUpdate.parameters = JSON.stringify({ ...currentParams, ...newParams });
             shouldLogEvent = true;
        }

        const updatedDevice = await prisma.device.update({
            where: { id: device.id },
            data: dataToUpdate
        });

        if (status !== undefined && status !== device.status) {
            await prisma.eventLog.create({
                data: {
                    deviceId: device.id,
                    eventType: 'HARDWARE_STATE_CHANGE',
                    description: `Hardware reported status: ${status}`
                }
            });
        }

        broadcast({ type: 'DEVICE_UPDATED', payload: updatedDevice });
        res.json({ success: true, message: 'Device status updated successfully' });

    } catch (e) {
        console.error('Hardware update failed:', e);
        res.status(500).json({ error: 'Update failed' });
    }
});

app.get('/api/telemetry', requireAuth, async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const telemetry = await prisma.telemetry.findMany({
            where: { timestamp: { gte: twentyFourHoursAgo } },
            orderBy: { timestamp: 'asc' }
        });
        res.json(telemetry);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- WebSocket logic for real time monitoring ---
const clients = new Set<any>();

wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    // Simulation: occasionally receive data from "devices" indicating they are alive.
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            // In a real scenario, this would authenticate the actual hardware device.
            if (data.type === 'DEVICE_PING' && data.deviceId) {
                await prisma.device.update({
                    where: { id: data.deviceId },
                    data: { lastSeen: new Date() }
                });
            }
        } catch (e) { }
    });
});

const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
            client.send(message);
        }
    });
};

// --- Microcontroller Simulation ---
setInterval(async () => {
    try {
        const devices = await prisma.device.findMany();
        if (devices.length === 0) return;

        const now = new Date();
        const updatedDevices = [];
        const updateOperations = [];

        // Group sensors by room for easy lookup
        const roomSensors: Record<string, any[]> = {};
        devices.forEach(d => {
            if (d.type === 'SENSOR') {
                if (!roomSensors[d.room]) roomSensors[d.room] = [];
                roomSensors[d.room].push(d);
            }
        });

        for (const device of devices) {
            let hasChanged = false;
            let status = device.status;
            const params = getParams(device.parameters);

            // 1. Update Last Seen for active devices
            if (status === 'ON') {
                device.lastSeen = now;
                hasChanged = true;
            }

            // 2. Power Consumption Calculation (W)
            let power = 0;
            if (status === 'ON') {
                switch (device.type) {
                    case 'RELAY': power = 10; break;
                    case 'COFFEE_MACHINE': power = params.temp > 90 ? 1500 : 100; break;
                    case 'AIR_PURIFIER': power = 40 + (Math.random() * 20); break;
                    case 'DEHUMIDIFIER': power = 250 + (Math.random() * 50); break;
                    case 'THERMOSTAT':
                        const baseFan = 50;
                        const acMode = params.acMode || 'AUTO';
                        const fanSpeed = params.fanSpeed || 'MEDIUM';
                        const speedMulti = fanSpeed === 'HIGH' ? 1.5 : (fanSpeed === 'LOW' ? 0.7 : 1.0);
                        
                        if (acMode === 'COOL' || acMode === 'HEAT') {
                            power = baseFan * speedMulti + 1200; // Compressor active
                        } else if (acMode === 'DRY') {
                            power = baseFan * speedMulti + 400;
                        } else {
                            power = baseFan * speedMulti;
                        }
                        break;
                    case 'FAN': power = 45; break;
                }
            }
            if (params.currentPower !== power) {
                params.currentPower = Math.round(power);
                hasChanged = true;
            }

            // 3. Room Environmental Interactions (Climate)
            if (device.type === 'THERMOSTAT' && status === 'ON' && Math.random() < 0.25) {
                const acMode = params.acMode || 'AUTO';
                const targetTemp = params.targetTemp || 22;
                const sensorsInRoom = roomSensors[device.room] || [];

                for (const sensor of sensorsInRoom) {
                    const sParams = getParams(sensor.parameters);
                    let sChanged = false;

                    // Temperature adjustment
                    if (sParams.sensorType === 'TEMPERATURE') {
                        const currentVal = sParams.value || 22;
                        let diff = 0;
                        if (acMode === 'COOL' || (acMode === 'AUTO' && currentVal > targetTemp)) {
                            diff = -0.2; // Cooling effect
                        } else if (acMode === 'HEAT' || (acMode === 'AUTO' && currentVal < targetTemp)) {
                            diff = 0.2; // Heating effect
                        }
                        
                        if (diff !== 0) {
                            const nextVal = currentVal + diff + (Math.random() * 0.1 - 0.05);
                            sParams.value = Math.round(Math.max(15, Math.min(35, nextVal)) * 10) / 10;
                            sChanged = true;
                        }
                    }

                    // Humidity adjustment (Dry mode)
                    if (sParams.sensorType === 'HUMIDITY' && acMode === 'DRY') {
                        const currentVal = sParams.value || 50;
                        if (currentVal > 35) {
                            sParams.value = Math.round((currentVal - 0.5) * 10) / 10;
                            sChanged = true;
                        }
                    }

                    if (sChanged) {
                        updateOperations.push(
                            prisma.device.update({
                                where: { id: sensor.id },
                                data: { parameters: JSON.stringify(sParams) }
                            })
                        );
                    }
                }
            }

            // 4. Battery Drain - Occurs much less frequently to avoid constant DB writes
            if (params.battery !== undefined && Math.random() < 0.1) {
                const drain = (status === 'ON' ? 0.3 : 0.05);
                params.battery = Math.max(0, parseFloat((params.battery - (Math.random() * drain)).toFixed(2)));
                hasChanged = true;
            }

            // 6. Coffee Machine specific logic (Fluctuations)
            if (device.type === 'COFFEE_MACHINE' && status === 'ON' && Math.random() < 0.3) {
                const targetTemp = 92;
                const currentTemp = params.temp || targetTemp;
                const drift = targetTemp - currentTemp;
                params.temp = Math.round((currentTemp + drift * 0.1 + (Math.random() - 0.5) * 0.5) * 10) / 10;
                hasChanged = true;
            }

            if (hasChanged) {
                updateOperations.push(
                    prisma.device.update({
                        where: { id: device.id },
                        data: { parameters: JSON.stringify(params), lastSeen: device.lastSeen }
                    })
                );
            }
        }

        const motionDevices = devices.filter(d => d.type === 'MOTION');
        for (const md of motionDevices) {
            if (md.status === 'ON' && md.lastSeen && (now.getTime() - new Date(md.lastSeen).getTime() > 30000)) {
                 // Auto-off motion after 30s
                 updateOperations.push(
                     prisma.device.update({ where: { id: md.id }, data: { status: 'OFF' } })
                 );
            } else if (Math.random() < 0.05) { // 5% chance of motion every 5s
                const mParams = getParams(md.parameters);
                mParams.lastMotion = now.toISOString();
                updateOperations.push(
                    prisma.device.update({
                        where: { id: md.id },
                        data: { parameters: JSON.stringify(mParams), lastSeen: now, status: 'ON' }
                    })
                );
            }
        }

        // Execute all updates simultaneously inside a single transaction to prevent database locks and Socket timeouts
        if (updateOperations.length > 0) {
            const results = await prisma.$transaction(updateOperations);
            broadcast({ type: 'DEVICES_UPDATED', payload: results });
        }

    } catch (e) {
        console.error("Simulation error", e);
    }
}, 5000);

setInterval(async () => {
    try {
        const devices = await prisma.device.findMany();
        if (devices.length === 0) return;

        const rooms = new Set(devices.map(d => d.room));
        const housePowerTotal = devices.filter(d => d.status === 'ON').reduce((sum, d) => sum + (getParams(d.parameters).currentPower || 0), 0);
        
        let houseTempTotal = 0, houseTempCount = 0;
        let houseHumTotal = 0, houseHumCount = 0;
        let houseAqiTotal = 0, houseAqiCount = 0;

        for (const room of rooms) {
            const roomDevices = devices.filter(d => d.room === room);
            const roomPower = roomDevices.filter(d => d.status === 'ON').reduce((sum, d) => sum + (getParams(d.parameters).currentPower || 0), 0);
            
            let tempTotal = 0, tempCount = 0;
            let humTotal = 0, humCount = 0;
            let aqiTotal = 0, aqiCount = 0;

            for (const d of roomDevices) {
                if (d.type === 'SENSOR') {
                    const params = getParams(d.parameters);
                    if (params.sensorType === 'TEMPERATURE' && params.value !== undefined) {
                        tempTotal += params.value; tempCount++;
                        houseTempTotal += params.value; houseTempCount++;
                    } else if (params.sensorType === 'HUMIDITY' && params.value !== undefined) {
                        humTotal += params.value; humCount++;
                        houseHumTotal += params.value; houseHumCount++;
                    } else if (params.sensorType === 'AQI' && params.value !== undefined) {
                        aqiTotal += params.value; aqiCount++;
                        houseAqiTotal += params.value; houseAqiCount++;
                    }
                }
            }

            const ops = [];
            ops.push(prisma.telemetry.create({ data: { room, type: 'POWER', value: roomPower } }));
            if (tempCount > 0) ops.push(prisma.telemetry.create({ data: { room, type: 'TEMP', value: tempTotal / tempCount } }));
            if (humCount > 0) ops.push(prisma.telemetry.create({ data: { room, type: 'HUMIDITY', value: humTotal / humCount } }));
            if (aqiCount > 0) ops.push(prisma.telemetry.create({ data: { room, type: 'AQI', value: aqiTotal / aqiCount } }));
            
            await prisma.$transaction(ops);
        }

        const globalOps = [];
        globalOps.push(prisma.telemetry.create({ data: { room: 'House', type: 'POWER', value: housePowerTotal } }));
        if (houseTempCount > 0) globalOps.push(prisma.telemetry.create({ data: { room: 'House', type: 'TEMP', value: houseTempTotal / houseTempCount } }));
        if (houseHumCount > 0) globalOps.push(prisma.telemetry.create({ data: { room: 'House', type: 'HUMIDITY', value: houseHumTotal / houseHumCount } }));
        if (houseAqiCount > 0) globalOps.push(prisma.telemetry.create({ data: { room: 'House', type: 'AQI', value: houseAqiTotal / houseAqiCount } }));
        
        await prisma.$transaction(globalOps);

    } catch (e) {
        console.error("Telemetry error:", e);
    }
}, 10000); // 10 seconds

// --- Microcontroller Simulation END ---
const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
