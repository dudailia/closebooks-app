import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import Constants from 'expo-constants'
import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebViewNavigation } from 'react-native-webview/lib/WebViewTypes'

const FALLBACK_URL = 'https://closebooks-app.vercel.app'
const APP_URL = String(Constants.expoConfig?.extra?.closebooksUrl ?? FALLBACK_URL)

function isInternalUrl(url: string): boolean {
  return url.startsWith(APP_URL)
}

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const [currentUrl, setCurrentUrl] = useState(APP_URL)
  const [canGoBack, setCanGoBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const source = useMemo(() => ({ uri: currentUrl }), [currentUrl])

  function handleNavChange(navState: WebViewNavigation) {
    setCurrentUrl(navState.url)
    setCanGoBack(navState.canGoBack)
    setHasError(false)
  }

  function handleShouldStartLoad(request: { url: string }) {
    if (isInternalUrl(request.url)) return true
    void Linking.openURL(request.url)
    return false
  }

  function handleReload() {
    setHasError(false)
    webViewRef.current?.reload()
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CloseBooks iOS</Text>
          <Text style={styles.title}>Your live web app, wrapped natively</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            disabled={!canGoBack}
            onPress={() => webViewRef.current?.goBack()}
            style={[styles.actionButton, !canGoBack && styles.actionButtonDisabled]}
          >
            <Text style={[styles.actionLabel, !canGoBack && styles.actionLabelDisabled]}>Back</Text>
          </Pressable>
          <Pressable onPress={handleReload} style={styles.actionButton}>
            <Text style={styles.actionLabel}>Reload</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.container}>
        {hasError ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Connection problem</Text>
            <Text style={styles.errorBody}>
              The app could not reach your CloseBooks deployment. Check the network or reload.
            </Text>
            <Pressable onPress={handleReload} style={styles.primaryButton}>
              <Text style={styles.primaryButtonLabel}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={source}
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsBackForwardNavigationGestures
              startInLoadingState
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false)
                setHasError(true)
              }}
              onNavigationStateChange={handleNavChange}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2d5a27" />
                <Text style={styles.loadingText}>Opening CloseBooks...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f4ee',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e6ddd2',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fffdf9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#8d867d',
    fontWeight: '700',
  },
  title: {
    marginTop: 4,
    fontSize: 16,
    color: '#1a1714',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#d8d0c5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionLabel: {
    color: '#584f47',
    fontSize: 13,
    fontWeight: '600',
  },
  actionLabelDisabled: {
    color: '#9c958c',
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 244, 238, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#584f47',
    fontSize: 14,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1714',
  },
  errorBody: {
    textAlign: 'center',
    color: '#6c645d',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2d5a27',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
})
