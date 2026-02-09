/**
 * Live Status API Client
 * Fetches live status from our Vercel API endpoint (server-cached)
 * This allows unlimited users without hitting Holodex rate limits
 */

// Use relative URL for Vercel deployment, full URL for local dev
const API_ENDPOINT = import.meta.env.DEV
    ? 'https://holodex.net/api/v2' // Fallback to Holodex directly in dev
    : '/api/update-live-status';

const HOLODEX_API_KEY = import.meta.env.VITE_HOLODEX_API_KEY || '';

// Cache for local development
const CACHE_DURATION = 30 * 1000;
const channelCache = {};

/**
 * Check live status using our server-side cache (production)
 * or Holodex directly (development)
 */
export const checkAllLiveStatus = async (members) => {
    // In production, use our cached API endpoint
    if (!import.meta.env.DEV) {
        return fetchFromServerCache();
    }

    // In development, call Holodex directly
    return fetchFromHolodexDirect(members);
};

/**
 * Fetch from our Vercel API (production mode)
 * This reads from server-side cache, no rate limit issues
 */
async function fetchFromServerCache() {
    try {
        const response = await fetch('/api/update-live-status');

        if (!response.ok) {
            console.error('[LiveStatus] Server API error:', response.status);
            return {};
        }

        const data = await response.json();
        console.log('[LiveStatus] Got cached data, age:', data.cacheAge, 'seconds');

        return data.liveStatus || {};
    } catch (error) {
        console.error('[LiveStatus] Error fetching from server:', error);
        return {};
    }
}

/**
 * Fetch directly from Holodex (development mode only)
 */
async function fetchFromHolodexDirect(members) {
    const results = {};

    console.log('[LiveStatus] Dev mode - calling Holodex directly');

    for (const member of members) {
        if (member.channelId) {
            const status = await checkChannelLive(member.channelId);
            results[member.id] = status;
        } else {
            results[member.id] = { isLive: false };
        }
    }

    return results;
}

/**
 * Check single channel (development mode)
 */
async function checkChannelLive(channelId) {
    // Check cache
    if (channelCache[channelId] && (Date.now() - channelCache[channelId].timestamp < CACHE_DURATION)) {
        return channelCache[channelId].data;
    }

    try {
        const headers = {};
        if (HOLODEX_API_KEY) {
            headers['X-APIKEY'] = HOLODEX_API_KEY;
        }

        const url = `https://holodex.net/api/v2/channels/${channelId}/videos?status=live&limit=1`;
        const response = await fetch(url, { headers });

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
        channelCache[channelId] = {
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
 * Check single channel live status
 */
export const checkLiveStatus = async (channelId) => {
    if (!import.meta.env.DEV) {
        // In production, get from cached data
        const allStatus = await fetchFromServerCache();
        // Find by channelId... but we store by member id
        // Just return the cached result for that channel
        return allStatus[channelId] || { isLive: false };
    }

    return checkChannelLive(channelId);
};

/**
 * Get YouTube channel URL from channel ID
 */
export const getChannelUrl = (channelId) => {
    return `https://www.youtube.com/channel/${channelId}`;
};
