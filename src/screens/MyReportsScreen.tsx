import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import {
  Clock,
  MapPin,
  Truck,
  CheckCircle,
  AlertTriangle,
  Flame,
  HeartPulse,
  ShieldAlert,
  Car,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  Video,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '../api/client';

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await ApiService.getMyIncidents();
      if (res.ok && res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching reports:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const openDetail = async (incident: any) => {
    setSelectedIncident(incident);
    setDetailLoading(true);
    try {
      const res = await ApiService.getIncidentDetail(incident.ulid);
      if (res.ok && res.data?.success) {
        setSelectedIncident(res.data.data);
      }
    } catch (e) {
      console.log('Error detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return { label: 'Laporan Diterima', bg: '#e0f2fe', text: '#0369a1', icon: Clock };
      case 'VERIFIED':
        return { label: 'Terverifikasi AI', bg: '#e0e7ff', text: '#4338ca', icon: Sparkles };
      case 'DISPATCHED':
        return { label: 'Armada Menuju TKP', bg: '#fef3c7', text: '#b45309', icon: Truck };
      case 'ACCEPTED':
        return { label: 'Petugas Merespons', bg: '#ffedd5', text: '#c2410c', icon: Truck };
      case 'ARRIVED':
        return { label: 'Petugas di TKP', bg: '#fef9c3', text: '#a16207', icon: MapPin };
      case 'RESOLVED':
      case 'CLOSED':
        return { label: 'Selesai Ditangani', bg: '#dcfce7', text: '#15803d', icon: CheckCircle };
      default:
        return { label: status, bg: '#f1f5f9', text: '#475569', icon: Clock };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FIRE':
        return { icon: Flame, color: '#ea580c', label: 'Kebakaran' };
      case 'MEDICAL':
        return { icon: HeartPulse, color: '#dc3545', label: 'Medis' };
      case 'SECURITY':
        return { icon: ShieldAlert, color: '#0284c7', label: 'Keamanan' };
      case 'TRAFFIC':
        return { icon: Car, color: '#4f46e5', label: 'Laka Lantas' };
      case 'DISASTER':
        return { icon: AlertTriangle, color: '#ca8a04', label: 'Bencana' };
      default:
        return { icon: Sparkles, color: '#6366f1', label: 'Umum' };
    }
  };

  const renderTimeline = (timeline: any[]) => {
    const steps = [
      { status: 'NEW', label: 'Laporan Diterima', desc: 'Laporan berhasil dicatat di server' },
      { status: 'VERIFIED', label: 'Verifikasi & AI', desc: 'AI menganalisis & kalkulasi armada' },
      { status: 'DISPATCHED', label: 'Armada Meluncur', desc: 'Petugas darurat dikerahkan ke lokasi' },
      { status: 'ARRIVED', label: 'Penanganan di TKP', desc: 'Petugas sedang menangani kedaruratan' },
      { status: 'RESOLVED', label: 'Selesai Ditangani', desc: 'Situasi darurat teratasi penuh' },
    ];

    const currentStatus = selectedIncident?.status || 'NEW';
    const statusOrder = ['NEW', 'VERIFIED', 'DISPATCHED', 'ACCEPTED', 'ARRIVED', 'RESOLVED', 'CLOSED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step, idx) => {
          const stepIndex = statusOrder.indexOf(step.status);
          const isPassed = currentIndex >= stepIndex;
          const isCurrent = (currentStatus === step.status) || (currentStatus === 'ACCEPTED' && step.status === 'DISPATCHED') || (currentStatus === 'CLOSED' && step.status === 'RESOLVED');

          return (
            <View key={step.status} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    isPassed && styles.timelineDotActive,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {isPassed ? (
                    <CheckCircle size={14} color="#fff" />
                  ) : (
                    <View style={styles.timelineDotInner} />
                  )}
                </View>
                {idx < steps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isPassed && currentIndex > stepIndex && styles.timelineLineActive,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, isPassed && styles.timelineTitleActive]}>
                  {step.label}
                </Text>
                <Text style={styles.timelineDesc}>{step.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 52) }]}>
        <Text style={styles.headerTitle}>Riwayat & Monitoring Laporan</Text>
        <Text style={styles.headerSub}>Pantau progres penanganan darurat laporan Anda secara langsung</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0d6efd" />
          <Text style={styles.loadingText}>Memuat riwayat laporan...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centerContainer}>
          <AlertTriangle size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Belum Ada Laporan</Text>
          <Text style={styles.emptySub}>
            Semua laporan kedaruratan yang Anda kirimkan akan muncul di sini beserta progres penanganannya.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.ulid || item.incident_no}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 100, 130) }
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusInfo = getStatusBadge(item.status);
            const StatusIcon = statusInfo.icon;
            const catInfo = getCategoryIcon(item.category);
            const CatIcon = catInfo.icon;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => openDetail(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.catBadge}>
                    <CatIcon size={14} color={catInfo.color} />
                    <Text style={[styles.catText, { color: catInfo.color }]}>{catInfo.label}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <StatusIcon size={12} color={statusInfo.text} />
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.incidentNo}>{item.incident_no}</Text>
                <Text style={styles.descText} numberOfLines={2}>
                  {item.description || 'Laporan kedaruratan warga'}
                </Text>

                <View style={styles.locationRow}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.address_text || 'Titik Koordinat GPS'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.timeText}>
                    {item.reported_at ? new Date(item.reported_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </Text>
                  <View style={styles.detailBtn}>
                    <Text style={styles.detailBtnText}>Lihat Progres</Text>
                    <ChevronRight size={16} color="#0d6efd" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal Detail Progres / Tracking */}
      <Modal
        visible={!!selectedIncident}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedIncident(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Monitoring Laporan</Text>
                <Text style={styles.modalSub}>{selectedIncident?.incident_no}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedIncident(null)}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {detailLoading && (
                <View style={{ padding: 10, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0d6efd" />
                </View>
              )}

              {/* Status Box */}
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxTitle}>TAHAPAN PROGRES PENANGANAN</Text>
                {renderTimeline(selectedIncident?.timeline || [])}
              </View>

              {/* Informasi Kejadian */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionBoxTitle}>RINCIAN LAPORAN</Text>
                <Text style={styles.infoDesc}>
                  {selectedIncident?.description || 'Tidak ada keterangan tambahan.'}
                </Text>

                <View style={styles.infoRow}>
                  <MapPin size={16} color="#0d6efd" />
                  <Text style={styles.infoRowText}>
                    {selectedIncident?.address_text || 'Koordinat GPS'}
                  </Text>
                </View>

                {selectedIncident?.assigned_unit && (
                  <View style={[styles.infoRow, { marginTop: 8 }]}>
                    <Truck size={16} color="#15803d" />
                    <Text style={[styles.infoRowText, { color: '#15803d', fontWeight: 'bold' }]}>
                      Armada Dikerahkan: {selectedIncident.assigned_unit}
                    </Text>
                  </View>
                )}
              </View>

              {/* Foto & Bukti Media */}
              {selectedIncident?.media && selectedIncident.media.length > 0 ? (
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionBoxTitle}>LAMPIRAN BUKTI MEDIA ({selectedIncident.media.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {selectedIncident.media.map((m: any, i: number) => {
                      const isPhoto = m.type === 'PHOTO' || (!m.type && m.url && !m.url.endsWith('.mp4'));
                      return (
                        <View key={i} style={styles.mediaThumb}>
                          {isPhoto ? (
                            <Image 
                              source={{ uri: m.url }} 
                              style={styles.mediaImg} 
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.mediaPlaceholder}>
                              <Video size={24} color="#0d6efd" />
                              <Text style={styles.mediaType}>{m.type || 'VIDEO'}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : selectedIncident?.first_media ? (
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionBoxTitle}>LAMPIRAN BUKTI MEDIA</Text>
                  <View style={[styles.mediaThumb, { marginTop: 8 }]}>
                    <Image 
                      source={{ uri: selectedIncident.first_media }} 
                      style={styles.mediaImg} 
                      resizeMode="cover"
                    />
                  </View>
                </View>
              ) : null}
            </ScrollView>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  incidentNo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  descText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d6efd',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalBody: {
    padding: 18,
  },
  statusBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  statusBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: '#10b981',
  },
  timelineDotCurrent: {
    backgroundColor: '#0d6efd',
    transform: [{ scale: 1.1 }],
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  timelineLineActive: {
    backgroundColor: '#10b981',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  timelineTitleActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  timelineDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  sectionBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  mediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
});
