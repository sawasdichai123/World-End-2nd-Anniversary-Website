import { useState, useEffect } from 'react'
import './VideoGrid.css'

/**
 * VideoGrid Component - Lightweight Thumbnail Version
 * Displays a 3x3 grid of YouTube thumbnails with subtle animation
 * Much faster than iframe embeds!
 */
function VideoGrid({ memberId, videos = [] }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Fade in after a short delay
        const timer = setTimeout(() => setIsVisible(true), 300)
        return () => clearTimeout(timer)
    }, [])

    // Ensure we have videos to display
    const gridVideos = videos.slice(0, 9)

    // Fill grid with duplicates if needed
    while (gridVideos.length < 9 && videos.length > 0) {
        gridVideos.push(videos[gridVideos.length % videos.length])
    }

    if (gridVideos.length === 0) {
        return null
    }

    return (
        <div className={`video-grid ${isVisible ? 'visible' : ''}`}>
            <div className="video-grid-inner">
                {gridVideos.map((video, index) => (
                    <div
                        key={`${video.id}-${index}`}
                        className="video-cell"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {/* Use high-quality thumbnail instead of iframe */}
                        <img
                            src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            className="video-thumbnail"
                        />
                    </div>
                ))}
            </div>
            {/* Dark overlay for readability */}
            <div className="grid-overlay" />
        </div>
    )
}

export default VideoGrid
