import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'
import { members } from '../data'
import { checkAllLiveStatus, getChannelUrl } from '../utils/youtube'
import VideoGrid from './VideoGrid'
import './CharacterShowcase.css'

gsap.registerPlugin(ScrollTrigger)

function CharacterShowcase() {
    const sectionRef = useRef(null)
    const containerRef = useRef(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [liveStatus, setLiveStatus] = useState({})
    const [memberVideos, setMemberVideos] = useState({})

    // Check live status on mount and periodically
    useEffect(() => {
        const checkStatus = async () => {
            const status = await checkAllLiveStatus(members)
            setLiveStatus(status)
        }

        checkStatus()

        // Refresh every 60 seconds
        const interval = setInterval(checkStatus, 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    // Fetch member videos on mount (for background grid)
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                // In production, use our API; in dev, skip video grid
                if (!import.meta.env.DEV) {
                    const response = await fetch('/api/member-videos')
                    if (response.ok) {
                        const data = await response.json()
                        setMemberVideos(data.videos || {})
                    }
                }
            } catch (error) {
                console.error('Error fetching member videos:', error)
            }
        }

        fetchVideos()
    }, [])

    useEffect(() => {
        const section = sectionRef.current
        const container = containerRef.current

        if (!section || !container) return

        // Calculate the scroll distance needed
        const scrollWidth = container.scrollWidth
        const viewportWidth = window.innerWidth
        const scrollDistance = scrollWidth - viewportWidth

        // Create the horizontal scroll animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${scrollDistance}`,
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                onUpdate: (self) => {
                    // Update active index based on scroll progress
                    const progress = self.progress
                    const newIndex = Math.min(
                        Math.floor(progress * members.length),
                        members.length - 1
                    )
                    setActiveIndex(newIndex)
                }
            }
        })

        tl.to(container, {
            x: -scrollDistance,
            ease: 'none'
        })

        return () => {
            ScrollTrigger.getAll().forEach(st => st.kill())
        }
    }, [])

    const goToMember = (index) => {
        const section = sectionRef.current
        if (!section) return

        const scrollTrigger = ScrollTrigger.getAll().find(
            st => st.trigger === section
        )

        if (scrollTrigger) {
            const progress = index / members.length
            const scrollPos = scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * progress
            gsap.to(window, {
                scrollTo: scrollPos,
                duration: 0.8,
                ease: 'power2.inOut'
            })
        }
    }

    return (
        <section className="character-showcase" ref={sectionRef}>
            {/* Section Header */}
            <div className="showcase-header">
                <span className="showcase-subtitle">Meet The Members</span>
                <h2 className="showcase-title">World End Artists</h2>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="showcase-wrapper">
                <div className="showcase-container" ref={containerRef}>
                    {members.map((member, index) => {
                        const memberLive = liveStatus[member.id]
                        const isLive = memberLive?.isLive

                        return (
                            <div
                                key={member.id}
                                className={`character-card ${activeIndex === index ? 'active' : ''}`}
                                style={{ '--theme-color': member.themeColor, '--accent-color': member.accentColor }}
                            >
                                {/* Video Grid Background */}
                                {memberVideos[member.id]?.length > 0 && (
                                    <VideoGrid
                                        memberId={member.id}
                                        videos={memberVideos[member.id]}
                                    />
                                )}
                                {/* Character Image */}
                                <div className="character-image-wrapper">
                                    <div className="character-glow" />

                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="character-image"
                                    />
                                    <div className="character-frame" />
                                </div>

                                {/* Character Info */}
                                <div className="character-info">
                                    <span className="character-number">0{index + 1}</span>
                                    <h3 className="character-name">{member.name}</h3>
                                    <span className="character-role">{member.role}</span>

                                    {/* Live Status Indicator */}
                                    <div className="live-status-container">
                                        {isLive ? (
                                            <a
                                                href={memberLive.liveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="live-status live"
                                            >
                                                <span className="live-indicator" />
                                                <span className="live-text">🔴 กำลัง Live อยู่!</span>
                                                <span className="live-title">{memberLive.liveTitle}</span>
                                            </a>
                                        ) : (
                                            <a
                                                href={getChannelUrl(member.channelId)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="live-status offline"
                                            >
                                                <span className="offline-text">⚫ Offline</span>
                                                <span className="channel-link">ไปที่ช่อง YouTube →</span>
                                            </a>
                                        )}
                                    </div>

                                    <p className="character-description">
                                        {member.profile.background}
                                    </p>

                                    <div className="character-tags">
                                        {member.profile.hashtags.map((tag, i) => (
                                            <span key={i} className="tag">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="character-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Birthday</span>
                                            <span className="meta-value">{member.profile.birthday}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Height</span>
                                            <span className="meta-value">{member.profile.height}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Navigation Dots */}
            <div className="showcase-nav">
                {members.map((member, index) => {
                    const isLive = liveStatus[member.id]?.isLive
                    return (
                        <button
                            key={member.id}
                            className={`nav-dot ${activeIndex === index ? 'active' : ''} ${isLive ? 'is-live' : ''}`}
                            onClick={() => goToMember(index)}
                            style={{ '--dot-color': member.themeColor }}
                        >
                            {isLive && <span className="nav-live-dot" />}
                            <span className="dot-label">{member.name}</span>
                        </button>
                    )
                })}
            </div>

            {/* Progress Bar */}
            <div className="showcase-progress">
                <div
                    className="progress-fill"
                    style={{ width: `${((activeIndex + 1) / members.length) * 100}%` }}
                />
            </div>

            {/* Current Member Indicator */}
            <div className="member-counter">
                <span className="current">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="divider">/</span>
                <span className="total">{String(members.length).padStart(2, '0')}</span>
            </div>
        </section>
    )
}

export default CharacterShowcase
