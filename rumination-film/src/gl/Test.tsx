import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {EffectComposer, Bloom, Vignette} from '@react-three/postprocessing';

export const GLTest: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{position: [0, 2.2, 7], fov: 38}} style={{background: '#050608'}}>
      <fog attach="fog" args={['#050608', 6, 16]} />
      <ambientLight intensity={0.05} />
      <spotLight position={[0, 7, 1]} angle={0.42} penumbra={0.6} intensity={180} castShadow shadow-mapSize={[2048, 2048]} color="#FFE7C4" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.6} metalness={0.1} />
      </mesh>
      {[-1.6, 0, 1.6].map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, f * 0.01 + i, 0]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <capsuleGeometry args={[0.22, 1.1, 8, 24]} />
            <meshStandardMaterial color="#6b5a4a" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[0, 2.0, 0]} castShadow>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color="#6b5a4a" roughness={0.35} metalness={0.2} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 6.8, 1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={[6, 5, 4]} toneMapped={false} />
      </mesh>
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.6} mipmapBlur />
        <Vignette darkness={0.7} />
      </EffectComposer>
    </ThreeCanvas>
  );
};
