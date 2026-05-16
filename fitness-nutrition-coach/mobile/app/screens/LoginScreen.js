import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', username: '', first_name: '', last_name: '',
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }
    if (!isLogin && form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.username || !form.first_name || !form.last_name) {
          Alert.alert('Error', 'All fields are required for registration.');
          setLoading(false);
          return;
        }
        if (form.username.length < 3) {
          Alert.alert('Error', 'Username must be at least 3 characters.');
          setLoading(false);
          return;
        }
        await register({
          email: form.email,
          password: form.password,
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.title}>Fitness Coach</Text>
        <Text style={styles.subtitle}>AI-Powered Fitness & Nutrition</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>{isLogin ? 'Sign In' : 'Create Account'}</Text>

          {!isLogin && (
            <>
              <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#aaa" value={form.first_name}
                onChangeText={(v) => set('first_name', v)} autoCapitalize="words" />
              <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#aaa" value={form.last_name}
                onChangeText={(v) => set('last_name', v)} autoCapitalize="words" />
              <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#aaa" value={form.username}
                onChangeText={(v) => set('username', v)} autoCapitalize="none" />
            </>
          )}

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={form.email}
            onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaa" value={form.password}
            onChangeText={(v) => set('password', v)} secureTextEntry />

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.btnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 60, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1a1a2e' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: '#fafafa' },
  btn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  toggle: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: '#666', fontSize: 14 },
  toggleLink: { color: '#007AFF', fontWeight: 'bold' },
});

export default LoginScreen;
