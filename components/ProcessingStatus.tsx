import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface ProcessingStatusProps {
  messages: string[];
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ messages }) => {
  return (
    <ScrollView style={styles.container}>
      {messages.map((message, index) => (
        <Text key={index} style={styles.message}>
          • {message}
        </Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  message: {
    marginBottom: 5,
    fontSize: 14,
  },
});