import { addTextToModel, loadGLTFModel, setupLighting } from '@/helpers';
import { CardScreenStyles } from '@/styles';
import { MaterialControls } from '@/types';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as THREE from 'three';

const enum AnimationState {
  SPIN_UP,
  SPIN_DOWN,
  IDLING,
}


export default function App(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // const sceneRef = useRef<THREE.Scene | null>(null);
  const animationCompleteRef = useRef<AnimationState>(AnimationState.SPIN_UP);

  const [materialProps,] = useState<MaterialControls>({
    metalness: 0.74,
    roughness: 0.17,
    clearcoat: 0.36,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.0,
    color: '#588bbb', // Blue status default
    bloom: 2
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Cancel animation frame aka pause animation
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
      // scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);
      // sceneRef.current = scene;

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

      // Load the model
      const gltf = await loadGLTFModel(
        require('../../assets/models/spline-export.glb'),
        scene
      );
      
      // Scale the model
      const statusCard = gltf.scene;
      statusCard.scale.set(1, 1, 1);
        
      // Add text to the model
      addTextToModel(statusCard, 'Blue Status', new THREE.Vector3(0, -4.72, 0.009));
      addTextToModel(statusCard, 'Pablo Endara-Santiago', new THREE.Vector3(0, -7.32, 0.009));
      addTextToModel(statusCard, 'West Village', new THREE.Vector3(0, -4.72, 0.051), [-1, 1, 1]);
      addTextToModel(statusCard, `Member Since ${`'25`}`, new THREE.Vector3(0, -7.32, 0.051), [-1, 1, 1]);

      const meshes: THREE.Mesh[] = [];
      statusCard.traverse((object) => {
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
    
        // // Find center of screen
        // const box = new THREE.Box3().setFromObject(statusCard);
        // const center = box.getCenter(new THREE.Vector3());

        // Set position of model
        statusCard.position.y = -1;
        //modelRef.current = statusCard;
        scene.add(statusCard);

  
      const animate = (): void => {
           animationFrameRef.current = requestAnimationFrame(animate);
          if(animationCompleteRef.current === AnimationState.SPIN_UP) {
            statusCard.position.y += 0.07; // Slow rotation when idle
            statusCard.rotation.y += 0.18;
            if (statusCard.position.y > 7.2) {
              animationCompleteRef.current = AnimationState.SPIN_DOWN;
            }
          } else if (animationCompleteRef.current === AnimationState.SPIN_DOWN) {
            statusCard.position.y -= 0.07; // Slow rotation when idle
            statusCard.rotation.y -= 0.22;
            if (statusCard.position.y < 6.1) {
              animationCompleteRef.current = AnimationState.IDLING;
            }
          } else if (animationCompleteRef.current === AnimationState.IDLING) {
            statusCard.rotation.y -= 0.025;
          }

        // Render the scene
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      animate();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1200);
    }
  };

  return (
    <View style={CardScreenStyles.container}>
      <GLView
        style={CardScreenStyles.glView}
        onContextCreate={onContextCreate}
      />
      {loading && (
        <View style={CardScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={CardScreenStyles.loadingText}>Loading 3D Scene...</Text>
        </View>
      )}
      {error && (
        <View style={CardScreenStyles.errorContainer}>
          <Text style={CardScreenStyles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
}

