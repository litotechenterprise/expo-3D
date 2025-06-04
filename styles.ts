import { StyleSheet } from "react-native";




export const CardScreenStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1a1a1a',
      position: 'relative',
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
    infoContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 15,
        borderRadius: 10,
      }, title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      info: {
        color: '#fff',
        fontSize: 14,
      },
      indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#666',
        position: 'absolute',
        top: 15,
        right: 15,
      },
      indicatorDragging: {
        backgroundColor: '#ffff00',
      },
      indicatorSpinning: {
        backgroundColor: '#ff8800',
      },
      helpContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        alignItems: 'center',
      },
      helpText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 5,
      },

      buttonContainer: {
        position: 'absolute', top: 100,  right: 20, backgroundColor: 'red', height: 50, width: 50, borderRadius: 100, justifyContent: 'center', alignItems: 'center'
      }

  });







