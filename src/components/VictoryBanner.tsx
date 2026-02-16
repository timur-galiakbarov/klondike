import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type VictoryBannerProps = {
  visible: boolean;
  moves: number;
  time: string;
  onClose: () => void;
  onNewGame: () => void;
};

export const VictoryBanner = ({ 
  visible, 
  moves, 
  time, 
  onClose, 
  onNewGame 
}: VictoryBannerProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Закрывающий крестик */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1e1a14" />
          </TouchableOpacity>
          
          {/* Иконка победы */}
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={64} color="#f4d35e" />
          </View>
          
          {/* Заголовок */}
          <Text style={styles.title}>Победа!</Text>
          
          {/* Статистика */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="play" size={24} color="#1e1a14" />
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Ходов</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#1e1a14" />
              <Text style={styles.statValue}>{time}</Text>
              <Text style={styles.statLabel}>Время</Text>
            </View>
          </View>
          
          {/* Кнопка новой игры */}
          <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
            <Text style={styles.newGameButtonText}>Новая игра</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#f7f3e8',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#f4d35e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244, 211, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#f4d35e',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e1a14',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e3e0d4',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e3e0d4',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e1a14',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  newGameButton: {
    backgroundColor: '#f4d35e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e3c34d',
  },
  newGameButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e1a14',
  },
});

export default VictoryBanner;