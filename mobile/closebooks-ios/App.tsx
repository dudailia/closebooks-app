import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNetInfo } from '@react-native-community/netinfo'
import Constants from 'expo-constants'
import * as Linking from 'expo-linking'
import * as LocalAuthentication from 'expo-local-authentication'
import { StatusBar } from 'expo-status-bar'
import {
  AppState,
  type AppStateStatus,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { WebView } from 'react-native-webview'
import type {
  ShouldStartLoadRequest,
  WebViewNavigation,
  WebViewProgressEvent,
} from 'react-native-webview/lib/WebViewTypes'

const FALLBACK_URL = 'https://closebooks-app.vercel.app'
const APP_URL = String(Constants.expoConfig?.extra?.closebooksUrl ?? FALLBACK_URL)
const STORAGE_KEY = 'closebooks:last-url'

const QUICK_ACTIONS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Clients', path: '/dashboard/clients' },
  { label: 'Advisory', path: '/dashboard/advisory' },
  { label: 'Upload', path: '/dashboard/upload' },
] as const

function isInternalUrl(url: string): boolean {
  return url.startsWith(APP_URL)
}

function resolveAppUrl(path: string): string {
  return path.startsWith('http') ? path : `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function mapDeepLinkToUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  if (isInternalUrl(rawUrl)) return rawUrl

  const parsed = Linking.parse(rawUrl)
  const path = parsed.path ? `/${parsed.path.replace(/^\/+/, '')}` : '/dashboard'
  return resolveAppUrl(path)
}

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const netInfo = useNetInfo()

  const [currentUrl, setCurrentUrl] = useState(APP_URL)
  const [canGoBack, setCanGoBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [lockMessage, setLockMessage] = useState('Unlock with Face ID or Touch ID to continue.')

  const source = useMemo(() => ({ uri: currentUrl }), [currentUrl])

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const [savedUrl, initialUrl, hasHardware, isEnrolled] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        Linking.getInitialURL(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ])

      if (!mounted) return

      const restored = mapDeepLinkToUrl(initialUrl) ?? (savedUrl && isInternalUrl(savedUrl) ? savedUrl : APP_URL)
      setCurrentUrl(restored)

      const biometricsAvailable = hasHardware && isEnrolled
      setBiometricsEnabled(biometricsAvailable)
      if (biometricsAvailable) {
        setIsLocked(true)
        void unlockApp()
      }

      const linkSub = Linking.addEventListener('url', (event) => {
        const nextUrl = mapDeepLinkToUrl(event.url)
        if (nextUrl) {
          setCurrentUrl(nextUrl)
          webViewRef.current?.stopLoading()
        }
      })

      const appStateSub = AppState.addEventListener('change', (nextState) => {
        const wasInactive = appStateRef.current === 'background' || appStateRef.current === 'inactive'
        appStateRef.current = nextState

        if (biometricsAvailable && nextState === 'active' && wasInactive) {
          setIsLocked(true)
          void unlockApp()
        }
      })

      setIsReady(true)

      return () => {
        linkSub.remove()
        appStateSub.remove()
      }
    }

    let cleanup: (() => void) | undefined
    void bootstrap().then((result) => {
      cleanup = result
    })

    return () => {
      mounted = false
      cleanup?.()
    }
  }, [])

  useEffect(() => {
    if (!isInternalUrl(currentUrl)) return
    void AsyncStorage.setItem(STORAGE_KEY, currentUrl)
  }, [currentUrl])

  async function unlockApp() {
    if (!biometricsEnabled || isAuthenticating) {
      setIsLocked(false)
      return
    }

    setIsAuthenticating(true)
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock CloseBooks',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    })
    setIsAuthenticating(false)

    if (result.success) {
      setIsLocked(false)
      setLockMessage('Unlocked.')
      return
    }

    setIsLocked(true)
    setLockMessage('Authentication failed. Try again to access CloseBooks.')
  }

  function handleNavChange(navState: WebViewNavigation) {
    setCurrentUrl(navState.url)
    setCanGoBack(navState.canGoBack)
    setHasError(false)
  }

  function handleShouldStartLoad(request: ShouldStartLoadRequest) {
    if (isInternalUrl(request.url)) return true
    void Linking.openURL(request.url)
    return false
  }

  function handleReload() {
    setHasError(false)
    webViewRef.current?.reload()
  }

  function handleProgress(event: WebViewProgressEvent) {
    setLoadProgress(event.nativeEvent.progress)
  }

  function jumpTo(path: string) {
    const nextUrl = resolveAppUrl(path)
    setCurrentUrl(nextUrl)
  }

  const progressVisible = loading && loadProgress > 0 && loadProgress < 1
  const offline = netInfo.isConnected === false

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CloseBooks iOS</Text>
          <Text style={styles.title}>A native command center for your live CloseBooks stack</Text>
          <Text style={styles.subtitle}>
            Dashboard, advisory, and close workflows are powered by your existing Vercel app.
          </Text>
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

      {offline && (
        <View style={styles.bannerWarning}>
          <Text style={styles.bannerText}>You’re offline. CloseBooks will reconnect automatically when service returns.</Text>
        </View>
      )}

      {progressVisible && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(8, loadProgress * 100)}%` }]} />
        </View>
      )}

      <View style={styles.shortcuts}>
        {QUICK_ACTIONS.map((action) => {
          const active = currentUrl.startsWith(resolveAppUrl(action.path))
          return (
            <Pressable
              key={action.path}
              onPress={() => jumpTo(action.path)}
              style={[styles.shortcutChip, active && styles.shortcutChipActive]}
            >
              <Text style={[styles.shortcutText, active && styles.shortcutTextActive]}>{action.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.container}>
        {!isReady ? (
          <View style={styles.overlayCenter}>
            <ActivityIndicator size="large" color="#2d5a27" />
            <Text style={styles.loadingText}>Preparing CloseBooks...</Text>
          </View>
        ) : hasError ? (
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
              pullToRefreshEnabled
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => {
                setLoading(false)
                setLoadProgress(1)
              }}
              onLoadProgress={handleProgress}
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
            {isLocked && (
              <View style={styles.lockOverlay}>
                <View style={styles.lockCard}>
                  <Text style={styles.lockEyebrow}>Private by default</Text>
                  <Text style={styles.lockTitle}>Unlock CloseBooks</Text>
                  <Text style={styles.lockBody}>{lockMessage}</Text>
                  <Pressable onPress={() => void unlockApp()} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonLabel}>
                      {isAuthenticating ? 'Checking…' : 'Unlock'}
                    </Text>
                  </Pressable>
                </View>
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
    gap: 12,
  },
  headerCopy: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#8d867d',
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    color: '#1a1714',
    fontWeight: '700',
  },
  subtitle: {
    color: '#6d645c',
    fontSize: 13,
    lineHeight: 18,
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
  bannerWarning: {
    backgroundColor: '#fdf1df',
    borderBottomWidth: 1,
    borderBottomColor: '#edd7b3',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bannerText: {
    color: '#9b5f12',
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#efe5d8',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d5a27',
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#faf6f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e6ddd2',
  },
  shortcutChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd4c9',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shortcutChipActive: {
    backgroundColor: '#1a1714',
    borderColor: '#1a1714',
  },
  shortcutText: {
    color: '#5a5149',
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutTextActive: {
    color: '#ffffff',
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f7f4ee',
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 12, 10, 0.66)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#e1d7ca',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  lockEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#8d867d',
    fontWeight: '700',
  },
  lockTitle: {
    fontSize: 24,
    color: '#1a1714',
    fontWeight: '700',
  },
  lockBody: {
    textAlign: 'center',
    color: '#675f57',
    fontSize: 14,
    lineHeight: 20,
  },
})
