import React from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { chatAPI } from '../utils/api';

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(String(timeStr).replace(' ', 'T'));
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const ChatScreen = () => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory({ limit: 50 });
      const reversed = [...(response.messages || [])].reverse();
      const formatted = [];
      reversed.forEach((msg, i) => {
        formatted.push({ id: i * 2, sender: 'user', text: msg.user_message, time: msg.created_at });
        formatted.push({ id: i * 2 + 1, sender: 'coach', text: msg.ai_response, time: msg.created_at });
      });
      setMessages(
        formatted.length > 0
          ? formatted
          : [{ id: 0, sender: 'coach', text: "Hello! I'm your AI fitness coach. How can I help you today?", time: new Date().toISOString() }]
      );
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([{ id: 0, sender: 'coach', text: "Hello! I'm your AI fitness coach. How can I help you today?", time: new Date().toISOString() }]);
    }
  };

  const handleSend = async () => {
    if (input.trim() && !loading) {
      const userMessage = input.trim();
      setInput('');
      setLoading(true);

      const userMessageObj = {
        id: Date.now(),
        sender: 'user',
        text: userMessage,
        time: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessageObj]);

      try {
        const response = await chatAPI.sendMessage(userMessage);
        const aiMessageObj = {
          id: Date.now() + 1,
          sender: 'coach',
          text: response.ai_response,
          time: response.created_at || new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessageObj]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (error) {
        console.error('Failed to send message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setMessages(prev => prev.slice(0, -1));
        setInput(userMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarEmoji}>🤖</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Fitness Coach</Text>
          <Text style={styles.headerSub}>{loading ? 'Thinking...' : 'Online'}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((message) => (
          message.sender === 'coach'
            ? (
              <View key={message.id} style={styles.coachRow}>
                <View style={styles.coachAvatar}>
                  <Text style={styles.coachAvatarEmoji}>🤖</Text>
                </View>
                <View style={styles.coachBubbleWrap}>
                  <View style={styles.coachBubble}>
                    <Text style={styles.coachText}>{message.text}</Text>
                  </View>
                  {message.time ? (
                    <Text style={styles.timeText}>{formatTime(message.time)}</Text>
                  ) : null}
                </View>
              </View>
            )
            : (
              <View key={message.id} style={styles.userRow}>
                <View style={styles.userBubbleWrap}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{message.text}</Text>
                  </View>
                  {message.time ? (
                    <Text style={styles.timeTextRight}>{formatTime(message.time)}</Text>
                  ) : null}
                </View>
              </View>
            )
        ))}
        {loading && (
          <View style={styles.coachRow}>
            <View style={styles.coachAvatar}>
              <Text style={styles.coachAvatarEmoji}>🤖</Text>
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>• • •</Text>
            </View>
          </View>
        )}
        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={loading ? 'AI is thinking…' : 'Ask me anything…'}
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          multiline
          maxHeight={100}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },

  // Header bar
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a237e', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14, gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  // Messages
  messagesContainer: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },

  coachRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  coachAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  coachAvatarEmoji: { fontSize: 16 },
  coachBubbleWrap: { flex: 1, maxWidth: '78%' },
  coachBubble: { backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  coachText: { fontSize: 14, color: '#1a1a2e', lineHeight: 20 },

  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  userBubbleWrap: { maxWidth: '78%', alignItems: 'flex-end' },
  userBubble: { backgroundColor: '#1a237e', borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userText: { fontSize: 14, color: '#fff', lineHeight: 20 },

  timeText: { fontSize: 10, color: '#aaa', marginTop: 3, marginLeft: 4 },
  timeTextRight: { fontSize: 10, color: '#aaa', marginTop: 3, marginRight: 4 },

  typingBubble: { backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12 },
  typingDots: { fontSize: 14, color: '#aaa', letterSpacing: 3 },

  // Input bar
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e8e8e8', gap: 8 },
  input: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1a1a2e', maxHeight: 100 },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#c8d0e8' },
  sendIcon: { fontSize: 16, color: '#fff', marginLeft: 2 },
});

export default ChatScreen;
