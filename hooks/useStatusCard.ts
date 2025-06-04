import { DAMPING, MaterialType, MIN_VELOCITY } from '@/constants';
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

const useStatusCard = (materialProps: MaterialType) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const animationCompleteRef = useRef<AnimationStateV2>(AnimationStateV2.UP_FAST);
    const [isDragging, setIsDragging] = useState(false);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);

    // Store the initial touch position
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const rotationRef = useRef({ x: 0, y: 0 });
  
    // Velocity tracking
    const velocityRef = useRef({ x: 0, y: 0 });
    const lastMoveTimeRef = useRef(Date.now());
    const lastDeltaRef = useRef({ x: 0, y: 0 });

    // Update materials when materialProps change
    useEffect(() => {
        if (modelRef.current && sceneRef.current) {
            sceneRef.current.background = new THREE.Color(materialProps.backgroundColor);
            const meshes: THREE.Mesh[] = [];
            modelRef.current.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    meshes.push(object);
                }
            });

            // Target specific mesh by index (change this index as needed)
            const targetIndex = 2;
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
                    bloomPass.strength = materialProps.bloom;
                    bloomPass.threshold = materialProps.luminanceThreshold;
                }
            }

            setupLighting(sceneRef.current);
        }
    }, [materialProps]);

    // Create PanResponder for handling touch/drag events
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            
            onPanResponderGrant: (evt) => {
                setIsDragging(true);
                const touch = evt.nativeEvent;
                lastTouchRef.current = { 
                    x: touch.locationX, 
                    y: touch.locationY 
                };
                
                velocityRef.current = { x: 0, y: 0 };
                lastMoveTimeRef.current = Date.now();
            },
            
            onPanResponderMove: (evt) => {
                const touch = evt.nativeEvent;
                const currentTime = Date.now();
                const deltaTime = currentTime - lastMoveTimeRef.current;
                
                const deltaX = touch.locationX - lastTouchRef.current.x;
                const deltaY = touch.locationY - lastTouchRef.current.y;
                
                rotationRef.current.y += deltaX * 0.01;
                rotationRef.current.x += deltaY * 0.01;
                
                if (deltaTime > 0) {
                    velocityRef.current.x = deltaX * 0.01;
                    velocityRef.current.y = deltaY * 0.01;
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
            },
        })
    ).current;

    const onContextCreate = async (gl: ExpoWebGLRenderingContext): Promise<void> => {
        try {
            const renderer = new Renderer({ gl });
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(materialProps.backgroundColor);
            scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(
                75,
                gl.drawingBufferWidth / gl.drawingBufferHeight,
                0.1,
                1000
            );
            camera.position.set(0, 0, 5);
            
            const gltf = await loadGLTFModel(
                require('../assets/models/spline-export.glb'),
                scene
            );
            
            const statusCard = gltf.scene;
            statusCard.scale.set(1, 1, 1);
            
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

            const targetIndex = 2;
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
            });

            statusCard.position.sub(new THREE.Vector3(0,5,0));
            modelRef.current = statusCard;
            scene.add(statusCard);

            const composer = new EffectComposer(renderer);
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);
            composerRef.current = composer;

            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(gl.drawingBufferWidth, gl.drawingBufferHeight),
                materialProps.bloom,
                0.4,
                materialProps.luminanceThreshold
            );
            composer.addPass(bloomPass);

            const animate = (): void => {
                requestAnimationFrame(animate);
                if(animationCompleteRef.current === AnimationStateV2.UP_FAST) {
                    statusCard.position.y += 0.12;
                    if (statusCard.position.y > 5.8) {
                        animationCompleteRef.current = AnimationStateV2.UP_SLOW;
                    }
                } else if (animationCompleteRef.current === AnimationStateV2.UP_SLOW) {
                    statusCard.position.y += 0.02;
                    if (statusCard.position.y > 6.1) {
                        animationCompleteRef.current = AnimationStateV2.COMPLETED;
                    }
                } else if (animationCompleteRef.current === AnimationStateV2.DOWN) {
                    statusCard.position.y -= 0.015;
                    if (statusCard.position.y < 6.0) {
                        animationCompleteRef.current = AnimationStateV2.COMPLETED;
                    }
                } else if (animationCompleteRef.current === AnimationStateV2.COMPLETED) {
                    if (!isDragging) {
                        rotationRef.current.y += velocityRef.current.x;
                        velocityRef.current.x *= DAMPING;
                        velocityRef.current.y *= DAMPING;
                        if (Math.abs(velocityRef.current.y) < MIN_VELOCITY) {
                            velocityRef.current.y = 0;
                        }
                    }
                    if (modelRef.current) {
                        modelRef.current.rotation.y = rotationRef.current.y;
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