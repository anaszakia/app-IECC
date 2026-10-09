import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Mail, Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react-native';
import { ApiService } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('warga@iecc.local');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    const targetEmail = loginEmail || email;
    const targetPass = loginPass || password;

    if (!targetEmail || !targetPass) {
      Alert.alert('Perhatian', 'Silakan isi email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiService.login(targetEmail, targetPass);
      if (res.ok && res.data.success) {
        login(res.data.data.user, res.data.data.token);
      } else {
        Alert.alert('Gagal Masuk', res.data?.message || 'Email atau kata sandi salah.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal terhubung ke server backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <ShieldAlert size={40} color="#ffffff" />
          </View>
          <Text style={styles.appName}>IECC Mobile</Text>
          <Text style={styles.appSub}>Integrated Emergency Command Center</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk ke Akun</Text>
          <Text style={styles.cardSub}>Akses portal warga atau panel armada lapangan.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.8 }]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Fast Login Selector */}
        <View style={styles.quickAccessBox}>
          <Text style={styles.quickAccessTitle}>PILIH AKUN LOGIN DEMO:</Text>

          {/* Akun Warga */}
          <TouchableOpacity
            style={[styles.quickCard, { borderColor: '#16a34a' }]}
            activeOpacity={0.8}
            onPress={() => {
              setEmail('warga@iecc.local');
              setPassword('12345678');
              handleLogin('warga@iecc.local', '12345678');
            }}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#16a34a20' }]}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.quickCardHeader}>
                <Text style={[styles.quickCardTitle, { color: '#4ade80' }]}>Ahmad (Warga Kota)</Text>
                <Text style={styles.quickBadgeCitizen}>WARGA</Text>
              </View>
              <Text style={styles.quickCardSub}>Pelaporan Darurat SOS, Foto/Video & Lokasi</Text>
            </View>
          </TouchableOpacity>

          {/* Unit Armada Petugas Lapangan */}
          <Text style={[styles.quickAccessTitle, { marginTop: 16, marginBottom: 8 }]}>UNIT ARMADA PETUGAS LAPANGAN:</Text>

          <View style={styles.quickGrid}>
            {/* 1. Ambulans */}
            <TouchableOpacity
              style={[styles.quickGridCard, { borderColor: '#0d6efd' }]}
              activeOpacity={0.8}
              onPress={() => {
                setEmail('field.ambulance@iecc.local');
                setPassword('12345678');
                handleLogin('field.ambulance@iecc.local', '12345678');
              }}
            >
              <View style={styles.quickGridTop}>
                <Text style={{ fontSize: 20 }}>🚑</Text>
                <View style={[styles.unitCodeBadge, { backgroundColor: '#0d6efd25' }]}>
                  <Text style={[styles.unitCodeText, { color: '#38bdf8' }]}>AMB-01</Text>
                </View>
              </View>
              <Text style={styles.quickGridTitle}>Ambulans PSC 119</Text>
              <Text style={styles.quickGridSub}>Dinas Kesehatan</Text>
            </TouchableOpacity>

            {/* 2. Damkar */}
            <TouchableOpacity
              style={[styles.quickGridCard, { borderColor: '#f08c00' }]}
              activeOpacity={0.8}
              onPress={() => {
                setEmail('field.damkar@iecc.local');
                setPassword('12345678');
                handleLogin('field.damkar@iecc.local', '12345678');
              }}
            >
              <View style={styles.quickGridTop}>
                <Text style={{ fontSize: 20 }}>🚒</Text>
                <View style={[styles.unitCodeBadge, { backgroundColor: '#f08c0025' }]}>
                  <Text style={[styles.unitCodeText, { color: '#fbbf24' }]}>DAM-01</Text>
                </View>
              </View>
              <Text style={styles.quickGridTitle}>Damkar & Rescue</Text>
              <Text style={styles.quickGridSub}>Dinas Pemadam</Text>
            </TouchableOpacity>

            {/* 3. Polisi */}
            <TouchableOpacity
              style={[styles.quickGridCard, { borderColor: '#0891b2' }]}
              activeOpacity={0.8}
              onPress={() => {
                setEmail('field.polisi@iecc.local');
                setPassword('12345678');
                handleLogin('field.polisi@iecc.local', '12345678');
              }}
            >
              <View style={styles.quickGridTop}>
                <Text style={{ fontSize: 20 }}>🚓</Text>
                <View style={[styles.unitCodeBadge, { backgroundColor: '#0891b225' }]}>
                  <Text style={[styles.unitCodeText, { color: '#22d3ee' }]}>POL-01</Text>
                </View>
              </View>
              <Text style={styles.quickGridTitle}>Patroli Polresta</Text>
              <Text style={styles.quickGridSub}>Kepolisian Kota</Text>
            </TouchableOpacity>

            {/* 4. Tim Rescue BPBD */}
            <TouchableOpacity
              style={[styles.quickGridCard, { borderColor: '#16a34a' }]}
              activeOpacity={0.8}
              onPress={() => {
                setEmail('field.rescue@iecc.local');
                setPassword('12345678');
                handleLogin('field.rescue@iecc.local', '12345678');
              }}
            >
              <View style={styles.quickGridTop}>
                <Text style={{ fontSize: 20 }}>🛟</Text>
                <View style={[styles.unitCodeBadge, { backgroundColor: '#16a34a25' }]}>
                  <Text style={[styles.unitCodeText, { color: '#4ade80' }]}>RES-01</Text>
                </View>
              </View>
              <Text style={styles.quickGridTitle}>Tim Rescue BPBD</Text>
              <Text style={styles.quickGridSub}>Badan Bencana</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20, paddingTop: 36, paddingBottom: 40, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  appName: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  appSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: '#cbd5e1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 46, color: '#ffffff', fontSize: 14 },
  eyeBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  loginBtn: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  
  // Quick Access Box
  quickAccessBox: { marginTop: 24 },
  quickAccessTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8 },
  
  // Citizen Card
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
    marginBottom: 6,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  quickBadgeCitizen: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
    backgroundColor: '#16a34a20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quickCardSub: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // Units Grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickGridCard: {
    width: '48.5%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  quickGridTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitCodeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickGridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  quickGridSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

