// ═══════════════════════════════════════════════════════════════════════════
// PHYSIOTHERAPIE FARO - Sculptural 3D WebGL Engine (Three.js r164)
// 1) Hero Fluted Emerald Glass Shader + Atmospheric Jade Spine Depth
// 2) Single-Context Scissor Renderer: 4 Tactile Anatomical 3D Card Sculptures
// 3) Interactive 3D Anatomical Body & Spine Explorer with 1px Projected Callouts
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 768;

// Procedural Studio Softbox Environment Map (PMREMGenerator) for crisp PBR glass & ceramic reflections
function createStudioEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x162923);

  const overhead = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  overhead.position.set(0, 7, 0);
  overhead.rotation.x = Math.PI * 0.5;
  envScene.add(overhead);

  const keyBox = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff8ee, side: THREE.DoubleSide })
  );
  keyBox.position.set(6, 3, 5);
  keyBox.lookAt(0, 0, 0);
  envScene.add(keyBox);

  const rimBox = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 12),
    new THREE.MeshBasicMaterial({ color: 0x6ce3b6, side: THREE.DoubleSide })
  );
  rimBox.position.set(-6, 2, -4);
  rimBox.lookAt(0, 0, 0);
  envScene.add(rimBox);

  const fillBox = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6),
    new THREE.MeshBasicMaterial({ color: 0x9ac4b6, side: THREE.DoubleSide })
  );
  fillBox.position.set(0, -5, 4);
  fillBox.lookAt(0, 0, 0);
  envScene.add(fillBox);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

// Procedural micro-mineral roughness & bump texture (eliminates plastic look)
function createMineralGrainTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 122 + Math.floor(Math.random() * 24);
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

// Procedural radial soft contact shadow texture
function createShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, 'rgba(11, 35, 28, 0.24)');
  grad.addColorStop(0.55, 'rgba(11, 35, 28, 0.09)');
  grad.addColorStop(1, 'rgba(11, 35, 28, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createMaterials() {
  const grain = createMineralGrainTexture();
  return {
    boneAlabaster: new THREE.MeshPhysicalMaterial({
      color: 0xf4f6f3,
      roughness: 0.24,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.004,
      metalness: 0.05,
      clearcoat: 0.78,
      clearcoatRoughness: 0.18,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xdcece4),
    }),
    boneStone: new THREE.MeshPhysicalMaterial({
      color: 0xdbe5df,
      roughness: 0.28,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.005,
      metalness: 0.06,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
    }),
    jadeTranslucent: new THREE.MeshPhysicalMaterial({
      color: 0x1e6b50,
      emissive: 0x072419,
      emissiveIntensity: 0.28,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      sheen: 0.5,
      sheenColor: new THREE.Color(0x88e6c2),
    }),
    jadeActive: new THREE.MeshPhysicalMaterial({
      color: 0x45c496,
      emissive: 0x1a7554,
      emissiveIntensity: 0.78,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
    }),
    // Custom GLSL Fresnel + Studio Rim Shader for anatomical glass figure
    bodyShellGlass: new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uColorInner: { value: new THREE.Color(0x284247) },
        uColorRim: { value: new THREE.Color(0xa6e8d2) },
        uKeyDir: { value: new THREE.Vector3(0.6, 0.7, 0.4).normalize() },
      },
      vertexShader: `
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        varying vec3 vWorldNormal;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormalView = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorInner;
        uniform vec3 uColorRim;
        uniform vec3 uKeyDir;
        varying vec3 vNormalView;
        varying vec3 vViewDir;
        varying vec3 vWorldNormal;
        void main() {
          float ndotv = clamp(abs(dot(normalize(vNormalView), normalize(vViewDir))), 0.0, 1.0);
          float fresnel = pow(1.0 - ndotv, 2.3);
          float keyWrap = clamp(dot(normalize(vWorldNormal), uKeyDir) * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uColorInner, uColorRim, fresnel * 0.85 + pow(keyWrap, 3.0) * 0.25);
          float alpha = clamp(0.08 + fresnel * 0.62 + pow(keyWrap, 4.0) * 0.14, 0.0, 0.78);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }),
    heroGlassSpine: new THREE.MeshPhysicalMaterial({
      color: 0x8cc8b0,
      roughness: 0.24,
      metalness: 0.08,
      transparent: true,
      opacity: 0.16,
      clearcoat: 0.75,
    }),
    heroDiscSoft: new THREE.MeshPhysicalMaterial({
      color: 0x2f8e6b,
      emissive: 0x0d3a2a,
      emissiveIntensity: 0.18,
      roughness: 0.2,
      transparent: true,
      opacity: 0.22,
      clearcoat: 0.85,
    }),
    fineWire: new THREE.MeshStandardMaterial({
      color: 0x8ad1b6,
      roughness: 0.25,
      metalness: 0.5,
      transparent: true,
      opacity: 0.65,
    }),
    shadowTex: createShadowTexture(),
  };
}

// Sculpted organic vertebra with smooth laminae & facet transitions
function buildSculptedVertebra(scale = 1, matBone, matDisc) {
  const g = new THREE.Group();

  const pts = [
    new THREE.Vector2(0.0, -0.145),
    new THREE.Vector2(0.28, -0.142),
    new THREE.Vector2(0.355, -0.10),
    new THREE.Vector2(0.315, -0.04),
    new THREE.Vector2(0.275, 0.0),
    new THREE.Vector2(0.315, 0.04),
    new THREE.Vector2(0.355, 0.10),
    new THREE.Vector2(0.28, 0.142),
    new THREE.Vector2(0.0, 0.145),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), matBone);
  body.scale.set(1.12, 1, 0.92);
  g.add(body);

  // Smooth posterior arch ring
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.052, 14, 32, Math.PI * 1.15), matBone);
  arch.rotation.x = Math.PI * 0.5;
  arch.rotation.z = -Math.PI * 0.075;
  arch.position.set(0, 0.01, -0.12);
  g.add(arch);

  const spinous = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.3, 8, 16), matBone);
  spinous.position.set(0, -0.05, -0.35);
  spinous.rotation.x = Math.PI * 0.36;
  g.add(spinous);

  const transGeo = new THREE.CapsuleGeometry(0.044, 0.38, 8, 14);
  const transL = new THREE.Mesh(transGeo, matBone);
  transL.position.set(-0.27, 0.02, -0.14);
  transL.rotation.z = Math.PI * 0.47;
  transL.rotation.y = 0.24;
  g.add(transL);

  const transR = transL.clone();
  transR.position.x = 0.27;
  transR.rotation.z = -Math.PI * 0.47;
  transR.rotation.y = -0.24;
  g.add(transR);

  // Tapered cushion disc
  const discPts = [
    new THREE.Vector2(0.0, -0.04),
    new THREE.Vector2(0.30, -0.038),
    new THREE.Vector2(0.33, 0.0),
    new THREE.Vector2(0.30, 0.038),
    new THREE.Vector2(0.0, 0.04),
  ];
  const disc = new THREE.Mesh(new THREE.LatheGeometry(discPts, 36), matDisc);
  disc.position.y = -0.185;
  disc.scale.set(1.09, 1, 0.9);
  g.add(disc);

  g.scale.setScalar(scale);
  return { group: g, disc, body };
}

// ───────────────────────────────────────────────────────────────────────────
// 1. HERO FLUTED EMERALD SHADER + INTEGRATED KINETIC SPINE
// ───────────────────────────────────────────────────────────────────────────
function initHeroScene() {
  const canvas = document.getElementById('hero-webgl');
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const mats = createMaterials();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, canvas.clientWidth / Math.max(1, canvas.clientHeight), 0.1, 60);
  camera.position.set(0, 0.1, 9.2);

  const bgUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(canvas.clientWidth, canvas.clientHeight) },
  };

  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.999, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / max(1.0, uResolution.y);

        // Fine vertical fluted glass refraction bands (Aurain R03)
        float fluteCount = mix(24.0, 42.0, clamp(aspect * 0.5, 0.0, 1.0));
        float xCoord = uv.x * fluteCount + (uMouse.x - 0.5) * 0.45;
        float flutePhase = fract(xCoord);
        float fluteProfile = pow(sin(flutePhase * 3.14159265), 1.8);
        float fluteEdge = smoothstep(0.0, 0.1, flutePhase) * (1.0 - smoothstep(0.9, 1.0, flutePhase));

        vec3 deepEmerald = vec3(0.043, 0.133, 0.106);
        vec3 midEmerald  = vec3(0.086, 0.235, 0.184);
        vec3 warmSage    = vec3(0.165, 0.345, 0.275);
        vec3 lightFloor  = vec3(0.965, 0.973, 0.965);

        // Multi-layered volumetric diffuse bloom
        float bloom1 = exp(-length((uv - vec2(0.5 + (uMouse.x - 0.5) * 0.12, 0.56)) * vec2(aspect * 0.72, 1.1)) * 1.9);
        float bloom2 = exp(-length((uv - vec2(0.32, 0.72)) * vec2(aspect * 0.8, 1.2)) * 2.5) * 0.45;
        float wave = sin(uv.x * 4.0 + uTime * 0.25) * 0.025;

        vec3 baseColor = mix(deepEmerald, midEmerald, clamp(uv.y * 0.5 + bloom1 * 0.65 + bloom2 + wave, 0.0, 1.0));
        baseColor = mix(baseColor, warmSage, bloom1 * 0.38);

        // Glass flute highlights
        float fluteLight = (fluteProfile * 0.18 + fluteEdge * 0.06) * (0.35 + 0.65 * smoothstep(0.15, 0.8, uv.y));
        baseColor += vec3(0.09, 0.24, 0.18) * fluteLight;

        // Subtle crisp 1px-feel luminous arc cradling ONLY the fanned card showcase below buttons
        vec2 arcCenter = vec2(0.5, -0.12);
        float distArc = length((uv - arcCenter) * vec2(aspect * 0.48, 1.0));
        float arcRing = exp(-pow((distArc - 0.48) * 290.0, 2.0)) * 0.14 * smoothstep(0.14, 0.34, uv.y) * (1.0 - smoothstep(0.36, 0.44, uv.y));
        baseColor += vec3(0.65, 0.9, 0.78) * arcRing;

        // Clean transition into clinical off-white #F6F8F6 (no stray elements below)
        float bottomFade = smoothstep(0.16, 0.0, uv.y);
        vec3 finalCol = mix(baseColor, lightFloor, bottomFade);

        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
  });

  const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bgPlane.frustumCulled = false;
  bgPlane.renderOrder = -1;
  scene.add(bgPlane);

  const ambient = new THREE.AmbientLight(0xdff2ea, 0.85);
  const keyLight = new THREE.DirectionalLight(0xfffdf8, 2.0);
  keyLight.position.set(4, 6, 5);
  const rimLight = new THREE.DirectionalLight(0x6ad6ac, 1.3);
  rimLight.position.set(-5, 2, -3);
  scene.add(ambient, keyLight, rimLight);

  // Subtle ambient 3D spine depth kept softly out of headline typography zone
  const spineGroup = new THREE.Group();
  const segments = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const scale = 0.38 + Math.sin(t * Math.PI) * 0.2;
    const { group, disc } = buildSculptedVertebra(scale, mats.heroGlassSpine, mats.heroDiscSoft);
    const y = (t - 0.5) * 2.8;
    const zCurve = Math.sin(t * Math.PI * 1.2) * 0.22;
    group.position.set(0, y, zCurve);
    group.rotation.x = Math.cos(t * Math.PI * 1.2) * 0.1;
    spineGroup.add(group);
    segments.push({ group, disc, baseY: y, t });
  }
  spineGroup.position.set(3.85, 0.35, -2.2);
  spineGroup.rotation.z = 0.14;
  scene.add(spineGroup);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    bgUniforms.uMouse.value.set(e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight);
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bgUniforms.uResolution.value.set(w, h);
  }
  resize();

  let visible = true;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0.02 });
  io.observe(canvas);

  return {
    render(timeSec) {
      if (!visible) return;
      bgUniforms.uTime.value = timeSec;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      if (!prefersReducedMotion) {
        spineGroup.rotation.y = timeSec * 0.14 + pointer.x * 0.24;
        spineGroup.rotation.x = pointer.y * 0.08;
        segments.forEach((s, idx) => {
          s.group.position.y = s.baseY + Math.sin(timeSec * 1.0 + idx * 0.32) * 0.02;
        });
      }
      renderer.render(scene, camera);
    },
    resize,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 2. SINGLE-CONTEXT SCISSOR RENDERER: 4 TACTILE ANATOMICAL 3D SCULPTURES
// ───────────────────────────────────────────────────────────────────────────
function addContactShadow(scene, shadowTex, y = -0.92, scale = 1.6) {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(scale, scale),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85 })
  );
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = y;
  scene.add(shadow);
}

function initCardMiniatures() {
  const canvas = document.getElementById('cards-webgl');
  const container = document.getElementById('cards-stage');
  const slots = Array.from(document.querySelectorAll('.card-3d-slot'));
  if (!canvas || !container || slots.length === 0) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setScissorTest(true);

  const envTex = createStudioEnvMap(renderer);
  const mats = createMaterials();
  const scenes = [];

  slots.forEach((slot) => {
    const kind = slot.dataset.model;
    const scene = new THREE.Scene();
    scene.environment = envTex;
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0.24, 2.95);
    camera.lookAt(0, -0.05, 0);

    const amb = new THREE.AmbientLight(0xdce9e2, 0.42);
    const key = new THREE.DirectionalLight(0xfffdf6, 2.85);
    key.position.set(3.5, 5.2, 3.8);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 14;
    key.shadow.camera.left = -1.6;
    key.shadow.camera.right = 1.6;
    key.shadow.camera.top = 1.6;
    key.shadow.camera.bottom = -1.6;
    key.shadow.bias = -0.002;
    const rim = new THREE.DirectionalLight(0x4be0a8, 1.9);
    rim.position.set(-4.2, 1.8, -3.0);
    const bounce = new THREE.DirectionalLight(0xc2dbd0, 0.5);
    bounce.position.set(0, -3.5, 2.5);
    scene.add(amb, key, rim, bounce);

    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    shadowFloor.rotation.x = -Math.PI * 0.5;
    shadowFloor.position.y = -0.92;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);
    addContactShadow(scene, mats.shadowTex, -0.925, 1.7);

    const root = new THREE.Group();

    if (kind === 'manual') {
      const v1 = buildSculptedVertebra(0.86, mats.boneAlabaster, mats.jadeTranslucent);
      v1.group.position.y = 0.32;
      const v2 = buildSculptedVertebra(0.86, mats.boneStone, mats.jadeTranslucent);
      v2.group.position.y = -0.34;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.014, 12, 64), mats.fineWire);
      halo.rotation.x = Math.PI * 0.36;
      root.add(v1.group, v2.group, halo);
    } else if (kind === 'kg') {
      // Sculpted organic double-helix posture ribbons + translucent core
      for (let k = 0; k < 2; k++) {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const t = i / 60;
          const a = t * Math.PI * 2.2 + k * Math.PI;
          const r = 0.34 + Math.sin(t * Math.PI) * 0.18;
          pts.push(new THREE.Vector3(Math.cos(a) * r, (t - 0.5) * 1.45, Math.sin(a) * r));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.TubeGeometry(curve, 72, 0.065, 20, false);
        root.add(new THREE.Mesh(geo, k === 0 ? mats.boneAlabaster : mats.jadeTranslucent));
      }
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), mats.jadeActive);
      root.add(core);
    } else if (kind === 'cmd') {
      // Anatomically flared sculpted mandible + twin condyles & articular discs
      const jawPts = [
        new THREE.Vector3(-0.66, 0.58, -0.22),
        new THREE.Vector3(-0.62, 0.06, -0.06),
        new THREE.Vector3(-0.34, -0.38, 0.38),
        new THREE.Vector3(0, -0.48, 0.56),
        new THREE.Vector3(0.34, -0.38, 0.38),
        new THREE.Vector3(0.62, 0.06, -0.06),
        new THREE.Vector3(0.66, 0.58, -0.22),
      ];
      const jawCurve = new THREE.CatmullRomCurve3(jawPts);
      const jawMesh = new THREE.Mesh(new THREE.TubeGeometry(jawCurve, 72, 0.105, 24, false), mats.boneAlabaster);
      root.add(jawMesh);

      // Chin symphysis sculpting
      const chin = new THREE.Mesh(new THREE.SphereGeometry(0.145, 28, 28), mats.boneAlabaster);
      chin.scale.set(1.25, 0.95, 0.9);
      chin.position.set(0, -0.48, 0.56);
      root.add(chin);

      [-0.66, 0.66].forEach((x) => {
        const condyle = new THREE.Mesh(new THREE.SphereGeometry(0.135, 28, 28), mats.boneStone);
        condyle.scale.set(1.15, 0.85, 0.9);
        condyle.position.set(x, 0.6, -0.22);
        const disc = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.036, 16, 36), mats.jadeTranslucent);
        disc.position.set(x, 0.68, -0.22);
        disc.rotation.x = Math.PI * 0.5;
        root.add(condyle, disc);
      });
    } else {
      // Sculpted distal femur + bicondylar knee + meniscus cushion + tibial flare
      const femurPts = [
        new THREE.Vector2(0.0, 0.82),
        new THREE.Vector2(0.16, 0.82),
        new THREE.Vector2(0.18, 0.45),
        new THREE.Vector2(0.28, 0.16),
        new THREE.Vector2(0.0, 0.16),
      ];
      const femur = new THREE.Mesh(new THREE.LatheGeometry(femurPts, 36), mats.boneAlabaster);
      const cL = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 28), mats.boneAlabaster);
      cL.scale.set(0.95, 1.0, 1.18);
      cL.position.set(-0.15, 0.14, 0);
      const cR = cL.clone();
      cR.position.x = 0.15;

      const meniscus = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.058, 18, 48), mats.jadeTranslucent);
      meniscus.rotation.x = Math.PI * 0.5;
      meniscus.position.y = -0.03;

      const patella = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 24), mats.boneStone);
      patella.scale.set(1.0, 1.15, 0.55);
      patella.position.set(0, 0.18, 0.24);

      const tibiaPts = [
        new THREE.Vector2(0.0, -0.14),
        new THREE.Vector2(0.29, -0.14),
        new THREE.Vector2(0.22, -0.35),
        new THREE.Vector2(0.16, -0.76),
        new THREE.Vector2(0.0, -0.76),
      ];
      const tibia = new THREE.Mesh(new THREE.LatheGeometry(tibiaPts, 36), mats.boneStone);

      const flowRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.015, 12, 64), mats.fineWire);
      flowRing.rotation.set(0.55, 0.3, 0);
      root.add(femur, cL, cR, meniscus, patella, tibia, flowRing);
    }

    root.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = true;
    });
    root.rotation.x = 0.16;
    scene.add(root);

    const state = { slot, scene, camera, root, hover: 0, hoverTarget: 0 };
    const parentCard = slot.closest('.treatment-card');
    if (parentCard) {
      parentCard.addEventListener('mouseenter', () => { state.hoverTarget = 1; });
      parentCard.addEventListener('mouseleave', () => { state.hoverTarget = 0; });
    }
    scenes.push(state);
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
  }
  resize();

  return {
    render(timeSec) {
      const cRect = container.getBoundingClientRect();
      if (cRect.bottom < 0 || cRect.top > window.innerHeight || cRect.width <= 0 || cRect.height <= 0) {
        return;
      }

      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);

      scenes.forEach((s, i) => {
        const rect = s.slot.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const xLeft = rect.left - cRect.left;
        const yBottom = cRect.bottom - rect.bottom;
        renderer.setViewport(xLeft, yBottom, rect.width, rect.height);
        renderer.setScissor(xLeft, yBottom, rect.width, rect.height);

        s.camera.aspect = rect.width / rect.height;
        s.camera.updateProjectionMatrix();

        s.hover += (s.hoverTarget - s.hover) * 0.1;
        if (!prefersReducedMotion) {
          s.root.rotation.y = timeSec * (0.42 + s.hover * 0.6) + i * 1.1;
          s.root.position.y = Math.sin(timeSec * 1.3 + i) * 0.035 + s.hover * 0.04;
        }
        s.root.scale.setScalar(1.22 + s.hover * 0.08);
        renderer.render(s.scene, s.camera);
      });
    },
    resize,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 3. INTERACTIVE 3D ANATOMICAL BODY & SPINE EXPLORER (Spur+fit R04 Pattern)
// ───────────────────────────────────────────────────────────────────────────
const ZONE_DATA = {
  hws: {
    title: 'Halswirbelsäule & Kiefer (CMD)',
    badge: 'Kiefergelenk & Nacken',
    therapy: 'CMD-Therapie & Manuelle Mobilisation',
    desc: 'Gezielte Entlastung bei Kieferschmerzen, Zähneknirschen, Spannungskopfschmerz und Bewegungseinschränkungen der oberen Halswirbelsäule.',
    camPos: new THREE.Vector3(1.6, 2.25, 3.8),
    camTarget: new THREE.Vector3(0, 2.05, 0),
    anchorLocal: new THREE.Vector3(0.16, 2.1, 0.22),
    labelPos: { x: 74, y: 18 },
  },
  lws: {
    title: 'Brust- & Lendenwirbelsäule',
    badge: 'Wirbelsäulen-Achse',
    therapy: 'Manuelle Therapie & Krankengymnastik',
    desc: 'Wiederherstellung der segmentalen Beweglichkeit und tiefen Rumpfstabilität bei Rückenschmerzen, Blockaden und Fehlhaltungen.',
    camPos: new THREE.Vector3(-1.9, 0.6, 4.2),
    camTarget: new THREE.Vector3(0, 0.55, 0),
    anchorLocal: new THREE.Vector3(-0.2, 0.55, 0.2),
    labelPos: { x: 18, y: 46 },
  },
  schulter: {
    title: 'Schultergürtel & Faszienkette',
    badge: 'Obere Extremität',
    therapy: 'Faszientherapie & medizinische Massage',
    desc: 'Lösung tiefer myofaszialer Verklebungen im Schulter-Nacken-Komplex zur Verbesserung der Überkopfbeweglichkeit und Schmerzreduktion.',
    camPos: new THREE.Vector3(2.15, 1.5, 4.0),
    camTarget: new THREE.Vector3(0.42, 1.4, 0),
    anchorLocal: new THREE.Vector3(0.84, 1.38, 0.08),
    labelPos: { x: 76, y: 36 },
  },
  knie: {
    title: 'Kniegelenk & Sportrehabilitation',
    badge: 'Untere Extremität',
    therapy: 'Postoperative Sportreha & Lymphdrainage',
    desc: 'Evidenzbasierter Belastungsaufbau nach Kreuzband-, Meniskus- oder Gelenkeingriffen inklusive entstauender Manueller Lymphdrainage.',
    camPos: new THREE.Vector3(1.65, -1.55, 3.9),
    camTarget: new THREE.Vector3(0.28, -1.62, 0),
    anchorLocal: new THREE.Vector3(0.42, -1.62, 0.18),
    labelPos: { x: 72, y: 74 },
  },
  overview: {
    title: 'Ganzheitliche Haltungs- & Bewegungsanalyse',
    badge: 'Gesamte Körperachse',
    therapy: 'Individueller Befund vor Ort in München',
    desc: 'Drehen Sie das 3D-Modell frei oder wählen Sie direkt einen anatomischen Schwerpunkt für passende Behandlungspfade in der Nymphenburger Str. 20a.',
    camPos: new THREE.Vector3(0.45, 0.15, 9.6),
    camTarget: new THREE.Vector3(0, -0.08, 0),
    anchorLocal: new THREE.Vector3(0, 0, 0),
  },
};

function buildTranslucentBodyShell(matShell) {
  const shell = new THREE.Group();

  // Continuous sculpted ergonomic torso, neck & pelvis silhouette (no detached capsule limbs!)
  const torsoPts = [
    new THREE.Vector2(0.0, -0.82),
    new THREE.Vector2(0.58, -0.76),
    new THREE.Vector2(0.74, -0.48),
    new THREE.Vector2(0.57, 0.04),
    new THREE.Vector2(0.67, 0.56),
    new THREE.Vector2(0.86, 1.06),
    new THREE.Vector2(1.02, 1.38),
    new THREE.Vector2(0.72, 1.62),
    new THREE.Vector2(0.24, 1.76),
    new THREE.Vector2(0.21, 2.08),
    new THREE.Vector2(0.36, 2.34),
    new THREE.Vector2(0.38, 2.62),
    new THREE.Vector2(0.22, 2.84),
    new THREE.Vector2(0.0, 2.88),
  ];
  const bodyLathe = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 48), matShell);
  bodyLathe.scale.set(1.05, 1.0, 0.58);
  shell.add(bodyLathe);

  // Subtle translucent bilateral ribcage & lower-extremity silhouette contours
  for (let r = 0; r < 6; r++) {
    const rt = r / 5;
    const rad = 0.54 + Math.sin(rt * Math.PI) * 0.16;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.016, 10, 56), matShell);
    rib.rotation.x = Math.PI * 0.47;
    rib.scale.set(1.12, 0.72, 1);
    rib.position.set(0, 0.62 + rt * 0.78, 0.04);
    shell.add(rib);
  }

  [-0.42, 0.42].forEach((lx) => {
    const legPts = [
      new THREE.Vector2(0.0, -2.68),
      new THREE.Vector2(0.11, -2.65),
      new THREE.Vector2(0.16, -2.15),
      new THREE.Vector2(0.19, -1.62),
      new THREE.Vector2(0.24, -1.1),
      new THREE.Vector2(0.29, -0.62),
      new THREE.Vector2(0.0, -0.58),
    ];
    const legWrap = new THREE.Mesh(new THREE.LatheGeometry(legPts, 32), matShell);
    legWrap.position.set(lx, 0, 0.03);
    shell.add(legWrap);
  });

  return shell;
}

function initExplorerScene() {
  const canvas = document.getElementById('explorer-webgl');
  const stage = document.getElementById('explorer-stage');
  const svgOverlay = document.getElementById('explorer-lines');
  if (!canvas || !stage) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const mats = createMaterials();
  const scene = new THREE.Scene();
  scene.environment = createStudioEnvMap(renderer);
  const camera = new THREE.PerspectiveCamera(35, stage.clientWidth / Math.max(1, stage.clientHeight), 0.1, 40);
  camera.position.copy(ZONE_DATA.overview.camPos);

  const amb = new THREE.AmbientLight(0xc2d8d0, 0.45);
  const key = new THREE.DirectionalLight(0xfffdf8, 2.95);
  key.position.set(5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 22;
  key.shadow.camera.left = -3.5;
  key.shadow.camera.right = 3.5;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0015;
  const rim = new THREE.DirectionalLight(0x64dfaf, 2.2);
  rim.position.set(-5.5, 2.5, -4);
  const backRim = new THREE.DirectionalLight(0x9bc8d4, 1.4);
  backRim.position.set(0, -1, -5);
  scene.add(amb, key, rim, backRim);

  // Real directional ShadowMap floor + subtle studio ring
  const expFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.34 })
  );
  expFloor.rotation.x = -Math.PI * 0.5;
  expFloor.position.y = -2.71;
  expFloor.receiveShadow = true;
  scene.add(expFloor);
  addContactShadow(scene, mats.shadowTex, -2.72, 3.8);
  const ring1 = new THREE.Mesh(
    new THREE.RingGeometry(1.52, 1.54, 96),
    new THREE.MeshBasicMaterial({ color: 0x9ed6c0, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  ring1.rotation.x = -Math.PI * 0.5;
  ring1.position.y = -2.71;
  scene.add(ring1);

  const rig = new THREE.Group();
  const zoneMeshes = { hws: [], lws: [], schulter: [], knie: [] };

  // Outer translucent anatomical figure shell
  const bodyShell = buildTranslucentBodyShell(mats.bodyShellGlass);
  rig.add(bodyShell);

  // Internal anatomical bone & joint axis
  const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 14, 36, Math.PI), mats.boneAlabaster);
  jaw.rotation.set(Math.PI * 0.65, 0, Math.PI);
  jaw.position.set(0, 2.22, 0.16);
  rig.add(jaw);
  zoneMeshes.hws.push(jaw);

  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const y = -0.35 + t * 2.42;
    const z = Math.sin(t * Math.PI * 1.7) * 0.14;
    const sc = 0.62 - t * 0.22;
    const v = buildSculptedVertebra(sc, mats.boneAlabaster, mats.jadeTranslucent);
    v.group.position.set(0, y, z);
    rig.add(v.group);
    if (i >= 11) zoneMeshes.hws.push(v.disc);
    else zoneMeshes.lws.push(v.disc);
  }

  const clavCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.88, 1.38, -0.02),
    new THREE.Vector3(-0.4, 1.52, 0.12),
    new THREE.Vector3(0, 1.5, 0.14),
    new THREE.Vector3(0.4, 1.52, 0.12),
    new THREE.Vector3(0.88, 1.38, -0.02),
  ]);
  const clavMesh = new THREE.Mesh(new THREE.TubeGeometry(clavCurve, 48, 0.048, 14, false), mats.boneAlabaster);
  rig.add(clavMesh);
  zoneMeshes.schulter.push(clavMesh);

  [-0.88, 0.88].forEach((sideX, idx) => {
    const shoulderOrb = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 24), mats.jadeTranslucent);
    shoulderOrb.position.set(sideX, 1.38, -0.02);
    rig.add(shoulderOrb);
    if (idx === 1) zoneMeshes.schulter.push(shoulderOrb);
  });

  const pelvis = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.075, 16, 48), mats.boneStone);
  pelvis.rotation.x = Math.PI * 0.44;
  pelvis.scale.set(1.22, 0.72, 1);
  pelvis.position.set(0, -0.52, 0.03);
  rig.add(pelvis);

  [-0.42, 0.42].forEach((hipX, idx) => {
    // Sculpted flared distal femur + bicondylar knee + patella + meniscus + tibial plateau
    const femurPts = [
      new THREE.Vector2(0.0, -0.56),
      new THREE.Vector2(0.1, -0.56),
      new THREE.Vector2(0.075, -1.12),
      new THREE.Vector2(0.145, -1.56),
      new THREE.Vector2(0.0, -1.56),
    ];
    const femur = new THREE.Mesh(new THREE.LatheGeometry(femurPts, 28), mats.boneAlabaster);
    femur.position.set(hipX, 0, 0.03);

    const cL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 22, 22), mats.boneAlabaster);
    cL.position.set(hipX - 0.065, -1.58, 0.04);
    const cR = cL.clone();
    cR.position.x = hipX + 0.065;

    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 20), mats.boneStone);
    patella.scale.set(1.0, 1.15, 0.55);
    patella.position.set(hipX, -1.56, 0.14);

    const meniscus = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.034, 16, 36), mats.jadeTranslucent);
    meniscus.rotation.x = Math.PI * 0.5;
    meniscus.position.set(hipX, -1.65, 0.05);

    const tibiaPts = [
      new THREE.Vector2(0.0, -1.68),
      new THREE.Vector2(0.14, -1.68),
      new THREE.Vector2(0.085, -1.96),
      new THREE.Vector2(0.058, -2.65),
      new THREE.Vector2(0.0, -2.65),
    ];
    const tibia = new THREE.Mesh(new THREE.LatheGeometry(tibiaPts, 28), mats.boneStone);
    tibia.position.set(hipX, 0, 0.03);

    rig.add(femur, cL, cR, patella, meniscus, tibia);
    if (idx === 1) zoneMeshes.knie.push(meniscus);
  });

  // Fascia kinetic meridian lines (visible in fascia mode)
  const fasciaGroup = new THREE.Group();
  [-1, 1].forEach((side) => {
    const pts = [
      new THREE.Vector3(side * 0.14, 2.2, 0.1),
      new THREE.Vector3(side * 0.84, 1.38, 0.02),
      new THREE.Vector3(side * 0.4, 0.4, 0.16),
      new THREE.Vector3(side * 0.42, -0.52, 0.06),
      new THREE.Vector3(side * 0.42, -1.62, 0.1),
      new THREE.Vector3(side * 0.42, -2.55, 0.03),
    ];
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.02, 10, false), mats.jadeActive);
    fasciaGroup.add(tube);
  });
  fasciaGroup.visible = false;
  rig.add(fasciaGroup);

  rig.traverse((obj) => {
    if (obj.isMesh && obj.material !== mats.bodyShellGlass) obj.castShadow = true;
  });
  scene.add(rig);

  let activeZone = 'overview';
  let userYawOffset = 0;
  let userPitchOffset = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const currentTarget = ZONE_DATA.overview.camTarget.clone();
  const currentCamPos = ZONE_DATA.overview.camPos.clone();

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.hotspot-btn') || e.target.closest('.explorer-controls')) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    userYawOffset += dx * 0.008;
    userPitchOffset = THREE.MathUtils.clamp(userPitchOffset + dy * 0.004, -0.45, 0.45);
  }, { passive: true });
  window.addEventListener('pointerup', () => { dragging = false; });

  function selectZone(zoneKey) {
    activeZone = ZONE_DATA[zoneKey] ? zoneKey : 'overview';
    userYawOffset = 0;
    userPitchOffset = 0;

    Object.entries(zoneMeshes).forEach(([k, meshes]) => {
      meshes.forEach((m) => {
        if (m.material === mats.jadeTranslucent || m.material === mats.jadeActive) {
          m.material = k === activeZone ? mats.jadeActive : mats.jadeTranslucent;
        }
      });
    });

    const z = ZONE_DATA[activeZone];
    const titleEl = document.getElementById('explorer-zone-title');
    const badgeEl = document.getElementById('explorer-zone-badge');
    const therapyEl = document.getElementById('explorer-zone-therapy');
    const descEl = document.getElementById('explorer-zone-desc');
    if (titleEl) titleEl.textContent = z.title;
    if (badgeEl) badgeEl.textContent = z.badge;
    if (therapyEl) therapyEl.textContent = z.therapy;
    if (descEl) descEl.textContent = z.desc;

    document.querySelectorAll('.hotspot-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.zone === activeZone);
    });
  }

  function setMode(mode) {
    fasciaGroup.visible = mode === 'fascia';
    bodyShell.visible = mode !== 'joints';
    document.querySelectorAll('.mode-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });
  }

  document.querySelectorAll('.hotspot-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectZone(btn.dataset.zone));
  });
  document.getElementById('explorer-reset')?.addEventListener('click', () => selectZone('overview'));
  document.querySelectorAll('.mode-pill').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  let visible = true;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0.02 });
  io.observe(stage);

  const projVec = new THREE.Vector3();
  const hotspotKeys = ['hws', 'lws', 'schulter', 'knie'];

  function updateHotspots() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h || isMobile()) return;

    let svgMarkup = '';
    hotspotKeys.forEach((key) => {
      const btn = document.querySelector(`.hotspot-btn[data-zone="${key}"]`);
      if (!btn) return;
      const z = ZONE_DATA[key];
      projVec.copy(z.anchorLocal);
      rig.localToWorld(projVec);
      projVec.project(camera);

      const sx = (projVec.x * 0.5 + 0.5) * w;
      const sy = (-projVec.y * 0.5 + 0.5) * h;

      const btnRect = btn.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const bx = btnRect.left - stageRect.left + (z.labelPos.x < 50 ? btnRect.width : 0);
      const by = btnRect.top - stageRect.top + btnRect.height * 0.5;

      const isAct = activeZone === key;
      const strokeCol = isAct ? 'rgba(130, 248, 200, 0.98)' : 'rgba(235, 248, 242, 0.72)';
      svgMarkup += `
        <line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"
              stroke="${strokeCol}" stroke-width="${isAct ? 1.8 : 1.2}" />
        <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${isAct ? 5.5 : 4}"
                fill="${isAct ? '#7ae4bc' : '#ffffff'}" />
      `;
    });
    if (svgOverlay) svgOverlay.innerHTML = svgMarkup;
  }

  window.__faroExplorer = { selectZone, setMode };

  return {
    render(timeSec) {
      if (!visible) return;
      const targetPreset = ZONE_DATA[activeZone];

      currentTarget.lerp(targetPreset.camTarget, 0.08);
      const desiredOffset = targetPreset.camPos.clone().sub(targetPreset.camTarget);
      desiredOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), userYawOffset);
      desiredOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), userPitchOffset);
      const desiredPos = currentTarget.clone().add(desiredOffset);

      currentCamPos.lerp(desiredPos, 0.08);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentTarget);

      if (!prefersReducedMotion && !dragging && activeZone === 'overview') {
        rig.rotation.y = -0.22 + Math.sin(timeSec * 0.35) * 0.18;
      } else if (!dragging) {
        rig.rotation.y += (0 - rig.rotation.y) * 0.06;
      }

      renderer.render(scene, camera);
      updateHotspots();
    },
    resize,
  };
}

export function initAllThreeScenes() {
  const hero = initHeroScene();
  const cards = initCardMiniatures();
  const explorer = initExplorerScene();

  const onResize = () => {
    hero?.resize();
    cards?.resize();
    explorer?.resize();
  };
  window.addEventListener('resize', onResize, { passive: true });

  const start = performance.now();
  let frameCount = 0;
  let lastFpsCheck = start;
  window.__faroPerf = { fps: 60 };

  function tick(now) {
    const t = (now - start) * 0.001;
    hero?.render(t);
    cards?.render(t);
    explorer?.render(t);

    frameCount++;
    if (now - lastFpsCheck >= 1000) {
      window.__faroPerf.fps = Math.round((frameCount * 1000) / (now - lastFpsCheck));
      frameCount = 0;
      lastFpsCheck = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
