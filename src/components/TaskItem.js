import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { lightColors, darkColors } from '../theme/colors';

export default function TaskItem({ task, onToggle, onDelete, isOverdue }) {
  const { subjects, darkMode } = useApp();
  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  const subject = subjects.find(s => s.id === task.subjectId);
  const timeLabel = task.dueDate 
    ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: subject ? subject.color : colors.muted }]} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.title, task.done && styles.done]}>{task.title}</Text>
          {isOverdue && <Text style={styles.overdue}>Overdue</Text>}
        </View>
        <Text style={styles.meta}>
          {subject ? subject.name : 'General'} {timeLabel ? `· ${timeLabel}` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="close" size={20} color={colors.muted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
        <Ionicons name={task.done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={task.done ? colors.success : colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 16, color: colors.text, fontWeight: '500' },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  overdue: { fontSize: 10, color: colors.danger, fontWeight: 'bold', marginLeft: 8, textTransform: 'uppercase' },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  deleteBtn: { padding: 8, marginRight: 8 },
  checkbox: { padding: 4 },
}); 