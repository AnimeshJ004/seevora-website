import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Sleek Stylized 3D Robot ─── */
function AIRobot() {
  const headRef = useRef();
  const coreRef = useRef();
  const leftHandRef = useRef();
  const rightHandRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.pointer;

    // 1. Head follows cursor with smooth lerping
    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, x * 0.4, 0.08);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -y * 0.3, 0.08);
    }

    // 2. Spinning AI Chest Core
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 1.5;
      coreRef.current.rotation.z = t * 0.8;
      // Pulse scale
      const s = 1.0 + Math.sin(t * 3) * 0.12;
      coreRef.current.scale.set(s, s, s);
    }

    // 3. Floating Hands (slightly out of sync for a natural look)
    if (leftHandRef.current) {
      leftHandRef.current.position.y = -0.9 + Math.sin(t * 2.0 + 0.8) * 0.1;
      leftHandRef.current.position.x = -1.2 + Math.cos(t * 1.0) * 0.04;
      leftHandRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
      leftHandRef.current.rotation.x = Math.cos(t * 0.3) * 0.1;
    }
    if (rightHandRef.current) {
      rightHandRef.current.position.y = -0.9 + Math.sin(t * 2.0 + 3.14) * 0.1;
      rightHandRef.current.position.x = 1.2 - Math.cos(t * 1.0) * 0.04;
      rightHandRef.current.rotation.z = -Math.sin(t * 0.5) * 0.1;
      rightHandRef.current.rotation.x = -Math.cos(t * 0.3) * 0.1;
    }

    // 4. Subtle eye pulsing glow
    const eyeIntensity = 2.0 + Math.sin(t * 4) * 0.5;
    if (leftEyeRef.current && leftEyeRef.current.material) {
      leftEyeRef.current.material.emissiveIntensity = eyeIntensity;
    }
    if (rightEyeRef.current && rightEyeRef.current.material) {
      rightEyeRef.current.material.emissiveIntensity = eyeIntensity;
    }
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* ───── HEAD GROUP ───── */}
      <group ref={headRef} position={[0, 0.5, 0]}>
        {/* Main Head Shell (Glossy white futuristic ceramic) */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.1}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Back Head Accent Panel (Vibrant Purple-magenta detailing) */}
        <mesh position={[0, 0.05, -0.2]} scale={[1.02, 1.02, 0.95]}>
          <sphereGeometry args={[0.55, 32, 32, 0, Math.PI, 0, Math.PI]} />
          <meshStandardMaterial
            color="#b14aed"
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>

        {/* Sleek Glossy Visor Screen */}
        <mesh position={[0, 0.02, 0.38]} scale={[1, 0.8, 1.05]}>
          <sphereGeometry args={[0.48, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.05}
            metalness={0.95}
          />
        </mesh>

        {/* Glowing Eyes */}
        <group position={[0, -0.02, 0.05]}>
          <mesh ref={leftEyeRef} position={[-0.18, 0.06, 0.72]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.18, 0.06, 0.72]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Earpieces / Side Joints */}
        <mesh position={[-0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 32]} />
          <meshStandardMaterial color="#475569" roughness={0.15} metalness={0.8} />
        </mesh>
        <mesh position={[0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 32]} />
          <meshStandardMaterial color="#475569" roughness={0.15} metalness={0.8} />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.81, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial
            color="#b14aed"
            emissive="#b14aed"
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ───── NECK ───── */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.16, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ───── TORSO / CHEST ───── */}
      <group position={[0, -0.85, 0]}>
        {/* Torso Shell (White Ceramic) */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.46, 0.32, 0.95, 32]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.1}
            metalness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Shoulder joints */}
        <mesh position={[-0.52, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.52, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Chest Glass Cover (using premium translucent material) */}
        <mesh position={[0, 0.05, 0.31]} scale={[1, 1.1, 0.5]}>
          <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.15}
            chromaticAberration={0.03}
            anisotropy={0.1}
            distortion={0.08}
            distortionScale={0.08}
            transmission={0.95}
            roughness={0.05}
            color="#ffffff"
          />
        </mesh>

        {/* Spinning Glowing Inner AI Core */}
        <mesh ref={coreRef} position={[0, 0.05, 0.16]}>
          <icosahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>

        {/* Core Outer Accents (Orbits inside chest screen) */}
        <mesh position={[0, 0.05, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.015, 8, 48]} />
          <meshStandardMaterial
            color="#b14aed"
            emissive="#b14aed"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* ───── FLOATING HANDS ───── */}
      {/* Left Hand */}
      <group ref={leftHandRef}>
        {/* Palm */}
        <mesh>
          <sphereGeometry args={[0.11, 32, 32]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.1}
            metalness={0.15}
            clearcoat={1.0}
          />
        </mesh>
        {/* Floating digital nodes under the palm */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* Right Hand */}
      <group ref={rightHandRef}>
        {/* Palm */}
        <mesh>
          <sphereGeometry args={[0.11, 32, 32]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.1}
            metalness={0.15}
            clearcoat={1.0}
          />
        </mesh>
        {/* Floating digital nodes under the palm */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ───── HOVER THRUSTER FLAME (Downward plasma cone) ───── */}
      <group position={[0, -1.45, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.001, 0.35, 32]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={3.5}
            transparent
            opacity={0.6}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#b14aed"
            emissive="#b14aed"
            emissiveIntensity={2.0}
            transparent
            opacity={0.45}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Orbital Ring ─── */
function OrbitalRing({ radius, color, speed, tiltX = 0, tiltZ = 0 }) {
  const ref = useRef();

  const ringGeometry = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * speed;
    }
  });

  return (
    <group ref={ref} rotation={[tiltX, 0, tiltZ]}>
      <line geometry={ringGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </line>
    </group>
  );
}

/* ─── Floating Particles Field ─── */
function ParticleField({ count = 120 }) {
  const particlesRef = useRef();

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.0 + Math.random() * 3.5;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = 0.5 + Math.random() * 1.5;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.02;
      particlesRef.current.rotation.x = Math.sin(t * 0.01) * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00e5ff"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Mouse-tracking scene rotation ─── */
function SceneController({ children }) {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mouse.current.x = (e.clientX / innerWidth - 0.5) * 2;
    mouse.current.y = (e.clientY / innerHeight - 0.5) * 2;
  };

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    target.current.x += (mouse.current.x * 0.25 - target.current.x) * 0.05;
    target.current.y += (mouse.current.y * 0.25 - target.current.y) * 0.05;
    if (groupRef.current) {
      groupRef.current.rotation.y = target.current.x;
      groupRef.current.rotation.x = -target.current.y;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

/* ─── Main Export ─── */
export default function AIScene3D() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 900,
        height: 900,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        style={{ background: 'transparent' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 11.5]} fov={45} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow />
        <pointLight position={[-4, 3, 2]} intensity={1.5} color="#0ea5e9" />
        <pointLight position={[4, -2, 2]} intensity={1.5} color="#7c3aed" />
        <pointLight position={[0, 1, 4]} intensity={0.8} color="#ffffff" />

        <SceneController>
          <group scale={1.65}>
            {/* Gentle hovering robot */}
            <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.4}>
              <AIRobot />
            </Float>

            {/* Orbital Rings */}
            <OrbitalRing radius={2.2} color="#00e5ff" speed={0.1} tiltX={Math.PI * 0.35} tiltZ={0.1} />
            <OrbitalRing radius={2.6} color="#b14aed" speed={-0.07} tiltX={Math.PI * 0.5} tiltZ={-0.2} />

            {/* Particle Field */}
            <ParticleField count={150} />
          </group>
        </SceneController>
      </Canvas>

      {/* Glow overlay — softened for light background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, rgba(14,165,233,0.06) 0%, rgba(124,58,237,0.02) 45%, transparent 70%)',
        }}
      />
    </div>
  );
}
