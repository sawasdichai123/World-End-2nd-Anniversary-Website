/**
 * Live Status & Videos API Client
 * Uses Holodex API directly (no backend needed)
 * Holodex has generous rate limits and allows CORS
 */

const HOLODEX_API_KEY = import.meta.env.VITE_HOLODEX_API_KEY || '';
const HOLODEX_BASE_URL = 'https://holodex.net/api/v2';

// Cache for live status (30 seconds)
const LIVE_CACHE_DURATION = 30 * 1000;
// Cache for videos (10 minutes - they don't change often)
const VIDEO_CACHE_DURATION = 10 * 60 * 1000;

const liveStatusCache = {};
const videosCache = {};

/**
 * Get headers for Holodex API
 */
function getHeaders() {
    const headers = {};
    if (HOLODEX_API_KEY) {
        headers['X-APIKEY'] = HOLODEX_API_KEY;
    }
    return headers;
}

/**
 * Check live status for all members
 */
export const checkAllLiveStatus = async (members) => {
    const results = {};

    console.log('[Holodex] Checking live status for', members.length, 'members...');

    for (const member of members) {
        if (member.channelId) {
            results[member.id] = await checkChannelLive(member.channelId);
        } else {
            results[member.id] = { isLive: false };
        }
    }

    return results;
};

/**
 * Check if a channel is live
 */
async function checkChannelLive(channelId) {
    // Check cache
    const cached = liveStatusCache[channelId];
    if (cached && (Date.now() - cached.timestamp < LIVE_CACHE_DURATION)) {
        return cached.data;
    }

    try {
        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?status=live&limit=1`;
        const response = await fetch(url, { headers: getHeaders() });

        if (!response.ok) {
            console.error(`[Holodex] Error for ${channelId}:`, response.status);
            return { isLive: false };
        }

        const videos = await response.json();

        let result;
        if (videos && videos.length > 0) {
            const stream = videos[0];
            console.log(`[Holodex] ${channelId} is LIVE:`, stream.title);
            result = {
                isLive: true,
                liveTitle: stream.title,
                liveUrl: `https://www.youtube.com/watch?v=${stream.id}`,
                viewers: stream.live_viewers || 0
            };
        } else {
            result = { isLive: false };
        }

        // Cache
        liveStatusCache[channelId] = {
            timestamp: Date.now(),
            data: result
        };

        return result;
    } catch (error) {
        console.error(`[Holodex] Error checking ${channelId}:`, error);
        return { isLive: false };
    }
}

/**
 * Fetch recent videos for all members (for video grid background)
 */
export const fetchAllMemberVideos = async (members, videosPerMember = 9) => {
    const results = {};

    console.log('[Holodex] Fetching videos for', members.length, 'members...');

    for (const member of members) {
        if (member.channelId) {
            results[member.id] = await fetchChannelVideos(member.channelId, videosPerMember);
        } else {
            results[member.id] = [];
        }
    }

    return results;
};

/**
 * Fetch videos for a single channel
 */
async function fetchChannelVideos(channelId, limit = 9) {
    // Check cache
    const cached = videosCache[channelId];
    if (cached && (Date.now() - cached.timestamp < VIDEO_CACHE_DURATION)) {
        return cached.data;
    }

    try {
        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?type=stream,video&status=past&limit=${limit}`;
        const response = await fetch(url, { headers: getHeaders() });

        if (!response.ok) {
            console.error(`[Holodex] Error fetching videos for ${channelId}:`, response.status);
            return [];
        }

        const videos = await response.json();

        const result = videos.map(video => ({
            id: video.id,
            title: video.title,
            thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
            duration: video.duration,
            publishedAt: video.published_at || video.available_at
        }));

        // Cache
        videosCache[channelId] = {
            timestamp: Date.now(),
            data: result
        };

        console.log(`[Holodex] Got ${result.length} videos for ${channelId}`);
        return result;
    } catch (error) {
        console.error(`[Holodex] Error fetching videos for ${channelId}:`, error);
        return [];
    }
}

/**
 * Get YouTube channel URL from channel ID
 */
export const getChannelUrl = (channelId) => {
    return `https://www.youtube.com/channel/${channelId}`;
};
