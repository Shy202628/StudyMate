import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Platform, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import TaskItem from '../components/TaskItem';
import { lightColors, darkColors } from '../theme/colors';

export default function TasksScreen() {
  const { tasks, subjects, addTask, toggleTask, deleteTask, darkMode } = useApp();
  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  // --- Week Strip Logic ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const getWeekDays = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      d.setHours(12, 0, 0, 0); // Noon prevents timezone day-shifts
      days.push({
        dateObj: new Date(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dateNum: d.getDate(),
      });
    }
    return days;
  };
  const weekDays = getWeekDays();

  // Safe local date string
  const getLocalDateStr = (dateObj) => {
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 10);
  };

  const selectedDateStr = selectedDate.toISOString().slice(0, 10); 
  
  // THE FIX: tasks have ISO strings. Convert them to local strings to compare!
    const filteredTasks = tasks
    .filter(t => {
      if (!t.dueDate) return false;
      // Force both dates to just be YYYY-MM-DD strings
      const taskDate = new Date(t.dueDate).toISOString().slice(0, 10);
      const selDate = selectedDate.toISOString().slice(0, 10);
      return taskDate === selDate;
    }) 
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // --- Add Task Modal State ---
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(null);
  const [moduleText, setModuleText] = useState(''); 
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const openModal = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(12, 0, 0, 0);
    setDueDate(newDate);
    setTitle('');
    setSubjectId(null);
    setModuleText('');
    setModalVisible(true);
  };


  const handleAddTask = () => {
  if (!title.trim()) {
    Alert.alert('Missing task', 'Please enter a task title.');
    return;
  }

  addTask({
    title: title.trim(),
    ...(moduleText.trim() ? {} : { subjectId }),
    moduleName: moduleText.trim(),
    dueDate: dueDate.toISOString(),
    priority: 'medium',
  });

  setModalVisible(false);
  Alert.alert('Task added', 'Your study task has been added successfully.');

  setTitle('');
  setSubjectId(null);
  setModuleText('');
}; 
  
return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <Text style={styles.headerTitle}>This week</Text>
        <Text style={styles.subtitle}>Plan sessions, not just deadlines</Text>

        {/* Week Strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((day, index) => {
            const isSelected = getLocalDateStr(selectedDate) === getLocalDateStr(day.dateObj);
            const hasTasks = tasks.some(t => t.dueDate && getLocalDateStr(new Date(t.dueDate)) === getLocalDateStr(day.dateObj));

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayBtn, isSelected && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedDate(day.dateObj)}
              >
                <Text style={[styles.dayName, isSelected && { color: '#fff' }]}>{day.dayName}</Text>
                <Text style={[styles.dayNum, isSelected && { color: '#fff' }]}>{day.dateNum}</Text>
                {hasTasks && <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Heading */}
        <Text style={styles.dateHeading}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </Text>

        {/* Task List */}
        <View style={[styles.taskListCard, { backgroundColor: colors.card }]}>
          {filteredTasks.length === 0 ? (
            <Text style={styles.empty}>Free day. Add a study session with the button below.</Text>
          ) : (
            filteredTasks.map((item, index) => (
              <View key={item.id}>
                <TaskItem
                  task={item}
                  onToggle={() => toggleTask(item.id)}
                  onDelete={() => deleteTask(item.id)}
                />
                {index < filteredTasks.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={openModal}>
        <Text style={styles.fabText}>+ Add task</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>NEW TASK</Text>
            
            <Text style={styles.inputLabel}>What do you need to do?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="e.g. Read chapter 7"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />

          
          <Text style={styles.inputLabel}>Module</Text>
          <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="e.g. Financial Accounting"
          placeholderTextColor={colors.muted}
          value={moduleText}
          onChangeText={setModuleText}
          />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {subjects.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjectChip, subjectId === s.id && { backgroundColor: s.color }]}
                  onPress={() => setSubjectId(s.id)}
                >
                  <View style={[styles.chipDot, { backgroundColor: subjectId === s.id ? '#fff' : s.color }]} />
                  <Text style={[styles.chipText, subjectId === s.id && { color: '#fff' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Due date</Text>
            <TouchableOpacity style={[styles.inputIconRow, { backgroundColor: colors.card }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: colors.text, flex: 1 }}>{dueDate.toLocaleDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            </TouchableOpacity>

   {showDatePicker && ( 
  <DateTimePicker 
    value={dueDate}
    mode="date"
    onValueChange={(event, date) => {
      setShowDatePicker(false);
      if (date) {
        setDueDate(previousDate => {
          const updatedDate = new Date(previousDate);
          updatedDate.setFullYear(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
          return updatedDate;
        });
      }
    }}
    onDismiss={() => setShowDatePicker(false)}
  />
)}
            <Text style={styles.inputLabel}>Time</Text>
            <TouchableOpacity style={[styles.inputIconRow, { backgroundColor: colors.card }]} onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: colors.text, flex: 1 }}>{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="time-outline" size={20} color={colors.muted} />
            </TouchableOpacity>
            
            {showTimePicker && (
  <DateTimePicker
    value={dueDate}
    mode="time"
    onValueChange={(event, time) => {
      setShowTimePicker(false);
      if (time) {
        setDueDate(previousDate => {
          const updatedDate = new Date(previousDate);
          updatedDate.setHours(
            time.getHours(),
            time.getMinutes(),
            0,
            0
          );
          return updatedDate;
        });
      }
    }}
    onDismiss={() => setShowTimePicker(false)}
  />
)} 

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: colors.muted, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddTask}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },
  
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  dayBtn: { alignItems: 'center', paddingVertical: 10, width: 44, borderRadius: 12, backgroundColor: colors.card },
  dayName: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 },
  dayNum: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },

  dateHeading: { fontSize: 12, letterSpacing: 1.5, fontWeight: '700', color: colors.muted, marginBottom: 12, marginLeft: 4 },
  
  taskListCard: { borderRadius: 16, padding: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  empty: { color: colors.muted, fontStyle: 'italic', fontSize: 14 },

  fab: { position: 'absolute', bottom: 24, right: 24, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, elevation: 4 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: { borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16 },
  inputIconRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 14, marginBottom: 16 },
  
  subjectChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, marginRight: 8 },
  chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.text },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: 12, marginRight: 8 },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
}); 