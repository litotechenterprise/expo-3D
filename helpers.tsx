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



  export const setupLighting = (scene: THREE.Scene, intensity: number = 2): void => {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, intensity);
    scene.add(ambientLight);

    //Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, intensity);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight); 
  };



  export const addTextToModel = async (model: THREE.Group, text: string, position: THREE.Vector3, scale?: number[]) => {
    const loader = new FontLoader();
    
    const loadFont = async () => {
      // Try loading GT-America-Mono JSON data directly
      try {
        console.log('Attempting to load GT-America-Mono font data...');
        const fontData = require('./assets/fonts/gt-mono.json');
        console.log('✅ GT-America-Mono font data imported successfully');
        
        // Use parse method for JSON data instead of load
        try {
          const font = loader.parse(fontData);
          console.log('✅ GT-America-Mono font parsed successfully!');
          createTextMesh(font);
          return;
        } catch (parseError) {
          console.error('❌ Error parsing GT-America-Mono font:', parseError);
          loadFallbackFont();
          return;
        }
      } catch (importError) {
        console.error('❌ Failed to import GT-America-Mono font data:', importError);
        loadFallbackFont();
      }
    };
    
    const loadFallbackFont = () => {
      console.log('Loading fallback Helvetiker font...');
      loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        (font: any) => {
          console.log('✅ Fallback font loaded');
          createTextMesh(font);
        },
        undefined,
        (error) => {
          console.error('❌ All fonts failed to load:', error);
          createFallbackGeometry();
        }
      );
    };
    
    const createFallbackGeometry = () => {
      console.error('Using fallback box geometry');
      const fallbackGeometry = new THREE.BoxGeometry(1, 0.2, 0.05);
      const fallbackMaterial = new THREE.MeshBasicMaterial({ 
        color: "#ffffff"
      });
      const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      fallbackMesh.layers.set(1);
      fallbackMesh.position.copy(position);
      model.add(fallbackMesh);
    };
    
    const createTextMesh = (font: any) => {
      const textGeometry = new TextGeometry(text.toUpperCase(), {
        font: font,
        size: 0.08,
        depth: 0.001,
      });
      
      // Center the text
      textGeometry.computeBoundingBox();

      // multiply by -1 to show text on the backside of card
      const multiplier = scale ? -1 : 1;
      // Calculate the width of the text
      const textWidth = (textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x) * multiplier;

      // Create material for text that naturally avoids bloom
      const textMaterial = new THREE.MeshBasicMaterial({
        color: "#ffffff", // Slightly dimmer to avoid bloom threshold
        transparent: false,
        fog: false // Exclude from fog as well
      });
      
      // Create mesh
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      // Exclude text from bloom by setting it to a different render layer
      textMesh.layers.set(1); // Layer 1 = no bloom, Layer 0 = with bloom
      
      // Center the text by offsetting half its width
      const centeredPosition = new THREE.Vector3(
        textWidth / 2,
        position.y,
        position.z
      );
      textMesh.position.copy(centeredPosition);
      textMesh.rotation.y = Math.PI; // Rotate to face the camera
      
      // manually set the scale of the text
      // required to show text on the backside of card
      if (scale) {
        textMesh.scale.set(scale[0], scale[1], scale[2]);
      }
      
      // Add to model
      model.add(textMesh);
    };
    
    // Start the font loading process
    await loadFont();
  };