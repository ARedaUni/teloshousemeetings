import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Paragraph,
  Snackbar,
} from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { v4 as uuidv4 } from 'uuid';

export default function HomeScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  });

  const [audioFolderId, setAudioFolderId] = useState('');
  const [summaryFolderId, setSummaryFolderId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string[]>([]);
  const [clientId] = useState(() => uuidv4());
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:8000/api/v1/audio/ws/' + clientId);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'status':
          setProcessingStatus(prev => [...prev, lastMessage.message]);
          setStatusMessage(lastMessage.message);
          setSnackbarVisible(true);
          break;
        case 'error':
          setStatusMessage(`Error: ${lastMessage.message}`);
          setSnackbarVisible(true);
          break;
        case 'progress':
          // Handle progress updates
          break;
      }
    }
  }, [lastMessage]);

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        setAccessToken(result.authentication?.accessToken || null);
        setStatusMessage('Successfully authenticated with Google');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setStatusMessage('Error authenticating with Google');
      setSnackbarVisible(true);
    }
  };

  const handleProcess = async () => {
    if (!accessToken) {
      setStatusMessage('Please sign in with Google first.');
      setSnackbarVisible(true);
      return;
    }
    if (!audioFolderId || !summaryFolderId) {
      setStatusMessage('Please specify both folder IDs.');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setProcessingStatus([]);
    setStatusMessage('Processing started. Please wait...');
    setSnackbarVisible(true);

    try {
      sendMessage({
        type: 'start_processing',
        data: {
          audioFolderId,
          summaryFolderId,
          accessToken
        }
      });
    } catch (e: any) {
      setStatusMessage('Error starting process: ' + e.message);
      setSnackbarVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Google Drive Audio Processing</Title>
          <Paragraph>
            Securely authenticate with Google to process audio files and save
            summaries.
          </Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.form}>
        {!accessToken && (
          <Button
            mode="contained"
            onPress={handleGoogleLogin}
            style={styles.button}
          >
            Login with Google
          </Button>
        )}
        {accessToken && (
          <Text style={styles.info}>Authenticated with Google</Text>
        )}

        <TextInput
          label="Audio Folder ID"
          value={audioFolderId}
          onChangeText={setAudioFolderId}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Summary Folder ID"
          value={summaryFolderId}
          onChangeText={setSummaryFolderId}
          style={styles.input}
          mode="outlined"
        />

        <Button
          mode="contained"
          onPress={handleProcess}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Process Files
        </Button>

        {processingStatus.length > 0 && (
          <ProcessingStatus messages={processingStatus} />
        )}
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {statusMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginVertical: 10,
  },
  info: {
    marginBottom: 10,
    color: 'green',
    fontSize: 16,
    fontWeight: '600',
  },
});
