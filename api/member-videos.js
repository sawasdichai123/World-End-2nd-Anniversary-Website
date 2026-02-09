/**
 * Vercel Serverless Function: Fetch Member Videos
 * Runs every 24 hours to fetch recent videos for each member
 */

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
const VIDEOS_PER_MEMBER = 9;

// In-memory cache
let cachedVideos = {
    timestamp: 0,
    data: {}
};

async function fetchChannelVideos(channelId) {
    try {
        const headers = {};
        if (HOLODEX_API_KEY) {
            headers['X-APIKEY'] = HOLODEX_API_KEY;
        }

        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?type=stream,video&status=past&limit=${VIDEOS_PER_MEMBER}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`Holodex error for ${channelId}: ${response.status}`);
            return [];
        }

        const videos = await response.json();

        return videos.map(video => ({
            id: video.id,
            title: video.title,
            thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
            duration: video.duration,
            publishedAt: video.published_at || video.available_at
        }));
    } catch (error) {
        console.error(`Error fetching videos for ${channelId}:`, error);
        return [];
    }
}

async function fetchAllMemberVideos() {
    const results = {};

    for (const member of MEMBERS) {
        console.log(`Fetching videos for ${member.name}...`);
        const videos = await fetchChannelVideos(member.channelId);
        results[member.id] = videos;

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}

// CommonJS export for Vercel
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const now = Date.now();
        const cacheAge = now - cachedVideos.timestamp;
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

        const isCronTrigger = req.headers['x-vercel-cron'] === 'true' ||
            req.query.update === 'true';

        if (isCronTrigger || cacheAge > CACHE_DURATION || !cachedVideos.timestamp) {
            console.log('🔄 Updating video cache...');
            const newData = await fetchAllMemberVideos();

            cachedVideos = {
                timestamp: now,
                data: newData
            };

            console.log('✅ Video cache updated successfully');
        }

        return res.status(200).json({
            success: true,
            timestamp: cachedVideos.timestamp,
            cacheAge: Math.round((now - cachedVideos.timestamp) / 1000 / 60),
            videos: cachedVideos.data
        });

    } catch (error) {
        console.error('Error in member-videos handler:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
