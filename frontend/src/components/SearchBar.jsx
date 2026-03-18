import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SearchBar({ value, onChangeText, onSearch, placeholder }) {
  return (
    <View style={s.wrapper}>
      <View style={s.container}>
        <View style={s.iconBox}>
          <Text style={s.iconText}>S</Text>
        </View>
        <TextInput
          style={s.input}
          placeholder={placeholder || 'Search symptoms, hospitals, services...'}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value?.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={s.clearBtn}>
            <Text style={s.clearText}>×</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.searchBtn} onPress={onSearch}>
          <Text style={s.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:       { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  container:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', paddingLeft: 12, paddingRight: 6, paddingVertical: 4 },
  iconBox:       { marginRight: 8 },
  iconText:      { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  input:         { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 8, fontFamily: 'System' },
  clearBtn:      { padding: 6 },
  clearText:     { fontSize: 20, color: '#9ca3af', lineHeight: 22 },
  searchBtn:     { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9, marginLeft: 6 },
  searchBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});