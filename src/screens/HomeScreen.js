import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import TaskItem from '../components/TaskItem';
import { lightColors, darkColors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const {
    tasks, subjects, sessions, exams,
    toggleTask, deleteTask, addTask, darkMode, timerSettings 
  } = useApp();

  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [moduleText, setModuleText] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const hour = today.getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const todaysTasks = tasks.filter(t => {
    const tDate = t.dueDate?.slice(0, 10);
    return tDate === todayStr || (tDate < todayStr && !t.done);
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const todayDone = tasks.filter(
    t => t.dueDate?.slice(0, 10) === todayStr && t.done
  ).length;

  const todayTotal = tasks.filter(
    t => t.dueDate?.slice(0, 10) === todayStr
  ).length;

  const todayMinutes = sessions
    .filter(s => s.date?.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
    
  const dailyGoal = timerSettings?.dailyGoal ?? 120; 

  const streakDays = new Set(
    sessions
      .filter(s => s.date)
      .map(s => {
        const d = new Date(s.date);
        return [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0'),
        ].join('-');
      })
  ).size;

  // Display real upcoming exams saved from Settings.
  const upcomingExams = (exams || [])
    .filter(exam => {
      if (!exam.examDate) return false;
      return exam.examDate.slice(0, 10) >= todayStr;
    })
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .slice(0, 3);

  const getDaysUntil = (dateString) => {
    const examDate = new Date(`${dateString.slice(0, 10)}T00:00:00`);
    const todayDate = new Date(`${todayStr}T00:00:00`);
    return Math.round((examDate - todayDate) / (1000 * 60 * 60 * 24));
  };

  const formatExamCountdown = (days) => {
    if (days === 0) return 'Exam is today!';
    if (days === 1) return 'Exam is tomorrow';
    return `Exam in ${days} days`;
  };

  const handleAddTask = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      moduleName: moduleText,
      dueDate: dueDate.toISOString(),
      priority: 'medium',
    });

    setTitle('');
    setModuleText('');
    setDueDate(new Date());
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.greeting}>{greeting}</Text>

        <Text style={styles.subtitle}>
          {todayTotal - todayDone > 0
            ? `${todayTotal - todayDone} tasks left today. You've got this.`
            : 'All clear for today! 🌱'}
        </Text>

        <View style={styles.chipsRow}>
          <View style={[styles.statChip, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.chipText, { color: '#B45309' }]}>
              🔥 {streakDays}-day streak
            </Text>
          </View>

          <View style={[styles.statChip, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.chipText, { color: '#047857' }]}>
              {todayDone} of {todayTotal} done
            </Text>
          </View>

          <View style={[styles.statChip, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.chipText, { color: '#B45309' }]}>
              {todayMinutes}/{dailyGoal} min
            </Text>
          </View>
        </View>

        {/* Real exam countdowns from Settings */}
        <Text style={styles.sectionTitle}>UPCOMING EXAMS</Text>

        {upcomingExams.length === 0 ? (
          <View style={[styles.noExamCard, { backgroundColor: colors.card }]}>
            <Ionicons
              name="calendar-outline"
              size={26}
              color={colors.primary}
            />
            <View style={styles.noExamTextContainer}>
              <Text style={[styles.noExamTitle, { color: colors.text }]}>
                No upcoming exams yet
              </Text>
              <Text style={[styles.noExamSubtitle, { color: colors.muted }]}>
                Add an exam in Settings and its countdown will appear here.
              </Text>
            </View>
          </View>
        ) : (
          upcomingExams.map(exam => {
            const subject = subjects.find(
              item => item.id === exam.subjectId
            );

            const moduleName = subject?.name || 'Module';
            const moduleTasks = tasks.filter(
              task => task.subjectId === exam.subjectId
            );
            const completedTasks = moduleTasks.filter(
              task => task.done
            ).length;

            const progress = moduleTasks.length > 0
              ? (completedTasks / moduleTasks.length) * 100
              : 0;

            const days = getDaysUntil(exam.examDate);

            return (
              <View
                key={exam.id}
                style={[styles.examCard, { backgroundColor: '#2563EB' }]}
              >
                <Text style={styles.examLabel}>
                  {exam.name?.trim() || 'Upcoming exam'}
                </Text>

                <Text style={styles.examTitle}>{moduleName}</Text>

                <Text style={styles.examCountdown}>
                  {formatExamCountdown(days)}
                </Text>

                <Text style={styles.examDate}>
                  Exam date: {exam.examDate.slice(0, 10)}
                </Text>

                <View style={styles.examBarBg}>
                  <View
                    style={[
                      styles.examBarFill,
                      { width: `${progress}%` },
                    ]}
                  />
                </View>

                <Text style={styles.examProgressText}>
                  {Math.round(progress)}% of {moduleName} tasks completed
                </Text>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>TODAY</Text>

        <View style={[styles.taskListCard, { backgroundColor: colors.card }]}>
          {todaysTasks.length === 0 ? (
            <Text style={styles.empty}>Free day. Add a task below.</Text>
          ) : (
            todaysTasks.map((item, index) => {
              const isOverdue =
                item.dueDate?.slice(0, 10) < todayStr && !item.done;

              return (
                <View key={item.id}>
                  <TaskItem
                    task={item}
                    isOverdue={isOverdue}
                    onToggle={() => toggleTask(item.id)}
                    onDelete={() => deleteTask(item.id)}
                  />
                  {index < todaysTasks.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ Add task</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              NEW TASK
            </Text>

            <Text style={styles.inputLabel}>What do you need to do?</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text },
              ]}
              placeholder="Enter any task you need to do" 
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Module</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text },
              ]}
              placeholder="e.g. Financial Accounting"
              placeholderTextColor={colors.muted}
              value={moduleText}
              onChangeText={setModuleText}
            />

            <Text style={styles.inputLabel}>Due date</Text>
            <TouchableOpacity
              style={[styles.inputIconRow, { backgroundColor: colors.card }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.text, flex: 1 }}>
                {dueDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                onChange={(e, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) setDueDate(d);
                }}
              />
            )}

            <Text style={styles.inputLabel}>Time</Text>
            <TouchableOpacity
              style={[styles.inputIconRow, { backgroundColor: colors.card }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: colors.text, flex: 1 }}>
                {dueDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Ionicons name="time-outline" size={20} color={colors.muted} />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={dueDate}
                mode="time"
                onChange={(e, d) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (d) setDueDate(d);
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: colors.muted, fontWeight: 'bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddTask}
              >
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
  greeting: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  subtitle: {
    fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap',
  },
  statChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    fontSize: 12, letterSpacing: 1.5, fontWeight: '700',
    color: colors.muted, marginBottom: 12, marginLeft: 4,
  },
  examCard: { borderRadius: 16, padding: 20, marginBottom: 14 },
  examLabel: {
    color: 'rgba(255,255,255,0.85)', fontSize: 12,
    fontWeight: '600', marginBottom: 4,
  },
  examTitle: {
    color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4,
  },
  examCountdown: {
    color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6,
  },
  examDate: {
    color: 'rgba(255,255,255,0.9)', fontSize: 12, marginBottom: 14,
  },
  examBarBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3, marginBottom: 8,
  },
  examBarFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  examProgressText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  noExamCard: {
    borderRadius: 16, padding: 16, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  noExamTextContainer: { flex: 1 },
  noExamTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  noExamSubtitle: { fontSize: 13, lineHeight: 18 },
  taskListCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  empty: { color: colors.muted, fontStyle: 'italic', fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, paddingHorizontal: 20,
    paddingVertical: 14, borderRadius: 30, elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 20,
  },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: {
    fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6,
  },
  input: { borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16 },
  inputIconRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    padding: 14, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: 12, marginRight: 8 },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
});
