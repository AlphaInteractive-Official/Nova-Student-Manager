import React, { useRef } from 'react';
import { View, StyleSheet, Platform, NativeModules } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For native mobile builds (Android APK / iOS)
let WebViewComponent: any = null;
let HTML_BASE64: string = '';

if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
    HTML_BASE64 = require('./src/htmlBundle').HTML_BASE64;
  } catch (e) {
    console.warn('Native modules require error:', e);
  }
}

const NATIVE_STORAGE_KEY = '@smh_permanent_storage_v1';

export default function App() {
  const webViewRef = useRef<any>(null);

  const restoreDataToWebView = async () => {
    try {
      const savedData = await AsyncStorage.getItem(NATIVE_STORAGE_KEY);
      if (savedData && webViewRef.current) {
        // Safely inject restore data into WebView
        const code = `
          try {
            if(window.handleNativeRestore){
              window.handleNativeRestore(${JSON.stringify(savedData)});
            }
          } catch(e){
            console.warn("Restore injection error", e);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(code);
      }
    } catch (err) {
      console.warn('AsyncStorage restore failure:', err);
    }
  };

  const handleMessage = async (event: any) => {
    try {
      if (!event || !event.nativeEvent || !event.nativeEvent.data) return;
      const dataStr = event.nativeEvent.data;
      const msg = JSON.parse(dataStr);

      if (msg.type === 'SYNC_STATE' && msg.payload) {
        // Persist to native SQLite database - survives all APK updates!
        await AsyncStorage.setItem(NATIVE_STORAGE_KEY, JSON.stringify(msg.payload));
      } else if (msg.type === 'REQUEST_RESTORE') {
        restoreDataToWebView();
      } else if (msg.type === 'DOWNLOAD_FILE' && msg.data) {
        // Native file download/save handler for images, CSV, and backup JSON
        try {
          const filename = msg.filename || `export_${Date.now()}.png`;
          const rawData = msg.data;
          const mime = msg.mime || 'application/octet-stream';

          if (NativeModules.FileSaver && NativeModules.FileSaver.saveFile) {
            const savedPath = await NativeModules.FileSaver.saveFile(filename, rawData, mime);
            webViewRef.current?.injectJavaScript(`
              if(window.toast){ toast("File saved to " + ${JSON.stringify(savedPath)}, "success", 5000); }
              true;
            `);
          } else {
            console.warn('FileSaver native module not available');
          }
        } catch (downloadErr) {
          console.warn('Native download handler error:', downloadErr);
          webViewRef.current?.injectJavaScript(`
            if(window.toast){ toast("Download error: " + ${JSON.stringify(String(downloadErr))}, "error", 5000); }
            true;
          `);
        }
      }
    } catch (err) {
      console.warn('WebView bridge message error:', err);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <StatusBar style="auto" />
        <iframe
          src="/app.html"
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          } as any}
          title="Student Manager Hub"
        />
      </View>
    );
  }

  // Native Android APK / iOS
  if (WebViewComponent) {
    return (
      <View style={styles.nativeContainer}>
        <StatusBar style="auto" />
        <WebViewComponent
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ uri: `data:text/html;charset=utf-8;base64,${HTML_BASE64}` }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          cacheEnabled={true}
          onLoadEnd={() => {
            // Restore persistent native SQLite storage on page ready
            restoreDataToWebView();
          }}
          onMessage={handleMessage}
          style={styles.webView}
        />
      </View>
    );
  }

  return <View style={styles.nativeContainer} />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0a0d14',
  },
  nativeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0d14',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
