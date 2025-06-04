import { CoreModal } from '@/components/Modal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DEFAULT_MATERIAL_PROPS } from '@/constants';
import useStatusCard from '@/hooks/useStatusCard';
import { CardScreenStyles } from '@/styles';
import { GLView } from 'expo-gl';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';


export default function App(): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  }
  const [ materialProps, setMaterialProps] = useState(DEFAULT_MATERIAL_PROPS);
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

