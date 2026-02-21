---
title: About
layout: about
---

<style>
    .center {
        margin: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
    }

    .author {
        opacity: 0.1;
        transition: opacity 0.15s;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .author:hover {
        opacity: 1;
    }
</style>

<div id="container" style="width: 100%; max-width: 500px; position: relative; overflow: hidden; margin: auto;">
<div id="loading" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
<object class="center" data="/img/loading.svg" width="60%"></object>
</div>
<div style="padding-top: 112%;"></div>
<div style="position: absolute; top: -10%; bottom: 0; right: 0; left: 0;">
<div style="width: 100%; position: relative; overflow: hidden;">
<div style="padding-top: 150%;"></div>
<div id="koishifumo" style="position: absolute; top: 0; bottom: 0; right: 0; left: 0;"> </div>
</div>
</div>
</div>

<p class="author" style="text-align: center;">模型作者: <a href="https://skfb.ly/ozsGo" target="_blank">203Null</a></p>

<script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.158.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.158.0/examples/jsm/"
        }
    }
</script>


<script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    let container, camera, scene, renderer;
    let fumoObject;
    let fumoPivot;
    let mouseX = NaN, mouseY = NaN, scrollX = 0, scrollY = 0;

    let rafId = 0;
    let containerRect = null;

    const distance = 25;
    const maxZoom = 0.58;

    const maxBounceTime = 500;
    const maxRotationTime = 200;
    let lastBounceTime = 0;
    let bouncing = false;
    let rotateDirection = 1;

    const MODEL_GZ  = './project_koishi_komeiji_fumo.glb.gz';

    init();

    function requestRender() {
        if (!fumoObject || !fumoPivot) return;
        if (rafId) return;
        rafId = requestAnimationFrame(render);
    }

    function updateContainerRect() {
        if (!container) return;
        containerRect = container.getBoundingClientRect();
    }

    function init() {
        container = document.getElementById("koishifumo");

        scene = new THREE.Scene();
        fumoPivot = new THREE.Group();
        scene.add(fumoPivot);

        camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
        camera.zoom = maxZoom;
        camera.up.set(0, 0, 1);
        camera.position.set(0, -distance, 0);
        camera.lookAt(scene.position);
        camera.updateProjectionMatrix();
        scene.add(camera);

        renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        updateContainerRect();

        async function fetchAndGunzipToArrayBuffer(url) {
            const res = await fetch(url, { cache: 'force-cache' });
            if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
            if (!res.body) throw new Error('streaming body not supported');
            const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
            return await new Response(stream).arrayBuffer();
        }

        async function loadModelCompressedOnly() {
            const ab = await fetchAndGunzipToArrayBuffer(MODEL_GZ);
            const loader = new GLTFLoader();
            const gltfobject = await loader.parseAsync(ab, './');
            fumoObject = gltfobject.scene;

            fumoObject.rotation.x = Math.PI / 2;
            fumoObject.position.x = 2.5;
            fumoObject.position.z = -10;
            fumoObject.position.y = -2;
            fumoPivot.position.y = 2;
            fumoPivot.add(fumoObject);

            document.getElementById("loading").remove();
            document.getElementById("container").style.visibility = "visible";

            requestRender();
        }

        loadModelCompressedOnly();

        function updateScroll() {
            mouseX -= scrollX - window.scrollX;
            mouseY -= scrollY - window.scrollY;
            scrollX = window.scrollX;
            scrollY = window.scrollY;
        }

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();

            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            renderer.setSize(container.clientWidth, container.clientHeight);

            updateScroll();
            updateContainerRect();
            requestRender();
        }, { passive: true });

        window.addEventListener('pointermove', (e) => {
            mouseX = e.pageX;
            mouseY = e.pageY;
            requestRender();
        }, { passive: true });

        window.addEventListener('pointerdown', (e) => {
            mouseX = e.pageX;
            mouseY = e.pageY;
            updateContainerRect();
            requestRender();
        }, { passive: true });

        window.addEventListener('scroll', () => {
            updateScroll();
            updateContainerRect();
            requestRender();
        }, { passive: true });

        window.addEventListener('click', (e) => {
            mouseX = e.pageX;
            mouseY = e.pageY;
            lastBounceTime = performance.now();
            bouncing = true;
            const randValue = Math.random();
            rotateDirection = randValue < 0.5 ? 0 : randValue < 0.75 ? -1 : 1;
            requestRender();
        }, { passive: true });
    }

    function render(now) {
        rafId = 0;

        let needsAnotherFrame = false;
        if (containerRect) {
            if (isNaN(mouseX) || isNaN(mouseY)) {
                camera.position.x = 0;
                camera.position.z = 0;
            } else {
                const centerX = containerRect.left + container.clientWidth / 2;
                const centerY = containerRect.top + container.clientHeight / 2;

                camera.position.x = (mouseX - window.scrollX - centerX) * -15 / window.innerWidth;
                camera.position.z = (mouseY - window.scrollY - centerY) * 8 / window.innerHeight;

                const xz2 = camera.position.x * camera.position.x + camera.position.z * camera.position.z;
                const d2 = distance * distance;
                const safe = Math.max(0, d2 - xz2);
                camera.position.y = -Math.sqrt(safe);
            }
            camera.lookAt(scene.position);
        }

        if (bouncing && fumoObject && fumoPivot) {
            const dt = now - lastBounceTime;
            if (dt > maxBounceTime) {
                bouncing = false;
                fumoObject.scale.x = fumoObject.scale.z = fumoObject.scale.y = 1;
                fumoPivot.rotation.z = 0;
            } else {
                const t = dt / maxBounceTime;
                fumoObject.scale.y = 1 - 0.5 * Math.sin(t * Math.PI * 5) / (1 + t * t * 200);
                fumoObject.scale.x = fumoObject.scale.z = 1 / Math.sqrt(fumoObject.scale.y);
                const rotationT = Math.min(1, dt / maxRotationTime);
                const bezierT = rotationT * rotationT * (3 - 2 * rotationT);
                fumoPivot.rotation.z = Math.PI * 2 * bezierT * rotateDirection;
                needsAnotherFrame = true;
            }
        }
        renderer.render(scene, camera);
        if (needsAnotherFrame) requestRender();
    }
</script>
