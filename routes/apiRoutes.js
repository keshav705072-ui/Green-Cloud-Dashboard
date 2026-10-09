const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');

let memoryLogs = [];
let clients = [];

let regions = {
    'Central India': { ci: 310, flag: '🇮🇳' },
    'North Europe': { ci: 65, flag: '🇪🇺' },
    'East US': { ci: 420, flag: '🇺🇸' }
};
let activeRegion = 'Central India';
let totalAvoidedCarbon = 18.60;
let totalRupeesSaved = 1840.50;
let currentInstances = 1;

function broadcastTelemetry(data) {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

// AI Predictive Forecast (Hindi Alerts)
function generateAiForecast() {
    const minRegion = Object.keys(regions).reduce((a, b) => regions[a].ci < regions[b].ci ? a : b);
    if (regions[activeRegion].ci > 380) {
        return `⚠️ ${activeRegion} me emission bahut high hai. AI ki salah: Workload turant ${minRegion} (${regions[minRegion].ci} gCO₂) me shift karein.`;
    } else if (regions[activeRegion].ci < 180) {
        return `✅ Clean grid active (${regions[activeRegion].ci} gCO₂). Heavy AI/ML batch jobs chalane ka sabse behtareen samay.`;
    }
    return `Grid sthiti santulit hai. Agle cycle me renewable energy ki sambhavna hai.`;
}

router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    clients.push({ id: clientId, res });

    res.write(`data: ${JSON.stringify({
        type: 'SNAPSHOT',
        regions,
        activeRegion,
        carbonIntensity: regions[activeRegion].ci,
        avoidedCarbon: totalAvoidedCarbon.toFixed(2),
        rupeesSaved: totalRupeesSaved.toFixed(2),
        instances: currentInstances,
        powerDraw: currentInstances * 65,
        forecast: generateAiForecast()
    })}\n\n`);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

setInterval(() => {
    Object.keys(regions).forEach(reg => {
        const delta = Math.round((Math.random() * 8) - 4);
        regions[reg].ci = Math.max(40, Math.min(500, regions[reg].ci + delta));
    });

    broadcastTelemetry({
        type: 'REGION_UPDATE',
        regions,
        activeRegion,
        carbonIntensity: regions[activeRegion].ci,
        avoidedCarbon: totalAvoidedCarbon.toFixed(2),
        rupeesSaved: totalRupeesSaved.toFixed(2),
        instances: currentInstances,
        powerDraw: currentInstances * 65,
        forecast: generateAiForecast()
    });
}, 3000);

async function recordAction(actionType, message, instances = currentInstances) {
    const logData = {
        timestamp: new Date(),
        actionType,
        statusMessage: message,
        carbonIntensity: regions[activeRegion].ci,
        instances
    };

    memoryLogs.unshift(logData);
    try {
        await Metric.create(logData);
    } catch (err) {
        console.log('MongoDB Log Sync Warning:', err.message);
    }
    return logData;
}

router.post('/autoscale', async (req, res) => {
    const { cpuLoad } = req.body;
    const load = Number(cpuLoad) || 0;
    
    if (load > 80) currentInstances = 4;
    else if (load > 55) currentInstances = 3;
    else if (load > 30) currentInstances = 2;
    else currentInstances = 1;

    const savedPerHour = (4 - currentInstances) * 12.50;
    totalRupeesSaved += (savedPerHour / 60);

    const message = `${load}% CPU load par ${currentInstances} Pod provision kiya gaya. (Bachaye: ₹${savedPerHour.toFixed(2)}/ghanta)`;
    const savedLog = await recordAction('AUTOSCALE', message, currentInstances);

    broadcastTelemetry({
        type: 'NEW_LOG',
        log: savedLog,
        instances: currentInstances,
        powerDraw: currentInstances * 65,
        rupeesSaved: totalRupeesSaved.toFixed(2)
    });

    res.json({ success: true, instances: currentInstances, cpuLoad: load, message });
});

router.post('/carbon-job', async (req, res) => {
    let cleanest = Object.keys(regions).reduce((a, b) => regions[a].ci < regions[b].ci ? a : b);
    const selectedRegion = cleanest;
    const cleanIntensity = regions[selectedRegion].ci;

    let status = '';
    let message = '';

    if (cleanIntensity < 220) {
        status = 'Routed & Executed';
        totalAvoidedCarbon += 3.2;
        totalRupeesSaved += 45.00;
        message = `Autonomous Shift: Workload ko ${selectedRegion} (${cleanIntensity} gCO₂) me bheja gaya. ₹45.00 aur 3.2kg carbon bachaya.`;
    } else {
        status = 'Deferred';
        message = `Grid me carbon intensity high hai. Workload ko queue me daal diya gaya hai.`;
    }

    const savedLog = await recordAction('CARBON_SCHEDULING', `[${status}] ${message}`);

    broadcastTelemetry({
        type: 'NEW_LOG',
        log: savedLog,
        avoidedCarbon: totalAvoidedCarbon.toFixed(2),
        rupeesSaved: totalRupeesSaved.toFixed(2)
    });

    res.json({ success: true, status, selectedRegion, message, carbonIntensity: cleanIntensity });
});

router.post('/storage-lifecycle', async (req, res) => {
    totalAvoidedCarbon += 1.8;
    totalRupeesSaved += 128.40;

    const message = '100GB puraane data ko Archive vault me tier kiya gaya. 68% power bachayi aur ₹128.40/mahina save kiye.';
    const savedLog = await recordAction('STORAGE_LIFECYCLE', message);

    broadcastTelemetry({
        type: 'NEW_LOG',
        log: savedLog,
        avoidedCarbon: totalAvoidedCarbon.toFixed(2),
        rupeesSaved: totalRupeesSaved.toFixed(2)
    });

    res.json({
        success: true,
        tier: 'Sub-Watt Archive Vault',
        savedEnergy: '68% Power Down',
        rupeesSaved: '₹128.40/mo',
        message
    });
});

// Chaos Testing with Hindi Audio Alert String
router.post('/simulate-spike', async (req, res) => {
    regions[activeRegion].ci = 485;
    const message = `⚠️ CHAOS ALERT: ${activeRegion} me carbon 485 gCO₂ tak pahunch gaya! Emergency compute pause activate ho gaya.`;
    
    const savedLog = await recordAction('CHAOS_TEST', message);

    broadcastTelemetry({
        type: 'CHAOS_ALERT',
        log: savedLog,
        regions,
        carbonIntensity: 485,
        audioAlert: 'Chetavani! Grid me carbon emission ka khatarnak spike aya hai. Emergency power down shuru kiya ja raha hai.'
    });

    res.json({ success: true, message });
});

router.get('/metrics', async (req, res) => {
    try {
        const dbLogs = await Metric.find().sort({ timestamp: -1 }).limit(20);
        if (dbLogs && dbLogs.length > 0) return res.json({ success: true, data: dbLogs });
    } catch (e) {}
    res.json({ success: true, data: memoryLogs.slice(0, 20) });
});

module.exports = router;