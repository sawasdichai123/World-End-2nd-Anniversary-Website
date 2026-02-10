/**
 * Vercel Serverless Function: /api/live-status
 * Checks live status for all World End members via Holodex API
 * Caches results for 30 seconds → 10,000 users = 1 Holodex request/30s
 */

const HOLODEX_API_KEY = process.env.HOLODEX_API_KEY || '';
const HOLODEX_BASE_URL = 'https://holodex.net/api/v2';

// All member channel IDs
const MEMBER_CHANNELS = [
    { id: 'ashyra', channelId: 'UCZYTMrnVmu1iUVyGeqB6zJQ' },
    { id: 'mildr', channelId: 'UCknOyz3O0-G6w5SJNAgO7uQ' },
    { id: 'debirun', channelId: 'UC3qnb4Sgo4QtiOi8iS7jOsQ' },
    { id: 'tsururu', channelId: 'UCa8ILv94qHT6oar_jVzg9sQ' },
    { id: 'xonebu', channelId: 'UCot8DHNnZ2X0ARgaNYZopjw' },
    { id: 'ami', channelId: 'UCGo7fnmWfGQewxZVDmC3iJQ' },
];

// In-memory cache
let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

async function checkChannelLive(channelId) {
    try {
        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?status=live&limit=1`;
        const headers = {};
        if (HOLODEX_API_KEY) {
            headers['X-APIKEY'] = HOLODEX_API_KEY;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`[API] Holodex error for ${channelId}: ${response.status}`);
            return { isLive: false };
        }

        const videos = await response.json();

        if (videos && videos.length > 0) {
            const stream = videos[0];
            return {
                isLive: true,
                liveTitle: stream.title,
                liveUrl: `https://www.youtube.com/watch?v=${stream.id}`,
                viewers: stream.live_viewers || 0,
            };
        }

        return { isLive: false };
    } catch (error) {
        console.error(`[API] Error checking ${channelId}:`, error.message);
        return { isLive: false };
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const now = Date.now();

        // Return cached data if fresh
        if (cache && (now - cacheTimestamp < CACHE_DURATION)) {
            console.log('[API] Returning cached live status');
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
            return res.status(200).json(cache);
        }

        console.log('[API] Fetching fresh live status from Holodex...');

        // Fetch all channels in parallel
        const results = {};
        const promises = MEMBER_CHANNELS.map(async (member) => {
            results[member.id] = await checkChannelLive(member.channelId);
        });

        await Promise.allSettled(promises);

        // Update cache
        cache = results;
        cacheTimestamp = now;

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
        return res.status(200).json(results);
    } catch (error) {
        console.error('[API] Live status error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
