import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchContactDetails } from '../services/hospitalService';
import { formatDistance } from '../utils/formatDistance';

const fmtDist = (km) => {
  if (km == null || km >= 9999) return 'N/A';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${parseFloat(km).toFixed(1)} km`;
};

const BUSY_COLORS = {
  busy:     { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  moderate: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  quiet:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
};
const OPEN_COLORS = {
  green: { bg: '#f0fdf4', text: '#15803d' },
  red:   { bg: '#fef2f2', text: '#b91c1c' },
  gray:  { bg: '#f9fafb', text: '#6b7280' },
};

const Divider = () => <View style={s.divider} />;

const InfoRow = ({ label, value, isLink, linkType, icon }) => {
  if (!value || value === 'N/A' || value === '#') return null;
  
  const handlePress = () => {
    if (!isLink) return;
    const url = linkType === 'phone' ? `tel:${value}` : value;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <TouchableOpacity 
      activeOpacity={isLink ? 0.6 : 1} 
      onPress={handlePress} 
      style={s.infoRow}
    >
      <View style={s.infoLeft}>
        <Text style={s.infoIcon}>{icon}</Text>
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={[s.infoValue, isLink && { color: '#2563eb', textDecorationLine: 'underline' }]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const HoursList = ({ hours }) => {
  if (!hours || hours.length === 0) return null;
  
  return (
    <View style={s.hoursContainer}>
      <Text style={s.hoursTitle}>📋 Opening Hours</Text>
      {hours.map((hour, i) => (
        <Text key={i} style={s.hourText}>{hour}</Text>
      ))}
    </View>
  );
};

const StatBox = ({ label, value, accent }) => (
  <View style={s.statBox}>
    <Text style={[s.statValue, accent && { color: '#2563eb' }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

export default function DetailsScreen({ route, navigation }) {
  const { hospital: h } = route.params;
  const [contactDetails, setContactDetails] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    // Fetch additional contact details if not already in hospital object
    if (h.id && !h.phone) {
      setLoadingContact(true);
      fetchContactDetails(h.id)
        .then(details => {
          setContactDetails(details);
          setLoadingContact(false);
        })
        .catch(() => {
          setLoadingContact(false);
        });
    }
  }, [h.id]);

  const busy    = BUSY_COLORS[h.busy_status?.status]  || BUSY_COLORS.quiet;
  const openClr = OPEN_COLORS[h.open_status?.color]   || OPEN_COLORS.gray;
  const score   = Math.round((h.ai_recommendation_score ?? 0) * 100);

  const openUrl = (url) => { if (url && url !== '#') Linking.openURL(url); };

  const initials = (h.DiagnosticCentreName || 'MC')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const phone = contactDetails?.phone || h.phone || 'N/A';
  const website = contactDetails?.website || h.website || 'N/A';
  const hours = contactDetails?.hours || (Array.isArray(h.opening_hours) ? h.opening_hours : []);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Hospital Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={s.heroCard}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.heroInfo}>
                <View style={s.badgeRow}>
                  {h.verified && (
                    <View style={s.verifiedBadge}>
                      <Text style={s.verifiedText}>✓ Verified</Text>
                    </View>
                  )}
                  <View style={[s.openBadge, { backgroundColor: openClr.bg }]}>
                    <Text style={[s.openText, { color: openClr.text }]}>
                      {h.open_status?.label ?? 'Hours Unknown'}
                    </Text>
                  </View>
                </View>
                <Text style={s.hospitalName}>{h.DiagnosticCentreName}</Text>
                <Text style={s.hospitalType}>
                  {h.amenity_type ? h.amenity_type.charAt(0).toUpperCase() + h.amenity_type.slice(1) : 'Medical Center'}
                </Text>
                <Text style={s.hospitalAddr}>{h.DiagnosticCentreAddress}</Text>
              </View>
            </View>
          </View>

          {/* Stats grid */}
          <View style={s.statsRow}>
            <StatBox label="Rating"   value={`${h['Rating (out of 5)'] || 0} / 5`} />
            <View style={s.statDivider} />
            <StatBox label="Reviews"  value={`${h['Number of Reviews'] || 0}`} />
            <View style={s.statDivider} />
            <StatBox label="Distance" value={fmtDist(h.distance_km)} />
            <View style={s.statDivider} />
            <StatBox label="AI Score" value={`${score}%`} accent />
          </View>
        </View>

        {/* Busy status */}
        <View style={[s.section, { backgroundColor: busy.bg }]}>
          <View style={s.busyRow}>
            <View style={[s.busyDot, { backgroundColor: busy.dot }]} />
            <Text style={[s.busyText, { color: busy.text }]}>
              {h.busy_status?.label ?? 'Usually Quiet'} — approx. {h.busy_status?.wait_mins ?? '15'} min wait
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity 
            style={[s.btnPrimary, { flex: 1.5, marginBottom: 0 }]} 
            onPress={() => openUrl(h.ride_links?.google_maps)}
          >
            <Text style={s.btnPrimaryText}>📍 Directions</Text>
          </TouchableOpacity>
          
          {phone && phone !== 'N/A' && (
            <TouchableOpacity 
              style={[s.btnPrimary, { flex: 1, marginBottom: 0, backgroundColor: '#16a34a' }]} 
              onPress={() => Linking.openURL(`tel:${phone}`)}
            >
              <Text style={s.btnPrimaryText}>☎️ Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact info section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📞 Contact & Location</Text>
          <InfoRow label="Phone" value={phone} isLink linkType="phone" icon="☎️" />
          <InfoRow label="Website" value={website} isLink linkType="web" icon="🌐" />
          <InfoRow label="Address" value={h.DiagnosticCentreAddress} icon="📍" />
          
          {/* Loading indicator for contact details */}
          {loadingContact && (
            <View style={s.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={s.loadingText}>Loading details...</Text>
            </View>
          )}
          
          {/* Hours */}
          {hours && hours.length > 0 && <HoursList hours={hours} />}
        </View>

        {/* Facilities section */}
        {h.facility_tags && h.facility_tags.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>⭐ Facilities</Text>
            <View style={s.facilityGrid}>
              {h.facility_tags.map((tag, i) => (
                <View key={i} style={s.facilityTag}>
                  <Text style={s.facilityTagText}>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ride options */}
        {h.ride_links && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🚕 Get Ride</Text>
            <TouchableOpacity 
              style={s.rideBtn}
              onPress={() => openUrl(h.ride_links.google_maps)}
            >
              <Text style={s.rideBtnText}>🗺️ Google Maps</Text>
            </TouchableOpacity>
            {h.ride_links.uber && (
              <TouchableOpacity 
                style={s.rideBtn}
                onPress={() => openUrl(h.ride_links.uber)}
              >
                <Text style={s.rideBtnText}>🚗 Uber</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  backBtn: { padding: 8 },
  backArrow: { fontSize: 24, color: '#2563eb' },
  scroll: { flex: 1, paddingBottom: 20 },
  
  heroCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatarRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  heroInfo: { flex: 1 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  verifiedBadge: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  openBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  openText: { fontSize: 12, fontWeight: '600' },
  hospitalName: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 4 },
  hospitalType: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  hospitalAddr: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  
  statsRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busyDot: { width: 12, height: 12, borderRadius: 6 },
  busyText: { fontSize: 13, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginVertical: 12 },
  btnPrimary: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 16 },
  infoLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  
  hoursContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  hoursTitle: { fontSize: 12, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  hourText: { fontSize: 12, color: '#4b5563', marginBottom: 4, lineHeight: 18 },
  
  facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  facilityTag: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  facilityTagText: { fontSize: 12, fontWeight: '500', color: '#0369a1' },
  
  rideBtn: { backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  rideBtnText: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 12, color: '#6b7280' },
  
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
});
