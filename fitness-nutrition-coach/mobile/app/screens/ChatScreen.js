import React from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Alert } from 'react-native';
import { chatAPI } from '../utils/api';

const ChatScreen = () => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Load chat history on component mount
  React.useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory({ limit: 50 });
      const formattedMessages = response.messages.map((msg, index) => ({
        id: index + 1,
        sender: 'user',
        text: msg.user_message,
      })).concat(response.messages.map((msg, index) => ({
        id: index + response.messages.length + 1,
        sender: 'coach',
        text: msg.ai_response,
      }))).sort((a, b) => a.id - b.id);

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Set default welcome message if no history
      setMessages([
        { id: 1, sender: 'coach', text: 'Hello! I\'m your AI fitness coach. How can I help you today?' },
      ]);
    }
  };

  const handleSend = async () => {
    if (input.trim() && !loading) {
      const userMessage = input.trim();
      setInput('');
      setLoading(true);

      // Add user message to UI immediately
      const userMessageObj = {
        id: messages.length + 1,
        sender: 'user',
        text: userMessage,
      };
      setMessages(prev => [...prev, userMessageObj]);

      try {
        // Send message to API
        const response = await chatAPI.sendMessage(userMessage);

        // Add AI response to UI
        const aiMessageObj = {
          id: messages.length + 2,
          sender: 'coach',
          text: response.ai_response,
        };
        setMessages(prev => [...prev, aiMessageObj]);
      } catch (error) {
        console.error('Failed to send message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        // Remove the user message if API call failed
        setMessages(prev => prev.slice(0, -1));
        setInput(userMessage); // Restore the input
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View key={message.id} style={[
            styles.messageRow,
            message.sender === 'user' ? styles.userRow : styles.coachRow
          ]}>
            <View style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.coachBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.sender === 'user' ? styles.userText : styles.coachText
              ]}>
                {message.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={loading ? "AI is thinking..." : "Ask me anything..."}
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          multiline
          maxHeight={100}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={[styles.sendButtonText, loading && styles.sendButtonTextDisabled]}>
            {loading ? "..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  coachRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  coachBubble: {
    backgroundColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  coachText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
});

export default ChatScreen;
