/**
 * Live Status & Videos API Client
 * 
 * Production: calls /api/* serverless proxy (cached, API key server-side)
 * Development: calls Holodex directly for convenience
 * 
 * This architecture supports 10,000+ concurrent users because:
 * - Server caches live status for 30s → all users share 1 Holodex request
 * - Server caches videos for 5 min → minimal API usage
 * - API key never exposed to frontend
 */

const IS_DEV = import.meta.env.DEV;
const DEV_API_KEY = import.meta.env.VITE_HOLODEX_API_KEY || '';
const HOLODEX_BASE_URL = 'https://holodex.net/api/v2';

// Client-side cache (backup for failed requests)
const LIVE_CACHE_DURATION = 30 * 1000;
const VIDEO_CACHE_DURATION = 5 * 60 * 1000;
const liveStatusCache = { data: null, timestamp: 0 };
const videosCache = {};

/**
 * Check live status for all members
 * Production: single request to /api/live-status (server handles caching)
 * Dev: direct Holodex calls
 */
export const checkAllLiveStatus = async (members) => {
    const now = Date.now();

    // Return client cache if fresh
    if (liveStatusCache.data && (now - liveStatusCache.timestamp < LIVE_CACHE_DURATION)) {
        return liveStatusCache.data;
    }

    try {
        let results;

        if (IS_DEV) {
            // Dev mode: direct Holodex calls (parallel)
            results = await checkLiveStatusDirect(members);
        } else {
            // Production: use proxy
            const response = await fetch('/api/live-status');
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            results = await response.json();
        }

        // Update client cache
        liveStatusCache.data = results;
        liveStatusCache.timestamp = now;

        return results;
    } catch (error) {
        console.error('[LiveStatus] Error:', error);

        // Return stale cache if available
        if (liveStatusCache.data) {
            console.log('[LiveStatus] Returning stale cache');
            return liveStatusCache.data;
        }

        // Fallback: all offline
        const fallback = {};
        members.forEach(m => { fallback[m.id] = { isLive: false }; });
        return fallback;
    }
};

/**
 * Dev-only: direct Holodex calls (parallel)
 */
async function checkLiveStatusDirect(members) {
    const results = {};
    const headers = DEV_API_KEY ? { 'X-APIKEY': DEV_API_KEY } : {};

    const promises = members.map(async (member) => {
        if (!member.channelId) {
            results[member.id] = { isLive: false };
            return;
        }

        try {
            const url = `${HOLODEX_BASE_URL}/channels/${member.channelId}/videos?status=live&limit=1`;
            const response = await fetch(url, { headers });

            if (!response.ok) {
                results[member.id] = { isLive: false };
                return;
            }

            const videos = await response.json();

            if (videos && videos.length > 0) {
                const stream = videos[0];
                results[member.id] = {
                    isLive: true,
                    liveTitle: stream.title,
                    liveUrl: `https://www.youtube.com/watch?v=${stream.id}`,
                    viewers: stream.live_viewers || 0,
                };
            } else {
                results[member.id] = { isLive: false };
            }
        } catch {
            results[member.id] = { isLive: false };
        }
    });

    await Promise.allSettled(promises);
    return results;
}

/**
 * Fetch recent videos for all members (for video grid background)
 */
export const fetchAllMemberVideos = async (members, videosPerMember = 9) => {
    const results = {};

    // Fetch all channels in parallel
    const promises = members.map(async (member) => {
        if (!member.channelId) {
            results[member.id] = [];
            return;
        }
        results[member.id] = await fetchChannelVideos(member.channelId, videosPerMember);
    });

    await Promise.allSettled(promises);
    return results;
};

/**
 * Fetch videos for a single channel
 */
async function fetchChannelVideos(channelId, limit = 9) {
    const now = Date.now();
    const cached = videosCache[channelId];

    // Return client cache if fresh
    if (cached && (now - cached.timestamp < VIDEO_CACHE_DURATION)) {
        return cached.data;
    }

    try {
        let videos;

        if (IS_DEV) {
            // Dev mode: direct Holodex
            const headers = DEV_API_KEY ? { 'X-APIKEY': DEV_API_KEY } : {};
            const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?type=stream,video&status=past&limit=${limit}`;
            const response = await fetch(url, { headers });

            if (!response.ok) return [];

            const data = await response.json();
            videos = data.map(video => ({
                id: video.id,
                title: video.title,
                thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
                duration: video.duration,
                publishedAt: video.published_at || video.available_at,
            }));
        } else {
            // Production: use proxy
            const response = await fetch(`/api/videos?channelId=${channelId}&limit=${limit}`);
            if (!response.ok) return [];
            videos = await response.json();
        }

        // Update client cache
        videosCache[channelId] = { timestamp: now, data: videos };

        return videos;
    } catch (error) {
        console.error(`[Videos] Error for ${channelId}:`, error);

        // Return stale cache if available
        if (cached) return cached.data;
        return [];
    }
}

/**
 * Get YouTube channel URL from channel ID
 */
export const getChannelUrl = (channelId) => {
    return `https://www.youtube.com/channel/${channelId}`;
};
