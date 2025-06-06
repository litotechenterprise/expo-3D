import { DAMPING, MaterialType, MIN_VELOCITY } from '@/constants';
import { addTextToModel, loadGLTFModel } from '@/helpers';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface SpringState {
    y: number;
    vy: number;
    rot: number;
    vrot: number;
}

const useStatusCard = (materialProps: MaterialType) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);

    // Spring animation state
    const springRef = useRef<SpringState>({ y: -10, vy: 0, rot: 0, vrot: 0 });
    const entryDoneRef = useRef(false);
    const lastTimeRef = useRef(Date.now());
    
    // Spring physics constants (matching web version)
    const targetY = 6; // Adjusted for Expo coordinate system
    const targetRot = Math.PI;
    const mass = 1.8; // Reduced for snappier feel
    const stiffness = 90;
    const damping = 22;

    // Store the initial touch position and target rotation
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const targetRotationYRef = useRef(Math.PI);
  
    // Velocity tracking for drag
    const velocityRef = useRef({ x: 0, y: 0 });
    const velocityHistoryRef = useRef<number[]>([]); // Track velocity history for better momentum
    const lastMoveTimeRef = useRef(Date.now());
    const lastDeltaRef = useRef({ x: 0, y: 0 });
    
    // Snapping behavior
    const isSnappingRef = useRef(false);
    const snapTargetRef = useRef(Math.PI); // Target rotation for snapping
    const hasReleasedRef = useRef(true); // Track if user has fully released touch
    
    // Store references to text elements for selective bloom
    const textElementsRef = useRef<THREE.Mesh[]>([]);
    
    // Function to calculate closest snap position (front = 0, back = π)
    const getClosestSnapPosition = (currentRotation: number): number => {
        // Normalize rotation to 0-2π range
        const normalizedRot = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        
        // Calculate distances to front (0) and back (π)
        const distToFront = Math.min(normalizedRot, Math.PI * 2 - normalizedRot);
        const distToBack = Math.abs(normalizedRot - Math.PI);
        
        // Return closest position
        if (distToFront < distToBack) {
            return Math.floor(currentRotation / (Math.PI * 2)) * Math.PI * 2; // Closest 0 position
        } else {
            return Math.floor(currentRotation / (Math.PI * 2)) * Math.PI * 2 + Math.PI; // Closest π position
        }
    };

    // Update materials when materialProps change
    useEffect(() => {
        if (modelRef.current && sceneRef.current) {
            sceneRef.current.background = new THREE.Color('#101010'); // Always use web version background
            const meshes: THREE.Mesh[] = [];
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    meshes.push(object);
                }
            });

            // Target specific mesh by index (change this index as needed)
            const targetIndex = 2;
            meshes.forEach((child, index) => {
                // Ensure all card meshes stay on layer 0 for bloom
                child.layers.set(0);
                
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
                }
            });

            // Update bloom effect
            if (composerRef.current) {
                const bloomPass = composerRef.current.passes.find(pass => pass instanceof UnrealBloomPass) as UnrealBloomPass;
                if (bloomPass) {
                    bloomPass.strength = materialProps.bloom || 2; // Default to web version value
                    bloomPass.threshold = materialProps.luminanceThreshold || 0.5; // Default to web version value
                    bloomPass.radius = 0.5; // Default to web version value
                }
            }
        }
    }, [materialProps]);

    // Create PanResponder for handling touch/drag events
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            
            onPanResponderGrant: (evt) => {
                setIsDragging(true);
                hasReleasedRef.current = false; // User is now touching
                const touch = evt.nativeEvent;
                lastTouchRef.current = { 
                    x: touch.locationX, 
                    y: touch.locationY 
                };
                
                velocityRef.current = { x: 0, y: 0 };
                velocityHistoryRef.current = []; // Reset velocity history
                isSnappingRef.current = false; // Stop any ongoing snapping
                lastMoveTimeRef.current = Date.now();
            },
            
            onPanResponderMove: (evt) => {
                const touch = evt.nativeEvent;
                const currentTime = Date.now();
                const deltaTime = currentTime - lastMoveTimeRef.current;
                
                const deltaX = touch.locationX - lastTouchRef.current.x;
                const deltaY = touch.locationY - lastTouchRef.current.y;
                
                targetRotationYRef.current += deltaX * 0.01;
                
                if (deltaTime > 0) {
                    const currentVelocityX = (deltaX * 0.01) / (deltaTime / 1000);
                    velocityRef.current.x = currentVelocityX;
                    velocityRef.current.y = deltaY * 0.01;
                    
                    // Track velocity history for better momentum calculation
                    velocityHistoryRef.current.push(currentVelocityX);
                    // Keep only the last 5 velocity samples
                    if (velocityHistoryRef.current.length > 5) {
                        velocityHistoryRef.current.shift();
                    }
                }
                
                lastTouchRef.current = { 
                    x: touch.locationX, 
                    y: touch.locationY 
                };
                lastMoveTimeRef.current = currentTime;
                lastDeltaRef.current = { x: deltaX, y: deltaY };
            },
            
            onPanResponderRelease: () => {
                setIsDragging(false);
                hasReleasedRef.current = true; // User has fully released touch
                
                // Apply momentum multiplier based on velocity history
                if (velocityHistoryRef.current.length > 0) {
                    // Calculate average velocity from recent samples
                    const avgVelocity = velocityHistoryRef.current.reduce((sum, v) => sum + v, 0) / velocityHistoryRef.current.length;
                    
                    // Apply momentum multiplier for more inertia
                    const MOMENTUM_MULTIPLIER = 0.5; // Define locally since import isn't working
                    velocityRef.current.x = avgVelocity * MOMENTUM_MULTIPLIER;
                }
            },
        })
    ).current;

    const onContextCreate = async (gl: ExpoWebGLRenderingContext): Promise<void> => {
        try {
            const renderer = new Renderer({ gl });
            const scene = new THREE.Scene();
            scene.background = new THREE.Color('#101010'); // Match web version background
            scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(
                30, // Reduced FOV from 75 to 30 for 80mm lens feel (less perspective distortion)
                gl.drawingBufferWidth / gl.drawingBufferHeight,
                0.1,
                1000
            );
            camera.position.set(0, 0, 12); // Moved camera back from 5 to 8 for more zoom out
            
            // Camera can see everything
            camera.layers.enableAll();

            // Add lighting that matches web version
            const ambientLight = new THREE.AmbientLight(0xffffff, 5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
            directionalLight.position.set(5, 5, 5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // Add environment map for reflections using CubeTextureLoader
            const cubeTextureLoader = new THREE.CubeTextureLoader();
            
            // Load cube texture from 6 PNG files
            // Order: positive X, negative X, positive Y, negative Y, positive Z, negative Z
            // (right, left, top, bottom, front, back)
            const envTexture = cubeTextureLoader.load([
                require('../assets/environment/px.png'), // positive X (right)
                require('../assets/environment/nx.png'), // negative X (left)
                require('../assets/environment/py.png'), // positive Y (top)
                require('../assets/environment/ny.png'), // negative Y (bottom)
                require('../assets/environment/pz.png'), // positive Z (front)
                require('../assets/environment/nz.png'), // negative Z (back)
            ]);
            
            scene.environment = envTexture;
            
            const gltf = await loadGLTFModel(
                require('../assets/models/spline-export.glb'),
                scene
            );
            
            const statusCard = gltf.scene;
            statusCard.scale.set(1, 1, 1);
            
            await addTextToModel(statusCard, 'West Village', new THREE.Vector3(0, -4.72, 0.009));
            await addTextToModel(statusCard, `Member Since ${`'25`}`, new THREE.Vector3(0, -7.32, 0.009));
            await addTextToModel(statusCard, 'Blue Status', new THREE.Vector3(0, -4.72, 0.051), [-1, 1, 1]);
            await addTextToModel(statusCard, `Pablo Endara-Santiago`, new THREE.Vector3(0, -7.32, 0.051), [-1, 1, 1]);
            
            // Find and store all text elements for bloom exclusion
            // Wait a moment for text to be added, then collect text elements
            setTimeout(() => {
                const collectTextElements = (object: THREE.Object3D) => {
                    if (object instanceof THREE.Mesh && object.geometry && object.geometry.type === 'TextGeometry') {
                        textElementsRef.current.push(object);
                        console.log('Found text element:', object);
                    }
                    object.children.forEach(collectTextElements);
                };
                collectTextElements(statusCard);
                console.log('Total text elements found:', textElementsRef.current.length);
            }, 100);

            const meshes: THREE.Mesh[] = [];
            statusCard.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    meshes.push(object);
                }
            });

            const targetIndex = 2;
            meshes.forEach((child, index) => {
                // Explicitly set all card meshes to layer 0 for bloom inclusion
                child.layers.set(0);
                
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
            });

            // Set initial position for spring animation (start below screen)
            statusCard.position.set(0, springRef.current.y, 0);
            statusCard.rotation.y = springRef.current.rot;
            modelRef.current = statusCard;
            scene.add(statusCard);

            // Set up high-resolution bloom rendering
            const pixelRatio = 2; // Increase resolution multiplier
            const renderWidth = gl.drawingBufferWidth * pixelRatio;
            const renderHeight = gl.drawingBufferHeight * pixelRatio;
            
            // Create composer with higher resolution render target
            const composer = new EffectComposer(renderer);
            composer.setSize(renderWidth, renderHeight);
            
            // First render pass - render everything normally
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);
            composerRef.current = composer;

            // Create high-resolution bloom pass
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(renderWidth, renderHeight),
                materialProps.bloom || 2, // Default to 2 like web version
                0.9, // luminanceSmoothing to match web version 
                materialProps.luminanceThreshold || 0.5 // Default to 0.5 like web version
            );
            
            composer.addPass(bloomPass);

            const animate = (): void => {
                requestAnimationFrame(animate);
                
                const currentTime = Date.now();
                const delta = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016); // Cap at 60fps
                lastTimeRef.current = currentTime;
                
                if (!entryDoneRef.current) {
                    // Spring physics calculations (matching web version)
                    const spring = springRef.current;
                    
                    // Y position spring
                    let dy = spring.y - targetY;
                    let ay = (-stiffness * dy - damping * spring.vy) / mass;
                    let vy = spring.vy + ay * delta;
                    let y = spring.y + vy * delta;

                    // Rotation spring
                    let drot = spring.rot - targetRot;
                    let arot = (-stiffness * drot - damping * spring.vrot) / mass;
                    let vrot = spring.vrot + arot * delta;
                    let rot = spring.rot + vrot * delta;

                    springRef.current = { y, vy, rot, vrot };

                    // Apply spring animation to card
                    if (statusCard) {
                        statusCard.position.y = y;
                        statusCard.rotation.y = rot;
                    }

                    // Check if spring animation is complete
                    if (
                        Math.abs(y - targetY) < 0.01 &&
                        Math.abs(rot - targetRot) < 0.01 &&
                        Math.abs(vy) < 0.01 &&
                        Math.abs(vrot) < 0.01
                    ) {
                        springRef.current = { y: targetY, vy: 0, rot: targetRot, vrot: 0 };
                        entryDoneRef.current = true;
                        if (statusCard) {
                            statusCard.position.y = targetY;
                            statusCard.rotation.y = targetRot;
                        }
                    }
                } else {
                    // After entry animation, handle drag interactions
                    if (!isDragging) {
                        // Check if we should start snapping - only if user has fully released AND velocity is low
                        const shouldStartSnapping = hasReleasedRef.current && Math.abs(velocityRef.current.x) < MIN_VELOCITY * 500;
                        
                        if (!isSnappingRef.current && shouldStartSnapping && modelRef.current) {
                            // Start snapping to closest position
                            isSnappingRef.current = true;
                            snapTargetRef.current = getClosestSnapPosition(modelRef.current.rotation.y);
                            velocityRef.current.x = 0; // Stop momentum
                        }
                        
                        if (isSnappingRef.current && modelRef.current) {
                            // Stop snapping if user touched again
                            if (!hasReleasedRef.current) {
                                isSnappingRef.current = false;
                            } else {
                                // Smooth snap to target position
                                const currentRotY = modelRef.current.rotation.y;
                                const snapSpeed = 0.12; // Speed of snapping
                                const diff = snapTargetRef.current - currentRotY;
                                
                                // Handle rotation wrapping for shortest path
                                let shortestDiff = diff;
                                if (Math.abs(diff) > Math.PI) {
                                    shortestDiff = diff > 0 ? diff - Math.PI * 2 : diff + Math.PI * 2;
                                }
                                
                                modelRef.current.rotation.y += shortestDiff * snapSpeed;
                                
                                // Check if snapping is complete
                                if (Math.abs(shortestDiff) < 0.01) {
                                    modelRef.current.rotation.y = snapTargetRef.current;
                                    isSnappingRef.current = false;
                                }
                            }
                        } else if (!isSnappingRef.current) {
                            // Apply velocity damping for smooth interactions
                            velocityRef.current.x *= DAMPING;
                            velocityRef.current.y *= DAMPING;
                            if (Math.abs(velocityRef.current.x) < MIN_VELOCITY) {
                                velocityRef.current.x = 0;
                            }
                            
                            // Apply velocity-based rotation for momentum/inertia
                            if (modelRef.current && Math.abs(velocityRef.current.x) > 0) {
                                modelRef.current.rotation.y += velocityRef.current.x * delta;
                            }
                        }
                    } else {
                        // During drag, stop snapping and follow finger
                        isSnappingRef.current = false;
                        hasReleasedRef.current = false; // Ensure we track that user is touching
                        
                        if (modelRef.current) {
                            const currentRotY = modelRef.current.rotation.y;
                            modelRef.current.rotation.y += (targetRotationYRef.current - currentRotY) * 0.15;
                        }
                    }
                }
                
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