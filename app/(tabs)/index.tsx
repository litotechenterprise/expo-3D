import useStatusCard from '@/hooks/useStatusCard';
import { CardScreenStyles } from '@/styles';
import { GLView } from 'expo-gl';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';


export default function App(): React.JSX.Element {
  const { onContextCreate, loading, error, panResponder } = useStatusCard();
  return (
    <View style={CardScreenStyles.container} {...panResponder.panHandlers}>
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
    </View>
  );
}

