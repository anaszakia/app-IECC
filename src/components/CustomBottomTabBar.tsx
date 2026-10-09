import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Clock,
  User,
  LogOut,
  AlertCircle,
  Truck,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CustomBottomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { user, logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const isFieldOfficer = user?.user_type === 'FIELD' || user?.role === 'field-officer';

  return (
    <View style={styles.container}>
      {/* Tab Bar Background & Items */}
      <View style={styles.bar}>
        {/* 1. Dashboard */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(isFieldOfficer ? 'FieldDashboard' : 'Dashboard')}
        >
          <LayoutDashboard
            size={22}
            color={state.index === 0 ? '#0d6efd' : '#94a3b8'}
          />
          <Text
            style={[
              styles.tabLabel,
              state.index === 0 && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* 2. Tugas Lapangan (Petugas) / Laporan (Warga) */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(isFieldOfficer ? 'FieldTasks' : 'CitizenReport')}
        >
          {isFieldOfficer ? (
            <Truck
              size={22}
              color={state.index === 1 ? '#0d6efd' : '#94a3b8'}
            />
          ) : (
            <FileText
              size={22}
              color={state.index === 1 ? '#0d6efd' : '#94a3b8'}
            />
          )}
          <Text
            style={[
              styles.tabLabel,
              state.index === 1 && styles.tabLabelActive,
            ]}
          >
            {isFieldOfficer ? 'Tugas' : 'Laporan'}
          </Text>
        </TouchableOpacity>

        {/* 3. Center Elevated Action Button (Tugas untuk Petugas / SOS untuk Warga) */}
        <View style={styles.centerButtonWrap}>
          <TouchableOpacity
            style={[styles.sosButton, isFieldOfficer && { shadowColor: '#0284c7' }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(isFieldOfficer ? 'FieldTasks' : 'CitizenReport')}
          >
            <View style={[styles.sosInner, isFieldOfficer && { backgroundColor: '#0284c7' }]}>
              {isFieldOfficer ? (
                <Truck size={26} color="#ffffff" />
              ) : (
                <ShieldAlert size={28} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.sosLabel, isFieldOfficer && { color: '#0284c7' }]}>
            {isFieldOfficer ? 'TUGAS' : 'SOS'}
          </Text>
        </View>

        {/* 4. Riwayat / Log */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(isFieldOfficer ? 'FieldTasks' : 'MyReports')}
        >
          <Clock
            size={22}
            color={state.index === 2 ? '#0d6efd' : '#94a3b8'}
          />
          <Text
            style={[
              styles.tabLabel,
              state.index === 2 && styles.tabLabelActive,
            ]}
          >
            {isFieldOfficer ? 'Log Siaga' : 'Riwayat'}
          </Text>
        </TouchableOpacity>

        {/* 5. Profil */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <User
            size={22}
            color={state.index === 3 ? '#0d6efd' : '#94a3b8'}
          />
          <Text
            style={[
              styles.tabLabel,
              state.index === 3 && styles.tabLabelActive,
            ]}
          >
            Profil
          </Text>
        </TouchableOpacity>
      </View>

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
              Apakah Anda yakin ingin keluar dari akun IECC Mobile? Anda perlu login kembali untuk mengakses data & membuat laporan.
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#0d6efd',
    fontWeight: '800',
  },

  // Elevated Center Button
  centerButtonWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  sosButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    padding: 4,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  sosInner: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#dc3545',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Modal
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
