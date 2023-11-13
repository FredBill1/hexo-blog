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
    let mouseX = 0, mouseY = 0, scrollX = 0, scrollY = 0;
    let renderRequested = false;
    const distance = 25;
    const maxZoom = 0.58;
    const maxZoomWidth = 300;

    const maxBounceTime = 500;
    let lastBounceTime = 0;
    let bouncing = false;

    init();

    function init() {
        container = document.getElementById("koishifumo");

        scene = new THREE.Scene();

        // scene.add(new THREE.AmbientLight(0x999999));
        // scene.background = new THREE.Color(0x000000);

        camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
        camera.zoom = maxZoom;
        camera.up.set(0, 0, 1);
        camera.position.set(0, -distance, 0);
        camera.lookAt(scene.position);
        camera.updateProjectionMatrix();

        // camera.add(new THREE.PointLight(0xffffff, 250));
        scene.add(camera);

        // const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x555555);
        // grid.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * (Math.PI / 180));
        // scene.add(grid);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const loader = new GLTFLoader();
        loader.load('./project_koishi_komeiji_fumo.glb', function (gltfobject) {
            fumoObject = gltfobject.scene;

            // rotate and position the gltf object to be in the center of the screen
            fumoObject.rotation.x = Math.PI / 2;
            fumoObject.position.x = 2.5;
            fumoObject.position.z = -10;

            scene.add(fumoObject);
            renderRequested = true;
            document.getElementById("loading").remove();
            document.getElementById("container").style.visibility = "visible";
            render();
        });

        function updateScroll() {
            mouseX -= scrollX - window.scrollX;
            mouseY -= scrollY - window.scrollY;
            scrollX = window.scrollX;
            scrollY = window.scrollY;
        }

        window.addEventListener('resize', function () {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
            updateScroll();
            renderRequested = true;
        });
        window.addEventListener("mousemove", function (e) {
            mouseX = e.pageX;
            mouseY = e.pageY;
            renderRequested = true;
        });
        window.addEventListener("scroll", function (e) {
            updateScroll();
            renderRequested = true;
        });
        window.addEventListener("mousedown", function (e) {
            lastBounceTime = Date.now();
            bouncing = true;
        });
    }

    function render() {
        requestAnimationFrame(render);
        if (!renderRequested && !bouncing) return;
        if (renderRequested) {
            renderRequested = false;
            const centerX = container.getBoundingClientRect().left + container.clientWidth / 2;
            const centerY = container.getBoundingClientRect().top + container.clientHeight / 2
            camera.position.x = (mouseX - window.scrollX - centerX) / -100;
            camera.position.z = (mouseY - window.scrollY - centerY) / 100;
            camera.position.y = -Math.sqrt(distance * distance - camera.position.x * camera.position.x - camera.position.z * camera.position.z);
            camera.lookAt(scene.position);
        }

        if (bouncing) {
            const dt = Date.now() - lastBounceTime;
            if (dt > maxBounceTime) {
                bouncing = false;
                fumoObject.scale.y = 1
            } else {
                const t = dt / maxBounceTime;
                fumoObject.scale.y = 1 - 0.5 * Math.sin(t * Math.PI * 5) / (1 + t * t * 200);
            }
        }
        renderer.render(scene, camera);
    }

</script>