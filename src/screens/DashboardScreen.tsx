import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import {
  PhoneCall,
  ShieldAlert,
  Clock,
  CheckCircle,
  Flame,
  HeartPulse,
  Car,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Sparkles,
  MapPin,
  HelpCircle,
  Radio,
  FileText,
  Activity,
  User,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../api/client';

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await ApiService.getMyIncidents();
      if (res.ok && res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (e) {
      console.log('Error summary:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const handleCallEmergency = (phone: string, label: string) => {
    Alert.alert(
      `Panggil ${label}`,
      `Apakah Anda yakin ingin menghubungkan panggilan darurat ke nomor ${phone}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Panggil', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const activeReportsCount = reports.filter(
    (r) => !['RESOLVED', 'CLOSED'].includes(r.status)
  ).length;
  const completedReportsCount = reports.filter((r) =>
    ['RESOLVED', 'CLOSED'].includes(r.status)
  ).length;
  const latestReport = reports[0] || null;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: Math.max(insets.top + 10, 52),
            paddingBottom: Math.max(insets.bottom + 100, 130),
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile & User Bar */}
        <View style={styles.userBar}>
          <TouchableOpacity
            style={styles.userInfo}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarWrap}>
              <User size={22} color="#0d6efd" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Halo, {user?.name || 'Warga Siaga'}</Text>
              <View style={styles.statusIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.userSub}>IECC Command Center Siaga 24/7</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#dc3545" />
          </TouchableOpacity>
        </View>

      {/* Hero SOS Quick Action Banner */}
      <View style={styles.sosCard}>
        <View style={styles.sosHeader}>
          <View style={styles.sosBadge}>
            <Radio size={14} color="#dc3545" />
            <Text style={styles.sosBadgeText}>SISTEM TANGGAP DARURAT</Text>
          </View>
          <Text style={styles.sosTime}>Terhubung GPS Presisi</Text>
        </View>

        <Text style={styles.sosTitle}>Butuh Bantuan Darurat?</Text>
        <Text style={styles.sosSubtitle}>
          Kirim laporan instan dengan foto, video, atau rekaman audio. AI akan otomatis mengklasifikasikan situasi dan mengerahkan armada terdekat.
        </Text>

        <TouchableOpacity
          style={styles.sosActionBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CitizenReport')}
        >
          <ShieldAlert size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.sosActionBtnText}>BUAT LAPORAN SEKARANG</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Status Box */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#0d6efd' }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MyReports')}
        >
          <View style={styles.statIconWrap}>
            <Activity size={18} color="#0d6efd" />
          </View>
          <Text style={styles.statCount}>{activeReportsCount}</Text>
          <Text style={styles.statLabel}>Laporan Aktif</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#16a34a' }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MyReports')}
        >
          <View style={[styles.statIconWrap, { backgroundColor: '#f0fdf4' }]}>
            <CheckCircle size={18} color="#16a34a" />
          </View>
          <Text style={styles.statCount}>{completedReportsCount}</Text>
          <Text style={styles.statLabel}>Selesai Ditangani</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#f59e0b' }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('MyReports')}
        >
          <View style={[styles.statIconWrap, { backgroundColor: '#fef3c7' }]}>
            <Clock size={18} color="#f59e0b" />
          </View>
          <Text style={styles.statCount}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total Laporan</Text>
        </TouchableOpacity>
      </View>

      {/* Latest Report Tracker (Jika ada) */}
      {latestReport && (
        <View style={styles.latestCard}>
          <View style={styles.latestHeader}>
            <View style={styles.latestTag}>
              <Clock size={12} color="#0284c7" />
              <Text style={styles.latestTagText}>PROGRES LAPORAN TERAKHIR</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyReports')}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>Semua</Text>
              <ChevronRight size={14} color="#0d6efd" />
            </TouchableOpacity>
          </View>

          <Text style={styles.latestNo}>{latestReport.incident_no}</Text>
          <Text style={styles.latestDesc} numberOfLines={2}>
            {latestReport.description || 'Laporan Kedaruratan Warga'}
          </Text>

          <View style={styles.latestFooter}>
            <View style={styles.latestStatusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.latestStatusText}>
                Status: {latestReport.status}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('MyReports')}
            >
              <Text style={styles.trackBtnText}>Lihat Timeline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hotline Darurat 1 Kontak */}
      <Text style={styles.sectionTitle}>LAYANAN DARURAT CEPAT (ONE TOUCH)</Text>
      <View style={styles.emergencyGrid}>
        <TouchableOpacity
          style={[styles.emergencyBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
          activeOpacity={0.7}
          onPress={() => handleCallEmergency('112', 'Pusat Panggilan Darurat 112')}
        >
          <PhoneCall size={20} color="#dc3545" />
          <View>
            <Text style={[styles.emergencyNumber, { color: '#dc3545' }]}>112</Text>
            <Text style={styles.emergencyLabel}>Darurat Umum / IECC</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.emergencyBtn, { backgroundColor: '#ffedd5', borderColor: '#fdba74' }]}
          activeOpacity={0.7}
          onPress={() => handleCallEmergency('113', 'Pemadam Kebakaran 113')}
        >
          <Flame size={20} color="#ea580c" />
          <View>
            <Text style={[styles.emergencyNumber, { color: '#ea580c' }]}>113</Text>
            <Text style={styles.emergencyLabel}>Damkar / Api</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.emergencyBtn, { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }]}
          activeOpacity={0.7}
          onPress={() => handleCallEmergency('110', 'Polisi 110')}
        >
          <ShieldAlert size={20} color="#0284c7" />
          <View>
            <Text style={[styles.emergencyNumber, { color: '#0284c7' }]}>110</Text>
            <Text style={styles.emergencyLabel}>Kepolisian</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.emergencyBtn, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}
          activeOpacity={0.7}
          onPress={() => handleCallEmergency('119', 'Ambulans Medis 119')}
        >
          <HeartPulse size={20} color="#16a34a" />
          <View>
            <Text style={[styles.emergencyNumber, { color: '#16a34a' }]}>119</Text>
            <Text style={styles.emergencyLabel}>Ambulans / Medis</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Edukasi & Panduan Tanggap Darurat */}
      <Text style={[styles.sectionTitle, { marginTop: 22 }]}>PANDUAN TANGGAP DARURAT</Text>
      <View style={styles.guideCard}>
        <View style={styles.guideItem}>
          <Flame size={20} color="#ea580c" />
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideTitle}>Kebakaran Gedung / Rumah</Text>
            <Text style={styles.guideSub}>Segera evakuasi melalui jalur darurat, hindari lift, dan tutup hidung dengan kain basah.</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.guideItem}>
          <HeartPulse size={20} color="#dc3545" />
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideTitle}>Pertolongan Pertama Luka Bakar / Medis</Text>
            <Text style={styles.guideSub}>Alirkan air bersih pada luka bakar selama 10-15 menit, jangan oleskan pasta gigi atau mentega.</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.guideItem}>
          <Car size={20} color="#4f46e5" />
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideTitle}>Kecelakaan Lalu Lintas</Text>
            <Text style={styles.guideSub}>Amankan lokasi kejadian dengan tanda segitiga darurat, jangan pindahkan korban luka berat sembarangan.</Text>
          </View>
        </View>
      </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 70,
  },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  userSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },

  // Hero SOS Card
  sosCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  sosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sosBadgeText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosTime: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  sosTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  sosSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  sosActionBtn: {
    backgroundColor: '#dc3545',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sosActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },

  // Latest Card
  latestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  latestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  latestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  latestTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 12,
    color: '#0d6efd',
    fontWeight: '600',
  },
  latestNo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  latestDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 12,
  },
  latestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  latestStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0d6efd',
  },
  latestStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  trackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d6efd',
  },

  // Emergency Grid
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  emergencyBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emergencyNumber: {
    fontSize: 17,
    fontWeight: '900',
  },
  emergencyLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },

  // Guide Card
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guideItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  guideTextWrap: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  guideSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
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
