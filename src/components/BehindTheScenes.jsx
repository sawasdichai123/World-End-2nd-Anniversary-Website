import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './BehindTheScenes.css'

function BehindTheScenes() {
    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

    // Placeholder images - to be replaced with actual behind the scenes photos
    const galleryItems = [
        { id: 1, title: 'Project Kickoff', description: 'Where it all began...' },
        { id: 2, title: 'Art Process', description: 'Creating the visuals' },
        { id: 3, title: 'Music Production', description: 'Composing the melody' },
        { id: 4, title: 'Team Meeting', description: 'Planning sessions' },
        { id: 5, title: 'Recording Session', description: 'Bringing voices to life' },
        { id: 6, title: 'Final Review', description: 'Polishing the details' },
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <section className="bts-section" ref={sectionRef}>
            {/* Background */}
            <div className="bts-bg" />

            <div className="bts-container">
                {/* Header */}
                <motion.div
                    className="bts-header"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                >
                    <span className="bts-subtitle">The Making Of</span>
                    <h2 className="bts-title">Behind The Scenes</h2>
                    <p className="bts-description">
                        Discover the journey of how this anniversary project came to life.
                        <br />
                        From concept to creation, each step was filled with passion.
                    </p>
                </motion.div>

                {/* Story Section */}
                <motion.div
                    className="bts-story"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="story-card">
                        <div className="story-icon">💡</div>
                        <h3>The Idea</h3>
                        <p>
                            It all started with a simple wish - to celebrate two amazing years
                            of World End with something special that the community could cherish forever.
                        </p>
                    </div>
                    <div className="story-card">
                        <div className="story-icon">🎨</div>
                        <h3>The Process</h3>
                        <p>
                            Months of planning, countless late nights, and endless revisions.
                            Every detail was crafted with love and dedication from the team.
                        </p>
                    </div>
                    <div className="story-card">
                        <div className="story-icon">🌟</div>
                        <h3>The Result</h3>
                        <p>
                            A celebration worthy of World End. Thank you to everyone who
                            believed in this project and made it possible.
                        </p>
                    </div>
                </motion.div>

                {/* Gallery Grid */}
                <motion.div
                    className="bts-gallery"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {galleryItems.map((item) => (
                        <motion.div
                            key={item.id}
                            className="gallery-item"
                            variants={itemVariants}
                        >
                            <div className="gallery-placeholder">
                                <div className="placeholder-icon">📷</div>
                                <span className="placeholder-text">Add Image Here</span>
                                <span className="placeholder-number">{item.id}</span>
                            </div>
                            <div className="gallery-info">
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Credits */}
                <motion.div
                    className="bts-credits"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <h3>Special Thanks</h3>
                    <p>To all the fans who have supported World End for two incredible years.</p>
                    <p className="fanmade-badge">★ A Fanmade Project with ❤️ ★</p>
                </motion.div>
            </div>
        </section>
    )
}

export default BehindTheScenes
