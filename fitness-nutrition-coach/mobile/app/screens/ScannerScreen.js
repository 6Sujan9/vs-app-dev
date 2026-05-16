import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState('Point your camera at a QR code containing a website URL.');

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);

    if (isValidUrl(data)) {
      navigation.navigate('Website', { url: data });
      setMessage(`Opening ${data}...`);
      return;
    }

    setMessage('Scanned code is not a valid web URL. Please scan a QR code with an http or https link.');
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.messageText}>{message}</Text>

        {scanned && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setScanned(false);
              setMessage('Point your camera at a QR code containing a website URL.');
            }}
          >
            <Text style={styles.actionButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerContainer: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionButton: {
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ScannerScreen;
