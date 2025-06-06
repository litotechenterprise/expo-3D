import { CoreModal } from '@/components/Modal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DEFAULT_MATERIAL_PROPS, statusOptions } from '@/constants';
import useStatusCard from '@/hooks/useStatusCard';
import { CardScreenStyles } from '@/styles';
import { GLView } from 'expo-gl';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';


export default function Color1Screen(): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  }
  
  // Get the color from route params (from tab selection)
  const params = useLocalSearchParams<{ statusColor?: string; statusName?: string }>();
  const selectedColor = params.statusColor || statusOptions[1].color;
  
  const [ materialProps, setMaterialProps] = useState({
    ...DEFAULT_MATERIAL_PROPS,
    color: selectedColor
  });
  
  // Update material props when tab changes
  useEffect(() => {
    if (params.statusColor) {
      setMaterialProps(prev => ({
        ...prev,
        color: params.statusColor as string
      }));
    }
  }, [params.statusColor]);
  
  const { onContextCreate, loading, error, panResponder } = useStatusCard(materialProps );

  return (
    <View style={[CardScreenStyles.container, {backgroundColor:"red"}]} {...panResponder.panHandlers}>
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
      
      <GLView
        style={CardScreenStyles.glView}
        onContextCreate={onContextCreate}
      />

      <CoreModal isVisable={modalVisible} toggle={toggleModal} setMaterialProps={setMaterialProps} materialProps={materialProps} />

      <TouchableOpacity 
      onPress={toggleModal}
      style={CardScreenStyles.buttonContainer}>
        <IconSymbol size={28} name="house.fill" color="white" />
      </TouchableOpacity>

    </View>
  );
} 