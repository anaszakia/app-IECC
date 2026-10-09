import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import {
  HeartPulse,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Car,
  Camera,
  Video,
  Mic,
  Square,
  Play,
  MapPin,
  Send,
  LogOut,
  Sparkles,
  X,
  FileAudio,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiService } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [category, setCategory] = useState<string>('AUTO');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [victimCount, setVictimCount] = useState('0');
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  
  // Media / Video note state
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'AUTO', label: 'Lainnya / AI Otomatis', icon: Sparkles, color: '#6366f1' },
    { id: 'MEDICAL', label: 'Medis / Sakit', icon: HeartPulse, color: '#dc3545' },
    { id: 'FIRE', label: 'Kebakaran', icon: Flame, color: '#ea580c' },
    { id: 'SECURITY', label: 'Kejahatan / Polisi', icon: ShieldAlert, color: '#0284c7' },
    { id: 'TRAFFIC', label: 'Laka Lantas', icon: Car, color: '#4f46e5' },
    { id: 'DISASTER', label: 'Bencana Alam', icon: AlertTriangle, color: '#ca8a04' },
  ];

  const takePhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Batas Foto', 'Maksimal 3 foto lampiran.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin kamera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setPhotos([...photos, base64Data]);
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin kamera untuk merekam video.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const pickVideoFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin galeri video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSendReport = async () => {
    if (!description.trim() && photos.length === 0 && !videoUri) {
      Alert.alert('Perhatian', 'Harap isi deskripsi atau lampirkan foto/video kejadian.');
      return;
    }

    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let coords = { latitude: -6.1753924, longitude: 106.8271528 }; // Default Jakarta Pusat
      
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = loc.coords;
      }

      const validDesc = (description.trim() === '-' || !description.trim())
        ? 'Laporan Multimedia Kedaruratan Warga via Mobile App (Foto & Video terlampir di lokasi).'
        : description.trim();

      const coordinateString = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      const resolvedAddress = addressText.trim() 
        ? `${addressText.trim()} (${coordinateString})`
        : `Titik Koordinat GPS: ${coordinateString}`;

      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', validDesc);
      formData.append('address', resolvedAddress);
      formData.append('address_text', resolvedAddress);
      formData.append('caller_name', user?.name || 'Warga (Mobile App)');
      formData.append('caller_phone', user?.phone || '081234567890');
      formData.append('urgency', 'HIGH');
      formData.append('lat', String(coords.latitude));
      formData.append('lng', String(coords.longitude));
      formData.append('victim_estimate', String(parseInt(victimCount, 10) || 0));
      formData.append('source', 'APP');

      // Append photos
      photos.forEach((photoUri, index) => {
        if (photoUri.startsWith('data:image')) {
          formData.append(`photos[${index}]`, photoUri);
        } else {
          const cleanUri = Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri;
          const filename = photoUri.split('/').pop() || `photo_${index}.jpg`;
          const ext = filename.split('.').pop()?.toLowerCase() || 'jpeg';
          formData.append('photos[]', {
            uri: photoUri,
            name: filename,
            type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          } as any);
        }
      });

      // Append video as file for React Native
      if (videoUri) {
        const filename = videoUri.split('/').pop() || 'incident_video.mp4';
        const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';
        const mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
        
        formData.append('video', {
          uri: videoUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      const res = await ApiService.reportIncident(formData);

      if (res.ok && res.data?.success) {
        Alert.alert(
          'Laporan & Media Berhasil Terkirim!',
          `Nomor Laporan: ${res.data.data?.incident_no || '-'}\n\nFoto, video kejadian, dan koordinat GPS telah diterima. AI Gemini Flash di backend sedang menganalisis keparahan & merekomendasikan armada terdekat.`,
          [{
            text: 'Tutup',
            onPress: () => {
              setDescription('');
              setAddressText('');
              setPhotos([]);
              setVideoUri(null);
            },
          }]
        );
      } else {
        let errorMsg = '';
        if (res.data?.errors) {
          const formatted = Object.entries(res.data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
          errorMsg = formatted;
        } else if (res.data?.message) {
          errorMsg = res.data.message;
        } else if (res.data?.error) {
          errorMsg = typeof res.data.error === 'string' ? res.data.error : JSON.stringify(res.data.error);
        } else if (res.error) {
          errorMsg = res.error;
        } else {
          errorMsg = `Status HTTP ${res.status}: Gagal memproses data di server.`;
        }

        console.log('[Submit Incident Error]', { status: res.status, data: res.data, error: res.error });
        Alert.alert('Gagal Mengirim', errorMsg);
      }
    } catch (e: any) {
      console.log('[Submit Incident Exception]', e);
      Alert.alert('Error', e.message || 'Gagal terhubung ke backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { 
          paddingTop: Math.max(insets.top + 10, 52),
          paddingBottom: Math.max(insets.bottom + 110, 130),
        }
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* User Bar */}
      <View style={styles.userBar}>
        <View>
          <Text style={styles.welcomeText}>IECC Mobile</Text>
          <Text style={styles.userSub}>Pelapor: {user?.name || 'Ahmad Warga Kota'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>

      {/* 1. Category */}
      <Text style={styles.sectionHeading}>1. PILIH KATEGORI DARURAT</Text>
      <View style={styles.catGrid}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catCard,
                isSelected && { borderColor: cat.color, backgroundColor: cat.color + '15', borderWidth: 2 },
              ]}
              onPress={() => setCategory(cat.id)}
            >
              <View style={[styles.catIconWrap, { backgroundColor: cat.color + '25' }]}>
                <Icon size={24} color={cat.color} />
              </View>
              <Text style={[styles.catLabel, isSelected && { color: cat.color, fontWeight: '700' }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Detail Form */}
      <Text style={styles.sectionHeading}>2. DESKRIPSI & FAKTA DI LOKASI</Text>
      <View style={styles.formCard}>
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Deskripsi Lengkap Kejadian *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Jelaskan apa yang terjadi (misal: Kebakaran rumah 2 lantai di pemukiman padat, api berkobar besar dan ada asap pekat tebal, tetangga berusaha memadamkan...)"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.aiHint}>
            <Sparkles size={14} color="#0284c7" />
            <Text style={styles.aiHintText}>AI Gemini Flash otomatis mengekstrak keparahan & armada yang wajib meluncur.</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Patokan Lokasi / Alamat</Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.singleInput}
              placeholder="Contoh: Jl. Merdeka No. 12, Samping Indomaret"
              placeholderTextColor="#94a3b8"
              value={addressText}
              onChangeText={setAddressText}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Estimasi Korban Terlihat</Text>
          <View style={styles.victimRow}>
            {['0', '1', '2', '3+'].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.victimBtn, victimCount === v && styles.victimBtnActive]}
                onPress={() => setVictimCount(v)}
              >
                <Text style={[styles.victimBtnText, victimCount === v && styles.victimBtnTextActive]}>
                  {v} Korban
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lampiran Bukti Foto, Video, dan Rekaman Suara */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Bukti Visual (Foto / Kamera) ({photos.length}/3)</Text>
          <View style={styles.photoRow}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}
                >
                  <X size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 3 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                <Camera size={22} color="#0284c7" />
                <Text style={styles.addPhotoText}>Foto Kamera</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lampiran Video Bukti Kejadian */}
        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>Video Kejadian (Kamera / Galeri)</Text>
          <View style={styles.mediaRow}>
            {/* Rekam Video Langsung */}
            <TouchableOpacity
              style={[styles.mediaOptionBtn, videoUri && styles.mediaOptionActive]}
              onPress={recordVideo}
            >
              <Video size={20} color={videoUri ? '#16a34a' : '#ea580c'} />
              <Text style={[styles.mediaOptionText, videoUri && { color: '#16a34a', fontWeight: 'bold' }]}>
                {videoUri ? '✓ Video Kamera Siap' : 'Rekam Video'}
              </Text>
            </TouchableOpacity>

            {/* Pilih Video dari Galeri */}
            <TouchableOpacity
              style={[styles.mediaOptionBtn, videoUri && styles.mediaOptionActive]}
              onPress={pickVideoFromGallery}
            >
              <Video size={20} color={videoUri ? '#16a34a' : '#0284c7'} />
              <Text style={[styles.mediaOptionText, videoUri && { color: '#16a34a', fontWeight: 'bold' }]}>
                {videoUri ? '✓ Video Terpilih' : 'Galeri Video'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tombol Kirim */}
      <TouchableOpacity
        style={[styles.submitButton, loading && { opacity: 0.7 }]}
        onPress={handleSendReport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="large" />
        ) : (
          <>
            <Send size={22} color="#ffffff" style={{ marginRight: 10 }} />
            <Text style={styles.submitButtonText}>KIRIM LAPORAN SEKARANG</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 60 },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  welcomeText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  userSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  sectionHeading: { fontSize: 12, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  catCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catLabel: { fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  formGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    color: '#0f172a',
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  aiHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  aiHintText: { fontSize: 11, color: '#0284c7', fontWeight: '500', flex: 1 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 48,
  },
  singleInput: { flex: 1, color: '#0f172a', fontSize: 14 },
  victimRow: { flexDirection: 'row', gap: 8 },
  victimBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    alignItems: 'center',
  },
  victimBtnActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  victimBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  victimBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  photoContainer: { position: 'relative' },
  photoThumb: { width: 76, height: 76, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc3545',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c710',
  },
  addPhotoText: { fontSize: 10, color: '#0284c7', marginTop: 4, fontWeight: '700' },
  mediaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  mediaOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
  },
  mediaOptionActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  mediaOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  submitButton: {
    backgroundColor: '#dc3545',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
