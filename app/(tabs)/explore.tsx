import { addTextToModel, loadGLTFModel, setupLighting } from '@/helpers';
import { CardScreenStyles } from '@/styles';
import { MaterialControls } from '@/types';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, Text, View } from 'react-native';
import * as THREE from 'three';

const enum AnimationState {
  SPIN_UP,
  SPIN_DOWN,
  IN_PLACE,
  COMPLETED
}


export default function App(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationCompleteRef = useRef<AnimationState>(AnimationState.SPIN_UP);
  const [dragInfo, setDragInfo] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  

   // Store the initial touch position
   const lastTouchRef = useRef({ x: 0, y: 0 });
   const rotationRef = useRef({ x: 0, y: 0 });

   // Velocity tracking
   const velocityRef = useRef({ x: 0, y: 0 });
   const lastMoveTimeRef = useRef(Date.now());
   const lastDeltaRef = useRef({ x: 0, y: 0 });
   
   // Physics constants
   const DAMPING = 0.98; // How quickly the spin slows down (0.95 = slow decay, 0.8 = fast decay)
   const MIN_VELOCITY = 0.001; // Minimum velocity before stopping


  const [materialProps,setMaterialProps] = useState<MaterialControls>({
    metalness: 0.74,
    roughness: 0.17,
    clearcoat: 0.36,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.0,
    color: '#588bbb', // Blue status default
    bloom: 2
  });

    // Create PanResponder for handling touch/drag events
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        
        onPanResponderGrant: (evt) => {
          // Touch started
          setIsDragging(true);
          const touch = evt.nativeEvent;
          lastTouchRef.current = { 
            x: touch.locationX, 
            y: touch.locationY 
          };
          
          // Reset velocity when starting new drag
          velocityRef.current = { x: 0, y: 0 };
          lastMoveTimeRef.current = Date.now();
        },
        
        onPanResponderMove: (evt) => {

          const touch = evt.nativeEvent;
        const currentTime = Date.now();
        const deltaTime = currentTime - lastMoveTimeRef.current;
        
        const deltaX = touch.locationX - lastTouchRef.current.x;
        const deltaY = touch.locationY - lastTouchRef.current.y;
        
        // Update rotation based on drag
        rotationRef.current.y += deltaX * 0.01;
        rotationRef.current.x += deltaY * 0.01;
        
        // Calculate velocity (speed of drag)
        if (deltaTime > 0) {
          velocityRef.current.x = deltaX * 0.01;
          velocityRef.current.y = deltaY * 0.01;
        }
        
        // Store for next frame
        lastTouchRef.current = { 
          x: touch.locationX, 
          y: touch.locationY 
        };
        lastMoveTimeRef.current = currentTime;
        lastDeltaRef.current = { x: deltaX, y: deltaY };
        
        // Update drag info display
        setDragInfo({ 
          x: Math.round(touch.locationX), 
          y: Math.round(touch.locationY) 
        });

         
        },
        
        onPanResponderRelease: () => {
          // Touch ended
          setIsDragging(false);
        
        },
      })
    ).current;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Cancel animation frame aka pause animation
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);


  // Set initial rotation
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.PI;
    }
  }, []);


  const onContextCreate = async (gl: ExpoWebGLRenderingContext): Promise<void> => {
    try {
      // Create renderer with proper settings
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      //renderer.shadowMap.enabled = true;
      //renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#101010");

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1, 5); 
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
        // const center = box.getCenter(new THREE.Vector3())
        // Set position of model
        statusCard.position.y = -1;
        modelRef.current = statusCard;
        scene.add(statusCard);

  
      const animate = (): void => {
          requestAnimationFrame(animate);
          if(animationCompleteRef.current === AnimationState.SPIN_UP) {
            statusCard.position.y += 0.19; 
            statusCard.rotation.y -= 0.043;
            if (statusCard.position.y > 7.2) {
              animationCompleteRef.current = AnimationState.SPIN_DOWN;
            }
          } else if (animationCompleteRef.current === AnimationState.SPIN_DOWN) {
            statusCard.position.y -= 0.02; 
            statusCard.rotation.y += 0.02;
            if (statusCard.position.y < 6.1) {
              animationCompleteRef.current = AnimationState.IN_PLACE;
            }
          } else if (animationCompleteRef.current === AnimationState.IN_PLACE) {
            statusCard.rotation.y += 0.02;
            if (statusCard.position.y > 0) {
              animationCompleteRef.current = AnimationState.COMPLETED;
            }
          }
          else if (animationCompleteRef.current === AnimationState.COMPLETED) {

            // Apply momentum when not dragging
              if (!isDragging) {
                // Apply velocity to rotation
                //rotationRef.current.x += velocityRef.current.y;
                rotationRef.current.y += velocityRef.current.x;
                
                // Apply damping to gradually slow down
                velocityRef.current.x *= DAMPING;
                velocityRef.current.y *= DAMPING;
                
                // Stop completely when velocity is very small
                if (Math.abs(velocityRef.current.y) < MIN_VELOCITY) {
                  velocityRef.current.y = 0;
                }
              }



            // Apply rotation to cube
            if (modelRef.current) {
              modelRef.current.rotation.y = rotationRef.current.y;
            }

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

  const isSpinning = Math.abs(velocityRef.current.x) > 0 || Math.abs(velocityRef.current.y) > 0;

  return (
    <View style={CardScreenStyles.container} {...panResponder.panHandlers}>
      <GLView
        style={CardScreenStyles.glView}
        onContextCreate={onContextCreate}
      />

<View style={CardScreenStyles.infoContainer}>
       
        <Text style={CardScreenStyles.info}>
          {isDragging 
            ? `Dragging at: (${dragInfo.x}, ${dragInfo.y})` 
            : isSpinning 
              ? 'Spinning with momentum...' 
              : 'Touch and drag to interact'}
        </Text>
        <View style={[
          CardScreenStyles.indicator, 
          isDragging && CardScreenStyles.indicatorDragging,
          isSpinning && !isDragging && CardScreenStyles.indicatorSpinning
        ]} />
      </View>
      
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

