import { addTextToModel, loadGLTFModel, setupLighting } from '@/helpers';
import { MaterialControls } from '@/types';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';

export default function App(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);


  const [materialProps,] = useState<MaterialControls>({
    metalness: 0.74,
    roughness: 0.17,
    clearcoat: 0.36,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.0,
    color: '#356DA0', // Blue status default
    bloom: 2
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);


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
        
        const x = 0
        // Add text to the model
        addTextToModel(loadedModel, 'Blue Status', new THREE.Vector3(0, -4.72, 0.009));
        addTextToModel(loadedModel, 'Pablo Endara-Santiago', new THREE.Vector3(0, -7.32, 0.009));
        addTextToModel(loadedModel, 'West Village', new THREE.Vector3(0, -4.72, 0.051), [-1, 1, 1]);
        addTextToModel(loadedModel, `Member Since ${new Date().getFullYear()}`, new THREE.Vector3(0, -7.32, 0.051), [-1, 1, 1]);

        const meshes: THREE.Mesh[] = [];
        loadedModel.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            meshes.push(object);
          }
        });

           // Target specific mesh by index (change this index as needed)
      const targetIndex = 2; // You can change this to target different meshes
      meshes.forEach((child, index) => {
        if (index === targetIndex) {
          const newMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(materialProps.color),
            metalness: materialProps.metalness,
            roughness: materialProps.roughness,
            clearcoat: materialProps.clearcoat,
            clearcoatRoughness: materialProps.clearcoatRoughness,
            envMapIntensity: materialProps.envMapIntensity,
          });
          child.material = newMaterial;
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        } else {
          const original = child.material as THREE.MeshStandardMaterial;
          const newMaterial = new THREE.MeshPhysicalMaterial({
            color: original.color.clone(),
            metalness: materialProps.metalness,
            roughness: materialProps.roughness,
            clearcoat: materialProps.clearcoat,
            clearcoatRoughness: materialProps.clearcoatRoughness,
            envMapIntensity: materialProps.envMapIntensity,
          });
          child.material = newMaterial;
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      })  
      
    
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
        
        }
      } catch (error) {
        console.error('Model loading error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
  
      const animate = (): void => {
        animationFrameRef.current = requestAnimationFrame(animate);
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
    } finally {

      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
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