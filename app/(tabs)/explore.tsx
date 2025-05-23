import { Asset } from 'expo-asset';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface TouchPosition {
  x: number;
  y: number;
}

export default function App(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const loadGLTFModel = async (
    modelPath: any, // Module import type
    scene: THREE.Scene
  ): Promise<GLTF> => {
    try {
      const asset = Asset.fromModule(modelPath);
      await asset.downloadAsync();
      
      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
          asset.uri!,
          (gltf: GLTF) => resolve(gltf),
          (progress: ProgressEvent) => {
            console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
          },
          (error: unknown) => reject(error instanceof Error ? error : new Error(String(error)))
        );
      });
    } catch (error) {
      throw new Error(`Failed to load model: ${error}`);
    }
  };

  const setupLighting = (scene: THREE.Scene): void => {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Accent point light
    const pointLight = new THREE.PointLight(0x4080ff, 0.5);
    pointLight.position.set(-5, 5, -5);
    scene.add(pointLight);
  };

  const createExampleModel = (): THREE.Mesh => {
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      shininess: 100,
      specular: 0x222222
    });
    return new THREE.Mesh(geometry, material);
  };

  const onContextCreate = async (gl: ExpoWebGLRenderingContext): Promise<void> => {
    try {
      // Create renderer with proper settings
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 5);
      camera.lookAt(0, 0, 0);

      // Setup lighting
      setupLighting(scene);
      
      try {
        const gltf = await loadGLTFModel(
          require('../../assets/models/spline-export.glb'),
          scene
        );
        
        const loadedModel = gltf.scene;
        loadedModel.scale.set(1, 1, 1);
        
        // Center the model
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.sub(center);
        
        modelRef.current = loadedModel;
        scene.add(loadedModel);
        
        // Play animations if any
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(loadedModel);
          gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
          });
          
          // Update mixer in animation loop
          // mixer.update(deltaTime);
        }
      } catch (error) {
        console.error('Model loading error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
      

      setLoading(false);

      // Touch controls state
      let touchStart: TouchPosition = { x: 0, y: 0 };
      let modelRotation = { x: 0, y: 0 };

      // Animation loop
      const clock = new THREE.Clock();
      
      const animate = (): void => {
        animationFrameRef.current = requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

        // Auto-rotate the model
        if (modelRef.current) {
          modelRef.current.rotation.y += 0.01;
        }

        // Render the scene
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      
      animate();
    } catch (error) {
      console.error('Scene setup error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading 3D Scene...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  glView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 5,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
  },
});