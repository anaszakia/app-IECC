import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import {
  Navigation,
  CheckCircle2,
  XCircle,
  MapPin,
  Truck,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Hospital,
  Sparkles,
  ExternalLink,
  Compass,
  User,
  Activity,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';
import { Modal, TextInput, ActivityIndicator } from 'react-native';

import * as Location from 'expo-location';
import { soundManager } from '../utils/soundManager';

export default function FieldTasksScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncingGps, setIsSyncingGps] = useState(false);

  // State Modal Handover Pasien IGD Dinamis
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(1);
  const [handoverModalVisible, setHandoverModalVisible] = useState(false);
  const [selectedTaskUlid, setSelectedTaskUlid] = useState<string | null>(null);
  const [selectedTaskIncident, setSelectedTaskIncident] = useState<any | null>(null);
  const [conditionText, setConditionText] = useState('');
  const [ageEstimate, setAgeEstimate] = useState('30');
  const [gender, setGender] = useState<'M' | 'F' | 'UNKNOWN'>('M');
  const [consciousness, setConsciousness] = useState<'ALERT' | 'VERBAL' | 'PAIN' | 'UNRESPONSIVE'>('ALERT');
  const [etaMinutes, setEtaMinutes] = useState('7');
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  const fetchFacilities = async () => {
    try {
      const res = await ApiService.getFacilities();
      if (res.ok && res.data?.success && Array.isArray(res.data.data)) {
        setFacilities(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedFacilityId(res.data.data[0].id);
        }
      }
    } catch (e) {
      console.log('Error fetching facilities:', e);
    }
  };

  const fetchTasks = async () => {
    setRefreshing(true);
    try {
      const unitParam = user?.unit?.ulid || user?.unit?.id;
      const res = await ApiService.getFieldTasks(unitParam);
      if (res.ok && res.data.success) {
        setTasks(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching tasks', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchFacilities();
  }, [user?.unit?.ulid, user?.unit?.id]);

  const handleAccept = async (assignmentUlid: string) => {
    soundManager.stopAlarm();
    const res = await ApiService.acceptTask(assignmentUlid);
    if (res.ok) {
      Alert.alert('Sukses', 'Tugas diterima! Bersiap meluncur ke lokasi.');
      fetchTasks();
    } else {
      Alert.alert('Gagal', res.data?.message || 'Gagal menerima tugas.');
    }
  };

  const handleUpdateStatus = async (assignmentUlid: string, nextStatus: string, incidentId?: number) => {
    let currentLat: number | undefined;
    let currentLng: number | undefined;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;

        // Sekaligus kirim posisi unit ke tracking
        const unitUlid = user?.unit?.ulid || tasks[0]?.unit?.ulid;
        if (unitUlid) {
          ApiService.sendLocation(unitUlid, currentLat, currentLng, Math.round((pos.coords.speed || 0) * 3.6), Math.round(pos.coords.heading || 0));
        }
      }
    } catch (e) {
      console.log('GPS fetch error during status update:', e);
    }

    const res = await ApiService.updateStatus(assignmentUlid, nextStatus, currentLat, currentLng);
    if (res.ok) {
      Alert.alert('Status Terkirim', `Status armada diubah menjadi: ${nextStatus}`);
      fetchTasks();
    } else {
      Alert.alert('Gagal', res.data?.message || 'Gagal memperbarui status.');
    }
  };

  const openHandoverModal = (item: any) => {
    setSelectedTaskUlid(item.assignment_ulid);
    setSelectedTaskIncident(item.incident);
    // Isi default awal berdasarkan deskripsi / kategori insiden
    const defaultDesc = item.incident?.description 
      ? `Pasien dari kejadian ${item.incident.category}: ${item.incident.description}`
      : 'Pasien darurat membutuhkan penanganan medis IGD.';
    setConditionText(defaultDesc);
    setHandoverModalVisible(true);
    fetchFacilities();
  };

  const submitHandoverForm = async () => {
    if (!selectedTaskUlid) return;
    if (!conditionText.trim()) {
      Alert.alert('Peringatan', 'Mohon isi ringkasan kondisi klinis / cedera pasien.');
      return;
    }

    setIsSubmittingHandover(true);
    try {
      const parsedAge = parseInt(ageEstimate, 10) || 30;
      const parsedEtaSec = (parseInt(etaMinutes, 10) || 7) * 60;
      const targetFac = facilities.find(f => f.id === selectedFacilityId);
      const targetName = targetFac ? targetFac.name : 'IGD Faskes Rujukan';

      const res = await ApiService.submitHandover(selectedTaskUlid, {
        facility_id: selectedFacilityId,
        gender: gender,
        age_estimate: parsedAge,
        condition_text: conditionText.trim(),
        consciousness: consciousness,
        requested_services: ['emergency_room', 'trauma'],
        eta_seconds: parsedEtaSec,
      });

      if (res.ok && res.data?.success) {
        Alert.alert('Berhasil', `Pre-Arrival Notification telah dikirim ke ${targetName}.`);
        setHandoverModalVisible(false);
        fetchTasks();
      } else {
        Alert.alert('Gagal', res.data?.message || 'Gagal mengirim rujukan pasien ke IGD.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Koneksi ke server gagal.');
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number, label?: string) => {
    if (!lat || !lng) {
      Alert.alert('Info Lokasi', 'Titik koordinat GPS kejadian belum tersedia.');
      return;
    }

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${lat},${lng}`;
    const cleanLabel = label ? encodeURIComponent(label) : 'Lokasi+Insiden+IECC';
    
    // Fallback universal Google Maps URL
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

  const renderItem = ({ item }: { item: any }) => {
    const isDispatched = item.status === 'DISPATCHED';
    const isAccepted = item.status === 'ACCEPTED';
    const isEnRoute = item.status === 'EN_ROUTE';
    const isArrived = item.status === 'ARRIVED';

    return (
      <View style={styles.card}>
        {/* Header Kartu Tugas */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.incidentNo}>{item.incident.incident_no}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.categoryBadge}>{item.incident.category}</Text>
              {item.incident.severity && (
                <Text style={styles.severityBadge}>Level {item.incident.severity}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Deskripsi & Ringkasan AI */}
        <Text style={styles.descText}>{item.incident.description || 'Laporan Kejadian Masuk'}</Text>
        
        {item.incident.ai_summary && (
          <View style={styles.aiBox}>
            <Sparkles size={14} color="#0284c7" />
            <Text style={styles.aiText}>AI: {item.incident.ai_summary}</Text>
          </View>
        )}

        {/* Lokasi & Tombol Langsung Google Maps */}
        <TouchableOpacity
          style={styles.locTouchBox}
          activeOpacity={0.7}
          onPress={() => openGoogleMaps(item.incident.lat, item.incident.lng, item.incident.incident_no)}
        >
          <View style={styles.locRow}>
            <View style={styles.mapIconWrap}>
              <MapPin size={18} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locText} numberOfLines={2}>
                {item.incident.address_text || `${item.incident.lat}, ${item.incident.lng}`}
              </Text>
              <View style={styles.openMapsHint}>
                <Compass size={13} color="#38bdf8" />
                <Text style={styles.openMapsHintText}>
                  {item.incident.lat && item.incident.lng ? 'Buka Navigasi Google Maps' : 'Koordinat GPS'}
                </Text>
                <ExternalLink size={12} color="#38bdf8" style={{ marginLeft: 2 }} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Button Bar */}
        <View style={styles.btnRow}>
          {isDispatched && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnAccept]}
                onPress={() => handleAccept(item.assignment_ulid)}
              >
                <CheckCircle2 size={18} color="#ffffff" />
                <Text style={styles.btnLabel}>Terima Tugas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnReject]}
                onPress={() => {
                  Alert.alert('Tolak Tugas', 'Armada sedang berhalangan / kendala teknis?', [
                    { text: 'Batal', style: 'cancel' },
                    {
                      text: 'Tolak',
                      style: 'destructive',
                      onPress: () => ApiService.rejectTask(item.assignment_ulid, 'Kendala operasional armada').then(fetchTasks),
                    },
                  ]);
                }}
              >
                <XCircle size={18} color="#ffffff" />
                <Text style={styles.btnLabel}>Tolak</Text>
              </TouchableOpacity>
            </>
          )}

          {isAccepted && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnBlue]}
              onPress={() => handleUpdateStatus(item.assignment_ulid, 'EN_ROUTE')}
            >
              <Navigation size={18} color="#ffffff" />
              <Text style={styles.btnLabel}>Meluncur ke Lokasi (EN_ROUTE)</Text>
            </TouchableOpacity>
          )}

          {isEnRoute && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnGreen]}
              onPress={() => handleUpdateStatus(item.assignment_ulid, 'ARRIVED')}
            >
              <MapPin size={18} color="#ffffff" />
              <Text style={styles.btnLabel}>Tiba di TKP (ARRIVED)</Text>
            </TouchableOpacity>
          )}

          {isArrived && (
            <View style={{ width: '100%', gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnHospital]}
                onPress={() => openHandoverModal(item)}
              >
                <Hospital size={18} color="#ffffff" />
                <Text style={styles.btnLabel}>Form Handover Pasien ke IGD RS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDark]}
                onPress={() => handleUpdateStatus(item.assignment_ulid, 'RESOLVED')}
              >
                <CheckCircle2 size={18} color="#ffffff" />
                <Text style={styles.btnLabel}>Selesai Penanganan (RESOLVED)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Officer Header */}
      <View style={[styles.officerBar, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        <View style={styles.officerInfo}>
          <View style={styles.officerAvatar}>
            <Truck size={22} color="#ffffff" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.officerName}>{user?.name || 'Petugas Lapangan'}</Text>
              {user?.unit?.code && (
                <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>{user.unit.code}</Text>
                </View>
              )}
            </View>
            <Text style={styles.officerRole}>{user?.agency?.name || 'Armada Tanggap Darurat'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.assignment_ulid}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTasks} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ShieldCheck size={56} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Siaga Tanggap Darurat</Text>
            <Text style={styles.emptySub}>Belum ada penugasan dispatch baru dari Command Center.</Text>
          </View>
        }
      />

      {/* MODAL FORM PRE-ARRIVAL HANDOVER PASIEN IGD */}
      <Modal
        visible={handoverModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHandoverModalVisible(false)}
      >
        <View style={styles.handoverModalOverlay}>
          <View style={styles.handoverModalCard}>
            <View style={styles.handoverModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Hospital size={22} color="#7c3aed" />
                <Text style={styles.handoverModalTitle}>Handover Pasien ke IGD RS</Text>
              </View>
              <TouchableOpacity onPress={() => setHandoverModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={styles.handoverIncidentSub}>
                Insiden: #{selectedTaskIncident?.incident_no} ({selectedTaskIncident?.category})
              </Text>

              {/* 1. Pemilih Faskes Rujukan (Rumah Sakit / Puskesmas) */}
              <Text style={styles.inputLabel}>Pilih Rumah Sakit / Puskesmas Tujuan Rujukan *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {facilities.map((fac) => {
                    const isSelected = selectedFacilityId === fac.id;
                    const isHospital = fac.type === 'HOSPITAL';
                    return (
                      <TouchableOpacity
                        key={fac.id}
                        style={[
                          styles.facCard,
                          isSelected && styles.facCardActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedFacilityId(fac.id)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Hospital size={14} color={isSelected ? '#ffffff' : (isHospital ? '#7c3aed' : '#0284c7')} />
                          <Text style={[styles.facName, isSelected && styles.facTextActive]}>
                            {fac.name}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <Text style={[styles.facTypeBadge, isSelected && styles.facTypeBadgeActive]}>
                            {isHospital ? 'RUMAH SAKIT' : 'PUSKESMAS'}
                          </Text>
                          <Text style={[styles.facBedText, isSelected && styles.facTextActive]}>
                            Bed IGD: {fac.er_beds_available ?? 0}/{fac.er_beds_total ?? 0}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* 2. Ringkasan Klinis & Cedera Pasien */}
              <Text style={styles.inputLabel}>Kondisi & Catatan Klinis Pasien *</Text>
              <TextInput
                style={styles.textInputArea}
                placeholder="Contoh: Pasien luka robek di kaki kanan, fraktur tertutup, perdarahan terkontrol..."
                placeholderTextColor="#64748b"
                value={conditionText}
                onChangeText={setConditionText}
                multiline
                numberOfLines={3}
              />

              {/* 2. Tingkat Kesadaran (AVPU) */}
              <Text style={styles.inputLabel}>Tingkat Kesadaran Pasien (AVPU)</Text>
              <View style={styles.chipRow}>
                {(['ALERT', 'VERBAL', 'PAIN', 'UNRESPONSIVE'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.chipBtn,
                      consciousness === level && styles.chipBtnActive,
                    ]}
                    onPress={() => setConsciousness(level)}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        consciousness === level && styles.chipBtnTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. Jenis Kelamin & Estimasi Umur */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Jenis Kelamin</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['M', 'F', 'UNKNOWN'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderBtn,
                          gender === g && styles.genderBtnActive,
                        ]}
                        onPress={() => setGender(g)}
                      >
                        <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                          {g === 'M' ? 'Pria' : g === 'F' ? 'Wanita' : '?'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Estimasi Umur (Thn)</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="30"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={ageEstimate}
                    onChangeText={setAgeEstimate}
                  />
                </View>
              </View>

              {/* 4. Estimasi Waktu Tiba di IGD (Menit) */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Estimasi Tiba di IGD (Menit)</Text>
                <TextInput
                  style={styles.textInputSmall}
                  placeholder="7"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={etaMinutes}
                  onChangeText={setEtaMinutes}
                />
              </View>
            </ScrollView>

            {/* Tombol Kirim Handover */}
            <TouchableOpacity
              style={[styles.submitHandoverBtn, isSubmittingHandover && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={isSubmittingHandover}
              onPress={submitHandoverForm}
            >
              {isSubmittingHandover ? (
                <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />
              ) : (
                <Hospital size={18} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.submitHandoverText}>
                {isSubmittingHandover ? 'MENGIRIM RUJUKAN...' : 'KIRIM PRE-ARRIVAL KE IGD RS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'DISPATCHED': return '#0284c7';
    case 'ACCEPTED': return '#ea580c';
    case 'EN_ROUTE': return '#d97706';
    case 'ARRIVED': return '#16a34a';
    case 'RESOLVED': return '#334155';
    default: return '#64748b';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  officerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  officerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  officerAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center' },
  officerName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  officerRole: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#334155', borderRadius: 10 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  incidentNo: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  categoryBadge: { fontSize: 11, fontWeight: '700', color: '#38bdf8', backgroundColor: '#0284c720', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  severityBadge: { fontSize: 11, fontWeight: '700', color: '#f87171', backgroundColor: '#dc354520', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  descText: { fontSize: 14, color: '#cbd5e1', marginVertical: 8, lineHeight: 20 },
  aiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0284c730',
  },
  aiText: { fontSize: 12, color: '#38bdf8', flex: 1 },
  locTouchBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0284c740',
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0284c720',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locText: { fontSize: 13, color: '#f1f5f9', fontWeight: '600', lineHeight: 18 },
  openMapsHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  openMapsHintText: { fontSize: 11, color: '#38bdf8', fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnAccept: { backgroundColor: '#16a34a' },
  btnReject: { backgroundColor: '#dc3545', flex: 0.4 },
  btnBlue: { backgroundColor: '#0284c7' },
  btnGreen: { backgroundColor: '#059669' },
  btnHospital: { backgroundColor: '#7c3aed' },
  btnDark: { backgroundColor: '#334155' },
  btnLabel: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

  // HANDOVER MODAL STYLES
  handoverModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  handoverModalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  handoverModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  handoverModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  handoverIncidentSub: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
    marginBottom: 12,
  },
  facCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 170,
  },
  facCardActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#a855f7',
  },
  facName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
  },
  facTextActive: {
    color: '#ffffff',
  },
  facTypeBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  facTypeBadgeActive: {
    color: '#e9d5ff',
  },
  facBedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38bdf8',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  textInputArea: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    padding: 10,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  textInputSmall: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  chipBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  chipBtnTextActive: {
    color: '#ffffff',
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  genderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  genderBtnTextActive: {
    color: '#ffffff',
  },
  submitHandoverBtn: {
    marginTop: 16,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitHandoverText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
