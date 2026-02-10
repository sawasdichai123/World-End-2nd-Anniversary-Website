import { useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Audio Analyser Hook ─────────────────────────────
// Stores the Web Audio API analyser reference globally
// so it persists across component re-renders
let audioContext = null
let analyser = null
let dataArray = null
let isAudioConnected = false

export function connectAudio(videoElement) {
    if (isAudioConnected || !videoElement) return

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8

        const source = audioContext.createMediaElementSource(videoElement)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        dataArray = new Uint8Array(analyser.frequencyBinCount)
        isAudioConnected = true
        console.log('[Audio] Connected to video element')
    } catch (error) {
        console.error('[Audio] Failed to connect:', error)
    }
}

function getAudioData() {
    if (!analyser || !dataArray) {
        return { bass: 0, mid: 0, treble: 0, overall: 0, raw: new Uint8Array(128) }
    }

    analyser.getByteFrequencyData(dataArray)

    const len = dataArray.length
    let bass = 0, mid = 0, treble = 0

    // Bass: 0-10 (low frequencies / kick drum)
    for (let i = 0; i < Math.min(10, len); i++) bass += dataArray[i]
    bass = bass / (Math.min(10, len) * 255)

    // Mid: 10-80 (vocals, melody)
    for (let i = 10; i < Math.min(80, len); i++) mid += dataArray[i]
    mid = mid / (Math.min(70, len) * 255)

    // Treble: 80+ (hi-hats, cymbals)
    for (let i = 80; i < len; i++) treble += dataArray[i]
    treble = treble / ((len - 80) * 255)

    const overall = bass * 0.5 + mid * 0.35 + treble * 0.15

    return { bass, mid, treble, overall, raw: dataArray }
}


// ─── Orbiting Particles ──────────────────────────────
// Thousands of particles swirling in a sphere, expanding with bass
function AudioParticles({ count = 2000 }) {
    const meshRef = useRef()
    const velocities = useRef()

    const [positions, colors, sizes] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const col = new Float32Array(count * 3)
        const siz = new Float32Array(count)
        const vel = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            // Distribute in a sphere
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = 3 + Math.random() * 4

            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            pos[i * 3 + 2] = r * Math.cos(phi)

            // Cyberpunk colors: purple, pink, cyan
            const colorChoice = Math.random()
            if (colorChoice < 0.33) {
                col[i * 3] = 0.6; col[i * 3 + 1] = 0.2; col[i * 3 + 2] = 0.9 // Purple
            } else if (colorChoice < 0.66) {
                col[i * 3] = 0.9; col[i * 3 + 1] = 0.1; col[i * 3 + 2] = 0.6 // Pink
            } else {
                col[i * 3] = 0.0; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 1.0 // Cyan
            }

            siz[i] = 0.02 + Math.random() * 0.04

            // Orbital velocity
            vel[i * 3] = (Math.random() - 0.5) * 0.02
            vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
        }

        velocities.current = vel
        return [pos, col, siz]
    }, [count])

    useFrame((state) => {
        if (!meshRef.current) return
        const audio = getAudioData()
        const time = state.clock.elapsedTime
        const geo = meshRef.current.geometry
        const posAttr = geo.attributes.position
        const sizeAttr = geo.attributes.size
        const colAttr = geo.attributes.color
        const vel = velocities.current

        for (let i = 0; i < count; i++) {
            let x = posAttr.array[i * 3]
            let y = posAttr.array[i * 3 + 1]
            let z = posAttr.array[i * 3 + 2]

            // Orbit rotation
            const angle = 0.002 + audio.mid * 0.01
            const cosA = Math.cos(angle)
            const sinA = Math.sin(angle)
            const nx = x * cosA - z * sinA
            const nz = x * sinA + z * cosA

            // Bass push (expand outward)
            const dist = Math.sqrt(nx * nx + y * y + nz * nz)
            const push = 1 + audio.bass * 0.8
            const targetDist = (3 + Math.random() * 0.1) * push

            const scale = dist > 0 ? 1 + (targetDist - dist) * 0.01 : 1

            posAttr.array[i * 3] = nx * scale + vel[i * 3]
            posAttr.array[i * 3 + 1] = y * scale + vel[i * 3 + 1] + Math.sin(time + i) * 0.001
            posAttr.array[i * 3 + 2] = nz * scale + vel[i * 3 + 2]

            // Size pulse with beat
            sizeAttr.array[i] = (0.02 + Math.random() * 0.02) * (1 + audio.bass * 3)

            // Color intensity shifts with treble
            const intensity = 0.5 + audio.treble * 1.5
            colAttr.array[i * 3] = colAttr.array[i * 3] * 0.95 + (colAttr.array[i * 3] * intensity) * 0.05
        }

        posAttr.needsUpdate = true
        sizeAttr.needsUpdate = true
        colAttr.needsUpdate = true
    })

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
                <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                vertexColors
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    )
}


// ─── Energy Ring ─────────────────────────────────────
// Glowing ring that pulses and rotates with the beat
function EnergyRing({ radius = 5, segments = 128 }) {
    const ringRef = useRef()

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(segments * 3)
        const col = new Float32Array(segments * 3)

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            pos[i * 3] = Math.cos(angle) * radius
            pos[i * 3 + 1] = 0
            pos[i * 3 + 2] = Math.sin(angle) * radius

            col[i * 3] = 0.6
            col[i * 3 + 1] = 0.2
            col[i * 3 + 2] = 0.9
        }

        return [pos, col]
    }, [radius, segments])

    useFrame((state) => {
        if (!ringRef.current) return
        const audio = getAudioData()
        const time = state.clock.elapsedTime

        const geo = ringRef.current.geometry
        const posAttr = geo.attributes.position
        const colAttr = geo.attributes.color

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const r = radius * (1 + audio.bass * 0.5 + Math.sin(angle * 4 + time * 2) * audio.mid * 0.3)

            posAttr.array[i * 3] = Math.cos(angle) * r
            posAttr.array[i * 3 + 1] = Math.sin(time * 0.5 + angle * 2) * audio.mid * 1.5
            posAttr.array[i * 3 + 2] = Math.sin(angle) * r

            // Color shift: purple → pink → cyan based on frequency
            const t = (i / segments + time * 0.1) % 1
            colAttr.array[i * 3] = 0.6 + Math.sin(t * Math.PI * 2) * 0.4
            colAttr.array[i * 3 + 1] = 0.1 + audio.treble * 0.5
            colAttr.array[i * 3 + 2] = 0.8 + Math.cos(t * Math.PI * 2) * 0.2
        }

        posAttr.needsUpdate = true
        colAttr.needsUpdate = true

        // Rotate ring
        ringRef.current.rotation.y += 0.003 + audio.bass * 0.02
        ringRef.current.rotation.x = Math.sin(time * 0.3) * 0.2
    })

    return (
        <line ref={ringRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <lineBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </line>
    )
}


// ─── Second Energy Ring (Outer) ──────────────────────
function OuterRing() {
    const ringRef = useRef()

    useFrame((state) => {
        if (!ringRef.current) return
        const audio = getAudioData()
        const time = state.clock.elapsedTime

        ringRef.current.rotation.y -= 0.002 + audio.mid * 0.01
        ringRef.current.rotation.z = Math.cos(time * 0.2) * 0.3
        ringRef.current.scale.setScalar(1 + audio.bass * 0.3)
    })

    return (
        <group ref={ringRef}>
            <EnergyRing radius={7} segments={96} />
        </group>
    )
}


// ─── Central Glow Orb ────────────────────────────────
// Pulsing sphere at the center that reacts to bass
function CentralOrb() {
    const meshRef = useRef()
    const glowRef = useRef()

    useFrame(() => {
        if (!meshRef.current) return
        const audio = getAudioData()

        const scale = 0.3 + audio.bass * 1.2
        meshRef.current.scale.setScalar(scale)
        meshRef.current.material.emissiveIntensity = 0.5 + audio.overall * 2

        if (glowRef.current) {
            glowRef.current.scale.setScalar(scale * 3)
            glowRef.current.material.opacity = 0.1 + audio.bass * 0.3
        }
    })

    return (
        <group>
            {/* Core */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial
                    color="#9b59b6"
                    emissive="#e91e8c"
                    emissiveIntensity={1}
                    transparent
                    opacity={0.8}
                />
            </mesh>
            {/* Glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <meshBasicMaterial
                    color="#9b59b6"
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}


// ─── Waveform Bars ───────────────────────────────────
// 3D spectrum bars arranged in a circle
function SpectrumBars({ count = 64 }) {
    const groupRef = useRef()
    const barsRef = useRef([])

    const barData = useMemo(() => {
        return Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * Math.PI * 2
            return {
                angle,
                x: Math.cos(angle) * 4,
                z: Math.sin(angle) * 4,
            }
        })
    }, [count])

    useFrame(() => {
        const audio = getAudioData()

        barsRef.current.forEach((bar, i) => {
            if (!bar) return
            const freqIndex = Math.floor((i / count) * audio.raw.length)
            const value = audio.raw[freqIndex] / 255

            // Height based on frequency
            bar.scale.y = 0.1 + value * 3
            bar.position.y = bar.scale.y / 2

            // Color shift
            const hue = (i / count + audio.overall * 0.5) % 1
            bar.material.color.setHSL(hue * 0.3 + 0.75, 0.8, 0.3 + value * 0.4)
            bar.material.emissive.setHSL(hue * 0.3 + 0.75, 1, value * 0.3)
        })

        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001
        }
    })

    return (
        <group ref={groupRef}>
            {barData.map((bar, i) => (
                <mesh
                    key={i}
                    ref={(el) => { barsRef.current[i] = el }}
                    position={[bar.x, 0, bar.z]}
                    rotation={[0, -bar.angle, 0]}
                >
                    <boxGeometry args={[0.08, 1, 0.08]} />
                    <meshStandardMaterial
                        color="#9b59b6"
                        emissive="#e91e8c"
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.7}
                    />
                </mesh>
            ))}
        </group>
    )
}


// ─── Main Scene ──────────────────────────────────────
function Scene() {
    return (
        <>
            <ambientLight intensity={0.1} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#9b59b6" />
            <pointLight position={[5, 3, 5]} intensity={0.5} color="#e91e8c" />
            <pointLight position={[-5, -3, -5]} intensity={0.5} color="#00d4ff" />

            <AudioParticles count={1500} />
            <EnergyRing radius={5} />
            <OuterRing />
            <CentralOrb />
            <SpectrumBars count={64} />
        </>
    )
}


// ─── Exported Component ──────────────────────────────
export default function AudioReactiveBackground() {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            opacity: 1,
        }}>
            <Canvas
                camera={{ position: [0, 2, 10], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: false,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
                style={{ background: 'transparent' }}
            >
                <Scene />
            </Canvas>
        </div>
    )
}
