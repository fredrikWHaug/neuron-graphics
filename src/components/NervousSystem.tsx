import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const NervousSystem: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a3d5c);
    scene.fog = new THREE.Fog(0x1a3d5c, 10, 100);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 15);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting - soft blue ambient lighting
    const ambientLight = new THREE.AmbientLight(0x4da6ff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x87ceeb, 1.2);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const backLight = new THREE.DirectionalLight(0x00bfff, 0.8);
    backLight.position.set(-10, -5, -10);
    scene.add(backLight);

    // Create the main neuron material - highly translucent blue
    const neuronMaterial = new THREE.MeshPhongMaterial({
      color: 0x4da6ff,
      transparent: true,
      opacity: 0.4,
      shininess: 100,
      emissive: 0x1a4d7a,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });

    // Create cell body (soma) - irregular organic shape
    const somaGeometry = new THREE.SphereGeometry(3, 32, 32);
    const somaPositions = somaGeometry.attributes.position.array;
    
    // Add organic irregularities to the soma
    for (let i = 0; i < somaPositions.length; i += 3) {
      const vertex = new THREE.Vector3(
        somaPositions[i],
        somaPositions[i + 1],
        somaPositions[i + 2]
      );
      
      // Add noise for organic shape
      const noise = (Math.random() - 0.5) * 0.1;
      const distance = vertex.length();
      vertex.normalize().multiplyScalar(distance * (1 + noise));
      
      somaPositions[i] = vertex.x;
      somaPositions[i + 1] = vertex.y;
      somaPositions[i + 2] = vertex.z;
    }
    
    somaGeometry.attributes.position.needsUpdate = true;
    somaGeometry.computeVertexNormals();

    const soma = new THREE.Mesh(somaGeometry, neuronMaterial);
    soma.position.set(0, 0, 0);
    soma.castShadow = true;
    soma.receiveShadow = true;
    scene.add(soma);

    // Create dendrites - multiple branching processes
    const createDendrite = (startPos: THREE.Vector3, direction: THREE.Vector3, length: number, thickness: number, branches: number = 0) => {
      const points: THREE.Vector3[] = [];
      const segments = 20;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const currentPos = startPos.clone();
        
        // Add curvature and organic flow
        const curve = new THREE.Vector3(
          Math.sin(t * Math.PI * 2) * 2,
          Math.cos(t * Math.PI * 1.5) * 1.5,
          Math.sin(t * Math.PI * 3) * 1
        );
        
        currentPos.add(direction.clone().multiplyScalar(length * t));
        currentPos.add(curve.multiplyScalar(t * 0.5));
        points.push(currentPos);
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(
        curve, 
        segments, 
        thickness * (1 - 0.7 * (points.length / segments)), 
        8, 
        false
      );

      const dendrite = new THREE.Mesh(tubeGeometry, neuronMaterial);
      dendrite.castShadow = true;
      dendrite.receiveShadow = true;
      scene.add(dendrite);

      // Add branches
      if (branches > 0 && length > 5) {
        const branchPoint = points[Math.floor(points.length * 0.7)];
        const branchDir1 = direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4);
        const branchDir2 = direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 4);
        
        createDendrite(branchPoint, branchDir1, length * 0.6, thickness * 0.7, branches - 1);
        createDendrite(branchPoint, branchDir2, length * 0.6, thickness * 0.7, branches - 1);
      }
    };

    // Create main dendrites extending from soma
    const dendriteCount = 6;
    for (let i = 0; i < dendriteCount; i++) {
      const angle = (i / dendriteCount) * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
      
      const direction = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation),
        Math.sin(angle) * Math.cos(elevation),
        Math.sin(elevation)
      );
      
      const startPos = soma.position.clone().add(direction.clone().multiplyScalar(3.2));
      const length = 8 + Math.random() * 6;
      const thickness = 0.3 + Math.random() * 0.2;
      
      createDendrite(startPos, direction, length, thickness, 2);
    }

    // Create one main axon
    const axonDirection = new THREE.Vector3(1, -0.3, 0.2).normalize();
    const axonStart = soma.position.clone().add(axonDirection.clone().multiplyScalar(3.2));
    
    const axonPoints: THREE.Vector3[] = [];
    const axonSegments = 30;
    
    for (let i = 0; i <= axonSegments; i++) {
      const t = i / axonSegments;
      const pos = axonStart.clone();
      
      // Long flowing axon with gentle curves
      const flow = new THREE.Vector3(
        Math.sin(t * Math.PI) * 1,
        Math.cos(t * Math.PI * 0.5) * 0.5,
        Math.sin(t * Math.PI * 0.3) * 0.3
      );
      
      pos.add(axonDirection.clone().multiplyScalar(20 * t));
      pos.add(flow.multiplyScalar(t));
      axonPoints.push(pos);
    }

    const axonCurve = new THREE.CatmullRomCurve3(axonPoints);
    const axonGeometry = new THREE.TubeGeometry(axonCurve, axonSegments, 0.2, 8, false);
    const axon = new THREE.Mesh(axonGeometry, neuronMaterial);
    axon.castShadow = true;
    axon.receiveShadow = true;
    scene.add(axon);

    // Add some floating particles for atmosphere
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < 50; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );
      scene.add(particle);
    }

    // Mouse controls
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z += event.deltaY * 0.01;
      camera.position.z = Math.max(5, Math.min(50, camera.position.z));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth camera rotation
      camera.position.x = mouseX * 10;
      camera.position.y = mouseY * 10;
      camera.lookAt(0, 0, 0);

      // Gentle pulsing glow
      const time = Date.now() * 0.001;
      neuronMaterial.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};