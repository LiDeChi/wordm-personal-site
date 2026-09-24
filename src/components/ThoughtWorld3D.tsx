import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ThoughtChoice } from "./ThoughtInteraction";

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  parent.add(item);
  return item;
}

export function ThoughtWorld3D({ choice }: { choice: ThoughtChoice }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const choiceRef = useRef(choice);
  useEffect(() => { choiceRef.current = choice; }, [choice]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 4.3, 11.5);
    camera.lookAt(0, 1.5, 0);
    scene.add(new THREE.HemisphereLight(0xffefd1, 0x294c44, 2.3));
    const sun = new THREE.DirectionalLight(0xffd9a0, 3.2);
    sun.position.set(-3, 7, 5);
    scene.add(sun);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x394c3f, roughness: 1 });
    const stone = new THREE.MeshStandardMaterial({ color: 0xb7aa83, roughness: 1 });
    const stoneDark = new THREE.MeshStandardMaterial({ color: 0x716b57, roughness: 1 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x304b43, roughness: 0.85, flatShading: true });
    const robe = new THREE.MeshStandardMaterial({ color: 0x29423b, roughness: 0.9, flatShading: true });
    const skin = new THREE.MeshStandardMaterial({ color: 0xc9aa7c, roughness: 1 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xf6d697, emissive: 0xa76d31, emissiveIntensity: 0.6, roughness: 0.4 });
    const mutedGold = new THREE.MeshBasicMaterial({ color: 0xf0d7a8, transparent: true, opacity: 0.58 });
    mesh(new THREE.CylinderGeometry(5.7, 6.5, 0.45, 48), groundMaterial, scene, 0, -0.35, 0);
    const path = mesh(new THREE.PlaneGeometry(2.2, 6.6), new THREE.MeshStandardMaterial({ color: 0x91866d, roughness: 1, transparent: true, opacity: 0.65 }), scene, 0, -0.1, -0.9);
    path.rotation.x = -Math.PI / 2;
    // A small court gate reads as a destination rather than a historical reconstruction.
    const gate = new THREE.Group();
    gate.position.set(0, 0, -3.1);
    scene.add(gate);
    for (const x of [-1.5, 1.5]) {
      mesh(new THREE.BoxGeometry(0.48, 2.8, 0.5), stone, gate, x, 1.3, 0);
      mesh(new THREE.BoxGeometry(0.72, 0.24, 0.72), stoneDark, gate, x, 2.8, 0);
    }
    mesh(new THREE.BoxGeometry(4.2, 0.42, 0.8), stone, gate, 0, 2.7, 0);
    const gateRoof = mesh(new THREE.ConeGeometry(2.8, 0.82, 4), roof, gate, 0, 3.23, 0);
    gateRoof.rotation.y = Math.PI / 4;
    const gateGlow = mesh(new THREE.PlaneGeometry(2.45, 2.25), new THREE.MeshBasicMaterial({ color: 0xe7b977, transparent: true, opacity: 0, depthWrite: false }), gate, 0, 1.15, -0.08);
    // The figure moves of his own accord after the player has only spoken.
    const person = new THREE.Group();
    person.position.set(0, 0, 1.25);
    scene.add(person);
    mesh(new THREE.CylinderGeometry(0.34, 0.65, 1.62, 7), robe, person, 0, 0.85, 0);
    mesh(new THREE.SphereGeometry(0.31, 16, 12), skin, person, 0, 1.83, 0);
    mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.15, 8), roof, person, 0, 2.13, 0);
    mesh(new THREE.BoxGeometry(0.85, 0.2, 0.28), robe, person, 0, 1.3, 0.18);
    const orb = mesh(new THREE.SphereGeometry(0.2, 18, 12), gold, scene, 1.45, 2.35, 1.25);
    const ring = mesh(new THREE.TorusGeometry(0.4, 0.014, 5, 44), mutedGold, scene, 1.45, 2.35, 1.25);
    ring.rotation.y = 0.5;
    const halo = mesh(new THREE.SphereGeometry(0.47, 14, 10), new THREE.MeshBasicMaterial({ color: 0xd99d58, transparent: true, opacity: 0.08, depthWrite: false }), scene, 1.45, 2.35, 1.25);
    const beam = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), mutedGold, scene);
    let target = new THREE.Vector3(1.45, 2.35, 1.25);
    let last = performance.now();
    let elapsed = 0;
    let frame = 0;
    let visible = true;
    let pointerX = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      if (!host) return;
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.position.z = width < 580 ? 13.5 : 11.5;
      camera.position.y = width < 580 ? 4.9 : 4.3;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    }
    function onPointer(event: PointerEvent) {
      if (!host) return;
      pointerX = (event.clientX - host.getBoundingClientRect().left) / host.clientWidth - 0.5;
    }
    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      if (!visible) { last = now; return; }
      elapsed += Math.min(now - last, 60) / 1000;
      last = now;
      const state = choiceRef.current;
      target = state === "speak" ? new THREE.Vector3(0.55, 2.04, person.position.z) : new THREE.Vector3(1.45, 2.35, 1.25);
      const rate = reducedMotion ? 1 : 0.065;
      orb.position.lerp(target, rate);
      ring.position.copy(orb.position);
      halo.position.copy(orb.position);
      const personX = state === "silent" ? -1.05 : 0;
      const personZ = state === "speak" ? -1.75 : state === "silent" ? 1.65 : 1.25;
      person.position.x += (personX - person.position.x) * (reducedMotion ? 1 : 0.035);
      person.position.z += (personZ - person.position.z) * (reducedMotion ? 1 : 0.035);
      (gateGlow.material as THREE.MeshBasicMaterial).opacity += ((state === "speak" ? 0.48 : 0) - (gateGlow.material as THREE.MeshBasicMaterial).opacity) * 0.04;
      orb.scale.setScalar(1 + Math.sin(elapsed * 2.5) * (reducedMotion ? 0 : 0.07));
      halo.scale.setScalar(1 + Math.sin(elapsed * 1.5) * (reducedMotion ? 0 : 0.12));
      ring.rotation.y += reducedMotion ? 0 : 0.004;
      beam.visible = state === "speak";
      if (beam.visible) {
        const from = orb.position;
        const to = new THREE.Vector3(0, 1.85, person.position.z);
        beam.position.copy(from).add(to).multiplyScalar(0.5);
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
        beam.scale.y = from.distanceTo(to);
      }
      camera.position.x += ((reducedMotion ? 0 : pointerX * 0.35) - camera.position.x) * 0.025;
      camera.lookAt(0, 1.45, 0);
      renderer.render(scene, camera);
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 });
    observer.observe(host);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(host);
    host.addEventListener("pointermove", onPointer);
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointer);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="thought-world-3d" />;
}
