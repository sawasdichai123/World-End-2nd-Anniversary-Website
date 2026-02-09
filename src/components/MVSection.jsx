import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import mvVideo from '../assets/Mvtest.mp4'
import './MVSection.css'

function MVSection() {
    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

    return (
        <section className="mv-section" ref={sectionRef}>
            {/* Background Effects */}
            <div className="mv-bg-gradient" />
            <div className="mv-grid-overlay" />

            <div className="mv-container">
                {/* Header */}
                <motion.div
                    className="mv-header"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                >
                    <span className="mv-subtitle">2nd Anniversary Special</span>
                    <h2 className="mv-title">
                        <span className="title-line">Music Video</span>
                        <span className="title-highlight">Premiere</span>
                    </h2>
                    <p className="mv-description">
                        Celebrate our 2nd Anniversary with the brand new fanmade song.
                        <br />
                        A story of connection, dreams, and the future we build together.
                    </p>
                </motion.div>

                {/* Video Player */}
                <motion.div
                    className="video-wrapper"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <div className="video-frame">
                        {/* Corner Decorations */}
                        <div className="frame-corner top-left" />
                        <div className="frame-corner top-right" />
                        <div className="frame-corner bottom-left" />
                        <div className="frame-corner bottom-right" />

                        {/* Glow Effect */}
                        <div className="video-glow" />

                        {/* Video Player */}
                        <video
                            className="video-player"
                            controls
                            poster=""
                        >
                            <source src={mvVideo} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* HUD Elements */}
                        <div className="hud-element hud-top-left">
                            <span>▶ NOW PLAYING</span>
                        </div>
                        <div className="hud-element hud-bottom-right">
                            <span>WORLD END 2ND</span>
                        </div>
                    </div>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    className="mv-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <div className="info-item">
                        <span className="info-icon">🎵</span>
                        <span className="info-text">Fanmade Original Song</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🎨</span>
                        <span className="info-text">Community Art Project</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">💜</span>
                        <span className="info-text">Made with Love</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default MVSection
