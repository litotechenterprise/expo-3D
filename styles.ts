import { StyleSheet } from "react-native";




export const CardScreenStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1a1a1a',
    },
    glView: {
      flex: 1,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    loadingText: {
      color: '#ffffff',
      marginTop: 10,
      fontSize: 16,
    },
    errorContainer: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      padding: 10,
      backgroundColor: 'rgba(255, 0, 0, 0.8)',
      borderRadius: 5,
    },
    errorText: {
      color: '#ffffff',
      fontSize: 14,
    },
  });







