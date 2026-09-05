import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Place, PLACE_CATEGORIES } from '../../lib/api/places';

interface CustomPlaceMarkerProps {
  place: Place;
  isSelected?: boolean;
}

export const CustomPlaceMarker = React.memo(function CustomPlaceMarker({
  place,
  isSelected = false,
}: CustomPlaceMarkerProps) {
  const meta = PLACE_CATEGORIES[place.type] || PLACE_CATEGORIES.other;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.markerBubble,
          { backgroundColor: isSelected ? meta.color : '#FFFFFF', borderColor: meta.color },
          isSelected && styles.markerBubbleSelected,
        ]}
      >
        <MaterialIcons
          name={(meta.icon as any) || 'pets'}
          size={18}
          color={isSelected ? '#FFFFFF' : meta.color}
        />
      </View>
      {/* Pin pointer triangle */}
      <View
        style={[
          styles.pinPointer,
          { borderTopColor: isSelected ? meta.color : '#FFFFFF' },
        ]}
      />
      {isSelected && (
        <View style={styles.labelContainer}>
          <Text numberOfLines={1} style={styles.labelText}>
            {place.name}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerBubbleSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
    transform: [{ scale: 1.1 }],
  },
  pinPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 34, 15, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
    maxWidth: 140,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
