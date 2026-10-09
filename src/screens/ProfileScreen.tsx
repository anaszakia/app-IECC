import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  MapPin,
  Bell,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: Math.max(insets.top + 10, 52),
            paddingBottom: Math.max(insets.bottom + 100, 130),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil Saya</Text>
          <Text style={styles.headerSub}>Informasi akun & pengaturan aplikasi</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <User size={36} color="#0d6efd" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Ahmad Warga Kota'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'warga@iecc.local'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Shield size={13} color="#0d6efd" />
              <Text style={styles.roleBadgeText}>
                {user?.user_type === 'FIELD' ? 'Petugas Lapangan' : 'Warga Terdaftar'}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <CheckCircle2 size={13} color="#16a34a" />
              <Text style={[styles.roleBadgeText, { color: '#16a34a' }]}>Akun Aktif</Text>
            </View>
          </View>
        </View>

        {/* Detail Info List */}
        <Text style={styles.sectionHeading}>DATA PRIBADI & KONTAK</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <User size={18} color="#64748b" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Nama Lengkap</Text>
              <Text style={styles.infoValue}>{user?.name || 'Ahmad Warga Kota'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <Mail size={18} color="#64748b" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Alamat Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'warga@iecc.local'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <Phone size={18} color="#64748b" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Nomor Handphone (Darurat)</Text>
              <Text style={styles.infoValue}>{user?.phone || '0812-3456-7890'}</Text>
            </View>
          </View>
        </View>

        {/* Pengaturan & Info Aplikasi */}
        <Text style={styles.sectionHeading}>SISTEM & INFORMASI</Text>
        <View style={styles.infoCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={18} color="#0d6efd" />
              <Text style={styles.settingText}>Versi Aplikasi</Text>
            </View>
            <Text style={styles.settingValue}>v1.0.4 (IECC Modern)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MapPin size={18} color="#16a34a" />
              <Text style={styles.settingText}>Integrasi GIS & GPS</Text>
            </View>
            <Text style={[styles.settingValue, { color: '#16a34a', fontWeight: 'bold' }]}>Aktif</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={() => setLogoutModalVisible(true)}
        >
          <LogOut size={20} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Konfirmasi Logout */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <AlertCircle size={36} color="#dc3545" />
            </View>
            <Text style={styles.modalTitle}>Konfirmasi Keluar</Text>
            <Text style={styles.modalMessage}>
              Apakah Anda yakin ingin keluar dari akun IECC Mobile? Anda perlu login kembali untuk membuat laporan darurat.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#bfdbfe',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d6efd',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  settingValue: {
    fontSize: 12,
    color: '#64748b',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc3545',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
