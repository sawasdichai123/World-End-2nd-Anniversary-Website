/**
 * Vercel Serverless Function: Update Live Status
 * This runs every minute via Vercel Cron to fetch live status from Holodex
 */

// In-memory cache
let cachedLiveStatus = {
    timestamp: 0,
    data: {}
};

// World End members channel IDs
const MEMBERS = [
    { id: 'ashyra', channelId: 'UCZYTMrnVmu1iUVyGeqB6zJQ', name: 'T-Reina Ashyra' },
    { id: 'mildr', channelId: 'UCknOyz3O0-G6w5SJNAgO7uQ', name: 'Mild-R' },
    { id: 'tsururu', channelId: 'UC3qnb4Sgo4QtiOi8iS7jOsQ', name: 'Kumoku Tsururu' },
    { id: 'ami', channelId: 'UCa8ILv94qHT6oar_jVzg9sQ', name: 'Ami' },
    { id: 'debirun', channelId: 'UCot8DHNnZ2X0ARgaNYZopjw', name: 'Debirun' },
    { id: 'xonebu', channelId: 'UCGo7fnmWfGQewxZVDmC3iJQ', name: 'Xonebu' }
];

const HOLODEX_API_KEY = process.env.HOLODEX_API_KEY || '';
const HOLODEX_BASE_URL = 'https://holodex.net/api/v2';

async function checkChannelLive(channelId) {
    try {
        const headers = {};
        if (HOLODEX_API_KEY) {
            headers['X-APIKEY'] = HOLODEX_API_KEY;
        }

        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?status=live&limit=1`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`Holodex error for ${channelId}: ${response.status}`);
            return { isLive: false };
        }

        const videos = await response.json();

        if (videos && videos.length > 0) {
            const stream = videos[0];
            return {
                isLive: true,
                liveTitle: stream.title,
                liveUrl: `https://www.youtube.com/watch?v=${stream.id}`,
                viewers: stream.live_viewers || 0
            };
        }

        return { isLive: false };
    } catch (error) {
        console.error(`Error checking ${channelId}:`, error);
        return { isLive: false };
    }
}

async function updateAllLiveStatus() {
    const results = {};

    for (const member of MEMBERS) {
        const status = await checkChannelLive(member.channelId);
        results[member.id] = status;

        if (status.isLive) {
            console.log(`✅ ${member.name} is LIVE!`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
}

// CommonJS export for Vercel
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const isCronTrigger = req.headers['x-vercel-cron'] === 'true' ||
            req.query.update === 'true';

        const now = Date.now();
        const cacheAge = now - cachedLiveStatus.timestamp;

        if (isCronTrigger || cacheAge > 120000 || !cachedLiveStatus.timestamp) {
            console.log('🔄 Updating live status cache...');
            const newData = await updateAllLiveStatus();

            cachedLiveStatus = {
                timestamp: now,
                data: newData
            };

            const liveCount = Object.values(newData).filter(s => s.isLive).length;
            console.log(`✅ Cache updated. ${liveCount} members live.`);
        }

        return res.status(200).json({
            success: true,
            timestamp: cachedLiveStatus.timestamp,
            cacheAge: Math.round((now - cachedLiveStatus.timestamp) / 1000),
            liveStatus: cachedLiveStatus.data
        });

    } catch (error) {
        console.error('Error in live-status handler:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
