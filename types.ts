export interface MaterialControls {
    metalness: number;
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    envMapIntensity: number;
    color: string; // <- make sure this is passed from the parent
    bloom: number;
  }
  
  export interface Model3DProps {
    materialProps: MaterialControls;
    statusName: string;
    dragging: boolean;
    setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  }


  export interface LightControls {
    ambient: number;
    directional: number;
  }