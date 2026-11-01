import { useEffect, useRef } from "react";
import * as THREE from "three";
import xrayBrainSrc from "@/assets/xray-brain.png";

export function Skeleton3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ─── Scene setup ─── */
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    /* ─── Lighting — brighter to make the image clearly visible ─── */
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xc0d8ff, 0.8);
    dirLight1.position.set(3, 4, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x9B6AED, 0.5);
    dirLight2.position.set(-4, -1, 4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x3B82F6, 1.0, 15);
    pointLight.position.set(0, 2, 4);
    scene.add(pointLight);

    /* ─── Main group — positioned center-left ─── */
    const mainGroup = new THREE.Group();
    mainGroup.position.set(-1, -0.1, 0);
    scene.add(mainGroup);

    /* ─── Curved panel with X-ray texture ─── */
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(xrayBrainSrc);
    texture.colorSpace = THREE.SRGBColorSpace;

    const arc = Math.PI * 0.5; // ~90° arc for subtle but visible curvature
    const curvedGeo = new THREE.CylinderGeometry(
      5.5, 5.5, 8.5, 80, 1, true, -arc / 2, arc
    );
    // Flip UVs horizontally
    const uvs = curvedGeo.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      uvs.setX(i, 1 - uvs.getX(i));
    }

    const curvedMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      toneMapped: false,
    });

    const curvedMesh = new THREE.Mesh(curvedGeo, curvedMat);
    mainGroup.add(curvedMesh);

    /* ─── Glow ring behind the skeleton ─── */
    const ringGeo = new THREE.RingGeometry(3.8, 4.5, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2563EB,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.z = -1.5;
    mainGroup.add(ringMesh);

    /* ─── Inner glow ring ─── */
    const innerRingGeo = new THREE.RingGeometry(2.5, 3.0, 80);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x7C3AED,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.position.z = -1.0;
    mainGroup.add(innerRingMesh);

    /* ─── Floating particles ─── */
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 4;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 2] = Math.sin(theta) * r * 0.5;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 0.04,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    /* ─── Animation loop ─── */
    let animId: number;
    let lastTime = performance.now();

    function animate() {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;

      // Slow auto-rotation
      curvedMesh.rotation.y += 0.15 * (1 / 60);

      // Glow rings pulse and slowly spin
      const t = now / 1000;
      ringMesh.rotation.z = t * 0.06;
      const pulse = 1 + Math.sin(t * 0.7) * 0.03;
      ringMesh.scale.set(pulse, pulse, 1);

      innerRingMesh.rotation.z = -t * 0.04;
      const iPulse = 1 + Math.sin(t * 1.1) * 0.04;
      innerRingMesh.scale.set(iPulse, iPulse, 1);

      // Particles orbit
      particles.rotation.y += 0.03 * (1 / 60);

      // Gentle floating bob
      mainGroup.position.y = -0.1 + Math.sin(t * 1.2) * 0.1;

      renderer.render(scene, camera);
    }

    animate();

    /* ─── Resize handler ─── */
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onResize);

    /* ─── Cleanup ─── */
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      curvedGeo.dispose();
      curvedMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 select-none"
      style={{ zIndex: 0 }}
    />
  );
}
