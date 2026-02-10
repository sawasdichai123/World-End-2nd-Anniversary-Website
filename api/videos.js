/**
 * Vercel Serverless Function: /api/videos
 * Fetches recent videos for a channel via Holodex API
 * Caches results for 5 minutes per channel
 * Usage: GET /api/videos?channelId=UCxxx&limit=9
 */

const HOLODEX_API_KEY = process.env.HOLODEX_API_KEY || '';
const HOLODEX_BASE_URL = 'https://holodex.net/api/v2';

// In-memory cache per channel
const videoCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchVideos(channelId, limit) {
    try {
        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?type=stream,video&status=past&limit=${limit}`;
        const headers = {};
        if (HOLODEX_API_KEY) {
            headers['X-APIKEY'] = HOLODEX_API_KEY;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`[API] Holodex video error for ${channelId}: ${response.status}`);
            return [];
        }

        const videos = await response.json();

        return videos.map(video => ({
            id: video.id,
            title: video.title,
            thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
            duration: video.duration,
            publishedAt: video.published_at || video.available_at,
        }));
    } catch (error) {
        console.error(`[API] Error fetching videos for ${channelId}:`, error.message);
        return [];
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { channelId, limit = '9' } = req.query;

    if (!channelId) {
        return res.status(400).json({ error: 'channelId is required' });
    }

    // Validate channelId format (basic security check)
    if (!/^UC[\w-]{22}$/.test(channelId)) {
        return res.status(400).json({ error: 'Invalid channelId format' });
    }

    const videoLimit = Math.min(parseInt(limit) || 9, 25); // Max 25 videos

    try {
        const now = Date.now();
        const cached = videoCache[channelId];

        // Return cached if fresh
        if (cached && (now - cached.timestamp < CACHE_DURATION)) {
            console.log(`[API] Returning cached videos for ${channelId}`);
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
            return res.status(200).json(cached.data);
        }

        console.log(`[API] Fetching fresh videos for ${channelId}...`);
        const videos = await fetchVideos(channelId, videoLimit);

        // Update cache
        videoCache[channelId] = {
            timestamp: now,
            data: videos,
        };

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return res.status(200).json(videos);
    } catch (error) {
        console.error('[API] Videos error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
