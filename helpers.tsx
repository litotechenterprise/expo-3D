import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';




export const loadGLTFModel = async (
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



  export const setupLighting = (scene: THREE.Scene): void => {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight();
    ambientLight.intensity = 0.2;
    scene.add(ambientLight);
    //Main directional light
    const directionalLight = new THREE.DirectionalLight();
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.intensity = 0.2
    scene.add(directionalLight);
    // // Accent point light
    // const pointLight = new THREE.PointLight(0x4080ff, 1.0);
    // pointLight.position.set(-5, 5, -5);
    // scene.add(pointLight);
  };



  export const addTextToModel = (model: THREE.Group, text: string, position: THREE.Vector3, scale?: number[]) => {
    // Create text geometry
    const loader = new FontLoader();
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font: any) => {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 0.105,
          height: 0.004,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.0002,
          bevelSize: 0.005,
          bevelOffset: 0,
          bevelSegments: 2
        });
        
        // Center the text
        textGeometry.computeBoundingBox();
        const multiplier = scale ? -1 : 1;
        const textWidth = (textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x) * multiplier;

        // Create material
        const textMaterial = new THREE.MeshPhysicalMaterial({
          color: "#f7f7f7",
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          emissiveIntensity: 1
        });
        
        // Create mesh
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        
        // Center the text by offsetting half its width
        const centeredPosition = new THREE.Vector3(
          textWidth / 2,
          position.y,
          position.z
        );
        textMesh.position.copy(centeredPosition);
        textMesh.rotation.y = Math.PI; // Rotate to face the camera

        if (scale) {
            textMesh.scale.set(scale[0], scale[1], scale[2]);
        }
        // Add to model
        model.add(textMesh);
      },
      undefined,
      (error) => {
        console.error('Error loading font:', error);
      }
    );
  };