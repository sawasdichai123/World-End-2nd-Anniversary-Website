import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './LandingSection.css'

function LandingSection() {
    const canvasRef = useRef(null)

    // Particle animation for background
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        let animationId
        let particles = []

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        resize()
        window.addEventListener('resize', resize)

        // Create particles
        const createParticles = () => {
            particles = []
            const particleCount = 80
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.5,
                    opacity: Math.random() * 0.5 + 0.2
                })
            }
        }

        createParticles()

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(particle => {
                particle.x += particle.speedX
                particle.y += particle.speedY

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width
                if (particle.x > canvas.width) particle.x = 0
                if (particle.y < 0) particle.y = canvas.height
                if (particle.y > canvas.height) particle.y = 0

                // Draw particle
                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(155, 89, 182, ${particle.opacity})`
                ctx.fill()
            })

            // Draw connecting lines
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < 120) {
                        ctx.beginPath()
                        ctx.moveTo(p1.x, p1.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - distance / 120)})`
                        ctx.stroke()
                    }
                })
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <section className="landing-section">
            {/* Animated Background */}
            <canvas ref={canvasRef} className="particles-canvas" />
            <div className="landing-gradient-overlay" />

            {/* Content */}
            <div className="landing-content">
                <motion.div
                    className="anniversary-badge"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="badge-year">2nd</span>
                    <span className="badge-label">Anniversary</span>
                </motion.div>

                <motion.h1
                    className="landing-title"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    <span className="title-gradient">World End</span>
                    <span className="title-subtitle">Virtual Project</span>
                </motion.h1>

                <motion.p
                    className="landing-description"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    Celebrating two years of imagination, creativity, and the virtual frontier.
                    <br />
                    <span className="highlight">A Fanmade Celebration</span>
                </motion.p>

                <motion.div
                    className="landing-cta"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                >
                    <button className="btn btn-primary">
                        <span>Watch Celebration</span>
                        <div className="btn-glow" />
                    </button>
                    <button className="btn btn-secondary">
                        <span>Meet The Members</span>
                    </button>
                </motion.div>

                <motion.div
                    className="fanmade-notice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                >
                    ★ Fanmade Project ★
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="scroll-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.5 }}
            >
                <div className="scroll-mouse">
                    <div className="scroll-wheel" />
                </div>
                <span className="scroll-text">Scroll to Explore</span>
            </motion.div>

            {/* Decorative Elements */}
            <div className="corner-decor top-left" />
            <div className="corner-decor top-right" />
            <div className="corner-decor bottom-left" />
            <div className="corner-decor bottom-right" />
        </section>
    )
}

export default LandingSection
