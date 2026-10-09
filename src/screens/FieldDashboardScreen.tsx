import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Radio,
  Navigation,
  Sparkles,
  User,
  LogOut,
  AlertCircle,
  Activity,
  ShieldCheck,
  ChevronRight,
  Hospital,
  Flame,
  Shield,
  LocateFixed,
  Send,
  Zap,
  Power,
  AlertTriangle,
  Wrench,
  Volume2,
  BellRing,
  Compass,
  ExternalLink,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../api/client';
import { soundManager } from '../utils/soundManager';

export default function FieldDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Unit Operational Status State
  const [unitStatus, setUnitStatus] = useState<string>(user?.unit?.status || 'AVAILABLE');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // GPS Tracking State
  const [isAutoTracking, setIsAutoTracking] = useState(true);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string>('Standby');

  // Alarm & Dispatch Notification State
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [newDispatchedTask, setNewDispatchedTask] = useState<any | null>(null);
  const knownTaskIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef<boolean>(false);

  const trackingIntervalRef = useRef<any>(null);
  const pollingIntervalRef = useRef<any>(null);

  const fetchTasks = useCallback(async (isInitial = false) => {
    try {
      const res = await ApiService.getFieldTasks();
      if (res.ok && res.data?.success) {
        const fetchedTasks: any[] = res.data.data || [];
        setTasks(fetchedTasks);

        if (fetchedTasks[0]?.unit?.status) {
          setUnitStatus(fetchedTasks[0].unit.status);
        }

        // Cek penugasan baru dengan status DISPATCHED
        const incomingDispatched = fetchedTasks.find(
          (t) => t.status === 'DISPATCHED' && !knownTaskIdsRef.current.has(t.assignment_ulid)
        );

        if (incomingDispatched) {
          knownTaskIdsRef.current.add(incomingDispatched.assignment_ulid);
          setNewDispatchedTask(incomingDispatched);
          setAlarmModalVisible(true);
          soundManager.playEmergencyAlarm();
        }

        // Simpan task IDs yang sudah diketahui
        fetchedTasks.forEach((t) => knownTaskIdsRef.current.add(t.assignment_ulid));
      }
    } catch (e) {
      console.log('Error fetching officer tasks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialFetchDoneRef.current = true;
    }
  }, []);

  // Initial load and fast polling for new dispatch orders every 4 seconds
  useEffect(() => {
    fetchTasks(true);

    pollingIntervalRef.current = setInterval(() => {
      fetchTasks(false);
    }, 4000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      soundManager.stopAlarm();
    };
  }, [fetchTasks]);

  // Determine active unit ULID
  const unitUlid = user?.unit?.ulid || tasks[0]?.unit?.ulid || null;
  const unitCode = user?.unit?.code || tasks[0]?.unit?.code || 'Unit Armada';

  // Function to change unit operational status (AVAILABLE, BUSY, OFFLINE, MAINTENANCE)
  const handleChangeUnitStatus = async (newStatus: string) => {
    if (!unitUlid) {
      Alert.alert('Unit Belum Terhubung', 'Akun belum memiliki armada penugasan aktif. Silakan hubungi operator.');
      return;
    }

    if (newStatus === unitStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await ApiService.updateUnitStatus(unitUlid, newStatus);
      if (res.ok && res.data?.success) {
        setUnitStatus(newStatus);
        Alert.alert('Status Unit Diperbarui', `Status operasional armada [${unitCode}] sekarang: ${newStatus}`);
        fetchTasks();
      } else {
        Alert.alert('Gagal Mengubah Status', res.data?.message || 'Koneksi ke server gagal.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal memperbarui status unit.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Function to capture and transmit current GPS position
  const handleSendLocation = async (isManual = true) => {
    try {
      if (isManual) setIsSendingLocation(true);
      setGpsStatusText('Mengambil GPS...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatusText('Izin GPS Ditolak');
        if (isManual) {
          Alert.alert('Izin Lokasi Diperlukan', 'Mohon izinkan akses GPS di pengaturan HP agar Command Center dapat memantau armada Anda.');
        }
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
      const heading = position.coords.heading ? Math.round(position.coords.heading) : 0;

      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (unitUlid) {
        const res = await ApiService.sendLocation(unitUlid, lat, lng, speed, heading);
        if (res.ok) {
          setLastLocation({ lat, lng, time: nowTime });
          setGpsStatusText(`Terkirim (${nowTime})`);
          if (isManual) {
            Alert.alert(
              'Lokasi Berhasil Terkirim',
              `Posisi unit [${unitCode}] berhasil disinkronkan ke Command Center.\n\nLat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\nWaktu: ${nowTime}`
            );
          }
        } else {
          setGpsStatusText('Gagal sync ke server');
          if (isManual) {
            Alert.alert('Gagal Mengirim Lokasi', res.data?.message || 'Koneksi ke server gagal.');
          }
        }
      } else {
        setLastLocation({ lat, lng, time: nowTime });
        setGpsStatusText(`Tersimpan (${nowTime})`);
        if (isManual) {
          Alert.alert(
            'GPS Terdeteksi',
            `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n(Unit ID belum terhubung, hubungi dispatcher)`
          );
        }
      }
    } catch (err: any) {
      console.log('GPS error:', err);
      setGpsStatusText('Error GPS');
      if (isManual) {
        Alert.alert('Kesalahan GPS', 'Gagal membaca koordinat GPS perangkat. Pastikan GPS aktif.');
      }
    } finally {
      if (isManual) setIsSendingLocation(false);
    }
  };

  // Periodic GPS sync effect
  useEffect(() => {
    if (isAutoTracking) {
      handleSendLocation(false);
      trackingIntervalRef.current = setInterval(() => {
        handleSendLocation(false);
      }, 20000);
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      setGpsStatusText('GPS Auto Dimatikan');
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isAutoTracking, unitUlid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
    handleSendLocation(false);
  };

  const openGoogleMaps = (lat?: number, lng?: number, label?: string) => {
    if (!lat || !lng) {
      Alert.alert('Info Lokasi', 'Titik koordinat GPS kejadian belum tersedia.');
      return;
    }

    const latLng = `${lat},${lng}`;
    const googleMapsAppUrl = `google.navigation:q=${latLng}&mode=d`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;

    Linking.canOpenURL(googleMapsAppUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(googleMapsAppUrl);
        } else {
          return Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webUrl);
      });
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    soundManager.stopAlarm();
    logout();
  };

  // Handle Accept from Alarm Modal
  const handleAcceptAlarm = async () => {
    if (!newDispatchedTask) return;
    soundManager.stopAlarm();
    setAlarmModalVisible(false);

    try {
      const res = await ApiService.acceptTask(newDispatchedTask.assignment_ulid);
      if (res.ok) {
        Alert.alert('Tugas Diterima', 'Segera bersiap meluncur ke lokasi kejadian.');
        fetchTasks();
        navigation.navigate('FieldTasks');
      } else {
        Alert.alert('Gagal', res.data?.message || 'Gagal menerima penugasan.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Koneksi gagal.');
    }
  };

  // Handle Reject from Alarm Modal
  const handleDismissAlarm = () => {
    soundManager.stopAlarm();
    setAlarmModalVisible(false);
    navigation.navigate('FieldTasks');
  };

  const activeTasks = tasks.filter((t) => !['RESOLVED', 'REJECTED'].includes(t.status));
  const activeTask = activeTasks[0] || null;
  const resolvedCount = tasks.filter((t) => t.status === 'RESOLVED').length;

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
        {/* User Bar Header */}
        <View style={styles.userBar}>
          <TouchableOpacity
            style={styles.userInfo}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarWrap}>
              <Truck size={22} color="#0d6efd" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Halo, {user?.name || 'Petugas Lapangan'}</Text>
              <View style={styles.statusIndicator}>
                <View style={[styles.onlineDot, { backgroundColor: getStatusColor(unitStatus) }]} />
                <Text style={styles.userSub}>
                  {user?.unit?.code ? `[${user.unit.code}] ` : ''}
                  {user?.agency?.name || 'Armada Siaga Lapangan'}
                </Text>
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

        {/* 1. KARTU UBAH STATUS OPERASIONAL UNIT (AVAILABLE, BUSY, OFFLINE, MAINTENANCE) */}
        <View style={styles.unitStatusCard}>
          <View style={styles.unitStatusHeader}>
            <View style={styles.unitStatusTitleRow}>
              <Power size={16} color="#0284c7" />
              <Text style={styles.unitStatusCardTitle}>STATUS KESIAPAN ARMADA</Text>
            </View>
            <View style={[styles.currentStatusPill, { backgroundColor: getStatusColor(unitStatus) + '20', borderColor: getStatusColor(unitStatus) }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(unitStatus) }]} />
              <Text style={[styles.currentStatusPillText, { color: getStatusColor(unitStatus) }]}>
                {unitStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.unitStatusDesc}>
            Pilih status kesiapan unit agar Command Center dapat mengalokasikan penugasan darurat secara akurat:
          </Text>

          <View style={styles.statusButtonGroup}>
            {/* Status: AVAILABLE (Siap Tugas / Aktif) */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                unitStatus === 'AVAILABLE' && styles.statusBtnActiveAvailable,
                isUpdatingStatus && { opacity: 0.6 },
              ]}
              activeOpacity={0.8}
              disabled={isUpdatingStatus}
              onPress={() => handleChangeUnitStatus('AVAILABLE')}
            >
              <CheckCircle2 size={16} color={unitStatus === 'AVAILABLE' ? '#ffffff' : '#16a34a'} />
              <Text style={[styles.statusBtnText, unitStatus === 'AVAILABLE' && styles.statusBtnTextActive]}>
                Siaga (AVAILABLE)
              </Text>
            </TouchableOpacity>

            {/* Status: BUSY (Sedang Menangani Kejadian) */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                unitStatus === 'BUSY' && styles.statusBtnActiveBusy,
                isUpdatingStatus && { opacity: 0.6 },
              ]}
              activeOpacity={0.8}
              disabled={isUpdatingStatus}
              onPress={() => handleChangeUnitStatus('BUSY')}
            >
              <AlertTriangle size={16} color={unitStatus === 'BUSY' ? '#ffffff' : '#f08c00'} />
              <Text style={[styles.statusBtnText, unitStatus === 'BUSY' && styles.statusBtnTextActive]}>
                Sibuk (BUSY)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.statusButtonGroup, { marginTop: 8 }]}>
            {/* Status: OFFLINE (Nonaktif / Istirahat) */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                unitStatus === 'OFFLINE' && styles.statusBtnActiveOffline,
                isUpdatingStatus && { opacity: 0.6 },
              ]}
              activeOpacity={0.8}
              disabled={isUpdatingStatus}
              onPress={() => handleChangeUnitStatus('OFFLINE')}
            >
              <Power size={16} color={unitStatus === 'OFFLINE' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.statusBtnText, unitStatus === 'OFFLINE' && styles.statusBtnTextActive]}>
                Nonaktif (OFFLINE)
              </Text>
            </TouchableOpacity>

            {/* Status: MAINTENANCE (Perbaikan Armada) */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                unitStatus === 'MAINTENANCE' && styles.statusBtnActiveMaintenance,
                isUpdatingStatus && { opacity: 0.6 },
              ]}
              activeOpacity={0.8}
              disabled={isUpdatingStatus}
              onPress={() => handleChangeUnitStatus('MAINTENANCE')}
            >
              <Wrench size={16} color={unitStatus === 'MAINTENANCE' ? '#ffffff' : '#ca8a04'} />
              <Text style={[styles.statusBtnText, unitStatus === 'MAINTENANCE' && styles.statusBtnTextActive]}>
                Bengkel (MAINT)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tombol Uji Sirene & Getaran Alarm */}
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: '#fee2e2',
              borderRadius: 10,
              paddingVertical: 9,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#fca5a5',
            }}
            activeOpacity={0.75}
            onPress={() => {
              if (alarmModalVisible) {
                soundManager.stopAlarm();
                setAlarmModalVisible(false);
              } else {
                setNewDispatchedTask({
                  incident: {
                    incident_no: 'TEST-EMERGENCY',
                    category: 'UJI COBA ALARM SIRENE & GETARAN',
                    address_text: 'Sistem pengujian alarm darurat IECC Mobile. Suara sirene & getaran sedang berdering kencang.',
                  },
                });
                setAlarmModalVisible(true);
                soundManager.playEmergencyAlarm();
              }
            }}
          >
            <BellRing size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#b91c1c' }}>
              TES BUNYI SIRENE & GETARAN DARURAT
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Live GPS Tracker Unit Card */}
        <View style={styles.gpsCard}>
          <View style={styles.gpsCardHeader}>
            <View style={styles.gpsBadge}>
              <LocateFixed size={16} color="#0284c7" />
              <Text style={styles.gpsBadgeText}>LIVE GPS ARMADA</Text>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto Sync (20s)</Text>
              <Switch
                value={isAutoTracking}
                onValueChange={(val) => setIsAutoTracking(val)}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={isAutoTracking ? '#ffffff' : '#94a3b8'}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
          </View>

          <View style={styles.gpsDetailBox}>
            <View style={styles.gpsInfoCol}>
              <Text style={styles.gpsUnitName}>{unitCode}</Text>
              <Text style={styles.gpsCoordText}>
                {lastLocation
                  ? `${lastLocation.lat.toFixed(5)}, ${lastLocation.lng.toFixed(5)}`
                  : 'Menunggu sinyal GPS...'}
              </Text>
            </View>
            <View style={styles.gpsStatusWrap}>
              <View style={[styles.gpsDot, { backgroundColor: isAutoTracking ? '#16a34a' : '#f59e0b' }]} />
              <Text style={styles.gpsStatusLabel}>{gpsStatusText}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendGpsBtn, isSendingLocation && { opacity: 0.8 }]}
            activeOpacity={0.85}
            onPress={() => handleSendLocation(true)}
            disabled={isSendingLocation}
          >
            {isSendingLocation ? (
              <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />
            ) : (
              <Send size={16} color="#ffffff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.sendGpsBtnText}>
              {isSendingLocation ? 'MENGIRIM POSISI...' : 'KIRIM POSISI GPS SEKARANG'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Hero Task Alert Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Radio size={14} color="#38bdf8" />
              <Text style={styles.heroBadgeText}>SISTEM DISPATCH PETUGAS</Text>
            </View>
            <Text style={styles.heroTime}>Siaga Lapangan</Text>
          </View>

          {activeTask ? (
            <>
              <Text style={styles.heroTitle}>Tugas Darurat Aktif!</Text>
              <Text style={styles.heroSubtitle}>
                [{activeTask.incident.incident_no}] {activeTask.incident.category} - {activeTask.incident.description || 'Segera respons instruksi dari dispatcher.'}
              </Text>
              <TouchableOpacity
                style={styles.heroActionBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('FieldTasks')}
              >
                <Navigation size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.heroActionBtnText}>BUKA & TANGANI PENUGASAN</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>Armada Siaga (Standby)</Text>
              <Text style={styles.heroSubtitle}>
                Saat ini belum ada panggilan tugas dispatch baru. Posisi GPS armada Anda terus terpantau live di Command Center.
              </Text>
              <TouchableOpacity
                style={[styles.heroActionBtn, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('FieldTasks')}
              >
                <ShieldCheck size={20} color="#38bdf8" style={{ marginRight: 8 }} />
                <Text style={[styles.heroActionBtnText, { color: '#38bdf8' }]}>LIHAT DAFTAR TUGAS</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 4. Status Statistik Cepat */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statBox, { borderLeftColor: '#0d6efd' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('FieldTasks')}
          >
            <View style={styles.statIconWrap}>
              <Activity size={18} color="#0d6efd" />
            </View>
            <Text style={styles.statCount}>{activeTasks.length}</Text>
            <Text style={styles.statLabel}>Tugas Aktif</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statBox, { borderLeftColor: '#16a34a' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('FieldTasks')}
          >
            <View style={[styles.statIconWrap, { backgroundColor: '#f0fdf4' }]}>
              <CheckCircle2 size={18} color="#16a34a" />
            </View>
            <Text style={styles.statCount}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Selesai TKP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statBox, { borderLeftColor: '#f59e0b' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('FieldTasks')}
          >
            <View style={[styles.statIconWrap, { backgroundColor: '#fef3c7' }]}>
              <Clock size={18} color="#f59e0b" />
            </View>
            <Text style={styles.statCount}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total Tugas</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Task Tracking Card */}
        {activeTask && (
          <View style={styles.latestCard}>
            <View style={styles.latestHeader}>
              <View style={styles.latestTag}>
                <Clock size={12} color="#0284c7" />
                <Text style={styles.latestTagText}>PENUGASAN SEDANG BERLANGSUNG</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('FieldTasks')}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>Semua</Text>
                <ChevronRight size={14} color="#0d6efd" />
              </TouchableOpacity>
            </View>

            <Text style={styles.latestNo}>{activeTask.incident.incident_no}</Text>
            
            {/* Lokasi Klik Google Maps */}
            <TouchableOpacity
              style={styles.latestLocBox}
              activeOpacity={0.7}
              onPress={() => openGoogleMaps(activeTask.incident.lat, activeTask.incident.lng, activeTask.incident.incident_no)}
            >
              <View style={styles.latestLocRow}>
                <MapPin size={16} color="#0284c7" />
                <Text style={styles.latestLocText} numberOfLines={2}>
                  {activeTask.incident.address_text || activeTask.incident.description || 'Lokasi kejadian darurat'}
                </Text>
              </View>
              <View style={styles.latestMapsHint}>
                <Compass size={12} color="#38bdf8" />
                <Text style={styles.latestMapsHintText}>Buka Rute di Google Maps</Text>
                <ExternalLink size={11} color="#38bdf8" />
              </View>
            </TouchableOpacity>

            <View style={styles.latestFooter}>
              <View style={styles.latestStatusBadge}>
                <View style={[styles.pulseDot, { backgroundColor: '#ea580c' }]} />
                <Text style={styles.latestStatusText}>Status: {activeTask.status}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.trackBtn, { backgroundColor: '#0284c7' }]}
                  onPress={() => openGoogleMaps(activeTask.incident.lat, activeTask.incident.lng, activeTask.incident.incident_no)}
                >
                  <Navigation size={14} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.trackBtnText}>Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() => navigation.navigate('FieldTasks')}
                >
                  <Text style={styles.trackBtnText}>Buka Tugas</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 6. Quick Officer SOP / Prosedur */}
        <Text style={styles.sectionTitle}>SOP & FITUR TANGGAP DARURAT</Text>
        <View style={styles.guideCard}>
          <View style={styles.guideItem}>
            <Navigation size={20} color="#0284c7" />
            <View style={styles.guideTextWrap}>
              <Text style={styles.guideTitle}>1. Terima & Meluncur (En Route)</Text>
              <Text style={styles.guideSub}>Konfirmasi penerimaan penugasan lalu perbarui status ke EN_ROUTE saat armada bergerak.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.guideItem}>
            <MapPin size={20} color="#16a34a" />
            <View style={styles.guideTextWrap}>
              <Text style={styles.guideTitle}>2. Tiba di Lokasi (Arrived)</Text>
              <Text style={styles.guideSub}>Set status ARRIVED saat tiba di TKP untuk mencatat waktu respons resmi sistem.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.guideItem}>
            <Hospital size={20} color="#7c3aed" />
            <View style={styles.guideTextWrap}>
              <Text style={styles.guideTitle}>3. Pra-Kedatangan RS (Pre-Arrival)</Text>
              <Text style={styles.guideSub}>Bagi unit ambulans, kirim data kondisi pasien awal ke IGD RS rujukan sebelum tiba.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL ALARM DARURAT SAAT UNIT DI-DISPATCH COMMAND CENTER */}
      <Modal
        visible={alarmModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDismissAlarm}
      >
        <View style={styles.alarmModalOverlay}>
          <View style={styles.alarmModalCard}>
            {/* Header Alarm Pulse */}
            <View style={styles.alarmIconCircle}>
              <BellRing size={44} color="#ffffff" />
            </View>

            <Text style={styles.alarmModalBadge}>🚨 PANGGILAN DARURAT MASUK</Text>
            <Text style={styles.alarmModalTitle}>
              {newDispatchedTask?.incident?.category || 'DARURAT'} - #{newDispatchedTask?.incident?.incident_no}
            </Text>
            <Text style={styles.alarmModalDesc}>
              {newDispatchedTask?.incident?.address_text || newDispatchedTask?.incident?.description || 'Unit armada Anda menerima perintah penugasan baru dari Command Center.'}
            </Text>

            {newDispatchedTask?.incident?.ai_summary && (
              <View style={styles.alarmAiBox}>
                <Sparkles size={14} color="#38bdf8" />
                <Text style={styles.alarmAiText}>AI: {newDispatchedTask.incident.ai_summary}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.alarmActionCol}>
              <TouchableOpacity
                style={styles.alarmAcceptBtn}
                activeOpacity={0.85}
                onPress={handleAcceptAlarm}
              >
                <CheckCircle2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.alarmAcceptText}>TERIMA PENUGASAN & MATIKAN SIRENE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alarmDismissBtn}
                activeOpacity={0.7}
                onPress={handleDismissAlarm}
              >
                <Volume2 size={16} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.alarmDismissText}>Lihat Detail Tugas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              Apakah Anda yakin ingin keluar dari akun petugas IECC Mobile? Pastikan tidak ada penugasan darurat aktif yang terlewat.
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

function getStatusColor(status: string) {
  switch (status) {
    case 'AVAILABLE': return '#16a34a';
    case 'BUSY': return '#f08c00';
    case 'OFFLINE': return '#64748b';
    case 'MAINTENANCE': return '#ca8a04';
    default: return '#0d6efd';
  }
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
    marginBottom: 14,
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
    width: 8,
    height: 8,
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

  // Operational Status Card
  unitStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  unitStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitStatusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unitStatusCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  currentStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  currentStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unitStatusDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 12,
  },
  statusButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statusBtnActiveAvailable: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  statusBtnActiveBusy: {
    backgroundColor: '#f08c00',
    borderColor: '#f08c00',
  },
  statusBtnActiveOffline: {
    backgroundColor: '#64748b',
    borderColor: '#64748b',
  },
  statusBtnActiveMaintenance: {
    backgroundColor: '#ca8a04',
    borderColor: '#ca8a04',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusBtnTextActive: {
    color: '#ffffff',
  },

  // GPS Card
  gpsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsBadgeText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  gpsDetailBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  gpsInfoCol: {
    flex: 1,
  },
  gpsUnitName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  gpsCoordText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gpsStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  gpsStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  sendGpsBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendGpsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Hero Card
  heroCard: {
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
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTime: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActionBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  heroActionBtnText: {
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
  latestLocBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  latestLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  latestLocText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  latestMapsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingLeft: 22,
  },
  latestMapsHintText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
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

  // Guide Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
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

  // ALARM MODAL STYLES
  alarmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alarmModalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dc3545',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  alarmIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  alarmModalBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f87171',
    letterSpacing: 1,
    marginBottom: 8,
  },
  alarmModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  alarmModalDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  alarmAiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284c740',
    marginBottom: 20,
    width: '100%',
  },
  alarmAiText: {
    fontSize: 12,
    color: '#38bdf8',
    flex: 1,
  },
  alarmActionCol: {
    width: '100%',
    gap: 10,
  },
  alarmAcceptBtn: {
    backgroundColor: '#dc3545',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  alarmAcceptText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alarmDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  alarmDismissText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modal Logout
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
