import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function AIRobot() {
  const headRef = useRef();
  const coreRef = useRef();
  const leftHandRef = useRef();
  const rightHandRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const torsoRef = useRef();
  const neckRef = useRef();
  const thrusterRef = useRef();
  const startTime = useRef(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.pointer;

    if (startTime.current === null) {
      startTime.current = t;
    }
    const elapsed = t - startTime.current;

    // Easing helper for back-bounce scale pop
    const getScale = (startDelay, duration) => {
      if (elapsed < startDelay) return 0;
      const progress = Math.min((elapsed - startDelay) / duration, 1);
      const val = progress;
      const c1 = 1.1; // Bounce back factor
      const c3 = c1 + 1;
      const eased = progress === 1 ? 1 : 1 + c3 * Math.pow(val - 1, 3) + c1 * Math.pow(val - 1, 2);
      return eased;
    };

    const torsoS = getScale(0.0, 0.7);
    const neckS = getScale(0.2, 0.6);
    const headS = getScale(0.4, 0.7);
    const handsS = getScale(0.7, 0.6);
    const thrusterS = getScale(0.9, 0.6);

    if (torsoRef.current) torsoRef.current.scale.set(torsoS, torsoS, torsoS);
    if (neckRef.current) neckRef.current.scale.set(neckS, neckS, neckS);
    if (headRef.current) headRef.current.scale.set(headS, headS, headS);
    if (leftHandRef.current) leftHandRef.current.scale.set(handsS, handsS, handsS);
    if (rightHandRef.current) rightHandRef.current.scale.set(handsS, handsS, handsS);
    if (thrusterRef.current) thrusterRef.current.scale.set(thrusterS, thrusterS, thrusterS);

    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, x * 0.4, 0.08);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -y * 0.3, 0.08);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 1.5;
      coreRef.current.rotation.z = t * 0.8;
      const s = 1.0 + Math.sin(t * 3) * 0.12;
      coreRef.current.scale.set(s, s, s);
    }
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
    const eyeIntensity = 2.0 + Math.sin(t * 4) * 0.5;
    if (leftEyeRef.current?.material)  leftEyeRef.current.material.emissiveIntensity = eyeIntensity;
    if (rightEyeRef.current?.material) rightEyeRef.current.material.emissiveIntensity = eyeIntensity;
  });

  return (
    <group position={[0, 0.2, 0]}>
      {/* HEAD */}
      <group ref={headRef} position={[0, 0.5, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.05, -0.2]} scale={[1.02, 1.02, 0.95]}>
          <sphereGeometry args={[0.55, 32, 32, 0, Math.PI, 0, Math.PI]} />
          <meshStandardMaterial color="#b14aed" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.02, 0.38]} scale={[1, 0.8, 1.05]}>
          <sphereGeometry args={[0.48, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.05} metalness={0.95} />
        </mesh>
        <mesh ref={leftEyeRef} position={[-0.18, 0.06, 0.72]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.18, 0.06, 0.72]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
        {[-0.68, 0.68].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 32]} />
            <meshStandardMaterial color="#475569" roughness={0.15} metalness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.81, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#b14aed" emissive="#b14aed" emissiveIntensity={2.0} toneMapped={false} />
        </mesh>
      </group>

      {/* NECK */}
      <mesh ref={neckRef} position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.16, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* TORSO */}
      <group ref={torsoRef} position={[0, -0.85, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.46, 0.32, 0.95, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.15} />
        </mesh>
        {[-0.52, 0.52].map((x, i) => (
          <mesh key={i} position={[x, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.05, 0.31]} scale={[1, 1.1, 0.5]}>
          <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <MeshTransmissionMaterial backside samples={4} thickness={0.15} chromaticAberration={0.03} anisotropy={0.1} distortion={0.08} distortionScale={0.08} transmission={0.95} roughness={0.05} color="#ffffff" />
        </mesh>
        <mesh ref={coreRef} position={[0, 0.05, 0.16]}>
          <icosahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.05, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.015, 8, 48]} />
          <meshStandardMaterial color="#b14aed" emissive="#b14aed" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>

      {/* LEFT HAND */}
      <group ref={leftHandRef}>
        <mesh><sphereGeometry args={[0.11, 32, 32]} /><meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.15} /></mesh>
        <mesh position={[0, -0.08, 0]}><sphereGeometry args={[0.03, 16, 16]} /><meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} /></mesh>
      </group>

      {/* RIGHT HAND */}
      <group ref={rightHandRef}>
        <mesh><sphereGeometry args={[0.11, 32, 32]} /><meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.15} /></mesh>
        <mesh position={[0, -0.08, 0]}><sphereGeometry args={[0.03, 16, 16]} /><meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} /></mesh>
      </group>

      {/* THRUSTER */}
      <group ref={thrusterRef} position={[0, -1.45, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.001, 0.35, 32]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3.5} transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#b14aed" emissive="#b14aed" emissiveIntensity={2.0} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function OrbitalRing({ radius, color, speed, tiltX = 0, tiltZ = 0 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * speed; });
  return (
    <group ref={ref} rotation={[tiltX, 0, tiltZ]}>
      <line geometry={geo}>
        <lineBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </line>
    </group>
  );
}

function ParticleField({ count = 120 }) {
  const ref = useRef();
  const { positions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.0 + Math.random() * 3.5;
      const phi = Math.acos(2 * Math.random() - 1);
      const th = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return { positions: pos };
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.02;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.03;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#00e5ff" transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function SceneController({ children }) {
  const ref = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  React.useEffect(() => {
    const fn = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);
  useFrame(() => {
    target.current.x += (mouse.current.x * 0.25 - target.current.x) * 0.05;
    target.current.y += (mouse.current.y * 0.25 - target.current.y) * 0.05;
    if (ref.current) {
      ref.current.rotation.y = target.current.x;
      ref.current.rotation.x = -target.current.y;
    }
  });
  return <group ref={ref}>{children}</group>;
}

export default function AIScene3D() {
  return (
    <div className="ai-scene-canvas">
      <Canvas
        style={{ background: 'transparent' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        dpr={[2, 3]}
        shadows
      >
        <PerspectiveCamera makeDefault position={[0, 0, 9.4]} fov={42} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-4, 3, 2]} intensity={1.5} color="#0ea5e9" />
        <pointLight position={[4, -2, 2]} intensity={1.5} color="#7c3aed" />
        <pointLight position={[0, 1, 4]} intensity={0.8} color="#ffffff" />

        <SceneController>
          <group scale={1.95} position={[0, 0.35, 0]}>
            <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.4}>
              <AIRobot />
            </Float>
            <OrbitalRing radius={2.2} color="#00e5ff" speed={0.1}   tiltX={Math.PI * 0.35} tiltZ={0.1}  />
            <OrbitalRing radius={2.35} color="#b14aed" speed={-0.07} tiltX={Math.PI * 0.5}  tiltZ={-0.2} />
            <ParticleField count={150} />
          </group>
        </SceneController>
      </Canvas>

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at center, rgba(14,165,233,0.06) 0%, rgba(124,58,237,0.02) 45%, transparent 70%)',
      }} />
    </div>
  );
}
