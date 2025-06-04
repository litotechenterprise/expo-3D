
import { DAMPING, DEFAULT_MATERIAL_PROPS, MIN_VELOCITY } from '@/constants';
import { addTextToModel, loadGLTFModel, setupLighting } from '@/helpers';
import { AnimationStateV2 } from '@/types';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const useStatusCard = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const animationCompleteRef = useRef<AnimationStateV2>(AnimationStateV2.UP_FAST);
    const [isDragging, setIsDragging] = useState(false);

     // Store the initial touch position
     const lastTouchRef = useRef({ x: 0, y: 0 });
     const rotationRef = useRef({ x: 0, y: 0 });
  
     // Velocity tracking
     const velocityRef = useRef({ x: 0, y: 0 });
     const lastMoveTimeRef = useRef(Date.now());
     const lastDeltaRef = useRef({ x: 0, y: 0 });
     
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
        
           
          },
          onPanResponderRelease: () => {
            // Touch ended
            setIsDragging(false);
          
          },
        })
      ).current;
  

  
  
    const onContextCreate = async (gl: ExpoWebGLRenderingContext): Promise<void> => {
      try {
        // Create renderer with proper settings
        const renderer = new Renderer({ gl });
        // renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);
  
        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75,
          gl.drawingBufferWidth / gl.drawingBufferHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0, 5); // 0,0,7
        // camera.lookAt(0, -1, 1);
  
        // Setup lighting
        setupLighting(scene);
  
        // Load the model
        const gltf = await loadGLTFModel(
          require('../assets/models/spline-export.glb'),
          scene
        );
        
        // Scale the model
        const statusCard = gltf.scene;
        statusCard.scale.set(1, 1, 1);
          
        // Add text to the model
        addTextToModel(statusCard, 'West Village', new THREE.Vector3(0, -4.72, 0.009));
        addTextToModel(statusCard, `Member Since ${`'25`}`, new THREE.Vector3(0, -7.32, 0.009));
        addTextToModel(statusCard, 'Blue Status', new THREE.Vector3(0, -4.72, 0.051), [-1, 1, 1]);
        addTextToModel(statusCard, `Pablo Endara-Santiago`, new THREE.Vector3(0, -7.32, 0.051), [-1, 1, 1]);
  
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
              color: new THREE.Color(DEFAULT_MATERIAL_PROPS.color),
              metalness: DEFAULT_MATERIAL_PROPS.metalness,
              roughness: DEFAULT_MATERIAL_PROPS.roughness,
              clearcoat: DEFAULT_MATERIAL_PROPS.clearcoat,
              clearcoatRoughness: DEFAULT_MATERIAL_PROPS.clearcoatRoughness,
              envMapIntensity: DEFAULT_MATERIAL_PROPS.envMapIntensity,
            });
            child.material = newMaterial;
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
          } else {
            const original = child.material as THREE.MeshStandardMaterial;
            const newMaterial = new THREE.MeshPhysicalMaterial({
              color: original.color.clone(),
              metalness: DEFAULT_MATERIAL_PROPS.metalness,
              roughness: DEFAULT_MATERIAL_PROPS.roughness,
              clearcoat: DEFAULT_MATERIAL_PROPS.clearcoat,
              clearcoatRoughness: DEFAULT_MATERIAL_PROPS.clearcoatRoughness,
              envMapIntensity: DEFAULT_MATERIAL_PROPS.envMapIntensity,
            });
            child.material = newMaterial;
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        })  
    
          // Find center of screen
          //const box = new THREE.Box3().setFromObject(statusCard);
          statusCard.position.sub(new THREE.Vector3(0,7,0));
          //statusCard.rotation.y = -3.5;
          modelRef.current = statusCard;
          scene.add(statusCard);
  
          // Setup post-processing
          const composer = new EffectComposer(renderer);
          const renderPass = new RenderPass(scene, camera);
          composer.addPass(renderPass);
    
          // Add bloom effect
          const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(gl.drawingBufferWidth, gl.drawingBufferHeight),
            DEFAULT_MATERIAL_PROPS.bloom,    // strength
            0.4,    // radius
            DEFAULT_MATERIAL_PROPS.luminanceThreshold    // threshold
          );
          composer.addPass(bloomPass);
  
    
        const animate = (): void => {
            requestAnimationFrame(animate);
            if(animationCompleteRef.current === AnimationStateV2.UP_FAST) {
              statusCard.position.y += 0.12; 
              //statusCard.rotation.y += 0.2;
              if (statusCard.position.y > 5.8 ) { //&& statusCard.rotation.y > 0.1
                animationCompleteRef.current = AnimationStateV2.UP_SLOW;
              }

            } else if (animationCompleteRef.current === AnimationStateV2.UP_SLOW) {
                statusCard.position.y += 0.02;
                if (statusCard.position.y > 6.1) { // && statusCard.rotation.y > 0.8
                  animationCompleteRef.current = AnimationStateV2.COMPLETED;
                }
            }  else if (animationCompleteRef.current === AnimationStateV2.DOWN) {
                statusCard.position.y -= 0.015;
             
                if (statusCard.position.y < 6.0) { // && statusCard.rotation.y > 0.8
                animationCompleteRef.current = AnimationStateV2.COMPLETED;
                }
        } 
            else if (animationCompleteRef.current === AnimationStateV2.COMPLETED) {
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
          composer.render();
          gl.endFrameEXP();
        };
        animate();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      } finally {

        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };


    useEffect(() => {
        return () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          // Cancel animation frame aka pause animation
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
      }, []);

    return {
        onContextCreate,
        loading,
        panResponder,
        error,
    }
}

export default useStatusCard;