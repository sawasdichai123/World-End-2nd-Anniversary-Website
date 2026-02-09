/**
 * Holodex API utility for checking VTuber live streams
 * Uses channel-based lookup instead of org filter
 */

// Holodex API key (optional but recommended for higher rate limits)
const HOLODEX_API_KEY = import.meta.env.VITE_HOLODEX_API_KEY || '';
const HOLODEX_BASE_URL = 'https://holodex.net/api/v2';

// Cache to prevent excessive requests (30 seconds)
const CACHE_DURATION = 30 * 1000;
const channelCache = {};

/**
 * Check if a specific channel is live using Holodex
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<{isLive: boolean, liveTitle?: string, liveUrl?: string}>}
 */
export const checkLiveStatus = async (channelId) => {
    // Check cache
    if (channelCache[channelId] && (Date.now() - channelCache[channelId].timestamp < CACHE_DURATION)) {
        return channelCache[channelId].data;
    }

    try {
        const headers = {};
        if (HOLODEX_API_KEY) {
            headers['X-APIKEY'] = HOLODEX_API_KEY;
        }

        // Use the channel's live/videos endpoint
        const url = `${HOLODEX_BASE_URL}/channels/${channelId}/videos?status=live&limit=1`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`[Holodex] Error for ${channelId}:`, response.status);
            throw new Error(`Holodex API error: ${response.status}`);
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

        // Cache the result
        channelCache[channelId] = {
            timestamp: Date.now(),
            data: result
        };

        return result;
    } catch (error) {
        console.error(`[Holodex] Error checking ${channelId}:`, error);
        return { isLive: false };
    }
};

/**
 * Check live status for multiple channels
 * @param {Array<{id: string, channelId: string}>} members - Array of member objects
 * @returns {Promise<Object>} Object with member id as key and live status as value
 */
export const checkAllLiveStatus = async (members) => {
    const results = {};

    console.log('[Holodex] Checking live status for', members.length, 'members...');

    // Check each member's channel
    const promises = members.map(async (member) => {
        if (member.channelId) {
            const status = await checkLiveStatus(member.channelId);
            results[member.id] = status;
        } else {
            results[member.id] = { isLive: false };
        }
    });

    await Promise.all(promises);

    const liveCount = Object.values(results).filter(r => r.isLive).length;
    console.log('[Holodex] Live members:', liveCount);

    return results;
};

/**
 * Get YouTube channel URL from channel ID
 * @param {string} channelId 
 * @returns {string}
 */
export const getChannelUrl = (channelId) => {
    return `https://www.youtube.com/channel/${channelId}`;
};
