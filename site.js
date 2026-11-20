/* ===== 3D WebGL globe (Three.js). Falls back to the 2D canvas globe if WebGL is unavailable. ===== */
(function(){
  var canvas = document.getElementById('globe');
  if (!canvas || !window.THREE) return;
  var T = THREE, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, renderer;
  try { renderer = new T.WebGLRenderer({canvas: canvas, antialias: true, alpha: true}); } catch (e) { return; }
  if (!renderer.getContext()) return;
  window.__globe3d = true;
  document.documentElement.classList.add('globe3d');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene(), cam = new T.PerspectiveCamera(36, 1, .1, 100);
  cam.position.set(0, 0, 7);
  var world = new T.Group(); scene.add(world);
  var R = 1.55, D = Math.PI / 180, ADD = T.AdditiveBlending, UP = new T.Vector3(0, 1, 0), FWD = new T.Vector3(0, 0, 1);
  function v3(ll, r){ var la = ll[0]*D, lo = ll[1]*D; return new T.Vector3(Math.cos(la)*Math.sin(lo)*r, Math.sin(la)*r, Math.cos(la)*Math.cos(lo)*r); }
  var BLUE = {dot:'#9fd8ff', arc:'#ffb547', home:'#5cc8ff', atm:'#2aa6ff', ring:'#5cc8ff'};
  var RED  = {dot:'#ffb3bd', arc:'#ff5d73', home:'#ff5d73', atm:'#ff2d55', ring:'#ffb547'};
  var red = false, P = BLUE;

  /* soft glow sprite */
  var gcv = document.createElement('canvas'); gcv.width = gcv.height = 64;
  var g2 = gcv.getContext('2d'), grd = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.22, 'rgba(255,255,255,.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grd; g2.fillRect(0, 0, 64, 64);
  var glowTex = new T.CanvasTexture(gcv);
  function glow(color, s){ var sp = new T.Sprite(new T.SpriteMaterial({map: glowTex, color: new T.Color(color), blending: ADD, transparent: true, depthWrite: false})); sp.scale.set(s, s, 1); return sp; }

  /* dark core hides the far side */
  world.add(new T.Mesh(new T.SphereGeometry(R*.992, 64, 64), new T.MeshBasicMaterial({color: 0x060a13})));

  /* dot shell */
  var N = 5600, pos = new Float32Array(N*3);
  for (var i = 0; i < N; i++){ var y = 1 - (i + .5)*2/N, rr = Math.sqrt(1 - y*y), th = i*2.39996323; pos[i*3] = Math.cos(th)*rr*R; pos[i*3+1] = y*R; pos[i*3+2] = Math.sin(th)*rr*R; }
  var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(pos, 3));
  var dotM = new T.PointsMaterial({color: new T.Color(P.dot), size: .02, transparent: true, opacity: .7, depthWrite: false});
  world.add(new T.Points(dg, dotM));

  /* graticule */
  var gratM = new T.LineBasicMaterial({color: new T.Color(P.home), transparent: true, opacity: .09, depthWrite: false});
  for (var lat = -60; lat <= 60; lat += 30){ var a = []; for (var lo = 0; lo <= 360; lo += 6) a.push(v3([lat, lo], R*1.001)); world.add(new T.Line(new T.BufferGeometry().setFromPoints(a), gratM)); }
  for (var lo2 = 0; lo2 < 360; lo2 += 30){ var b = []; for (var la2 = -90; la2 <= 90; la2 += 6) b.push(v3([la2, lo2], R*1.001)); world.add(new T.Line(new T.BufferGeometry().setFromPoints(b), gratM)); }

  /* atmosphere */
  var atmU = {c: {value: new T.Color(P.atm)}};
  scene.add(new T.Mesh(new T.SphereGeometry(R*1.22, 64, 64), new T.ShaderMaterial({
    uniforms: atmU, transparent: true, depthWrite: false, blending: ADD, side: T.BackSide,
    vertexShader: 'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 c;varying vec3 n;void main(){float i=pow(max(0.0,0.62-dot(n,vec3(0.0,0.0,1.0))),3.0)*0.9;gl_FragColor=vec4(c*i,i);}'
  })));

  /* home: Guelph, with a shield dome */
  var HOME = [43.55, -80.25], H = v3(HOME, R);
  var homeDot = new T.Mesh(new T.SphereGeometry(.03, 16, 16), new T.MeshBasicMaterial({color: new T.Color(P.home)}));
  homeDot.position.copy(H); world.add(homeDot);
  var homeGlow = glow(P.home, .42); homeGlow.position.copy(H); world.add(homeGlow);
  var dome = new T.Mesh(new T.SphereGeometry(.27, 28, 12, 0, Math.PI*2, 0, Math.PI/2),
    new T.MeshBasicMaterial({color: new T.Color(P.home), wireframe: true, transparent: true, opacity: .25, blending: ADD, depthWrite: false}));
  dome.position.copy(H); dome.quaternion.setFromUnitVectors(UP, H.clone().normalize()); world.add(dome);

  /* orbit + satellites */
  var orbit = new T.Group(); orbit.rotation.set(1.18, 0, .38); scene.add(orbit);
  var oc = []; for (var o = 0; o <= 128; o++){ var an = o/128*Math.PI*2; oc.push(new T.Vector3(Math.cos(an)*R*1.3, Math.sin(an)*R*1.3, 0)); }
  var orbM = new T.LineBasicMaterial({color: new T.Color(P.home), transparent: true, opacity: .22, depthWrite: false});
  orbit.add(new T.Line(new T.BufferGeometry().setFromPoints(oc), orbM));
  var sats = [glow(P.home, .2), glow(P.arc, .16)]; sats.forEach(function(s){ orbit.add(s); });

  /* impact rings */
  var rings = [];
  function burst(at, color){
    var m = new T.Mesh(new T.RingGeometry(.05, .066, 48), new T.MeshBasicMaterial({color: new T.Color(color), transparent: true, side: T.DoubleSide, blending: ADD, depthWrite: false}));
    m.position.copy(at.clone().multiplyScalar(1.004)); m.quaternion.setFromUnitVectors(FWD, at.clone().normalize());
    world.add(m); rings.push({m: m, t: 0});
  }

  /* attack arcs */
  var SRC = [[51.5,-0.1],[55.75,37.6],[39.9,116.4],[1.35,103.8],[-23.5,-46.6],[35.7,139.7],[52.5,13.4],[25.2,55.3],[19.4,-99.1],[28.6,77.2],
             [-33.9,151.2],[6.5,3.4],[59.3,18.1],[37.6,127],[-1.3,36.8],[48.9,2.35],[40.4,-3.7],[-34.6,-58.4],[5.6,-0.19],[64.1,-21.9]];
  var arcs = [], SEG = 90;
  function spawn(){
    var s = v3(SRC[(Math.random()*SRC.length)|0], R), from = red ? H : s, to = red ? s : H;
    var A = from.clone().normalize(), B = to.clone().normalize(), w = A.angleTo(B), sw = Math.sin(w) || 1, lift = .08 + .42*(w/Math.PI), pts = [];
    for (var i = 0; i <= SEG; i++){
      var t = i/SEG, k1 = Math.sin((1-t)*w)/sw, k2 = Math.sin(t*w)/sw;
      pts.push(A.clone().multiplyScalar(k1).add(B.clone().multiplyScalar(k2)).multiplyScalar(R*(1 + lift*Math.sin(Math.PI*t))));
    }
    var g = new T.BufferGeometry().setFromPoints(pts); g.setDrawRange(0, 0);
    var mat = new T.LineBasicMaterial({color: new T.Color(P.arc), transparent: true, opacity: .95, blending: ADD, depthWrite: false});
    var line = new T.Line(g, mat), head = glow(P.arc, .24), src = glow(P.arc, .16);
    src.position.copy(from); world.add(line); world.add(head); world.add(src);
    arcs.push({line: line, g: g, mat: mat, head: head, src: src, pts: pts, to: to, t: 0, sp: .0045 + Math.random()*.005, done: false, fade: 1});
  }
  var count = 0, countEls = document.querySelectorAll('.blocked');
  function step(){
    for (var i = arcs.length - 1; i >= 0; i--){
      var a = arcs[i];
      if (!a.done){
        a.t = Math.min(1, a.t + a.sp);
        var n = Math.max(2, Math.round(a.t*SEG) + 1); a.g.setDrawRange(0, n); a.head.position.copy(a.pts[n-1]);
        if (a.t >= 1){
          a.done = true; burst(a.to, P.ring); count++;
          countEls.forEach(function(e){ e.textContent = count; });
          world.remove(a.head); a.head.material.dispose();
        }
      } else {
        a.fade -= .02; a.mat.opacity = a.fade; a.src.material.opacity = a.fade;
        if (a.fade <= 0){ world.remove(a.line); world.remove(a.src); a.g.dispose(); a.mat.dispose(); a.src.material.dispose(); arcs.splice(i, 1); }
      }
    }
    for (var j = rings.length - 1; j >= 0; j--){
      var r = rings[j]; r.t += .02; var sc = 1 + r.t*5; r.m.scale.set(sc, sc, sc); r.m.material.opacity = Math.max(0, 1 - r.t);
      if (r.t >= 1){ world.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(j, 1); }
    }
  }

  /* HTML label that tracks Guelph */
  var host = canvas.parentElement, label = document.getElementById('glabel'), tmp = new T.Vector3();
  function placeLabel(){
    if (!label) return;
    homeDot.getWorldPosition(tmp); var facing = tmp.z > .35;
    tmp.project(cam);
    var cr = canvas.getBoundingClientRect(), hr = host.getBoundingClientRect();
    var x = cr.left - hr.left + (tmp.x + 1)/2*cr.width + 16, y = cr.top - hr.top + (1 - tmp.y)/2*cr.height - 30;
    x = Math.min(x, hr.width - label.offsetWidth - 4);
    if (x < cr.left - hr.left + (tmp.x + 1)/2*cr.width - 8) y -= 22;
    label.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    label.style.opacity = facing ? '1' : '0';
  }

  window.__globeMode = function(on){
    red = on; P = on ? RED : BLUE;
    dotM.color.set(P.dot); gratM.color.set(P.home); atmU.c.value.set(P.atm); homeDot.material.color.set(P.home);
    homeGlow.material.color.set(P.home); dome.material.color.set(P.home); orbM.color.set(P.home);
    sats[0].material.color.set(P.home); sats[1].material.color.set(P.arc);
    if (label) label.textContent = on ? 'GUELPH · RED TEAM HQ' : 'GUELPH · PROTECTED';
  };

  function size(){ var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w/h; cam.updateProjectionMatrix(); }
  size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(canvas); else addEventListener('resize', size);
  var visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }).observe(canvas);

  var mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener('pointermove', function(e){ mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; }, {passive: true});

  var last = 0, t0 = performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = (now - t0)/1000;
    tx += (mx - tx)*.04; ty += (my - ty)*.04;
    world.rotation.y = -HOME[1]*D + (reduce ? 0 : Math.sin(t*.13)*.9) + tx*.7;
    world.rotation.x = .5 + ty*.45;
    if (!reduce && now - last > (red ? 480 : 680) && arcs.length < 10){ last = now; spawn(); }
    step();
    dome.material.opacity = .16 + .1*Math.sin(t*3);
    homeGlow.scale.setScalar(.38 + .08*Math.sin(t*4));
    sats[0].position.set(Math.cos(t*.5)*R*1.3, Math.sin(t*.5)*R*1.3, 0);
    sats[1].position.set(Math.cos(t*.33 + 2)*R*1.3, Math.sin(t*.33 + 2)*R*1.3, 0);
    if (!reduce){
      var sy = Math.min(window.scrollY, 700);
      canvas.style.transform = 'translate(-50%,-50%) scale(' + (1 + sy/700*.45).toFixed(3) + ')';
      canvas.style.opacity = String(Math.max(0, 1 - sy/850));
    }
    renderer.render(scene, cam); placeLabel();
  }
  requestAnimationFrame(frame);
})();
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* network canvas: nodes drift, links form when close, a few nodes flag amber like hot alerts */
  var c = document.getElementById('net'), x = c.getContext('2d'), W, H, dpr, nodes = [];
  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr,0,0,dpr,0,0);
    var n = Math.round(Math.min(90, W * H / 16000)); nodes = [];
    for (var i = 0; i < n; i++) nodes.push({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25, hot:Math.random()<.07, p:Math.random()*6.28});
  }
  function draw(t){
    x.clearRect(0,0,W,H);
    for (var i = 0; i < nodes.length; i++){
      var a = nodes[i];
      if (!reduce){ a.x += a.vx; a.y += a.vy; if (a.x<0||a.x>W) a.vx*=-1; if (a.y<0||a.y>H) a.vy*=-1; }
      for (var j = i+1; j < nodes.length; j++){
        var b = nodes[j], dx = a.x-b.x, dy = a.y-b.y, d = dx*dx+dy*dy;
        if (d < 19600){ x.strokeStyle = 'rgba(' + (window.__glow || '92,200,255') + ',' + (0.16*(1-d/19600)) + ')'; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke(); }
      }
    }
    for (var k = 0; k < nodes.length; k++){
      var p = nodes[k];
      if (p.hot){
        var r = 2.6 + (reduce ? 0 : Math.sin(t/500 + p.p) * 1.2);
        x.fillStyle = 'rgba(255,181,71,.18)'; x.beginPath(); x.arc(p.x,p.y,r*3.2,0,6.28); x.fill();
        x.fillStyle = '#ffb547'; x.beginPath(); x.arc(p.x,p.y,r,0,6.28); x.fill();
      } else { x.fillStyle = 'rgba(160,215,255,.55)'; x.beginPath(); x.arc(p.x,p.y,1.6,0,6.28); x.fill(); }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  size(); requestAnimationFrame(draw);
  var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ size(); if (reduce) draw(0); }, 150); });

  /* cursor glow + card spotlight */
  var g = document.getElementById('glow');
  if (!reduce && matchMedia('(pointer:fine)').matches){
    addEventListener('pointermove', function(e){ g.style.opacity = 1; g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }, {passive:true});
  }
  document.querySelectorAll('.spot').forEach(function(el){
    el.addEventListener('pointermove', function(e){ var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX-r.left)+'px'); el.style.setProperty('--my', (e.clientY-r.top)+'px'); });
  });

  /* count-up stats: final values are already in the HTML; this only animates them once when seen */
  if (!reduce && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if (!en.isIntersecting) return; io.unobserve(en.target);
        en.target.querySelectorAll('[data-count]').forEach(function(s){
          var to = +s.dataset.count, from = s.dataset.from ? +s.dataset.from : 0, t0 = null, dur = 1400;
          (function step(ts){ if (!t0) t0 = ts; var k = Math.min(1,(ts-t0)/dur), e = 1-Math.pow(1-k,3);
            s.textContent = Math.round(from + (to-from)*e); if (k < 1) requestAnimationFrame(step); })(performance.now());
        });
      });
    }, {threshold:.5});
    document.querySelectorAll('.stat').forEach(function(s){ io.observe(s); });
  }

  /* terminal: replays the alert feed with typing, looping */
  var term = document.getElementById('term');
  if (!reduce && term){
    var lines = Array.prototype.slice.call(term.children);
    var cmd = lines[0], cmdText = cmd.textContent;
    function run(){
      lines.forEach(function(l,i){ if (i) l.style.visibility = 'hidden'; });
      cmd.textContent = ''; var i = 0;
      (function type(){
        cmd.textContent = cmdText.slice(0, ++i);
        if (i < cmdText.length) setTimeout(type, 28 + Math.random()*40);
        else { var n = 1; (function show(){ if (n < lines.length){ lines[n].style.visibility = 'visible'; n++; setTimeout(show, n === 2 ? 700 : 520); } else setTimeout(run, 6500); })(); }
      })();
    }
    setTimeout(run, 2400);
  }

  /* copy email */
  document.getElementById('copy').addEventListener('click', function(){
    var b = this, t = document.getElementById('email').textContent;
    function done(){ b.textContent = 'Copied ✓'; setTimeout(function(){ b.textContent = 'Copy email'; }, 1600); }
    function fallback(){ var r = document.createRange(); r.selectNodeContents(document.getElementById('email')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText(t).then(done, fallback); } catch (e) { fallback(); }
  });
})();

(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---- name decrypt ---- */
  function scramble(){
    var el = document.querySelector('h1 .grad'); if (!el || reduce) return;
    var final = el.textContent, glyphs = '!<>-_\\/[]{}=+*^?#01XZ%$', f = 0;
    (function tick(){
      var out = '';
      for (var i = 0; i < final.length; i++){
        if (f > i * 1.6 + 6 || final[i] === '-') out += final[i];
        else out += glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out; f++;
      if (out !== final) setTimeout(tick, 32); else el.textContent = final;
    })();
  }

  /* ---- boot sequence ---- */
  var seen = false; try { seen = sessionStorage.getItem('papa-booted') === '1'; } catch (e) {}
  if (reduce || seen) { setTimeout(scramble, 500); }
  else {
    root.classList.add('boot-on', 'boot-hold');
    var boot = document.getElementById('boot'), log = document.getElementById('bootlog'), done = false, timers = [];
    var lines = [
      '&gt; establishing secure session ............. <b>OK</b>',
      '&gt; syncing threat feeds  [NVD · CISA KEV] ... <b>OK</b>',
      '&gt; verifying credentials   Security+ <b>✓</b>  ISC2 CC <b>✓</b>  MSc <b>✓</b>',
      '&gt; loading analyst profile: orleans-bosomtwe.p',
      '<span class="grant">ACCESS GRANTED</span>'
    ];
    lines.forEach(function(l, i){ timers.push(setTimeout(function(){ log.innerHTML += (i ? '\n' : '') + l; }, 120 + i * 330)); });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ document.getElementById('bootbar').style.width = '100%'; }); });
    var finish = function(){
      if (done) return; done = true; timers.forEach(clearTimeout);
      try { sessionStorage.setItem('papa-booted', '1'); } catch (e) {}
      root.classList.remove('boot-hold'); boot.classList.add('out');
      setTimeout(function(){ root.classList.remove('boot-on'); }, 800);
      setTimeout(scramble, 350);
      removeEventListener('keydown', finish); removeEventListener('pointerdown', finish);
    };
    timers.push(setTimeout(finish, 2250));
    setTimeout(finish, 4500); /* failsafe */
    addEventListener('keydown', finish); addEventListener('pointerdown', finish);
  }

  /* ---- globe: attacks arc toward Guelph and get blocked ---- */
  var gc = document.getElementById('globe');
  if (gc && !window.__globe3d){
    var gx = gc.getContext('2d'), GS = 0, gdpr = 1, pts = [], arcs = [], bursts = [], D = Math.PI / 180;
    var home = [43.55, -80.25];
    var src = [[51.5,-0.1],[55.75,37.6],[39.9,116.4],[1.35,103.8],[-23.5,-46.6],[35.7,139.7],[52.5,13.4],[25.2,55.3],[19.4,-99.1],[28.6,77.2],[-33.9,151.2],[6.5,3.4],[59.3,18.1],[37.6,127]];
    for (var i = 0, N = 1100; i < N; i++){ var y = 1 - (i + .5) * 2 / N, r = Math.sqrt(1 - y*y), th = i * 2.39996; pts.push([Math.cos(th)*r, y, Math.sin(th)*r]); }
    function vec(ll){ var la = ll[0]*D, lo = ll[1]*D; return [Math.cos(la)*Math.sin(lo), Math.sin(la), Math.cos(la)*Math.cos(lo)]; }
    var H = vec(home);
    function gsize(){ var b = gc.getBoundingClientRect(); gdpr = Math.min(devicePixelRatio || 1, 2); GS = b.width; gc.width = GS*gdpr; gc.height = GS*gdpr; gx.setTransform(gdpr,0,0,gdpr,0,0); }
    var rot = 0, tilt = 0.42;
    function proj(v){
      var cr = Math.cos(rot), sr = Math.sin(rot), x = v[0]*cr + v[2]*sr, z = -v[0]*sr + v[2]*cr;
      var ct = Math.cos(tilt), st = Math.sin(tilt), y = v[1]*ct - z*st, z2 = v[1]*st + z*ct;
      var R = GS * .36; return [GS/2 + x*R, GS/2 - y*R, z2];
    }
    function slerp(a, b, t){
      var d = a[0]*b[0] + a[1]*b[1] + a[2]*b[2], w = Math.acos(Math.min(1, d)), s = Math.sin(w) || 1;
      var k1 = Math.sin((1-t)*w)/s, k2 = Math.sin(t*w)/s, h = 1 + .32*Math.sin(Math.PI*t);
      return [(a[0]*k1 + b[0]*k2)*h, (a[1]*k1 + b[1]*k2)*h, (a[2]*k1 + b[2]*k2)*h];
    }
    var last = 0;
    function gdraw(t){
      if (!GS) gsize();
      rot = -home[1]*D + (reduce ? 0 : Math.sin(t/7000) * 1.1); /* keep Guelph facing the viewer */
      gx.clearRect(0, 0, GS, GS);
      var R = GS*.36, c = GS/2;
      var atm = gx.createRadialGradient(c, c, R*.8, c, c, R*1.35);
      atm.addColorStop(0, 'rgba(92,200,255,.10)'); atm.addColorStop(1, 'rgba(92,200,255,0)');
      gx.fillStyle = atm; gx.beginPath(); gx.arc(c, c, R*1.35, 0, 6.29); gx.fill();
      gx.strokeStyle = 'rgba(92,200,255,.18)'; gx.lineWidth = 1; gx.beginPath(); gx.arc(c, c, R, 0, 6.29); gx.stroke();
      for (var i = 0; i < pts.length; i++){ var p = proj(pts[i]); if (p[2] > 0){ gx.fillStyle = 'rgba(150,210,255,' + (.08 + .5*p[2]) + ')'; gx.fillRect(p[0]-.8, p[1]-.8, 1.6, 1.6); } }
      if (!reduce && t - last > 650 && arcs.length < 7){ last = t; arcs.push({a: vec(src[(Math.random()*src.length)|0]), t: 0, sp: .006 + Math.random()*.006}); }
      for (var j = arcs.length - 1; j >= 0; j--){
        var A = arcs[j]; if (!reduce) A.t += A.sp; var tt = Math.min(1, A.t);
        gx.lineWidth = 1.6; var prev = null;
        for (var s = 0; s <= 40; s++){
          var u = s/40 * tt, q = proj(slerp(A.a, H, u));
          if (prev && q[2] > -.15 && prev[2] > -.15){ gx.strokeStyle = 'rgba(255,181,71,' + (.15 + .65*(s/40)) + ')'; gx.beginPath(); gx.moveTo(prev[0], prev[1]); gx.lineTo(q[0], q[1]); gx.stroke(); }
          prev = q;
        }
        if (prev && prev[2] > -.15){ gx.fillStyle = '#ffd38a'; gx.shadowColor = '#ffb547'; gx.shadowBlur = 12; gx.beginPath(); gx.arc(prev[0], prev[1], 2.6, 0, 6.29); gx.fill(); gx.shadowBlur = 0; }
        if (A.t >= 1){ arcs.splice(j, 1); bursts.push({r: 0}); }
      }
      var hp = proj(H);
      for (var k = bursts.length - 1; k >= 0; k--){
        var B = bursts[k]; B.r += 1.1; var al = 1 - B.r/42;
        if (al <= 0){ bursts.splice(k, 1); continue; }
        gx.strokeStyle = 'rgba(92,200,255,' + al + ')'; gx.lineWidth = 2; gx.beginPath(); gx.arc(hp[0], hp[1], B.r, 0, 6.29); gx.stroke();
      }
      gx.fillStyle = '#5cc8ff'; gx.shadowColor = '#5cc8ff'; gx.shadowBlur = 18; gx.beginPath(); gx.arc(hp[0], hp[1], 4.5, 0, 6.29); gx.fill(); gx.shadowBlur = 0;
      gx.font = '500 11px "Geist Mono", monospace'; gx.fillStyle = 'rgba(233,238,248,.85)'; gx.fillText('GUELPH · PROTECTED', hp[0] + 10, hp[1] - 10);
      if (!reduce) requestAnimationFrame(gdraw);
    }
    requestAnimationFrame(gdraw);
    addEventListener('resize', function(){ GS = 0; if (reduce) requestAnimationFrame(gdraw); });
  }

  /* ---- scroll progress ---- */
  var bar = document.getElementById('scanbar'), ticking = false;
  function prog(){ var m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (m > 0 ? scrollY/m : 0) + ')'; ticking = false; }
  addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(prog); } }, {passive: true}); prog();

  /* ---- reticle cursor ---- */
  if (!reduce && matchMedia('(pointer:fine)').matches){
    root.classList.add('reticle-on');
    var dot = document.getElementById('rdot'), ring = document.getElementById('rring'), mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('pointermove', function(e){ mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; }, {passive: true});
    (function follow(){ rx += (mx - rx) * .2; ry += (my - ry) * .2; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(follow); })();
    document.addEventListener('pointerover', function(e){ ring.classList.toggle('lock', !!e.target.closest('a,button,.spot')); });
    document.addEventListener('pointerleave', function(){ mx = my = -100; });
  }

  /* ---- glitch section titles as they arrive ---- */
  if (!reduce && 'IntersectionObserver' in window){
    var gio = new IntersectionObserver(function(es){ es.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('glitch'); gio.unobserve(en.target); } }); }, {threshold: .6});
    document.querySelectorAll('section h2').forEach(function(h){ gio.observe(h); h.addEventListener('animationend', function(){ h.classList.remove('glitch'); }); });
  }

  /* ---- 3D tilt ---- */
  if (!reduce && matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.b-main,.b-side,.b-sm,.stat,.cert').forEach(function(el){
      el.classList.add('tilt');
      el.addEventListener('pointermove', function(e){ var r = el.getBoundingClientRect(), px = (e.clientX - r.left)/r.width - .5, py = (e.clientY - r.top)/r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py*6) + 'deg) rotateY(' + (px*7) + 'deg) translateY(-3px)'; });
      el.addEventListener('pointerleave', function(){ el.style.transform = ''; });
    });
  }

  /* ---- interactive terminal ---- */
  var dlg = document.getElementById('tty'), out = document.getElementById('ttyout'), inp = document.getElementById('ttyin'), hist = [], hi = 0;
  var MAIL = 'papa.orleans-bosomtwe@outlook.com', LI = 'https://www.linkedin.com/in/papakobosomtwe';
  var C = {
    help: function(){ return '<span class="c">Available commands</span>\n  whoami        who I am\n  experience    where I\'ve worked\n  projects      tools I\'ve built\n  skills        my toolkit\n  certs         certifications &amp; education\n  scan          run a VulnIntel demo scan\n  resume        get my resume\n  contact       how to reach me\n  sudo hire papa\n  clear · exit'; },
    whoami: function(){ return '<span class="c">Papa Kobina Orleans-Bosomtwe</span>\nInformation Security Analyst · Guelph, ON\nMSc Cybersecurity &amp; Threat Intelligence (U of Guelph)\nCompTIA Security+ · ISC2 CC\n<span class="g">● Open to work · Eligible to work in Canada</span>\nTargets: InfoSec Analyst · GRC / Compliance · SOC · IT Support'; },
    experience: function(){ return '<span class="c">2022–2023  Information Security Analyst · Margins Group</span>\n  Sentinel alert triage &amp; hunts · Defender for Endpoint · Entra ID\n  ISO 27001 gap work · ISO 22301 risk register · PCI DSS evidence\n  <span class="g">Cut monthly non-compliant assets 15 → 5</span>\n<span class="c">2021       IT Security Intern · Perfect Business Services</span>\n  <span class="g">120+ tickets/month at 90% first-contact resolution</span>'; },
    projects: function(){ return '<span class="c">VulnIntel</span>   CVE + CISA KEV matching against your real software stack\n            FastAPI · React/TS · PostgreSQL · Docker\n            <a href="https://vulnintel.onrender.com" target="_blank" rel="noopener">vulnintel.onrender.com ↗</a>\n<span class="c">VendorGuard</span> third-party risk scores, compliance &amp; cert tracking\n            <a href="https://vendor-guard-b0c94021.base44.app" target="_blank" rel="noopener">open live app ↗</a>'; },
    skills: function(){ return '<span class="c">secops</span>   Sentinel · Defender · Fortinet · Kibana · IR\n<span class="c">identity</span> Entra ID · Intune · Purview · access reviews\n<span class="c">grc</span>      ISO 27001 · ISO 22301 · risk registers · vendor reviews · PCI DSS\n<span class="c">vuln</span>     CVE · CVSS · CISA KEV · OWASP Top 10\n<span class="c">dev</span>      Python · FastAPI · React · TypeScript · PostgreSQL · Docker'; },
    certs: function(){ return '<span class="g">✓</span> CompTIA Security+\n<span class="g">✓</span> ISC2 Certified in Cybersecurity\n<span class="g">✓</span> Cisco Cybersecurity Essentials &amp; Threat Mgmt\n<span class="d">○ Microsoft SC-200 (planned)</span>\n<span class="c">MSc</span> Cybersecurity &amp; Threat Intelligence · U of Guelph · 2025\n<span class="c">BSc</span> Management Information Systems · Ashesi University · 2022'; },
    resume: function(){ return 'Resume: <a href="resume.pdf" target="_blank" rel="noopener">resume.pdf ↗</a>'; },
    contact: function(){ return 'email     <span class="c">' + MAIL + '</span>\nlinkedin  <a href="' + LI + '" target="_blank" rel="noopener">linkedin.com/in/papakobosomtwe ↗</a>\nlocation  Guelph, ON · open to KW, GTA, Ottawa, remote'; },
    ls: function(){ return '<span class="c">experience/  projects/  research/  skills/</span>  resume.pdf  contact.txt'; },
    scan: function(){ return '<span class="d">$ vulnintel match --inventory demo</span>\n› 1,284 CVEs checked · 3 affect this stack\n<span class="r">CRIT 10.0</span> CVE-2024-3400  PAN-OS     <span class="h">[KEV]</span>\n<span class="r">CRIT  9.8</span> CVE-2023-34362 MOVEit     <span class="h">[KEV]</span>\n<span class="h">HIGH  9.4</span> CVE-2023-4966  NetScaler  <span class="h">[KEV]</span>\n<span class="g">✓ prioritized by active exploitation</span>'; },
    hire: function(){ return 'Permission denied. Try: <span class="c">sudo hire papa</span>'; },
    'sudo hire papa': function(){ return '[sudo] password for recruiter: ********\n<span class="g">✓ Access granted. Excellent decision.</span>\nNext step: email <span class="c">' + MAIL + '</span>\n          or <a href="mailto:' + MAIL + '?subject=Let%27s%20talk%20about%20a%20role">open a draft in your mail app ↗</a>'; },
    'sudo': function(){ return 'usage: sudo hire papa'; },
    date: function(){ return new Date().toString(); },
    'cat contact.txt': function(){ return C.contact(); },
    'cat resume.pdf': function(){ return C.resume(); },
    'rm -rf /': function(){ return '<span class="r">Nice try.</span> Blocked by policy. Incident logged. 🛡'; }
  };
  function print(h){ out.insertAdjacentHTML('beforeend', h + '\n'); out.scrollTop = out.scrollHeight; }
  function run(raw){
    var cmd = raw.trim().replace(/\s+/g, ' '), key = cmd.toLowerCase();
    print('<span class="g">guest@papa:~$</span> ' + cmd.replace(/[&<>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]; }));
    if (!key) return;
    if (key === 'clear'){ out.innerHTML = ''; return; }
    if (key === 'exit'){ dlg.close(); return; }
    var f = key.indexOf('flag{') === 0 ? C.submit : (C[key] || C[key.split(' ')[0]]);
    var res = f ? f(cmd) : '<span class="r">command not found:</span> ' + key.split(' ')[0].replace(/[&<>]/g, '') + '. Type <span class="c">help</span>.';
    if (res != null) print(res);
  }
  var greeted = false;
  function open(){
    if (dlg.open) return; dlg.showModal();
    if (!greeted){ greeted = true; print('<span class="c">soc-shell v2.6</span> · connected to papa@guelph\nType <span class="c">help</span> to look around, or type <span class="c">ctf</span> to play capture the flag.\n'); }
    setTimeout(function(){ inp.focus(); }, 30);
  }
  window.__tty = {C: C, print: print, open: open, run: run};
  document.getElementById('fab').addEventListener('click', open);
  document.getElementById('ttyx').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
  document.getElementById('ttyform').addEventListener('submit', function(e){ e.preventDefault(); var v = inp.value; if (v.trim()){ hist.push(v); } hi = hist.length; inp.value = ''; run(v); });
  inp.addEventListener('keydown', function(e){
    if (window.__sfx && e.key.length === 1) window.__sfx('type');
    if (e.key === 'ArrowUp' && hi > 0){ hi--; inp.value = hist[hi]; e.preventDefault(); }
    else if (e.key === 'ArrowDown'){ hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); }
    else if (e.key === 'Tab'){ e.preventDefault(); var v = inp.value.toLowerCase(), m = Object.keys(C).filter(function(k){ return k.indexOf(v) === 0; }); if (m.length === 1) inp.value = m[0]; }
  });
  addEventListener('keydown', function(e){
    if (root.classList.contains('boot-on')) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === '/' || e.key === '`'){ e.preventDefault(); open(); }
  });
})();
/* ===== Red team mode, CTF, live KEV feed, toasts, achievements ===== */
(function(){
  var root = document.documentElement, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tty = window.__tty || {}, C = tty.C || {}, print = tty.print || function(){}, openT = tty.open || function(){};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* --- toasts --- */
  function toast(icon, title, sub){
    var box = $('toasts'); if (!box) return;
    var el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = '<span class="ti">' + esc(icon) + '</span><div><b>' + esc(title) + '</b><span>' + esc(sub) + '</span></div>';
    box.appendChild(el); if (window.__sfx) window.__sfx('toast');
    setTimeout(function(){ el.classList.add('bye'); setTimeout(function(){ el.remove(); }, 400); }, 4600);
  }

  window.__toast = toast;

  /* --- red team / blue team --- */
  var red = false, modeBtn = $('mode');
  function setMode(on){
    if (window.__sfx) window.__sfx('mode');
    red = on; root.setAttribute('data-mode', on ? 'red' : 'blue');
    modeBtn.setAttribute('aria-pressed', String(on));
    modeBtn.title = on ? 'Switch to blue team mode' : 'Switch to red team mode';
    window.__glow = on ? '255,93,115' : '92,200,255';
    if (window.__globeMode) window.__globeMode(on);
    var f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
    toast(on ? 'RT' : 'BT', on ? 'Red team mode' : 'Blue team mode', on ? 'Offensive view on. Something new appeared…' : 'Defenses back up.');
  }
  modeBtn.addEventListener('click', function(){ setMode(!red); });

  var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'], kp = 0;
  addEventListener('keydown', function(e){
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kp = k === seq[kp] ? kp + 1 : (k === seq[0] ? 1 : 0);
    if (kp === seq.length){ kp = 0; setMode(!red); toast('↑↓', 'Cheat code accepted', 'Konami code. Respect.'); }
  });

  /* --- capture the flag (flags are checked by SHA-256, never stored in plain text here) --- */
  var HASH = {
    'f00b650bc798192bfd4271e293b95ca24caf6090b59644be850d7a900f4138d2': 1,
    'b3f214a24cfb6c201a747c977b141fa28f933ca6d8f5772a913ec13c98cf3ca1': 2,
    '6e779ef27569de018c17d10d1c24d86591e438ec4d17a730494237343285fdd3': 3
  };
  var got = [];
  try { got = JSON.parse(localStorage.getItem('papa-flags') || '[]'); if (!Array.isArray(got)) got = []; } catch (e) {}
  function save(){ try { localStorage.setItem('papa-flags', JSON.stringify(got)); } catch (e) {} }
  function hud(){ $('flagCount').textContent = got.length; $('flagsBtn').classList.toggle('got', got.length > 0); }
  hud();
  function sha(s){
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function(b){
      return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  C.submit = function(cmd){
    var m = cmd.match(/flag\{[^}\s]*\}/i);
    if (!m) return 'usage: submit flag{...}';
    if (!(window.crypto && crypto.subtle)) return '<span class="r">Flag checks need HTTPS.</span>';
    sha(m[0].toLowerCase()).then(function(h){
      var n = HASH[h];
      if (!n){ print('<span class="r">✗ Invalid flag.</span> Keep hunting. Type <span class="c">ctf</span> for hints.'); return; }
      if (got.indexOf(n) > -1){ print('<span class="h">Flag ' + n + ' is already captured.</span>'); return; }
      got.push(n); save(); hud(); if (window.__sfx) window.__sfx(got.length === 3 ? 'win' : 'flag');
      print('<span class="g">✓ Flag ' + n + ' captured (' + got.length + '/3)</span>');
      toast('⚑', 'Flag captured · ' + got.length + '/3', got.length < 3 ? 'Keep going. Type ctf for hints.' : 'All flags found!');
      if (got.length === 3) setTimeout(win, 900);
    });
    return null;
  };
  C.ctf = function(){
    return '<span class="c">Capture the flag</span> · 3 flags are hidden on this site.\n' +
      'Submit each one here: <span class="c">submit flag{...}</span>   captured: <span class="h">' + got.length + '/3</span>\n\n' +
      'Hints\n  1. Good analysts read the source.\n  2. Hidden files start with a dot. Encoded is not encrypted.\n  3. Some things only appear when you switch sides.';
  };
  C.flags = C.ctf;
  C['ls -a'] = function(){ return '<span class="c">./  ../  .secrets  experience/  projects/  research/  skills/</span>  resume.pdf  contact.txt'; };
  C['ls -la'] = C['ls -a'];
  C['cat .secrets'] = function(){ return '<span class="d"># note to self: base64 is encoding, not encryption</span>\nZmxhZ3tiNHMzNjRfMXNfbjB0XzNuY3J5cHQxMG59'; };
  C.decode = function(cmd){
    var a = cmd.trim().split(' ').slice(-1)[0];
    if (!a || /^(decode|base64|-d)$/i.test(a)) return 'usage: decode &lt;base64 text&gt;';
    try { return esc(atob(a)); } catch (e) { return '<span class="r">decode: that is not valid base64</span>'; }
  };
  C.base64 = function(cmd){ return /\s-d\s/.test(cmd + ' ') ? C.decode(cmd) : 'usage: base64 -d &lt;text&gt;'; };
  C.redteam = function(){ if (!red) setMode(true); return '<span class="r">Red team mode enabled.</span>'; };
  C.blueteam = function(){ if (red) setMode(false); return '<span class="c">Blue team mode enabled.</span>'; };
  C.nmap = function(){
    return 'Starting Nmap scan against papa (Guelph, ON)\nPORT      STATE   SERVICE\n' +
      '22/tcp    open    secops      Sentinel, Defender for Endpoint, Entra ID\n' +
      '443/tcp   open    grc         ISO 27001, ISO 22301, PCI DSS, risk registers\n' +
      '8080/tcp  open    builder     Python, FastAPI, React, PostgreSQL, Docker\n' +
      '3389/tcp  <span class="r">closed</span>  bad-habits\n' +
      '<span class="g">Host is up. 1 analyst found. Status: available.</span>';
  };
  C.headers = function(){
    return 'This site is served with:\n  Content-Security-Policy     no inline scripts, locked-down sources\n  Strict-Transport-Security   2 years, preload\n' +
      '  X-Frame-Options             DENY\n  X-Content-Type-Options      nosniff\n  Referrer-Policy             strict-origin-when-cross-origin\n' +
      '  Permissions-Policy          camera, mic, location off\n  /.well-known/security.txt';
  };
  C.help = function(){
    return '<span class="c">About me</span>\n  whoami  experience  projects  skills  certs  resume  contact\n' +
      '<span class="c">Security toys</span>\n  scan        VulnIntel demo scan\n  kev         live CISA KEV feed\n  nmap papa   scan me\n  headers     this site\'s security headers\n  redteam · blueteam\n' +
      '<span class="c">Capture the flag</span>\n  ctf         rules and hints\n  submit flag{...}\n' +
      '<span class="c">Other</span>\n  sudo hire papa · ls -a · clear · exit';
  };

  $('flagsBtn').addEventListener('click', function(){ openT(); setTimeout(function(){ if (tty.run) tty.run('ctf'); }, 60); });

  /* --- win screen --- */
  function win(){
    var w = $('win'); w.hidden = false;
    try { $('tty').close(); } catch (e) {}
    $('winx').focus();
    if (reduce) return;
    var cv = $('confetti'), cx = cv.getContext('2d'), W = cv.width = innerWidth, Hh = cv.height = innerHeight;
    var cols = ['#5cc8ff','#ffb547','#4fe0a0','#ff6b6b','#ffffff'], ps = [];
    for (var i = 0; i < 240; i++) ps.push({x: W/2, y: Hh*.42, vx: (Math.random() - .5)*18, vy: -Math.random()*17 - 4, s: 5 + Math.random()*6, r: Math.random()*6, vr: (Math.random() - .5)*.3, c: cols[i % cols.length]});
    var start = performance.now();
    (function f(now){
      cx.clearRect(0, 0, W, Hh);
      ps.forEach(function(p){ p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s/2, -p.s/4, p.s, p.s/2); cx.restore(); });
      if (now - start < 4800) requestAnimationFrame(f); else cx.clearRect(0, 0, W, Hh);
    })(start);
  }
  $('winx').addEventListener('click', function(){ $('win').hidden = true; });
  addEventListener('keydown', function(e){ if (e.key === 'Escape' && !$('win').hidden) $('win').hidden = true; });

  /* --- live CISA KEV feed (served by /api/kev on Vercel; falls back to notable entries) --- */
  var FALL = [['CVE-2024-3400','Palo Alto Networks','PAN-OS'],['CVE-2023-4966','Citrix','NetScaler ADC'],['CVE-2023-34362','Progress','MOVEit Transfer'],
              ['CVE-2024-21762','Fortinet','FortiOS'],['CVE-2023-20198','Cisco','IOS XE'],['CVE-2024-1709','ConnectWise','ScreenConnect'],['CVE-2021-44228','Apache','Log4j']];
  function ticker(items, live){
    var html = items.map(function(i){
      return '<span><b>' + esc(i.id) + '</b>' + esc(i.vendor) + ' ' + esc(i.product) + (i.added ? '<em>added ' + esc(i.added) + '</em>' : '') + (i.ransomware ? '<em>ransomware</em>' : '') + '</span>';
    }).join('');
    $('kevtrack').innerHTML = html + html.replace(/<span>/g, '<span aria-hidden="true">');
    $('kevlabel').textContent = live ? 'LIVE · CISA KEV' : 'CISA KEV';
  }
  ticker(FALL.map(function(f){ return {id: f[0], vendor: f[1], product: f[2]}; }), false);
  var kevP = null;
  function getKev(){
    if (!kevP) kevP = fetch('/api/kev', {headers: {accept: 'application/json'}}).then(function(r){ if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    return kevP;
  }
  getKev().then(function(d){ if (d && d.items && d.items.length) ticker(d.items, true); }).catch(function(){});
  C.kev = function(){
    print('<span class="d">querying CISA Known Exploited Vulnerabilities feed…</span>');
    getKev().then(function(d){
      print('<span class="c">Newest actively exploited vulnerabilities</span> · ' + esc(d.count) + ' in catalog\n' +
        d.items.slice(0, 8).map(function(i){ return '<span class="h">' + esc(i.id) + '</span>  ' + esc(i.vendor) + ' ' + esc(i.product) + '  <span class="d">' + esc(i.added) + '</span>'; }).join('\n'));
    }).catch(function(){ print('<span class="r">Live feed unavailable here.</span> On the deployed site this pulls CISA KEV through a Vercel serverless function.'); });
    return null;
  };

  /* --- achievements and hints --- */
  var readDone = false;
  addEventListener('scroll', function(){
    if (readDone) return;
    var m = document.documentElement.scrollHeight - innerHeight;
    if (m > 0 && scrollY/m > .97){ readDone = true; toast('★', 'Achievement: Thorough', 'You read the whole page. Most people skim.'); }
  }, {passive: true});
  if (got.length < 3) setTimeout(function(){ toast('⚑', '3 flags are hidden on this site', 'Press / and type ctf to play.'); }, 7000);

  try {
    console.log('%c PAPA@SOC ', 'background:#5cc8ff;color:#070a12;font:700 14px monospace;padding:4px 8px;border-radius:4px');
    console.log('Hi, fellow curious person. 3 flags are hidden on this site.\nOpen the terminal (press /) and type ctf. Hint: you are already in the right place for flag 1… almost. Try View Source.');
  } catch (e) {}
})();

/* ===== Security lab, sound effects, Guelph clock ===== */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function sfx(n){ if (window.__sfx) window.__sfx(n); }
  function toast(i, t, s){ if (window.__toast) window.__toast(i, t, s); }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }

  /* ---------- sound effects (off by default) ---------- */
  var ac = null, sOn = false;
  try { sOn = localStorage.getItem('papa-sfx') === '1'; } catch (e) {}
  function tone(f, d, type, vol, slide){
    if (!sOn) return;
    if (!ac){ try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol || .06, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .03);
  }
  var S = {
    click: function(){ tone(1300, .04, 'square', .02); },
    ok: function(){ tone(660, .1, 'sine', .07); setTimeout(function(){ tone(990, .18, 'sine', .07); }, 90); },
    bad: function(){ tone(170, .28, 'sawtooth', .05, 80); },
    alert: function(){ tone(880, .07, 'square', .035); setTimeout(function(){ tone(880, .07, 'square', .035); }, 120); },
    flag: function(){ [523, 659, 784, 1047].forEach(function(f, i){ setTimeout(function(){ tone(f, .2, 'triangle', .07); }, i*90); }); },
    mode: function(){ tone(80, .55, 'sawtooth', .06, 640); },
    toast: function(){ tone(1500, .06, 'sine', .03); },
    type: function(){ tone(1700 + Math.random()*500, .015, 'square', .01); },
    win: function(){ [392, 523, 659, 784, 1047, 1319].forEach(function(f, i){ setTimeout(function(){ tone(f, .25, 'triangle', .07); }, i*80); }); }
  };
  window.__sfx = function(n){ if (S[n]) S[n](); };
  var sBtn = $('sfx');
  function sUi(){ sBtn.setAttribute('aria-pressed', String(sOn)); sBtn.title = sOn ? 'Sound effects on' : 'Sound effects off'; }
  sUi();
  sBtn.addEventListener('click', function(){
    sOn = !sOn; try { localStorage.setItem('papa-sfx', sOn ? '1' : '0'); } catch (e) {}
    sUi(); if (sOn){ S.ok(); toast('♪', 'Sound on', 'Every click, alert and flag now makes noise.'); }
  });
  document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('.btn,.lab-tabs button,.ph-samples button,.mode,.flags')) S.click(); });

  /* ---------- Guelph clock ---------- */
  var clk = $('clock');
  function tickClock(){
    if (!clk) return;
    var now = new Date(), fmt = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit'});
    var h = +new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Toronto', hour: 'numeric', hourCycle: 'h23'}).format(now);
    clk.innerHTML = 'It\'s <b>' + esc(fmt.format(now)) + '</b> in Guelph right now. ' + (h >= 7 && h < 23 ? 'I\'m probably awake and checking email.' : 'I\'m probably asleep, but your email will be the first thing I read.');
  }
  tickClock(); setInterval(tickClock, 30000);

  /* ---------- tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.lab-tabs [role="tab"]'));
  var fpDone = false;
  function show(tab){
    tabs.forEach(function(t){
      var on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (tab.id === 't-fp' && !fpDone){ fpDone = true; fingerprint(); }
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ show(t); });
    t.addEventListener('keydown', function(e){
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (j === null) return; e.preventDefault(); var n = tabs[(j + tabs.length) % tabs.length]; show(n); n.focus();
    });
  });

  /* ---------- SOC triage game ---------- */
  var ALERTS = [
    {src:'Microsoft Entra ID', sev:'high', t:'Impossible travel activity', kv:[['User','j.mensah@contoso.ca'],['Sign-in 1','Toronto, CA · 09:02'],['Sign-in 2','Lagos, NG · 09:17'],['Client','Legacy IMAP · MFA not prompted']], a:'esc',
     why:'Two countries 15 minutes apart, over legacy auth that skips MFA. Revoke sessions, reset the password and block legacy authentication.'},
    {src:'Defender for Endpoint', sev:'crit', t:'Encoded PowerShell launched by Word', kv:[['Device','FIN-LT-042'],['Parent process','WINWORD.EXE'],['Command','powershell.exe -nop -w hidden -enc SQBFAFgA…'],['User','a.owusu']], a:'esc',
     why:'Word spawning hidden, encoded PowerShell is classic macro malware. Isolate the device and pull the document.'},
    {src:'Microsoft Sentinel', sev:'med', t:'47 failed sign-ins for svc-backup', kv:[['Account','svc-backup'],['Source','10.0.4.12 (backup server)'],['Pattern','02:00 nightly, every run'],['Context','Password rotated yesterday']], a:'fp',
     why:'Same internal host, same schedule, right after a password rotation. The backup job has a stale credential. Fix the job; this is not an attack.'},
    {src:'Email gateway', sev:'high', t:'User clicked a link in an invoice email', kv:[['Sender','billing@micros0ft-invoices.com'],['Attachment','Invoice_8842.html'],['Clicked by','r.boateng'],['Landing page','Fake Microsoft 365 sign-in']], a:'esc',
     why:'Look-alike domain (a zero for the o) and a credential-harvesting page. Reset the user, purge the email from every inbox and block the domain.'},
    {src:'Fortinet firewall', sev:'low', t:'High volume of outbound DNS', kv:[['Destination','8.8.8.8 : 53'],['Sources','212 internal hosts'],['Pattern','Steady, business hours'],['Context','DHCP hands out 8.8.8.8 as secondary DNS']], a:'fp',
     why:'Normal resolver traffic, explained by the DHCP settings. Worth a ticket to tidy up DNS, but not an incident.'},
    {src:'Defender for Endpoint', sev:'high', t:'HackTool:Win32/Mimikatz detected', kv:[['Device','IT-PENTEST-01'],['User','ext.pentester'],['Change','CHG-2041 · approved pen test'],['Window','Today 09:00–17:00']], a:'fp',
     why:'An authorized, scheduled pen test on the tester\'s own machine. Confirm with the change owner, document it and close.'},
    {src:'Microsoft Entra ID', sev:'crit', t:'Suspicious inbox forwarding rule', kv:[['Mailbox','cfo@contoso.ca'],['Rule','Forward everything to finance.cfo@gmail.com, then delete'],['Created','4 minutes after a sign-in from a new device'],['Network','Unfamiliar hosting provider']], a:'esc',
     why:'Textbook business email compromise. Remove the rule, revoke sessions, reset credentials and check what was already forwarded.'},
    {src:'Intune compliance', sev:'low', t:'Device non-compliant: patch level', kv:[['Device','HR-LT-017'],['Missing','Cumulative update released 3 days ago'],['Policy','14 days to patch'],['Status','Installed, pending reboot']], a:'fp',
     why:'Inside the patch window and already pending a reboot. Track it to resolution (that\'s how I cut non-compliance from 15 to 5), but it\'s not an incident.'},
    {src:'Microsoft Sentinel', sev:'high', t:'certutil used to download a file', kv:[['Device','OPS-SRV-03'],['Command','certutil -urlcache -f http://45.137.x.x/a.exe'],['Account','SYSTEM'],['Reputation','IP linked to an active malware campaign']], a:'esc',
     why:'certutil is a living-off-the-land download trick. Unknown IP, an executable payload and SYSTEM rights. Isolate and investigate.'},
    {src:'KnowBe4', sev:'low', t:'User reported a suspicious email', kv:[['Reporter','k.addo'],['Subject','"Your package is on hold"'],['Campaign','Q4 phishing simulation'],['Sender','Simulation domain']], a:'fp',
     why:'It\'s our own phishing simulation, and the user did exactly the right thing. Close it and thank them.'}
  ];
  var SEV = {crit:'CRITICAL', high:'HIGH', med:'MEDIUM', low:'LOW'};
  var stage = $('triStage'), tri = null;
  function hudT(){ $('triN').textContent = tri ? Math.min(tri.i + 1, 8) : 0; $('triS').textContent = tri ? tri.score : 0; $('triK').textContent = tri ? tri.streak : 0; }
  function clock(){ if (tri) $('triT').textContent = ((performance.now() - tri.t0)/1000).toFixed(1) + 's'; }
  function start(){
    var pool = ALERTS.slice(); for (var i = pool.length - 1; i > 0; i--){ var j = (Math.random()*(i + 1))|0, x = pool[i]; pool[i] = pool[j]; pool[j] = x; }
    tri = {list: pool.slice(0, 8), i: 0, score: 0, streak: 0, best: 0, t0: performance.now(), answered: false, timer: setInterval(clock, 100)};
    render();
  }
  function render(){
    var a = tri.list[tri.i]; tri.answered = false; hudT();
    stage.innerHTML = '<article class="alert-card sev-' + a.sev + '" id="acard">' +
      '<div class="ac-top"><span class="ac-sev">' + SEV[a.sev] + '</span><span>' + esc(a.src) + '</span><span class="ac-id">INC-' + (4800 + ((Math.random()*190)|0)) + '</span></div>' +
      '<h4>' + esc(a.t) + '</h4>' +
      '<dl class="ac-kv">' + a.kv.map(function(k){ return '<div><dt>' + esc(k[0]) + '</dt><dd>' + esc(k[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="ac-act" id="acAct"><button class="btn" type="button" data-a="fp">Close as false positive <kbd>F</kbd></button><button class="btn danger" type="button" data-a="esc">Escalate incident <kbd>E</kbd></button></div>' +
      '</article>';
    stage.querySelectorAll('[data-a]').forEach(function(b){ b.addEventListener('click', function(){ answer(b.getAttribute('data-a')); }); });
    S.alert();
  }
  function answer(choice){
    if (!tri || tri.answered) return; tri.answered = true;
    var a = tri.list[tri.i], ok = choice === a.a;
    if (ok){ tri.score++; tri.streak++; tri.best = Math.max(tri.best, tri.streak); S.ok(); } else { tri.streak = 0; S.bad(); var c = $('acard'); c.classList.add('shake'); }
    hudT();
    var label = a.a === 'esc' ? 'a true positive. Escalate.' : 'a false positive or expected activity. Close it.';
    $('acAct').outerHTML = '<div class="verdict ' + (ok ? 'good' : 'bad') + '"><b>' + (ok ? '✓ Correct: ' : '✗ Not quite: this was ') + label + '</b><p>' + esc(a.why) + '</p>' +
      '<button class="btn primary sm" type="button" id="triNext">' + (tri.i === 7 ? 'End shift' : 'Next alert') + ' <kbd>Enter</kbd></button></div>';
    var nb = $('triNext'); nb.addEventListener('click', next); nb.focus({preventScroll: true});
    if (tri.streak === 5) toast('★', 'Achievement: On a roll', '5 correct calls in a row.');
  }
  function next(){ tri.i++; if (tri.i >= 8) end(); else render(); }
  function end(){
    clearInterval(tri.timer); clock();
    var s = tri.score, secs = ((performance.now() - tri.t0)/1000).toFixed(0);
    var rank = s === 8 ? ['SOC lead material.', 'A perfect shift. We would run a very tight SOC together.']
             : s >= 6 ? ['Solid Tier 2 analyst.', 'Good instincts. A couple of those are tricky even for experienced analysts.']
             : s >= 4 ? ['Promising Tier 1.', 'The tells are subtle. That\'s why teams hire people who do this daily.']
             : ['The attackers thank you.', 'Rough shift. Good news: you can hire someone who does this for a living.'];
    stage.innerHTML = '<div class="tri-end"><div class="big">' + s + '/8</div><h3>' + rank[0] + '</h3><p>' + rank[1] + ' Shift time: ' + secs + 's. I triaged alerts like these every day in Microsoft Sentinel and Defender. Want that on your team?</p>' +
      '<div class="row"><a class="btn primary" href="mailto:papa.orleans-bosomtwe@outlook.com?subject=' + encodeURIComponent('I scored ' + s + '/8 on your SOC triage game') + '">Email Papa my score</a><button class="btn" type="button" id="triAgain">Play again</button></div></div>';
    $('triAgain').addEventListener('click', start);
    tri.done = true;
    if (s === 8){ S.win(); toast('★', 'Achievement: SOC lead material', 'Perfect triage on all 8 alerts.'); } else S.ok();
  }
  $('triGo').addEventListener('click', start);
  document.addEventListener('keydown', function(e){
    var tg = e.target; if (!tri || tri.done || $('p-triage').hidden) return;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    var dlg = $('tty'); if (dlg && dlg.open) return;
    var r = stage.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    var k = e.key.toLowerCase();
    if (!tri.answered && (k === 'e' || k === 'f')){ e.preventDefault(); answer(k === 'e' ? 'esc' : 'fp'); }
    else if (tri.answered && k === 'enter' && tg.id !== 'triNext'){ e.preventDefault(); next(); }
  });

  /* ---------- phishing URL x-ray ---------- */
  var BRANDS = ['paypal','microsoft','office365','outlook','apple','icloud','amazon','google','netflix','linkedin','facebook','instagram','interac','canadapost','scotiabank','wellsfargo','dropbox','docusign','coinbase'];
  var RISKY_TLD = ['zip','mov','xyz','top','click','tk','ml','ga','cf','gq','work','rest','support','country','loan','icu','buzz','cam','monster'];
  var SHORT = ['bit.ly','tinyurl.com','t.co','goo.gl','is.gd','cutt.ly','ow.ly','rebrand.ly','shorturl.at','tiny.cc'];
  function regDomain(host){
    var p = host.split('.'); if (p.length <= 2) return host;
    var n = (p[p.length - 1].length === 2 && /^(co|com|org|net|gov|ac|gc|edu)$/.test(p[p.length - 2])) ? 3 : 2;
    return p.slice(-n).join('.');
  }
  function xray(raw){
    var out = $('phOut'), s = raw.trim(), noScheme = false;
    if (!s){ out.innerHTML = ''; return; }
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)){ s = 'http://' + s; noScheme = true; }
    var u; try { u = new URL(s); } catch (e) { out.innerHTML = '<p class="lab-err">That doesn\'t parse as a URL. Check for typos.</p>'; return; }
    var host = u.hostname, isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.charAt(0) === '[';
    var reg = isIp ? host : regDomain(host), sub = isIp ? '' : host.slice(0, Math.max(0, host.length - reg.length));
    var F = [], add = function(p, t){ F.push({p: p, t: t}); };
    if (u.protocol === 'http:') add(10, 'No HTTPS. Anything typed on this page travels in plain text.');
    if (isIp) add(25, 'The host is a raw IP address instead of a domain name.');
    if (u.username) add(25, 'Contains an @. Browsers ignore everything before it, so the real destination is ' + host + '.');
    if (host.indexOf('xn--') > -1) add(25, 'Punycode (xn--) domain. It can hide look-alike letters from other alphabets.');
    if (!isIp && sub.split('.').filter(Boolean).length >= 3) add(10, 'A long chain of subdomains pushes the real domain out of view.');
    var lower = host, norm = host.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/5/g, 's').replace(/rn/g, 'm');
    for (var i = 0; i < BRANDS.length; i++){
      var b = BRANDS[i], owns = reg.indexOf(b + '.') === 0;
      if (lower.indexOf(b) > -1 && !owns){ add(30, 'Mentions ' + b + ' in the address, but the domain is owned by ' + reg + '.'); break; }
      if (norm.indexOf(b) > -1 && lower.indexOf(b) === -1){ add(30, 'Look-alike spelling of ' + b + ' (digits swapped in for letters).'); break; }
      if (u.pathname.toLowerCase().indexOf(b) > -1 && !owns){ add(15, 'Uses the brand name "' + b + '" in the path, on a domain it doesn\'t own.'); break; }
    }
    var tld = host.split('.').pop();
    if (!isIp && RISKY_TLD.indexOf(tld) > -1) add(15, 'The .' + tld + ' ending is cheap to register and common in phishing.');
    if ((reg.match(/-/g) || []).length >= 1 && F.length) add(10, 'Hyphenated domain name, a common way to fake a brand.');
    if (SHORT.indexOf(reg) > -1 || SHORT.indexOf(host) > -1) add(15, 'A URL shortener hides the real destination.');
    var w = (u.pathname + u.search).toLowerCase().match(/(login|log-in|signin|sign-in|verify|verification|secure|account|update|password|reset|wallet|unlock|confirm|invoice)/);
    if (w) add(10, 'Uses pressure words like "' + w[1] + '" in the path.');
    if (u.port && u.port !== '80' && u.port !== '443') add(10, 'Runs on an unusual port (' + u.port + ').');
    if (/\/\//.test(u.pathname) || /=https?(%3a|:)/i.test(u.search)) add(10, 'Contains a redirect to another web address.');
    if (/\.(exe|scr|zip|iso|js|vbs|html?|hta)$/i.test(u.pathname)) add(15, 'Points straight at a file instead of a web page.');
    if (s.length > 75) add(10, 'Unusually long. Long links hide the important part.');
    var score = Math.min(100, F.reduce(function(t, f){ return t + f.p; }, 0));
    var v = score >= 55 ? ['Likely phishing', 'var(--crit)'] : score >= 25 ? ['Suspicious', 'var(--hot)'] : ['Looks clean', 'var(--ok)'];
    var anat = '<span class="a-sch">' + esc(u.protocol) + '//</span>' + (u.username ? '<span class="a-usr">' + esc(decodeURIComponent(u.username)) + '@</span>' : '') +
      (sub ? '<span class="a-sub">' + esc(sub) + '</span>' : '') + '<span class="a-reg">' + esc(reg) + '</span>' + (u.port ? '<span class="a-port">:' + esc(u.port) + '</span>' : '') +
      '<span class="a-path">' + esc(u.pathname + u.search + u.hash) + '</span>';
    var list = F.length ? F.map(function(f){ return '<li><i>+' + f.p + '</i><span>' + esc(f.t) + '</span></li>'; }).join('')
      : '<li class="ok"><i>✓</i><span>No phishing patterns found. The domain ' + esc(reg) + ' looks like a normal registered domain.</span></li>';
    out.innerHTML = '<div class="ph-res"><div class="ph-score" id="phScore"><b>' + score + '</b><span>' + v[0] + '</span><div class="bar"><i id="phBar"></i></div></div>' +
      '<div><div class="anat">' + anat + '</div><p class="anat-cap">Highlighted: the domain that actually controls this link.' + (noScheme ? ' (No scheme given, so http:// was assumed.)' : '') + '</p>' +
      '<ul class="feat">' + list + '</ul><p class="note ph-foot">Built from the URL features in my <a href="https://github.com/pkob1/AI_ML_Phishing_Detection" target="_blank" rel="noopener">MSc phishing-detection project</a> (Random Forest and Naive Bayes). Real filters also check domain age, reputation and the page itself.</p></div></div>';
    $('phScore').style.setProperty('--v', v[1]);
    requestAnimationFrame(function(){ $('phBar').style.width = score + '%'; });
    if (score >= 55) S.bad(); else S.ok();
  }
  $('phGo').addEventListener('click', function(){ xray($('phUrl').value); });
  $('phUrl').addEventListener('keydown', function(e){ if (e.key === 'Enter') xray(this.value); });
  document.querySelectorAll('.ph-samples [data-u]').forEach(function(b){ b.addEventListener('click', function(){ $('phUrl').value = b.getAttribute('data-u'); xray(b.getAttribute('data-u')); }); });

  /* ---------- password strength + Have I Been Pwned (k-anonymity) ---------- */
  var COMMON = ['password','123456','qwerty','letmein','welcome','admin','iloveyou','monkey','dragon','football','baseball','sunshine','princess','abc123','111111','trustno1','master','hello','freedom','whatever','summer','winter','spring','autumn','canada','toronto','guelph','hockey','maple','soccer','secret','login'];
  function human(s){
    if (s < 1) return 'Instantly';
    var u = [[60, 'seconds', 1], [3600, 'minutes', 60], [86400, 'hours', 3600], [31557600, 'days', 86400], [3.15576e9, 'years', 31557600]];
    for (var i = 0; i < u.length; i++) if (s < u[i][0]) return Math.max(1, Math.round(s/u[i][2])).toLocaleString() + ' ' + u[i][1];
    return s < 3.15576e11 ? 'Centuries' : 'Longer than the universe';
  }
  var pin = $('pwIn'), hashTimer = null;
  function pwAnalyze(){
    var p = pin.value, bar = $('pwBar'), notes = [];
    $('pwBreach').textContent = '–'; $('pwBreach').className = '';
    if (!p){ bar.style.width = '0'; $('pwEnt').textContent = '–'; $('pwCrack').textContent = '–'; $('pwNotes').innerHTML = ''; $('pwHash').innerHTML = ''; return; }
    var pool = 0; if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^a-zA-Z0-9]/.test(p)) pool += 33;
    var ent = p.length*Math.log2(pool || 1);
    var words = p.trim().split(/[\s._-]+/).filter(Boolean);
    if (words.length >= 3 && words.every(function(w){ return /^[a-z]+$/i.test(w); })){
      ent = Math.min(ent, words.length*12.9 + (/[A-Z]/.test(p) ? 3 : 0));
      notes.push(words.length + '-word passphrase. Scored as if each word came from a 7,776-word diceware list, which is how attackers model them.');
    }
    var low = p.toLowerCase().replace(/[@4]/g, 'a').replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[$5]/g, 's');
    var hit = COMMON.filter(function(w){ return low.indexOf(w) > -1 || low.replace(/i/g, 'l').indexOf(w) > -1; })[0];
    if (hit){ ent = Math.min(ent, 16 + (p.length - hit.length)*3.3); notes.push('Contains "' + hit + '", which sits near the top of every cracking wordlist, even with letters swapped for symbols.'); }
    if (/(19|20)\d\d\W*$/.test(p)){ ent -= 6; notes.push('Ends in a year. Attackers append years and "!" to dictionary words first.'); }
    if (/(.)\1{2,}/.test(p)){ ent -= 8; notes.push('Repeated characters add almost nothing.'); }
    if (/(abc|bcd|cde|123|234|345|456|567|678|789|qwe|wer|ert|asd|sdf|zxc)/i.test(p)){ ent -= 8; notes.push('Keyboard and number runs are among the first guesses.'); }
    if (p.length < 12) notes.push('Under 12 characters. Length beats complexity: four random words make a stronger password.');
    if (pool <= 26 && p.length < 16) notes.push('Only one kind of character.');
    if (!notes.length) notes.push('No obvious patterns. Store it in a password manager so it stays unique to one site.');
    ent = Math.max(0, ent);
    var col = ent < 36 ? 'var(--crit)' : ent < 60 ? 'var(--hot)' : ent < 80 ? 'var(--accent)' : 'var(--ok)';
    bar.style.width = Math.min(100, ent) + '%'; bar.style.background = col;
    $('pwEnt').textContent = Math.round(ent) + ' bits';
    $('pwCrack').textContent = human(Math.pow(2, ent)/2/1e10);
    $('pwNotes').innerHTML = notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('');
    clearTimeout(hashTimer); hashTimer = setTimeout(showHash, 120);
  }
  function sha1(s){ return crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)).then(function(b){ return hex(b).toUpperCase(); }); }
  function showHash(){
    var p = pin.value; if (!p || !(window.crypto && crypto.subtle)) return;
    return sha1(p).then(function(h){
      $('pwHash').innerHTML = 'SHA-1 of your password:<code><span class="sent">' + h.slice(0, 5) + '</span><span class="kept">' + h.slice(5) + '</span></code>' +
        'Only the 5 highlighted characters go to Have I Been Pwned. It sends back every leaked hash that starts with them, and the match happens here in your browser. This technique is called <b>k-anonymity</b>.';
      return h;
    });
  }
  pin.addEventListener('input', pwAnalyze);
  pin.addEventListener('keydown', function(e){ if (e.key === 'Enter') check(); });
  $('pwShow').addEventListener('click', function(){ var on = pin.type === 'password'; pin.type = on ? 'text' : 'password'; this.textContent = on ? 'Hide' : 'Show'; this.setAttribute('aria-pressed', String(on)); });
  function check(){
    var p = pin.value, el = $('pwBreach'); if (!p) { pin.focus(); return; }
    if (!(window.crypto && crypto.subtle)){ el.textContent = 'Needs HTTPS'; return; }
    el.textContent = 'Checking…'; el.className = '';
    sha1(p).then(function(h){
      showHash();
      return fetch('https://api.pwnedpasswords.com/range/' + h.slice(0, 5), {headers: {'Add-Padding': 'true'}})
        .then(function(r){ if (!r.ok) throw new Error(String(r.status)); return r.text(); })
        .then(function(t){
          var n = 0, suf = h.slice(5);
          t.split('\n').some(function(l){ var x = l.trim().split(':'); if (x[0] === suf){ n = +x[1]; return true; } return false; });
          if (n){ el.textContent = n.toLocaleString() + ' times'; el.className = 'bad'; S.bad(); }
          else { el.textContent = 'Not found'; el.className = 'good'; S.ok(); }
        });
    }).catch(function(){ el.textContent = 'Unavailable'; el.className = ''; $('pwNotes').insertAdjacentHTML('beforeend', '<li>Couldn\'t reach Have I Been Pwned from this preview. It works on the live site.</li>'); });
  }
  $('pwGo').addEventListener('click', check);

  /* ---------- browser fingerprint ---------- */
  function fingerprint(){
    var n = navigator, ua = n.userAgent || '', items = [];
    var tz = 'unknown'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var off = -new Date().getTimezoneOffset(), offS = (off >= 0 ? '+' : '-') + ('0' + Math.floor(Math.abs(off)/60)).slice(-2) + ':' + ('0' + Math.abs(off) % 60).slice(-2);
    var br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Unknown browser';
    var os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows NT/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
    var gpu = 'hidden';
    try { var gl = document.createElement('canvas').getContext('webgl'); var ex = gl && gl.getExtension('WEBGL_debug_renderer_info'); if (ex) gpu = gl.getParameter(ex.UNMASKED_RENDERER_WEBGL); } catch (e) {}
    var mq = function(q){ return window.matchMedia && matchMedia(q).matches; };
    items.push(['Location hint', tz + ' (UTC' + offS + ')']);
    items.push(['Languages', (n.languages && n.languages.length ? n.languages : [n.language]).join(', ')]);
    items.push(['Browser', br + ' on ' + os]);
    items.push(['Screen', screen.width + '×' + screen.height + ' at ' + (window.devicePixelRatio || 1) + 'x']);
    items.push(['Window', innerWidth + '×' + innerHeight]);
    items.push(['CPU threads', n.hardwareConcurrency || 'hidden']);
    items.push(['Memory', n.deviceMemory ? 'about ' + n.deviceMemory + ' GB' : 'hidden']);
    items.push(['Touch', n.maxTouchPoints > 0 ? n.maxTouchPoints + ' touch points' : 'none']);
    items.push(['Graphics', gpu]);
    items.push(['Settings', [mq('(prefers-color-scheme: dark)') ? 'dark mode' : 'light mode', mq('(prefers-reduced-motion: reduce)') ? 'reduced motion' : 'motion on', n.doNotTrack === '1' ? 'Do Not Track on' : 'Do Not Track off'].join(' · ')]);
    var cv = document.createElement('canvas'); cv.width = 260; cv.height = 50; var c = cv.getContext('2d'), data = '';
    try { c.textBaseline = 'top'; c.font = '16px Arial'; c.fillStyle = '#f60'; c.fillRect(110, 1, 62, 20); c.fillStyle = '#069'; c.fillText('Papa@SOC fingerprint ✓', 2, 15); c.fillStyle = 'rgba(102,204,0,.7)'; c.fillText('Papa@SOC fingerprint ✓', 4, 17); data = cv.toDataURL(); } catch (e) {}
    var listEl = $('fpList');
    listEl.innerHTML = items.map(function(it){ return '<div><dt>' + esc(it[0]) + '</dt><dd>' + esc(it[1]) + '</dd></div>'; }).join('') + '<div><dt>Canvas drawing</dt><dd id="fpCanvas">hashing…</dd></div>';
    if (!reduce) Array.prototype.forEach.call(listEl.children, function(d, i){ d.style.animationDelay = (i*60) + 'ms'; });
    if (!(window.crypto && crypto.subtle)){ $('fpId').textContent = 'needs HTTPS'; return; }
    var enc = new TextEncoder();
    crypto.subtle.digest('SHA-256', enc.encode(data)).then(function(b){ $('fpCanvas').textContent = 'renders as ' + hex(b).slice(0, 12) + ' on your device'; });
    crypto.subtle.digest('SHA-256', enc.encode(items.map(function(i){ return i.join('='); }).join('|') + data)).then(function(b){
      var h = hex(b).slice(0, 16).toUpperCase(), id = h.match(/.{4}/g).join('-'), el = $('fpId');
      if (reduce){ el.textContent = id; return; }
      var f = 0, g = '0123456789ABCDEF';
      (function tk(){
        el.textContent = id.split('').map(function(ch, i){ return ch === '-' || f > i*1.5 ? ch : g[(Math.random()*16)|0]; }).join('');
        if (++f < id.length*1.5 + 4) setTimeout(tk, 35); else { el.textContent = id; S.ok(); }
      })();
    });
  }

  /* ---------- terminal hook ---------- */
  var tty = window.__tty;
  if (tty && tty.C){
    var oldHelp = tty.C.help;
    tty.C.help = function(){ return oldHelp() + '\n<span class="c">Security lab</span>\n  lab         jump to the interactive lab\n  triage      start the SOC triage game'; };
    tty.C.lab = function(){ try { $('tty').close(); } catch (e) {} $('lab').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}); return null; };
    tty.C.triage = function(){ tty.C.lab(); show($('t-triage')); setTimeout(start, 500); return null; };
  }
})();
