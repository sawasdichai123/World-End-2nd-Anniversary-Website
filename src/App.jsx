import { useEffect } from 'react'
import LandingSection from './components/LandingSection'
import CharacterShowcase from './components/CharacterShowcase'
import MVSection from './components/MVSection'
import BehindTheScenes from './components/BehindTheScenes'
import './index.css'

function App() {
  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="app">
      {/* Noise Overlay for texture */}
      <div className="noise-overlay" />

      {/* Landing / Hero Section */}
      <LandingSection />

      {/* Character Showcase - Horizontal Scroll */}
      <CharacterShowcase />

      {/* MV Premiere Section */}
      <MVSection />

      {/* Behind The Scenes */}
      <BehindTheScenes />

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-text">World End</span>
            <span className="logo-year">2nd Anniversary</span>
          </div>
          <p className="footer-notice">
            ★ Fanmade Project ★
            <br />
            This is a fan-made celebration project. Not affiliated with the official World End VTuber project.
          </p>
          <div className="footer-links">
            <span>Made with ❤️ by Fans, for Fans</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
