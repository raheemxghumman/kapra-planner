import { Float } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Mesh, PlaneGeometry } from 'three';
import { DoubleSide, MathUtils } from 'three';
import { createPrintTexture } from './printTexture';

const WIDTH = 2.6;
const HEIGHT = 3.6;
const SEGMENTS_X = 70;
const SEGMENTS_Y = 100;

/**
 * A piece of cloth that ripples like fabric in a breeze.
 * Every frame we move each vertex of a finely divided plane along its depth (z) using
 * a few sine waves, then recompute normals so the light follows the folds.
 */
function Cloth() {
  const meshRef = useRef<Mesh>(null);
  const geometryRef = useRef<PlaneGeometry>(null);

  const printTexture = useMemo(() => createPrintTexture(), []);
  // Free the GPU memory used by the texture when the scene unmounts.
  useEffect(() => () => printTexture.dispose(), [printTexture]);

  // Remember the flat starting positions once; waves are always added to these.
  const basePositions = useMemo(() => {
    const plane = new Float32Array((SEGMENTS_X + 1) * (SEGMENTS_Y + 1) * 3);
    let i = 0;
    for (let row = 0; row <= SEGMENTS_Y; row++) {
      for (let col = 0; col <= SEGMENTS_X; col++) {
        plane[i++] = (col / SEGMENTS_X - 0.5) * WIDTH;
        plane[i++] = (0.5 - row / SEGMENTS_Y) * HEIGHT;
        plane[i++] = 0;
      }
    }
    return plane;
  }, []);

  useFrame(({ clock, pointer }) => {
    const geometry = geometryRef.current;
    const mesh = meshRef.current;
    if (!geometry || !mesh) return;

    const time = clock.getElapsedTime();
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = basePositions[i];
      const y = basePositions[i + 1];
      // Folds grow towards the bottom edge, as if the cloth hangs from the top.
      const hang = (HEIGHT / 2 - y) / HEIGHT;
      positions[i + 2] =
        // Long vertical folds, like a draped dupatta.
        Math.sin(x * 3.4 + time * 0.9) * 0.22 * (0.35 + hang) +
        // Slow breeze across the whole cloth.
        Math.sin(y * 1.5 + time * 0.7) * 0.1 +
        // Small ripples at the hem.
        Math.cos((x + y) * 5.2 + time * 1.8) * 0.04 * hang;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Turn gently towards the mouse.
    mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, pointer.x * 0.35 - 0.25, 0.05);
    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, -pointer.y * 0.15, 0.05);
  });

  return (
    <mesh ref={meshRef} rotation={[0, -0.25, 0.04]}>
      <planeGeometry ref={geometryRef} args={[WIDTH, HEIGHT, SEGMENTS_X, SEGMENTS_Y]} />
      {/* "sheen" is the soft glow that real fabric has at grazing angles. */}
      <meshPhysicalMaterial
        map={printTexture}
        sheen={0.8}
        sheenRoughness={0.4}
        sheenColor="#fff4e6"
        roughness={0.75}
        side={DoubleSide}
      />
    </mesh>
  );
}

export default function FabricScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 2]} aria-hidden>
      <hemisphereLight args={['#fff8ef', '#4f5a3a', 0.9]} />
      {/* Warm key light from the front right. */}
      <directionalLight position={[3, 4, 5]} intensity={2.4} color="#fff1df" />
      {/* Rim light from behind so the edges and folds stand out. */}
      <directionalLight position={[-3, 2, -4]} intensity={1.6} color="#e8c9c0" />
      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.6}>
        <Cloth />
      </Float>
    </Canvas>
  );
}
