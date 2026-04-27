import React from 'react';
import { Text, TouchableOpacity, StyleSheet, TextStyle, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PrimaryButton = ({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.primaryLabel}>{label}</Text>
  </TouchableOpacity>
);

export const SecondaryButton = ({
  label,
  caption,
  leadingIconName,
  onPress,
  disabled,
  style,
  labelStyle,
  captionStyle
}: {
  label: string;
  caption?: string;
  leadingIconName?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  captionStyle?: TextStyle;
}) => (
  <TouchableOpacity
    style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled, style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <View style={styles.secondaryContent}>
      {leadingIconName ? (
        <Ionicons
          name={leadingIconName}
          size={18}
          color="#f7f3e8"
          style={styles.secondaryIcon}
        />
      ) : null}
      <View>
        <Text style={[styles.secondaryLabel, labelStyle]}>{label}</Text>
        {caption ? (
          <Text style={[styles.secondaryCaption, captionStyle]}>{caption}</Text>
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);

export const IconButton = ({
  label,
  iconName,
  onPress,
  disabled,
  iconColor,
  onDisabledPress,
  style,
  labelStyle
}: {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  disabled?: boolean;
  iconColor?: string;
  onDisabledPress?: () => void;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}) => (
  <TouchableOpacity
    style={[styles.iconButton, disabled && styles.iconButtonDisabled, style]}
    onPress={disabled ? onDisabledPress ?? onPress : onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={iconName} size={22} color={iconColor ?? '#f7f3e8'} />
    <Text style={[styles.iconButtonLabel, labelStyle]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#f4d35e',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center'
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1a14'
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center'
  },
  secondaryButtonDisabled: {
    opacity: 0.5
  },
  secondaryLabel: {
    color: '#f7f3e8',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
    textAlignVertical: 'center',
    includeFontPadding: false
  },
  secondaryCaption: {
    color: 'rgba(247,243,232,0.72)',
    fontSize: 11,
    lineHeight: 13,
    marginTop: 2,
    textAlignVertical: 'center',
    includeFontPadding: false
  },
  secondaryContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  secondaryIcon: {
    marginRight: 8
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 4,
    flex: 1,
    minWidth: 0
  },
  iconButtonDisabled: {
    opacity: 0.5
  },
  iconButtonLabel: {
    color: '#f7f3e8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 12,
    minHeight: 24,
    maxWidth: 108,
    textAlignVertical: 'top'
  }
});
