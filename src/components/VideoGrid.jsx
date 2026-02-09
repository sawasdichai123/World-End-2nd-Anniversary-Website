import { useState, useEffect } from 'react'
import './VideoGrid.css'

/**
 * VideoGrid Component
 * Displays a 3x3 grid of YouTube video embeds as background
 * Videos are muted, looping, and non-interactive
 */
function VideoGrid({ memberId, videos = [] }) {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Small delay to stagger iframe loading
        const timer = setTimeout(() => setIsLoaded(true), 500)
        return () => clearTimeout(timer)
    }, [])

    // Ensure we have exactly 9 videos (or fill with placeholders)
    const gridVideos = videos.slice(0, 9)

    // If less than 9 videos, duplicate existing ones to fill the grid
    while (gridVideos.length < 9 && videos.length > 0) {
        gridVideos.push(videos[gridVideos.length % videos.length])
    }

    if (!isLoaded || gridVideos.length === 0) {
        return (
            <div className="video-grid video-grid-placeholder">
                <div className="grid-overlay" />
            </div>
        )
    }

    return (
        <div className="video-grid">
            <div className="video-grid-inner">
                {gridVideos.map((video, index) => (
                    <div key={`${video.id}-${index}`} className="video-cell">
                        <iframe
                            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            loading="lazy"
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
