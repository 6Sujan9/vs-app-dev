import React from 'react';
import {
  StyleSheet, View, Text, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { chatAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(String(timeStr).replace(' ', 'T'));
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const TypingIndicator = ({ C }) => {
  const dot1 = React.useRef(new Animated.Value(0)).current;
  const dot2 = React.useRef(new Animated.Value(0)).current;
  const dot3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 4 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: C.textMuted,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
};

const MessageBubble = ({ message, isNew, C, theme }) => {
  const isCoach = message.sender === 'coach';
  const slideAnim = React.useRef(new Animated.Value(isNew ? 30 : 0)).current;
  const opacityAnim = React.useRef(new Animated.Value(isNew ? 0 : 1)).current;

  React.useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  if (isCoach) {
    return (
      <Animated.View
        style={[
          styles.coachRow,
          { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
        ]}
      >
        <View style={[styles.coachAvatar, { backgroundColor: C.hero }]}>
          <Text style={styles.coachAvatarEmoji}>🤖</Text>
        </View>
        <View style={styles.coachBubbleWrap}>
          <View style={[
            styles.coachBubble,
            {
              backgroundColor: C.card,
              shadowColor: theme.isDark ? C.shadow : '#000',
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
            },
          ]}>
            <Text style={[styles.coachText, { color: C.text }]}>{message.text}</Text>
          </View>
          {message.time ? (
            <Text style={[styles.timeText, { color: C.textMuted }]}>{formatTime(message.time)}</Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.userRow,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.userBubbleWrap}>
        <View style={[styles.userBubble, { backgroundColor: C.primary }]}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
        {message.time ? (
          <Text style={[styles.timeTextRight, { color: C.textMuted }]}>{formatTime(message.time)}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
};

const ChatScreen = () => {
  const { theme } = useTheme();
  const C = theme.colors;

  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [newMessageIds, setNewMessageIds] = React.useState(new Set());
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

      const userMsgId = Date.now();
      const userMessageObj = {
        id: userMsgId,
        sender: 'user',
        text: userMessage,
        time: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessageObj]);
      setNewMessageIds(prev => new Set([...prev, userMsgId]));

      try {
        const response = await chatAPI.sendMessage(userMessage);
        const aiMsgId = Date.now() + 1;
        const aiMessageObj = {
          id: aiMsgId,
          sender: 'coach',
          text: response.ai_response,
          time: response.created_at || new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessageObj]);
        setNewMessageIds(prev => new Set([...prev, aiMsgId]));
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
      style={[styles.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.chatHeader, { backgroundColor: C.hero }]}>
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
          <MessageBubble
            key={message.id}
            message={message}
            isNew={newMessageIds.has(message.id)}
            C={C}
            theme={theme}
          />
        ))}
        {loading && (
          <View style={styles.coachRow}>
            <View style={[styles.coachAvatar, { backgroundColor: C.hero }]}>
              <Text style={styles.coachAvatarEmoji}>🤖</Text>
            </View>
            <View style={[styles.typingBubble, { backgroundColor: C.card }]}>
              <TypingIndicator C={C} />
            </View>
          </View>
        )}
        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: C.inputBg, color: C.text }]}
          placeholder={loading ? 'AI is thinking…' : 'Ask me anything…'}
          placeholderTextColor={C.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxHeight={100}
          editable={!loading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: C.primary },
            (!input.trim() || loading) && styles.sendButtonDisabled,
          ]}
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
  container: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  messagesContainer: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  coachAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  coachAvatarEmoji: { fontSize: 16 },
  coachBubbleWrap: { flex: 1, maxWidth: '78%' },
  coachBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowRadius: 3,
    elevation: 1,
  },
  coachText: { fontSize: 14, lineHeight: 20 },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  userBubbleWrap: { maxWidth: '78%', alignItems: 'flex-end' },
  userBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 3, marginLeft: 4 },
  timeTextRight: { fontSize: 10, marginTop: 3, marginRight: 4 },
  typingBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 16, color: '#fff', marginLeft: 2 },
});

export default ChatScreen;
