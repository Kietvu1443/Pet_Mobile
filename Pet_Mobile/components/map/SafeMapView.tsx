import React, {
  Component,
  ReactNode,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  UIManager,
  Platform,
  Pressable,
  TurboModuleRegistry,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type {
  CameraRef,
  StyleSpecification,
  PressEvent,
} from '@maplibre/maplibre-react-native';

// Safe dynamic reference to @maplibre/maplibre-react-native
let mapLibreModule: any = null;
let mapLibreAttempted = false;

export function getMapLibre(): any {
  if (mapLibreAttempted) return mapLibreModule;
  mapLibreAttempted = true;

  if (Platform.OS === 'web') return null;

  try {
    // Check if MLRNCameraModule TurboModule exists in the native binary.
    // If it does not exist, DO NOT require @maplibre/maplibre-react-native
    // because NativeCameraModule.js calls TurboModuleRegistry.getEnforcing('MLRNCameraModule') which crashes immediately.
    const hasCameraTurbo = Boolean(TurboModuleRegistry?.get?.('MLRNCameraModule'));
    if (!hasCameraTurbo) {
      return null;
    }

    mapLibreModule = require('@maplibre/maplibre-react-native');
  } catch (err) {
    console.warn('[SafeMapView] Native MapLibre module could not be loaded:', err);
    mapLibreModule = null;
  }

  return mapLibreModule;
}

export const Marker = (props: any) => {
  const ML = getMapLibre();
  if (ML?.Marker) {
    const MLMarker = ML.Marker;
    return <MLMarker {...props} />;
  }
  return null;
};
import { Place, openDirectionsInMaps } from '../../lib/api/places';
import { SafeCoords, DEFAULT_MAP_CENTER } from '../../lib/location/safeLocation';
import { CustomPlaceMarker } from './CustomPlaceMarker';

/**
 * Cấu hình nguồn bản đồ OpenStreetMap (OSM) chuẩn MapLibre Style Specification
 * Có thể ghi đè tile URL qua biến môi trường EXPO_PUBLIC_OSM_TILE_URL
 */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster-source': {
      type: 'raster',
      tiles: [
        process.env.EXPO_PUBLIC_OSM_TILE_URL ||
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster-source',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function isNativeMapAvailable(): boolean {
  if (Platform.OS === 'web') return false;

  try {
    const ML = getMapLibre();
    return Boolean(ML?.Map && ML?.Camera);
  } catch {
    return false;
  }
}

export interface SafeMapViewRef {
  flyTo: (coords: { latitude: number; longitude: number }, zoom?: number) => void;
  easeTo: (coords: { latitude: number; longitude: number }, zoom?: number) => void;
}

export interface SafeMapViewProps {
  places?: Place[];
  userLocation?: SafeCoords | null;
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  onMapLongPress?: (coords: { latitude: number; longitude: number }) => void;
  centerCoords?: { latitude: number; longitude: number };
  initialCenter?: SafeCoords;
  initialZoom?: number;
  style?: any;
  height?: number;
  isFullScreen?: boolean;
  children?: ReactNode;
  attributionStyle?: any;
  onRetry?: () => void;
  onTouchMap?: () => void;
}

/**
 * Attribution bản quyền OpenStreetMap hợp chuẩn
 */
export function OsmAttribution({ style }: { style?: any }) {
  return (
    <View style={[styles.osmAttribution, style]} pointerEvents="none">
      <Text style={styles.osmAttributionText}>© OpenStreetMap contributors</Text>
    </View>
  );
}

export const OsmUrlTile = () => null;
export const FallbackInteractiveMap = MapErrorFallback;

export interface MapErrorFallbackProps {
  onRetry?: () => void;
  style?: any;
  height?: number;
  isFullScreen?: boolean;
  latitude?: number;
  longitude?: number;
  title?: string;
  errorMessage?: string;
}

/**
 * Giao diện thông báo lỗi nhẹ nhàng khi native MapLibre chưa được biên dịch vào app
 */
export function MapErrorFallback({
  onRetry,
  style,
  height = 260,
  isFullScreen = false,
  latitude = 10.7769,
  longitude = 106.7009,
  title = 'Bản đồ thú cưng',
  errorMessage,
}: MapErrorFallbackProps) {
  const handleOpenExternal = () => {
    openDirectionsInMaps(latitude, longitude, title);
  };

  return (
    <View
      style={[
        styles.fallbackContainer,
        isFullScreen ? styles.fallbackFullScreen : { height },
        style,
      ]}
    >
      <View style={styles.errorIconWrap}>
        <MaterialIcons name="map" size={32} color="#00220F" />
      </View>
      <Text style={styles.errorTitle}>Bản đồ MapLibre cần build mới</Text>
      <Text style={styles.errorSubtitle}>
        {errorMessage ||
          'Thư viện MapLibre Native đã được cấu hình trong app.json. Cần chạy "npx expo run:android" để nạp binary native. Bạn có thể mở trực tiếp địa điểm trên ứng dụng bản đồ bên dưới.'}
      </Text>

      <View style={styles.errorActions}>
        {onRetry && (
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
            onPress={onRetry}
          >
            <MaterialIcons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.externalBtn, pressed && { opacity: 0.8 }]}
          onPress={handleOpenExternal}
        >
          <MaterialIcons name="open-in-new" size={16} color="#00220F" />
          <Text style={styles.externalBtnText}>Mở bản đồ ngoài</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('[SafeMapView] MapLibre failed to render, activating fallback:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error);
      }
      return <MapErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

/**
 * Abstraction bản đồ MapLibre chung cho toàn bộ dự án Pet_Mobile
 * - 100% không dùng Google Maps SDK / API key
 * - Hiển thị nền OpenStreetMap thật với tên đường, ngõ xóm
 * - Quản lý camera tự do (không tự giật snap về vị trí GPS khi kéo)
 */
export const SafeMapView = forwardRef<SafeMapViewRef, SafeMapViewProps>(
  (
    {
      places = [],
      userLocation,
      selectedPlace,
      onSelectPlace,
      onMapPress,
      onMapLongPress,
      centerCoords,
      initialCenter = DEFAULT_MAP_CENTER,
      initialZoom = 13,
      style,
      height = 260,
      isFullScreen = false,
      children,
      attributionStyle,
      onRetry,
      onTouchMap,
    },
    ref
  ) => {
    const cameraRef = useRef<CameraRef>(null);
    const isMapReadyRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true);
    const pendingCameraActionRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      isMountedRef.current = true;
      // Fallback timer: sau 400ms nếu onDidFinishLoadingMap chưa gọi, vẫn cho phép camera actions
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          isMapReadyRef.current = true;
          if (pendingCameraActionRef.current) {
            const pending = pendingCameraActionRef.current;
            pendingCameraActionRef.current = null;
            pending();
          }
        }
      }, 400);

      return () => {
        isMountedRef.current = false;
        isMapReadyRef.current = false;
        pendingCameraActionRef.current = null;
        clearTimeout(timer);
      };
    }, []);

    const safeCameraAction = useCallback((action: () => Promise<void> | void) => {
      if (!isMountedRef.current) return;

      if (!isMapReadyRef.current) {
        pendingCameraActionRef.current = action;
        return;
      }

      try {
        const res = action();
        if (res && typeof (res as any).catch === 'function') {
          (res as any).catch((err: any) => {
            // Nuốt lỗi nếu view vừa unmount hoặc reactTag chưa sẵn sàng trên native thread
            console.log('[SafeMapView] Camera action ignored:', err?.message || err);
          });
        }
      } catch (err: any) {
        console.log('[SafeMapView] Camera action sync error:', err?.message || err);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      flyTo: (coords: { latitude: number; longitude: number }, zoom = 14) => {
        safeCameraAction(() =>
          cameraRef.current?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom,
            duration: 600,
          }) as any
        );
      },
      easeTo: (coords: { latitude: number; longitude: number }, zoom = 14) => {
        safeCameraAction(() =>
          cameraRef.current?.easeTo({
            center: [coords.longitude, coords.latitude],
            zoom,
            duration: 400,
          }) as any
        );
      },
    }));

    const prevCenterRef = useRef<string>('');
    useEffect(() => {
      if (centerCoords && centerCoords.latitude && centerCoords.longitude) {
        const key = `${centerCoords.latitude.toFixed(5)},${centerCoords.longitude.toFixed(5)}`;
        if (key !== prevCenterRef.current) {
          prevCenterRef.current = key;
          safeCameraAction(() =>
            cameraRef.current?.flyTo({
              center: [centerCoords.longitude, centerCoords.latitude],
              zoom: initialZoom,
              duration: 600,
            }) as any
          );
        }
      }
    }, [centerCoords?.latitude, centerCoords?.longitude, initialZoom, safeCameraAction]);

    const isAvailable = isNativeMapAvailable();

    if (!isAvailable) {
      return (
        <MapErrorFallback
          height={height}
          isFullScreen={isFullScreen}
          style={style}
          onRetry={onRetry}
          latitude={userLocation?.latitude || initialCenter.latitude}
          longitude={userLocation?.longitude || initialCenter.longitude}
        />
      );
    }

    const ML = getMapLibre();
    if (!ML?.Map || !ML?.Camera) {
      return (
        <MapErrorFallback
          height={height}
          isFullScreen={isFullScreen}
          style={style}
          onRetry={onRetry}
          latitude={userLocation?.latitude || initialCenter.latitude}
          longitude={userLocation?.longitude || initialCenter.longitude}
        />
      );
    }

    const { Map: MLMap, Camera: MLCamera, Marker: MLMarker } = ML;

    const handleMapPressEvent = (e: any) => {
      const coords = e?.nativeEvent?.lngLat || e?.lngLat;
      if (onMapPress && coords) {
        onMapPress({
          longitude: coords[0],
          latitude: coords[1],
        });
      }
    };

    const handleMapLongPressEvent = (e: any) => {
      const coords = e?.nativeEvent?.lngLat || e?.lngLat;
      if (onMapLongPress && coords && Array.isArray(coords) && coords.length >= 2) {
        const [lng, lat] = coords;
        // Phân biệt với marker interaction: không kích hoạt nếu tọa độ trùng gần với marker hiện có
        const isNearExistingMarker = places.some((p) => {
          const latDiff = Math.abs(p.latitude - lat);
          const lngDiff = Math.abs(p.longitude - lng);
          return latDiff < 0.0005 && lngDiff < 0.0005;
        });
        if (!isNearExistingMarker) {
          onMapLongPress({
            longitude: lng,
            latitude: lat,
          });
        }
      }
    };

    return (
      <MapErrorBoundary
        fallback={() => (
          <MapErrorFallback
            height={height}
            isFullScreen={isFullScreen}
            style={style}
            onRetry={onRetry}
            latitude={userLocation?.latitude || initialCenter.latitude}
            longitude={userLocation?.longitude || initialCenter.longitude}
          />
        )}
      >
        <View
          style={[
            styles.mapContainer,
            isFullScreen ? styles.mapContainerFullScreen : { height },
            style,
          ]}
          onTouchStart={onTouchMap}
        >
          <MLMap
            style={StyleSheet.absoluteFill}
            mapStyle={OSM_RASTER_STYLE}
            attribution={false}
            logo={false}
            compass={false}
            dragPan={true}
            touchZoom={true}
            onPress={handleMapPressEvent}
            onLongPress={handleMapLongPressEvent}
            onDidFinishLoadingMap={() => {
              isMapReadyRef.current = true;
              if (pendingCameraActionRef.current) {
                const pending = pendingCameraActionRef.current;
                pendingCameraActionRef.current = null;
                setTimeout(() => {
                  if (isMountedRef.current) {
                    pending();
                  }
                }, 50);
              }
            }}
          >
            <MLCamera
              ref={cameraRef}
              initialViewState={{
                center: [initialCenter.longitude, initialCenter.latitude],
                zoom: initialZoom,
              }}
            />

            {/* User GPS Location Marker (chỉ render khi có GPS thật từ expo-location) */}
            {userLocation && (
              <MLMarker
                id="user-location-marker"
                lngLat={[userLocation.longitude, userLocation.latitude]}
                anchor="center"
              >
                <View style={styles.userMarkerContainer} pointerEvents="none">
                  <View style={styles.userPulseRing} />
                  <View style={styles.userCenterDot} />
                </View>
              </MLMarker>
            )}

            {/* Backend Places Markers */}
            {places.map((place) => (
              <MLMarker
                key={`place-${place.id}`}
                id={`place-${place.id}`}
                lngLat={[place.longitude, place.latitude]}
                anchor="bottom"
                onPress={() => onSelectPlace?.(place)}
              >
                <CustomPlaceMarker
                  place={place}
                  isSelected={selectedPlace?.id === place.id}
                />
              </MLMarker>
            ))}

            {/* Custom Markers / Children (e.g. for add-place) */}
            {children}
          </MLMap>

          {/* Attribution OpenStreetMap hợp chuẩn */}
          <OsmAttribution style={attributionStyle} />
        </View>
      </MapErrorBoundary>
    );
  }
);

SafeMapView.displayName = 'SafeMapView';

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  mapContainerFullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  userMarkerContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
  },
  userCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  fallbackContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
  },
  fallbackFullScreen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDF7EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 320,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00220F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  externalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  externalBtnText: {
    color: '#00220F',
    fontSize: 13,
    fontWeight: '600',
  },
  osmAttribution: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  osmAttributionText: {
    fontSize: 9,
    color: '#334155',
    fontWeight: '500',
  },
});
