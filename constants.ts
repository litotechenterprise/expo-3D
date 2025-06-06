export const statusOptions = [
    { name: 'Blue Member', color: '#588bbb' },
    { name: 'Silver Elite Status', color: '#a7abae' },
    { name: 'Gold Elite Status', color: '#b49150' },
    { name: 'Platinum Elite Status', color: '#576C81' },
    { name: 'Obsidian Status', color: '#272532' },
  ];

  export const defaultStyling = {
    size: 0.105,
    height: 0.004,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.0002,
    bevelSize: 0.005,
    bevelOffset: 0,
    bevelSegments: 2
  }

    // Physics constants
    export const DAMPING = 0.985; // How quickly the spin slows down (0.95 = slow decay, 0.8 = fast decay)
    export const MIN_VELOCITY = 0.001; // Minimum velocity before stopping
    export const MOMENTUM_MULTIPLIER = 0.5; // Boost factor for velocity on release
 


   export type MaterialType = {
    metalness: number;
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    envMapIntensity: number;
    color: string;
    bloom: number;
    luminanceThreshold: number;
    backgroundColor: string;
   }

 
   export const DEFAULT_MATERIAL_PROPS: MaterialType = {
     metalness: 0.74,
     roughness: 0.17,
     clearcoat: 0.36,
     clearcoatRoughness: 0.15, // Updated to match web version
     envMapIntensity: 1.0,
     color: '#588bbb', // Blue status default to match web version
     bloom: 1.5, // Updated to match web version
     luminanceThreshold: 0.5,
     backgroundColor: '#101010', // Updated to match web version
   };