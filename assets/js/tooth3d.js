/* Tooth Care Centre - procedural 3D molar (Three.js r128)
   Built from maths only, so no model files are needed. */
(function (root) {
  'use strict';

  // Merge duplicate vertices so normals stay smooth across UV seams and poles.
  function weld(THREE, geo) {
    var p = geo.attributes.position, map = {}, verts = [], remap = new Array(p.count);
    for (var i = 0; i < p.count; i++) {
      var k = Math.round(p.getX(i) * 1e4) + '_' + Math.round(p.getY(i) * 1e4) + '_' + Math.round(p.getZ(i) * 1e4);
      if (map[k] === undefined) { map[k] = verts.length / 3; verts.push(p.getX(i), p.getY(i), p.getZ(i)); }
      remap[i] = map[k];
    }
    var idx = geo.index ? Array.prototype.slice.call(geo.index.array) : remap.map(function (_, n) { return n; });
    var out = [];
    for (var j = 0; j < idx.length; j += 3) {
      var a = remap[idx[j]], b = remap[idx[j + 1]], c = remap[idx[j + 2]];
      if (a !== b && b !== c && a !== c) out.push(a, b, c);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(out);
    return g;
  }

  function srgb(THREE, hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

  function paint(THREE, geo, fn) {
    var p = geo.attributes.position, c = new Float32Array(p.count * 3);
    for (var i = 0; i < p.count; i++) {
      var col = fn(p.getX(i), p.getY(i), p.getZ(i));
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  }

  function sgnpow(v, k) { return Math.sign(v) * Math.pow(Math.abs(v), k); }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function buildCrown(THREE) {
    var g = weld(THREE, new THREE.SphereGeometry(1, 96, 72));
    var p = g.attributes.position, RX = 0.92, RY = 0.7, RZ = 0.84;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // squarer than a sphere: superellipsoid-style remap
      x = sgnpow(x, 0.72); y = sgnpow(y, 0.85); z = sgnpow(z, 0.72);
      // chewing surface: four cusps separated by a cross-shaped fissure
      var top = smooth(0.15, 0.95, y);
      var cusp = Math.sin(Math.min(Math.abs(x), 1) * Math.PI * 0.92) * Math.sin(Math.min(Math.abs(z), 1) * Math.PI * 0.92);
      y += top * (0.3 * cusp - 0.1);
      // taper toward the neck
      var t = Math.max(0, -y);
      var f = 1 - 0.42 * Math.pow(t, 1.25);
      x *= f; z *= f;
      p.setXYZ(i, x * RX, y * RY, z * RZ);
    }
    paint(THREE, g, function (x, y) {
      var u = Math.min(1, Math.max(0, (0.65 - y) / 1.2));
      var c = srgb(THREE, '#FFFFFF').lerp(srgb(THREE, '#F4ECD8'), Math.min(1, u * 1.2));
      return c.lerp(srgb(THREE, '#E4D2A8'), Math.max(0, u - 0.6) * 1.6);
    });
    g.computeVertexNormals();
    return g;
  }

  function buildRoot(THREE, dir) {
    var H = 1.75, g = weld(THREE, new THREE.CylinderGeometry(0.34, 0.045, H, 40, 36, false));
    var p = g.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      var u = (H / 2 - y) / H;                                   // 0 at top, 1 at the tip
      var swell = 1 + 0.10 * Math.sin(u * Math.PI);
      x = x * swell * 1.05; z = z * swell * 0.78;
      x += dir * (0.20 * u + 0.16 * Math.pow(u, 3));              // splay outward
      z += 0.12 * u * u;                                          // slight curve
      p.setXYZ(i, x, y, z);
    }
    paint(THREE, g, function (x, y) {
      var u = Math.min(1, Math.max(0, (H / 2 - y) / H));
      return srgb(THREE, '#EBDDB8').lerp(srgb(THREE, '#D9C494'), u);
    });
    g.computeVertexNormals();
    return g;
  }

  function buildGum(THREE) {
    var g = weld(THREE, new THREE.TorusGeometry(0.6, 0.25, 32, 96));
    var p = g.attributes.position;
    for (var i = 0; i < p.count; i++) {
      // torus lies in XY; stand it flat (XZ) and shape it like the tooth outline
      p.setXYZ(i, p.getX(i) * 1.12, p.getZ(i) * 1.15, p.getY(i) * 1.0);
    }
    g.computeVertexNormals();
    return g;
  }

  // Returns { group, anchors }. Anchors are points of interest in tooth space.
  function buildTooth(THREE) {
    var group = new THREE.Group();

    var enamel = new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.3, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.18
    });
    var rootMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.55, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.6
    });
    var gumMat = new THREE.MeshPhysicalMaterial({
      color: srgb(THREE, '#EE8C93'), roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35
    });

    var crown = new THREE.Mesh(buildCrown(THREE), enamel);
    crown.position.y = 0.05;
    group.add(crown);

    var r1 = new THREE.Mesh(buildRoot(THREE, -1), rootMat); r1.position.set(-0.36, -1.32, 0.0);
    var r2 = new THREE.Mesh(buildRoot(THREE, 1), rootMat);  r2.position.set(0.36, -1.32, 0.0);
    group.add(r1, r2);

    var gum = new THREE.Mesh(buildGum(THREE), gumMat);
    gum.position.y = -0.42;
    group.add(gum);

    var shift = 0.78;                       // centre the model on the pivot
    group.position.y = shift;
    var anchors = {
      enamel: new THREE.Vector3(0.52, 0.74 + shift, 0.5),
      gum: new THREE.Vector3(0, -0.42 + shift, 0.95),
      roots: new THREE.Vector3(-0.66, -1.9 + shift, 0.14)
    };
    var holder = new THREE.Group();
    holder.add(group);
    return { group: holder, anchors: anchors };
  }

  // Soft studio environment for reflections (no external HDR file needed)
  function buildEnvironment(THREE, renderer) {
    var scene = new THREE.Scene();
    var geo = new THREE.SphereGeometry(20, 32, 16), cols = [], p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var t = (p.getY(i) / 20 + 1) / 2;
      var c = srgb(THREE, '#8FB6B4').lerp(srgb(THREE, '#F2FBFA'), Math.pow(t, 0.8));
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    function softbox(w, h, x, y, z, s) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(s, s, s), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); scene.add(m);
    }
    softbox(10, 7, -9, 8, 9, 6);
    softbox(6, 9, 12, 2, 4, 3.5);
    softbox(14, 3, 0, 12, -6, 4);
    var pm = new THREE.PMREMGenerator(renderer);
    var tex = pm.fromScene(scene, 0.03).texture;
    pm.dispose();
    return tex;
  }

  function contactShadowTexture(THREE) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(143,229,219,0.55)'); g.addColorStop(0.55, 'rgba(143,229,219,0.16)'); g.addColorStop(1, 'rgba(143,229,219,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function sparkleTexture(THREE) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function buildSparkles(THREE, count) {
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3), palette = [[0.56, 0.9, 0.86], [1, 1, 1], [1, 0.82, 0.37], [1, 0.62, 0.56]];
    for (var i = 0; i < count; i++) {
      var r = 2.3 + Math.random() * 1.9, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 4.6;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * r;
      var c = palette[i % palette.length]; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var m = new THREE.PointsMaterial({ size: 0.16, map: sparkleTexture(THREE), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
    return new THREE.Points(g, m);
  }

  /* ---------- Scene and interaction (browser only) ---------- */
  function init(opts) {
    var THREE = root.THREE, host = opts.container;
    if (!THREE || !host) return null;
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.environment = buildEnvironment(THREE, renderer);
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.1, 8.2);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfe6e2, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(-3, 5, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0x8fe5db, 1.1); rim.position.set(4, 1, -4); scene.add(rim);
    var warm = new THREE.PointLight(0xffb199, 0.9, 14); warm.position.set(-3.5, -1.5, 3); scene.add(warm);
    var sparkles = buildSparkles(THREE, 70); scene.add(sparkles);

    var tooth = buildTooth(THREE);
    var pivot = new THREE.Group(); pivot.add(tooth.group); scene.add(pivot);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: contactShadowTexture(THREE), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.95; scene.add(shadow);

    var state = { yaw: -0.5, pitch: 0.12, vy: 0, vp: 0, target: null, drag: false, lx: 0, ly: 0, idleUntil: 0, running: false, visible: true };
    var dots = {};
    (opts.dots || []).forEach(function (d) { dots[d.dataset.anchor] = d; });
    var tmp = new THREE.Vector3();

    function resize() {
      var w = host.clientWidth || 400, h = host.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.85 ? 9.6 : 8.2;   // keep the whole tooth in frame on narrow stages
      camera.updateProjectionMatrix();
    }
    resize();
    if (root.ResizeObserver) new ResizeObserver(resize).observe(host); else root.addEventListener('resize', resize);

    host.addEventListener('pointerdown', function (e) {
      state.drag = true; state.lx = e.clientX; state.ly = e.clientY; state.target = null;
      host.setPointerCapture(e.pointerId); host.classList.add('is-dragging');
      if (opts.onInteract) opts.onInteract();
      kick();
    });
    host.addEventListener('pointermove', function (e) {
      if (!state.drag) return;
      var dx = e.clientX - state.lx, dy = e.clientY - state.ly; state.lx = e.clientX; state.ly = e.clientY;
      state.vy = dx * 0.010; state.vp = dy * 0.006;
      state.yaw += state.vy; state.pitch = Math.max(-0.5, Math.min(0.6, state.pitch + state.vp));
      kick();
    });
    function up() { state.drag = false; host.classList.remove('is-dragging'); state.idleUntil = performance.now() + 2500; kick(); }
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { state.yaw -= 0.25; kick(); }
      if (e.key === 'ArrowRight') { state.yaw += 0.25; kick(); }
    });

    function focusOn(name) {
      var a = tooth.anchors[name]; if (!a) return;
      var t = -Math.atan2(a.x, a.z), cur = state.yaw;      // turn the anchor toward the viewer
      while (t - cur > Math.PI) t -= Math.PI * 2;
      while (t - cur < -Math.PI) t += Math.PI * 2;
      state.target = t; state.idleUntil = performance.now() + 5000; kick();
    }

    var last = performance.now();
    function frame(now) {
      state.running = false;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var moving = false;
      if (state.target !== null) {
        var d = state.target - state.yaw; state.yaw += d * Math.min(1, dt * 5);
        if (Math.abs(d) < 0.002) state.target = null;
        moving = true;
      } else if (!state.drag) {
        state.vy *= Math.pow(0.02, dt);
        if (Math.abs(state.vy) > 0.0004) { state.yaw += state.vy; moving = true; }
        if (!reduce && now > state.idleUntil) { state.yaw += dt * 0.32; moving = true; }
        state.pitch += (0.12 - state.pitch) * Math.min(1, dt * 0.8);
      } else moving = true;

      var bob = reduce ? 0 : Math.sin(now / 1400) * 0.06;
      pivot.rotation.y = state.yaw; pivot.rotation.x = state.pitch; pivot.position.y = bob;
      sparkles.rotation.y = now / 9000; sparkles.position.y = Math.sin(now / 2200) * 0.08;
      shadow.scale.setScalar(1 - bob * 0.6); shadow.material.opacity = 1 - bob * 0.8;
      renderer.render(scene, camera);

      // markers follow their anchors and hide when they turn away from the viewer
      var w = host.clientWidth, h = host.clientHeight;
      for (var k in dots) {
        var a = tooth.anchors[k]; if (!a) continue;
        tmp.copy(a); tooth.group.localToWorld(tmp);
        var facing = tmp.z - pivot.position.z > 0.15;
        tmp.project(camera);
        dots[k].style.transform = 'translate(' + ((tmp.x * 0.5 + 0.5) * w) + 'px,' + ((-tmp.y * 0.5 + 0.5) * h) + 'px)';
        dots[k].style.opacity = facing ? 1 : 0;
      }
      if (!reduce || moving) kick();
    }
    function kick() { if (!state.running && state.visible && !document.hidden) { state.running = true; requestAnimationFrame(frame); } }

    if (root.IntersectionObserver) {
      new IntersectionObserver(function (en) {
        state.visible = en[0].isIntersecting;
        if (state.visible) { last = performance.now(); kick(); }
      }).observe(host);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = performance.now(); kick(); } });
    kick();
    return { focusOn: focusOn, destroy: function () { renderer.dispose(); } };
  }

  var api = { buildTooth: buildTooth, init: init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ToothScene = api;
})(typeof window !== 'undefined' ? window : globalThis);
