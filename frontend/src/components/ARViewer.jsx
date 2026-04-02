import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

export default function ARViewer({ modelUrl, onClose }) {
  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const [status, setStatus] = useState("Loading 3D model...");
  const [xrSupported, setXrSupported] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");

  useEffect(() => {
    let renderer;
    let scene;
    let camera;
    let videoStream;
    let arButton;

    const container = mountRef.current;
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.01,
      20
    );
    camera.position.set(0, 1.2, 2.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 1);
    scene.add(dirLight);

    const setupVideoBackground = async () => {
      try {
        if (videoStream) {
          videoStream.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: cameraFacing } },
        });
        videoStream = stream;
        const video = document.createElement("video");
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();

        const texture = new THREE.VideoTexture(video);
        scene.background = texture;
        setStatus(
          cameraFacing === "environment"
            ? "Model ready (rear camera)"
            : "Model ready (front camera)"
        );
      } catch (err) {
        setStatus("Camera access blocked. Showing model only.");
      }
    };

    if (modelUrl) {
      const loader = new GLTFLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        modelUrl,
        (gltf) => {
          modelRef.current = gltf.scene;
          modelRef.current.position.set(0, -0.5, -2);
          modelRef.current.scale.set(1, 1, 1);
          scene.add(modelRef.current);
          setStatus("Model ready");
        },
        undefined,
        () => {
          setStatus("Failed to load model. Please upload a valid GLB for this product.");
        }
      );
    } else {
      setStatus("No model for this product. Please upload a GLB in admin.");
    }

    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((supported) => {
          if (supported) {
            setXrSupported(true);
            arButton = ARButton.createButton(renderer, { requiredFeatures: [] });
            arButton.style.position = "absolute";
            arButton.style.bottom = "16px";
            arButton.style.right = "16px";
            container.appendChild(arButton);
          } else {
            setupVideoBackground();
          }
        })
        .catch(() => setupVideoBackground());
    } else {
      setupVideoBackground();
    }

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", onResize);

    renderer.setAnimationLoop(() => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      if (arButton && container.contains(arButton)) {
        container.removeChild(arButton);
      }
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (videoStream) {
        videoStream.getTracks().forEach((t) => t.stop());
      }
      renderer.dispose();
    };
  }, [modelUrl, cameraFacing]);

  const handleRotate = () => {
    if (modelRef.current) {
      modelRef.current.rotation.y += Math.PI / 8;
    }
  };

  const handleScale = (factor) => {
    if (modelRef.current) {
      modelRef.current.scale.multiplyScalar(factor);
    }
  };

  const toggleCamera = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="relative w-full h-full md:w-4/5 md:h-4/5 bg-black">
        <div className="absolute top-3 left-3 z-10 text-white text-sm">
          {status}{xrSupported ? " (WebXR available)" : " (Fallback mode)"}
        </div>
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button className="btn-outline bg-white" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="absolute bottom-3 left-3 z-10 flex gap-2">
          <button className="btn-outline bg-white" onClick={handleRotate}>
            Rotate
          </button>
          <button className="btn-outline bg-white" onClick={() => handleScale(1.1)}>
            Scale +
          </button>
          <button className="btn-outline bg-white" onClick={() => handleScale(0.9)}>
            Scale -
          </button>
          {!xrSupported && (
            <button className="btn-outline bg-white" onClick={toggleCamera}>
              {cameraFacing === "environment" ? "Use Front Camera" : "Use Rear Camera"}
            </button>
          )}
        </div>
        <div ref={mountRef} className="w-full h-full" />
      </div>
    </div>
  );
}
