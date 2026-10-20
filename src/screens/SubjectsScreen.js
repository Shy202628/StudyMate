import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert,
} from 'react-native';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { lightColors, darkColors } from '../theme/colors';

const PALETTE = [
  '#4A90D9', '#E5484D', '#2FA84F', '#F5A623',
  '#8E44AD', '#E91E63', '#16A085', '#34495E',
];

export default function SubjectsScreen({ navigation }) {
  const { subjects, tasks, addSubject, deleteSubject, darkMode } = useApp();
  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [examDate, setExamDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAdd = () => {
  const trimmed = name.trim();
  if (!trimmed) return;
  addSubject({
    name: trimmed,
    color,
    teacher: '',
    examDate: examDate ? examDate.toISOString() : null,
  });
  setName('');
  setColor(PALETTE[0]);
  setExamDate(null);
}; 

  const handleDelete = (subject) => {
    Alert.alert(
      'Delete subject?',
      `Tasks linked to "${subject.name}" will stay but lose their subject.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSubject(subject.id) },
      ]
    );
  };

  const countTasks = (subjectId) =>
    tasks.filter(t => t.subjectId === subjectId && !t.done).length;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add a subject</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Mathematics"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.paletteRow}>
        {PALETTE.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              color === c && styles.swatchActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
  style={[styles.dateBtn, { backgroundColor: colors.card }]}
  onPress={() => setShowDatePicker(true)}
>
  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
  <Text style={[styles.dateBtnText, { color: colors.text }]}>
    {examDate
      ? `Exam: ${examDate.toLocaleDateString()}`
      : 'Set exam date (optional)'}
  </Text>
  {examDate && (
    <TouchableOpacity onPress={() => setExamDate(null)}>
      <Ionicons name="close-circle" size={18} color={colors.muted} />
    </TouchableOpacity>
  )}
    </TouchableOpacity>

   {showDatePicker && (
  <DateTimePicker
    value={examDate || new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={(event, date) => {
      console.log('picker fired', event.type, date);
      // Android fires onChange immediately, so close the picker right away
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (event.type === 'dismissed') return;
      if (date) setExamDate(date);
    }}
    onDismiss={() => setShowDatePicker(false)}
  />
)}
   
   
           <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Add Subject</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Your subjects</Text>

      <FlatList
        data={subjects}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.subjectRow}
            onPress={() => navigation.navigate('SubjectDetail', { subjectId: item.id })}
          >
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.subjectName}>{item.name}</Text>
              <Text style={styles.subjectMeta}>
                {countTasks(item.id)} pending task{countTasks(item.id) === 1 ? '' : 's'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No subjects yet. Add one above.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  paletteRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  swatch: {
    width: 32, height: 32, borderRadius: 16,
    marginRight: 10, marginBottom: 8,
  },

dateBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  marginBottom: 12,
},
dateBtnText: {
  flex: 1,
  marginLeft: 8,
  fontSize: 14,
}, 

  swatchActive: { borderWidth: 3, borderColor: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 8,
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  subjectName: { fontSize: 16, fontWeight: '600', color: colors.text },
  subjectMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
}); 