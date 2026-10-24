import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image } from '@/components/ui/image';

const VERTEX = `
  attribute vec2 a_position;
  attribute vec2 a_uv;
  varying vec2 v_uv;
  void main() { v_uv = a_uv; gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_active;
  varying vec2 v_uv;
  void main() {
    vec2 point = abs(v_uv - 0.5);
    float radius = 0.045;
    vec2 box = point - vec2(0.5 - radius);
    float edge = length(max(box, 0.0)) + min(max(box.x, box.y), 0.0) - radius;
    float alpha = 1.0 - smoothstep(-0.006, 0.006, edge);
    if (alpha <= 0.0) discard;
    float rim = 1.0 - smoothstep(0.002, 0.018, max(-edge, 0.0));
    vec4 color = texture2D(u_texture, v_uv);
    color.rgb += vec3(1.0, 0.025, 0.04) * rim * (0.08 + u_active * 0.25);
    color.a *= alpha;
    gl_FragColor = color;
  }
`;

function shader(gl, type, source) {
  const value = gl.createShader(type);
  if (!value) throw new Error('WebGL shader allocation failed');
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(value);
    gl.deleteShader(value);
    throw new Error(message || 'WebGL shader compilation failed');
  }
  return value;
}

function program(gl) {
  const value = gl.createProgram();
  if (!value) throw new Error('WebGL program allocation failed');
  gl.attachShader(value, shader(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(value, shader(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(value);
  if (!gl.getProgramParameter(value, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(value);
    gl.deleteProgram(value);
    throw new Error(message || 'WebGL program linking failed');
  }
  return value;
}

function createScene(canvas, urls, onPrimaryReady, reduceMotion) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) return null;

  let imageProgram;
  try { imageProgram = program(gl); } catch (error) {
    console.warn('ClipLens walkthrough is using its image fallback:', error);
    return null;
  }

  const buffer = gl.createBuffer();
  if (!buffer) { gl.deleteProgram(imageProgram); return null; }
  let schedule = () => {};
  const textures = urls.map((url, index) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([25, 10, 12, 255]));
    if (!url) { if (index === 0) onPrimaryReady(false); return texture; }

    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (index === 0) onPrimaryReady(true);
        schedule();
      } catch {
        if (index === 0) onPrimaryReady(false);
      }
    };
    image.onerror = () => { if (index === 0) onPrimaryReady(false); };
    image.src = url;
    return texture;
  });

  const position = gl.getAttribLocation(imageProgram, 'a_position');
  const uv = gl.getAttribLocation(imageProgram, 'a_uv');
  const textureLocation = gl.getUniformLocation(imageProgram, 'u_texture');
  const activeLocation = gl.getUniformLocation(imageProgram, 'u_active');
  let targetProgress = 0;
  let currentProgress = 0;
  let pointerTarget = [0, 0];
  let pointerCurrent = [0, 0];
  let frame = 0;
  let disposed = false;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const project = (x, y, z, ratio) => {
    const camera = 4.4;
    const perspective = 3.15 / (camera - z);
    return [x * perspective / ratio, y * perspective];
  };

  const cardVertices = (index, progress, ratio) => {
    const relative = index - progress;
    const distance = Math.abs(relative);
    const scale = 1.03 - Math.min(distance * .16, .45);
    const centerX = Math.max(-2.2, Math.min(2.2, relative * 1.12)) + pointerCurrent[0] * (.045 + distance * .012);
    const centerY = Math.sin(relative * .72) * .22 + pointerCurrent[1] * (.035 + distance * .01);
    const centerZ = -distance * .68;
    const rotateX = Math.sin(relative * .52) * .07 - pointerCurrent[1] * .025;
    const rotateY = -relative * .105 + pointerCurrent[0] * .035;
    const rotateZ = relative * .035;
    const width = 2.65 * scale;
    const height = width / (16 / 9);
    const cosX = Math.cos(rotateX); const sinX = Math.sin(rotateX);
    const cosY = Math.cos(rotateY); const sinY = Math.sin(rotateY);
    const cosZ = Math.cos(rotateZ); const sinZ = Math.sin(rotateZ);
    const points = [
      [-width / 2, -height / 2, 0, 0, 0], [width / 2, -height / 2, 0, 1, 0],
      [-width / 2, height / 2, 0, 0, 1], [-width / 2, height / 2, 0, 0, 1],
      [width / 2, -height / 2, 0, 1, 0], [width / 2, height / 2, 0, 1, 1],
    ];
    const vertices = [];
    for (const [px, py, pz, uValue, vValue] of points) {
      let x = px * cosY + pz * sinY;
      let z = -px * sinY + pz * cosY;
      let y = py * cosX - z * sinX;
      z = py * sinX + z * cosX;
      const rx = x * cosZ - y * sinZ;
      const ry = x * sinZ + y * cosZ;
      x = rx + centerX;
      y = ry + centerY;
      z += centerZ;
      const [screenX, screenY] = project(x, y, z, ratio);
      vertices.push(screenX, screenY, uValue, vValue);
    }
    return { vertices, z: centerZ, distance };
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const width = Math.round(rect.width * pixelRatio);
    const height = Math.round(rect.height * pixelRatio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = () => {
    if (disposed) return;
    frame = 0;
    currentProgress = reduceMotion ? targetProgress : currentProgress + (targetProgress - currentProgress) * .14;
    pointerCurrent[0] = reduceMotion ? 0 : pointerCurrent[0] + (pointerTarget[0] - pointerCurrent[0]) * .12;
    pointerCurrent[1] = reduceMotion ? 0 : pointerCurrent[1] + (pointerTarget[1] - pointerCurrent[1]) * .12;
    const moving = Math.abs(targetProgress - currentProgress) > .001 || Math.abs(pointerTarget[0] - pointerCurrent[0]) > .004 || Math.abs(pointerTarget[1] - pointerCurrent[1]) > .004;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(imageProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
    gl.uniform1i(textureLocation, 0);

    const ratio = canvas.width / Math.max(canvas.height, 1);
    const cards = textures.map((_, index) => ({ ...cardVertices(index, currentProgress, ratio), index })).sort((a, b) => a.z - b.z);
    for (const card of cards) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[card.index]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(card.vertices), gl.DYNAMIC_DRAW);
      gl.uniform1f(activeLocation, Math.max(0, 1 - card.distance * .55));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    if (moving) frame = window.requestAnimationFrame(draw);
  };

  resize();
  schedule = () => { if (!frame && !disposed) frame = window.requestAnimationFrame(draw); };
  schedule();
  return {
    setProgress(value) { targetProgress = Math.max(0, Math.min(urls.length - 1, value)); schedule(); },
    setPointer(x, y) { if (!reduceMotion) pointerTarget = [x, y]; schedule(); },
    resize() { resize(); schedule(); },
    dispose() {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      textures.forEach((texture) => texture && gl.deleteTexture(texture));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(imageProgram);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

const VideoStoryScene = forwardRef(function VideoStoryScene({ images, active, Figure, label, reducedMotion }, ref) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [webglReady, setWebglReady] = useState(false);
  const [webglAllowed, setWebglAllowed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    const sync = () => setWebglAllowed(query.matches);
    sync();
    if (query.addEventListener) query.addEventListener('change', sync);
    else query.addListener(sync);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', sync);
      else query.removeListener(sync);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setProgress(value) { rendererRef.current?.setProgress(value); },
    setPointer(x, y) { rendererRef.current?.setPointer(x, y); },
  }), []);

  useEffect(() => {
    if (!webglAllowed) return undefined;
    const canvas = canvasRef.current;
    const host = canvas?.closest('.steps3d-visual');
    if (!canvas || !host) return undefined;
    let cancelled = false;
    let renderer;
    let resizeObserver;
    let intersectionObserver;
    const start = () => {
      if (cancelled || rendererRef.current) return;
      renderer = createScene(canvas, images, (ready) => { if (!cancelled) setWebglReady(ready); }, reducedMotion);
      if (!renderer) return;
      rendererRef.current = renderer;
      renderer.setProgress(active);
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => renderer.resize());
        resizeObserver.observe(host);
      }
    };
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) { start(); intersectionObserver?.disconnect(); }
      }, { rootMargin: '300px 0px' });
      intersectionObserver.observe(host);
    } else start();
    return () => {
      cancelled = true;
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      renderer?.dispose();
      rendererRef.current = null;
    };
  }, [images, reducedMotion, webglAllowed]);

  useEffect(() => { rendererRef.current?.setProgress(active); }, [active]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    rendererRef.current?.setPointer(((event.clientX - rect.left) / rect.width - .5) * 2, -((event.clientY - rect.top) / rect.height - .5) * 2);
  };

  return (
    <div className={`steps3d-visual ${webglReady ? 'is-webgl-ready' : ''} ${reducedMotion ? 'is-reduced-motion' : ''}`} onPointerMove={handlePointerMove} onPointerLeave={() => rendererRef.current?.setPointer(0, 0)}>
      {webglAllowed && <canvas ref={canvasRef} className="steps3d-canvas" aria-hidden="true" />}
      <div className="steps3d-fallback" aria-hidden="true"><Image src={images[Math.min(active, images.length - 1)]} alt="" className="steps3d-fallback-image" /></div>
      <div className="steps3d-scene-label"><span className="steps3d-live-dot" />{label}</div>
      <span className="steps3d-counter"><b>0{active + 1}</b><i />04</span>
      {webglAllowed && Figure && <div className="steps3d-hairline" aria-hidden="true"><Figure intensity={0.3} theme="auto" /></div>}
      <div className="steps3d-progress"><span style={{ width: `${((active + 1) / 4) * 100}%` }} /></div>
    </div>
  );
});

export default VideoStoryScene;
