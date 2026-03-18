import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, StyleSheet } from 'react-native';

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

const InfoRow = ({ label, value, isLink, linkType }) => {
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
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, isLink && { color: '#2563eb', textDecorationLine: 'underline' }]}>
        {value}
      </Text>
    </TouchableOpacity>
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
  const busy    = BUSY_COLORS[h.busy_status?.status]  || BUSY_COLORS.quiet;
  const openClr = OPEN_COLORS[h.open_status?.color]   || OPEN_COLORS.gray;
  const score   = Math.round((h.ai_recommendation_score ?? 0) * 100);

  const openUrl = (url) => { if (url && url !== '#') Linking.openURL(url); };

  const initials = (h.DiagnosticCentreName || 'MC')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>{'<'}</Text>
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
            <div style={{ flex: 1 }}>
              <View style={s.heroInfo}>
                <View style={s.badgeRow}>
                  {h.verified && (
                    <View style={s.verifiedBadge}>
                      <Text style={s.verifiedText}>Verified</Text>
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
            </div>
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
            <Text style={s.btnPrimaryText}>Directions</Text>
          </TouchableOpacity>
          
          {h.phone && h.phone !== 'N/A' && (
            <TouchableOpacity 
              style={[s.btnPrimary, { flex: 1, marginBottom: 0, backgroundColor: '#16a34a' }]} 
              onPress={() => openUrl(`tel:${h.phone}`)}
            >
              <Text style={s.btnPrimaryText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact info section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contact & Location</Text>
          <InfoRow label="Phone" value={h.phone} isLink linkType="phone" />
          <InfoRow label="Website" value={h.website} isLink linkType="web" />
          <InfoRow label="Address" value={h.DiagnosticCentreAddress} />
          <InfoRow label="Place ID" value={h.id} />
        </View>

        {/* ETA Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Travel Time</Text>
          <Text style={s.etaValue}>{h.eta ?? 'N/A'}</Text>
          <Text style={s.etaNote}>Based on current traffic conditions</Text>
        </View>

        {/* Facility tags */}
        {h.facility_tags?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Facilities Available</Text>
            <View style={s.tagWrap}>
              {h.facility_tags.map((tag, i) => (
                <View key={i} style={s.tag}>
                  <Text style={s.tagText}>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ride Services */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Book a Ride</Text>
          <View style={s.rideRow}>
            {[['Uber', h.ride_links?.uber, s.btnUber, s.btnUberText],
              ['Ola',  h.ride_links?.ola,  s.btnOla,  s.btnOlaText],
              ['Rapido', h.ride_links?.rapido, s.btnRapido, s.btnRapidoText],
            ].map(([label, url, btnStyle, txtStyle]) => (
              <TouchableOpacity key={label} style={[s.rideBtn, btnStyle]} onPress={() => openUrl(url)}>
                <Text style={[s.rideBtnText, txtStyle]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f5f7fa' },
  scroll:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backArrow:    { fontSize: 18, fontWeight: '700', color: '#374151' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  heroCard:     { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2 },
  avatarRow:    { flexDirection: 'row', gap: 16, marginBottom: 20 },
  avatar:       { width: 64, height: 64, borderRadius: 14, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '800', color: '#1d4ed8' },
  heroInfo:     { flex: 1 },
  badgeRow:     { flexDirection: 'row', gap: 6, marginBottom: 6 },
  verifiedBadge:{ backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#15803d' },
  openBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  openText:     { fontSize: 10, fontWeight: '700' },
  hospitalName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  hospitalType: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  hospitalAddr: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  statsRow:     { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 12, padding: 4 },
  statBox:      { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue:    { fontSize: 15, fontWeight: '800', color: '#111827' },
  statLabel:    { fontSize: 10, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  statDivider:  { width: 1, backgroundColor: '#e5e7eb', marginVertical: 10 },
  section:      { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 },
  actionRow:    { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  busyRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busyDot:      { width: 8, height: 8, borderRadius: 4 },
  busyText:     { fontSize: 14, fontWeight: '600' },
  etaValue:     { fontSize: 28, fontWeight: '800', color: '#111827' },
  etaNote:      { fontSize: 12, color: '#9ca3af' },
  tagWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:          { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tagText:      { fontSize: 12, fontWeight: '600', color: '#374151' },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel:    { fontSize: 13, color: '#6b7280' },
  infoValue:    { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 },
  btnPrimary:   { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText:{ fontSize: 15, fontWeight: '700', color: '#fff' },
  rideRow:      { flexDirection: 'row', gap: 10 },
  rideBtn:      { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  rideBtnText:  { fontSize: 13, fontWeight: '700' },
  btnUber:      { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  btnUberText:  { color: '#111827' },
  btnOla:       { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  btnOlaText:   { color: '#15803d' },
  btnRapido:    { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  btnRapidoText:{ color: '#c2410c' },
});