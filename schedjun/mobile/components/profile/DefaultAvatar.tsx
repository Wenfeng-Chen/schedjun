import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors } from '../../constants/theme';

interface DefaultAvatarProps {
  nickname?: string;
  size?: number;
  guest?: boolean;
}

function getInitial(nickname?: string) {
  const text = nickname?.trim();
  if (!text) {
    return '君';
  }
  return text.slice(0, 1).toUpperCase();
}

export default function DefaultAvatar({ nickname, size = 72, guest = false }: DefaultAvatarProps) {
  const initial = guest ? '?' : getInitial(nickname);
  const fontSize = Math.round(size * 0.38);

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={guest ? ['#D8DEE8', '#C4CBD6'] : [colors.primary, '#6B96FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      </LinearGradient>
      <View style={[styles.ring, { borderRadius: size / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});
