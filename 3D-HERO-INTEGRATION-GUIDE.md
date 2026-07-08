# 3D Hero Animation Integration Guide — Seevora

## 🎯 Overview

This guide explains how to integrate your **premium 3D organic blob animation** (copper/amber liquid glass) into the hero section. Currently, a CSS fallback is in place for preview. Follow the options below to replace it with your actual 3D render.

---

## 📐 Design Specifications (As Per Brief)

### Visual Design
- **Object**: Abstract organic blob/torus — smooth, liquid metal folded into a loop
- **Material**: Glossy glass/chrome hybrid with:
  - High specular reflection
  - Subtle transparency/refraction
  - Soft internal glow
  - Frosted diffusion at edges

### Color Palette
```css
Warm Copper/Amber:
- Primary: #E3A857 (copper)
- Mid: #C68A5A (amber)
- Deep: #8A5A34 (bronze)

Cool Fill:
- Navy/Charcoal: #141920

Background:
- Near-black void: #0a0d12
```

### Animation
- **Rotation**: 1-2 axes, 8-15 second seamless loop
- **Float**: Gentle Y-axis bob (small oscillation)
- **Camera**: Very slight drift/parallax
- **Style**: Calm, premium, enterprise feel (not flashy)

### Composition
- **Position**: Centered or offset to one side (right side in our layout)
- **Text overlay**: Soft dark gradient scrim for legibility
- **Format**: Looping video (.mp4/.webm) or live embed (Spline/Three.js)

---

## 🛠️ Integration Options

### Option 1: Spline Embed (⭐ Recommended - Fastest)

**File Location**: `src/components/landing-page/HomePage.jsx`  
**Line**: ~272 (inside `.hero-3d-stage`)

Replace the `.premium-3d-blob` div with:

```jsx
<iframe 
  src='https://my.spline.design/YOUR-SCENE-ID' 
  frameBorder='0' 
  width='100%' 
  height='100%'
  className="spline-embed"
  style={{ 
    position: 'absolute', 
    top: 0, 
    left: 0,
    border: 'none'
  }}
  title="3D Blob Animation"
/>
```

**Spline Export Settings**:
- Background: Transparent or #0a0d12
- Camera: Fixed or mouse-reactive (subtle)
- Quality: High (for smooth rendering)
- Export as: Web embed URL

**CSS Addition** (add to `src/index.css`):
```css
.spline-embed {
  pointer-events: auto;
  z-index: 2;
}
```

---

### Option 2: Video Loop (.mp4 / .webm)

**File Structure**:
```
public/
  assets/
    3d-blob-animation.mp4
    3d-blob-animation.webm  (optional, for better compression)
```

**Code Integration**:

Replace the `.premium-3d-blob` div with:

```jsx
<video 
  autoPlay 
  loop 
  muted 
  playsInline
  className="hero-3d-video"
>
  <source src="/assets/3d-blob-animation.mp4" type="video/mp4" />
  <source src="/assets/3d-blob-animation.webm" type="video/webm" />
  Your browser does not support the video tag.
</video>
```

**CSS Addition**:
```css
.hero-3d-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  z-index: 2;
}
```

**Blender Render Settings** (if rendering from Blender):
- Resolution: 1920x1080 (Full HD) or 2560x1440 (2K)
- FPS: 30 (smooth, web-optimized)
- Duration: 8-15 seconds
- Output: H.264 (MP4) with transparency or dark background
- Codec: High quality, ~5-10 MB file size

---

### Option 3: Three.js Component (Advanced - Interactive)

**Step 1**: Install Three.js
```bash
npm install three @react-three/fiber @react-three/drei
```

**Step 2**: Create Component

**File**: `src/components/ThreeDBlob.jsx`

```jsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, OrbitControls } from '@react-three/drei';

function BlobMesh() {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y = time * 0.1;
    meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
    meshRef.current.position.y = Math.sin(time * 0.5) * 0.3;
  });

  return (
    <mesh ref={meshRef} scale={2.5}>
      <torusGeometry args={[1, 0.4, 32, 64]} />
      <MeshDistortMaterial
        color="#E3A857"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.5}
        distort={0.3}
        speed={2}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

export default function ThreeDBlob() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#E3A857" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#141920" />
      <BlobMesh />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
```

**Step 3**: Integrate into Hero

**File**: `src/components/landing-page/HomePage.jsx`

Add import:
```jsx
import ThreeDBlob from '../ThreeDBlob';
```

Replace `.premium-3d-blob` div with:
```jsx
<ThreeDBlob />
```

---

## 📊 Current CSS Fallback

The current implementation uses **pure CSS 3D transforms** to create a preview blob with:
- ✅ Organic morphing shapes
- ✅ Copper/amber gradient colors
- ✅ Glassmorphic layering
- ✅ Rim lighting effects
- ✅ Floating animation
- ✅ Ambient particle system

This serves as a **visual placeholder** until your actual 3D render is ready.

---

## 🎨 Blender/Spline Creation Tips

### Blender Setup (if creating from scratch):

1. **Create Blob Shape**:
   - Add Torus (Shift+A → Mesh → Torus)
   - Add Subdivision Surface modifier (3-4 levels)
   - Add Simple Deform modifier (twist/bend slightly)
   - Add Displace modifier with noise texture for organic look

2. **Material (Cycles or Eevee)**:
   - Principled BSDF shader
   - Metallic: 0.9
   - Roughness: 0.15-0.25
   - Transmission: 0.2 (for glass effect)
   - IOR: 1.45
   - Add fresnel effect for rim lighting

3. **Lighting**:
   - Key light: Warm (color: #E3A857) from top-right
   - Fill light: Cool (color: #141920) from bottom-left
   - HDRI environment map for reflections

4. **Animation**:
   - Keyframe rotation on Y-axis (360° over 12 seconds)
   - Add gentle rotation on X-axis (±5° wiggle)
   - Keyframe Z-position for floating bob (±0.5 units)

5. **Render**:
   - Background: Transparent or solid #0a0d12
   - Output: Animation (.mp4, H.264, 1920x1080, 30fps)

### Spline Setup:

1. **Shape**: Use blob/organic preset
2. **Material**: Glass with high metalness
3. **Color**: Apply copper gradient (#E3A857 → #8A5A34)
4. **Lights**: Add rim light + fill light (as per brief)
5. **Animation**: Set rotation + float behavior
6. **Export**: Get embed URL or export video

---

## ✅ Testing Checklist

Before going live, verify:

- [ ] Animation loops seamlessly (no visible jump)
- [ ] Blob is centered/positioned correctly
- [ ] Text remains readable over animation
- [ ] Performance is smooth (60fps on modern browsers)
- [ ] Mobile responsive (consider disabling on <768px if heavy)
- [ ] Reduced motion preference respected
- [ ] Video/embed loads quickly (<5 MB if video)

---

## 🚀 Quick Start Commands

**Currently Active**:
```bash
# Dev server running on http://localhost:5173
npm run dev
```

**After Integration**:
```bash
# Refresh browser to see changes
# No rebuild needed for HTML/CSS changes
```

---

## 📞 Support

**Current Status**: CSS fallback active  
**Next Step**: Choose integration option above  
**Location**: `src/components/landing-page/HomePage.jsx` (line ~272)  
**CSS**: `src/index.css` (search for "PREMIUM 3D HERO")

---

**Pro Tip**: Start with **Option 1 (Spline)** for fastest results. You can create the animation in Spline's web editor in ~30 minutes and get an embed URL immediately.
