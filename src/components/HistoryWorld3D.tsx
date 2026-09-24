import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Lang } from "../i18n/lang";

type Props = {
  years: number[];
  index: number;
  related: number[];
  lang: Lang;
  onSelect: (index: number) => void;
};

type WorldControl = {
  select: (index: number, related: number[]) => void;
  zoomBy: (amount: number) => void;
  dispose: () => void;
};

const POSITIONS = [
  [-8.1, -0.55], [-5.4, 0.8], [-2.7, -0.3], [0, 0.95],
  [2.7, -0.55], [5.4, 0.65], [8.1, -0.25],
];

function heightAt(x: number, z: number) {
  const ridge = POSITIONS.reduce((height, [siteX, siteZ]) => {
    const distance = ((x - siteX) ** 2 / 5.5) + ((z - siteZ) ** 2 / 2.2);
    return height + Math.exp(-distance) * 0.48;
  }, 0);
  return -0.28 + ridge + Math.sin(x * 0.53 + z * 1.15) * 0.15 + Math.cos(z * 1.7) * 0.1;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

export function HistoryWorld3D({ years, index, related, lang, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const controlRef = useRef<WorldControl | null>(null);
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { controlRef.current?.select(index, related); }, [index, related]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const container: HTMLDivElement = host;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.84;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x18342f, 0.032);
    const camera = new THREE.OrthographicCamera(-11, 11, 5, -5, 0.1, 100);
    const ambient = new THREE.HemisphereLight(0xf5e8c8, 0x294940, 1.25);
    const sun = new THREE.DirectionalLight(0xffdb9d, 1.85);
    sun.position.set(-5, 12, 7);
    scene.add(ambient, sun);

    const terrainGeometry = new THREE.PlaneGeometry(23, 12, 92, 48);
    terrainGeometry.rotateX(-Math.PI / 2);
    const terrainColors: number[] = [];
    const terrainColor = new THREE.Color();
    const terrainPosition = terrainGeometry.attributes.position;
    for (let i = 0; i < terrainPosition.count; i += 1) {
      const x = terrainPosition.getX(i);
      const z = terrainPosition.getZ(i);
      const height = heightAt(x, z);
      terrainPosition.setY(i, height);
      terrainColor.set(0x294438).lerp(new THREE.Color(0x51684f), Math.max(0, Math.min(1, height * 0.65 + 0.25)));
      terrainColors.push(terrainColor.r, terrainColor.g, terrainColor.b);
    }
    terrainGeometry.setAttribute("color", new THREE.Float32BufferAttribute(terrainColors, 3));
    terrainGeometry.computeVertexNormals();
    const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.22, depthWrite: false }));
    scene.add(terrain);

    const trailPoints = POSITIONS.map(([x, z]) => new THREE.Vector3(x, heightAt(x, z) + 0.15, z));
    const trailCurve = new THREE.CatmullRomCurve3(trailPoints);
    const trail = new THREE.Mesh(
      new THREE.TubeGeometry(trailCurve, 100, 0.019, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xc8a263 }),
    );
    scene.add(trail);

    const nodes: THREE.Group[] = [];
    const stoneMaterials: THREE.MeshStandardMaterial[] = [];
    const rings: THREE.Mesh[] = [];
    POSITIONS.forEach(([x, z], i) => {
      const root = new THREE.Group();
      root.userData.siteIndex = i;
      root.position.set(x, heightAt(x, z), z);
      const stone = new THREE.MeshStandardMaterial({ color: 0xb9b69d, roughness: 0.88, metalness: 0.05, emissive: 0x6c5326, emissiveIntensity: 0 });
      const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x334b43, roughness: 0.78, metalness: 0.12 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.88, 0.19, 8), stone);
      base.position.y = 0.1;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.08, 0.32), stone);
      shaft.position.y = 0.76;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.73, 0.48, 4), roofMaterial);
      cap.rotation.y = Math.PI / 4;
      cap.position.y = 1.5;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.025, 5, 40),
        new THREE.MeshBasicMaterial({ color: 0xd2ad70, transparent: true, opacity: 0.34 }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      root.add(base, shaft, cap, ring);
      scene.add(root);
      nodes.push(root);
      stoneMaterials.push(stone);
      rings.push(ring);

      // Small groves give the map a human scale without claiming a literal reconstruction.
      for (let treeIndex = 0; treeIndex < 3; treeIndex += 1) {
        const offsetX = Math.sin(i * 11 + treeIndex * 4) * 1.25;
        const offsetZ = Math.cos(i * 7 + treeIndex * 5) * 1.35;
        const treeX = x + offsetX;
        const treeZ = z + offsetZ;
        const tree = new THREE.Mesh(
          new THREE.ConeGeometry(0.18 + treeIndex * 0.04, 0.65 + treeIndex * 0.12, 5),
          new THREE.MeshStandardMaterial({ color: 0x1c4236, roughness: 1, flatShading: true }),
        );
        tree.position.set(treeX, heightAt(treeX, treeZ) + 0.36, treeZ);
        scene.add(tree);
      }
    });

    const clues = new THREE.Group();
    scene.add(clues);
    let currentIndex = index;
    let currentRelated = related;
    let width = 1;
    let height = 1;
    let isVisible = true;
    let azimuth = 0.12;
    let elevation = 0.78;
    let zoom = 1;
    let drag: { x: number; y: number; azimuth: number; elevation: number } | null = null;
    const target = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const labelOffset = new THREE.Vector3();
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let appliedZoom = 0;

    function select(nextIndex: number, nextRelated: number[]) {
      currentIndex = nextIndex;
      currentRelated = nextRelated;
      nodes.forEach((node, nodeIndex) => { node.scale.setScalar(nodeIndex === nextIndex ? 0.71 : 0.56); });
      stoneMaterials.forEach((material, nodeIndex) => { material.emissiveIntensity = nodeIndex === nextIndex ? 0.7 : 0; });
      rings.forEach((ring, nodeIndex) => {
        (ring.material as THREE.MeshBasicMaterial).opacity = nodeIndex === nextIndex ? 0.96 : 0.34;
        ring.scale.setScalar(nodeIndex === nextIndex ? 1.18 : 1);
      });
      clues.children.forEach(disposeObject);
      clues.clear();
      nextRelated.forEach((year) => {
        const earlierIndex = years.indexOf(year);
        if (earlierIndex < 0) return;
        const [startX, startZ] = POSITIONS[earlierIndex];
        const [endX, endZ] = POSITIONS[nextIndex];
        const start = new THREE.Vector3(startX, heightAt(startX, startZ) + 1.75, startZ);
        const end = new THREE.Vector3(endX, heightAt(endX, endZ) + 1.75, endZ);
        const middle = start.clone().add(end).multiplyScalar(0.5);
        middle.y += 1.15 + Math.abs(endX - startX) * 0.12;
        const arc = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, middle, end), 32, 0.017, 5, false),
          new THREE.MeshBasicMaterial({ color: 0xf3d69a, transparent: true, opacity: 0.72 }),
        );
        clues.add(arc);
      });
    }

    function resize() {
      width = Math.max(container.clientWidth, 1);
      height = Math.max(container.clientHeight, 1);
      const narrow = width < 650;
      const viewWidth = narrow ? 11.7 : 22;
      const viewHeight = viewWidth * height / width;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function pointerDown(event: PointerEvent) {
      drag = { x: event.clientX, y: event.clientY, azimuth, elevation };
      renderer.domElement.setPointerCapture(event.pointerId);
      container.classList.add("is-dragging");
    }
    function pointerMove(event: PointerEvent) {
      if (!drag) return;
      azimuth = Math.max(-0.65, Math.min(0.65, drag.azimuth + (event.clientX - drag.x) * 0.003));
      elevation = Math.max(0.48, Math.min(1.1, drag.elevation + (event.clientY - drag.y) * 0.003));
    }
    function pointerUp(event: PointerEvent) {
      if (drag && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) {
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height * 2 - 1));
        raycaster.setFromCamera(pointer, camera);
        let picked: THREE.Object3D | null = raycaster.intersectObjects(nodes, true)[0]?.object ?? null;
        while (picked && typeof picked.userData.siteIndex !== "number") picked = picked.parent;
        if (picked) onSelectRef.current(picked.userData.siteIndex as number);
      }
      drag = null;
      container.classList.remove("is-dragging");
    }
    function pointerCancel() { drag = null; container.classList.remove("is-dragging"); }
    function wheel(event: WheelEvent) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoom = Math.max(0.8, Math.min(1.5, zoom + event.deltaY * 0.0007));
    }

    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const visibilityObserver = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; });
    visibilityObserver.observe(container);
    resize();
    select(currentIndex, currentRelated);

    let frame = 0;
    function animate() {
      frame = window.requestAnimationFrame(animate);
      if (!isVisible) return;
      const [selectedX] = POSITIONS[currentIndex];
      const focusX = width < 650 ? selectedX : selectedX * 0.2;
      target.x += (focusX - target.x) * 0.075;
      const radius = 20;
      if (zoom !== appliedZoom) {
        camera.zoom = 1 / zoom;
        camera.updateProjectionMatrix();
        appliedZoom = zoom;
      }
      camera.position.set(
        target.x + Math.sin(azimuth) * radius,
        Math.sin(elevation) * radius,
        Math.cos(azimuth) * Math.cos(elevation) * radius,
      );
      camera.lookAt(target.x, -1.55, 0);
      camera.updateMatrixWorld();
      nodes.forEach((node, nodeIndex) => {
        const label = labelRefs.current[nodeIndex];
        if (!label) return;
        projected.copy(node.position).add(labelOffset.set(0, nodeIndex === currentIndex ? 0.95 : 0.82, 0)).project(camera);
        label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
        label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
        label.style.visibility = Math.abs(projected.x) > 0.85 || Math.abs(projected.y) > 0.9 ? "hidden" : "visible";
      });
      renderer.render(scene, camera);
    }
    animate();

    controlRef.current = { select, zoomBy: (amount) => { zoom = Math.max(0.8, Math.min(1.5, zoom + amount)); }, dispose: () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      renderer.domElement.removeEventListener("wheel", wheel);
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      const materials = new Set<THREE.Material>();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const entries = Array.isArray(child.material) ? child.material : [child.material];
          entries.forEach((material) => materials.add(material));
        }
      });
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    } };

    return () => { controlRef.current?.dispose(); controlRef.current = null; };
  // The scene is built once; selected year and callback are updated through refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="history-world-3d" ref={hostRef}>
      {failed && <div className="history-world-fallback">{lang === "zh" ? "此设备暂不支持 3D 场景，请使用下方年份导航。" : "3D is unavailable on this device. Use the year controls below."}</div>}
      <div className="history-world-atmosphere" aria-hidden="true" />
      {!failed && <>
        <div className="history-world-labels" aria-label={lang === "zh" ? "场景中的历史节点" : "Moments in the scene"}>
          {years.map((year, siteIndex) => (
            <button
              key={year}
              ref={(element) => { labelRefs.current[siteIndex] = element; }}
              type="button"
              className={siteIndex === index ? "is-active" : ""}
              aria-pressed={siteIndex === index}
              aria-label={lang === "zh" ? `前 ${year} 年，选择历史节点` : `${year} BCE, select moment`}
              onClick={() => onSelectRef.current(siteIndex)}
            >{year}</button>
          ))}
        </div>
        <div className="history-world-controls">
          <button type="button" aria-label={lang === "zh" ? "放大场景" : "Zoom in"} onClick={() => controlRef.current?.zoomBy(-0.17)}>+</button>
          <button type="button" aria-label={lang === "zh" ? "缩小场景" : "Zoom out"} onClick={() => controlRef.current?.zoomBy(0.17)}>−</button>
        </div>
      </>}
    </div>
  );
}
