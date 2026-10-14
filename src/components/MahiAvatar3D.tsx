import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SessionState } from '../services/liveSession';

interface MahiAvatar3DProps {
  state: SessionState;
  userVolume: number;
  mahiVolume: number;
}

export const MahiAvatar3D: React.FC<MahiAvatar3DProps> = ({ state, userVolume, mahiVolume }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff2d78, 3, 10);
    pointLight1.position.set(2, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 3, 10);
    pointLight2.position.set(-2, -1, 2);
    scene.add(pointLight2);

    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // Head Base (Stylized Holographic Cyberpunk Head / Bust)
    const skinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfbcfe8,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.2,
      ior: 1.4,
      transparent: true,
      opacity: 0.9,
    });

    const headGeo = new THREE.SphereGeometry(0.9, 32, 32);
    headGeo.scale(1, 1.25, 1.1);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headGroup.add(headMesh);

    // Hair Group (Procedural cyberpunk hair strands & bangs)
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0xdb2777,
      roughness: 0.2,
      metalness: 0.8,
    });

    const hairGroup = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const strandGeo = new THREE.CylinderGeometry(0.04, 0.12, 1.6, 8);
      const strand = new THREE.Mesh(strandGeo, hairMaterial);
      const angle = (i / 24) * Math.PI * 2;
      const radius = 0.82;
      strand.position.set(Math.cos(angle) * radius * 0.7, 0.4 + Math.sin(i) * 0.1, Math.sin(angle) * radius * 0.7 - 0.1);
      strand.rotation.z = (Math.random() - 0.5) * 0.5;
      strand.rotation.x = 0.2 + (Math.random() - 0.5) * 0.3;
      hairGroup.add(strand);
    }
    headGroup.add(hairGroup);

    // Eyes
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x05050c });

    const createEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), eyeWhiteMat);
      white.scale.set(1, 0.6, 0.6);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), irisMat);
      iris.position.set(0, 0, 0.12);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), pupilMat);
      pupil.position.set(0, 0, 0.16);

      eyeGroup.add(white, iris, pupil);
      eyeGroup.position.set(x, 0.2, 0.78);
      return eyeGroup;
    };

    const leftEye = createEye(-0.32);
    const rightEye = createEye(0.32);
    headGroup.add(leftEye, rightEye);

    // Mouth (Lip-sync morphing mesh)
    const mouthGeo = new THREE.BoxGeometry(0.35, 0.08, 0.1);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.4 });
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, -0.35, 0.85);
    headGroup.add(mouthMesh);

    // Holographic Orbit Rings around Head
    const ringGeo = new THREE.TorusGeometry(1.5, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.5 }));
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Floating gentle hover
      headGroup.position.y = Math.sin(time * 2) * 0.08;
      headGroup.rotation.y = Math.sin(time * 0.8) * 0.15;
      headGroup.rotation.z = Math.cos(time * 0.6) * 0.03;

      // Orbit rings rotation
      ring1.rotation.z = time * 0.5;
      ring2.rotation.x = time * -0.4;

      // Blinking simulation
      const blinkCycle = Math.sin(time * 3);
      if (blinkCycle > 0.95) {
        leftEye.scale.y = 0.1;
        rightEye.scale.y = 0.1;
      } else {
        leftEye.scale.y = 1;
        rightEye.scale.y = 1;
      }

      // Lip-sync & jaw movement responding to Mahi's voice volume
      if (state === 'speaking' && mahiVolume > 0) {
        const openness = Math.min(1, mahiVolume * 3);
        mouthMesh.scale.y = 1 + openness * 3.5;
        mouthMesh.scale.x = 1 + openness * 0.5;
        mouthMesh.position.y = -0.35 - openness * 0.05;
      } else if (state === 'listening' && userVolume > 0) {
        // Subtle empathetic nod / mouth curve when listening
        mouthMesh.scale.y = 1 + userVolume * 1.5;
        mouthMesh.scale.x = 1;
        mouthMesh.position.y = -0.35;
      } else {
        mouthMesh.scale.set(1, 1, 1);
        mouthMesh.position.y = -0.35;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [state, mahiVolume, userVolume]);

  return (
    <div
      ref={containerRef}
      className="w-full h-72 md:h-96 relative flex items-center justify-center pointer-events-none"
    />
  );
};


