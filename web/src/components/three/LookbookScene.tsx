import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState } from 'react';
import { DoubleSide, MathUtils, PlaneGeometry, SRGBColorSpace, type Group, type Mesh } from 'three';
import { imageUrl } from '../../utils/format';

const CARD_WIDTH = 1.5;
const CARD_HEIGHT = 2;
const RADIUS = 3.3;

/**
 * A plane bent slightly around its vertical axis, like a fabric swatch hanging on a rail.
 * Built once and shared by every card.
 */
function useBentGeometry(): PlaneGeometry {
  return useMemo(() => {
    const geometry = new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 32, 1);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      positions.setZ(i, -x * x * 0.22);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

interface CardProps {
  url: string;
  angle: number;
  index: number;
  geometry: PlaneGeometry;
}

function Card({ url, angle, index, geometry }: CardProps) {
  // Configure the texture in the loader callback (not after the hook returns it).
  const texture = useTexture(imageUrl(url, 520), (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = 8;
  });
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const baseY = (index % 2 === 0 ? 0.18 : -0.18);

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return;
    // Each card bobs on its own rhythm so the group never moves in lockstep.
    mesh.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.55 + index * 1.7) * 0.07;
    const target = hovered ? 1.07 : 1;
    const scale = MathUtils.damp(mesh.current.scale.x, target, 6, delta);
    mesh.current.scale.setScalar(scale);
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      position={[Math.sin(angle) * RADIUS, baseY, Math.cos(angle) * RADIUS]}
      rotation={[0, angle, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.92} metalness={0} />
    </mesh>
  );
}

function Carousel({ images }: { images: string[] }) {
  const group = useRef<Group>(null);
  const geometry = useBentGeometry();

  useFrame(({ pointer }, delta) => {
    const carousel = group.current;
    if (!carousel) return;
    // Slow constant turn, a little faster while the page is scrolled.
    const scrolled = Math.min(window.scrollY / window.innerHeight, 1);
    carousel.rotation.y += delta * (0.07 + scrolled * 0.25);
    // Lean towards the mouse and tip back as the hero scrolls away.
    carousel.rotation.x = MathUtils.damp(carousel.rotation.x, -pointer.y * 0.08 + scrolled * 0.25, 4, delta);
    carousel.position.x = MathUtils.damp(carousel.position.x, pointer.x * 0.25, 4, delta);
  });

  return (
    <group ref={group}>
      {images.map((url, index) => (
        <Card
          key={url}
          url={url}
          index={index}
          geometry={geometry}
          angle={(index / images.length) * Math.PI * 2}
        />
      ))}
    </group>
  );
}

/**
 * The landing hero's 3D lookbook: real product photos on curved cards turning slowly in a
 * ring. Fog in the paper colour softens the cards at the back, giving depth.
 */
export default function LookbookScene({ images }: { images: string[] }) {
  return (
    <Canvas camera={{ position: [0, 0.4, 8.6], fov: 34 }} dpr={[1, 2]} aria-hidden>
      <fog attach="fog" args={['#ece7de', 8, 13.5]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 4, 6]} intensity={1.4} color="#fff3e4" />
      <Suspense fallback={null}>
        <Carousel images={images} />
      </Suspense>
    </Canvas>
  );
}
