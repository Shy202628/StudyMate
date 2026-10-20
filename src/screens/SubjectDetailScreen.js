import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import TaskItem from '../components/TaskItem';
import { lightColors, darkColors } from '../theme/colors';

export default function SubjectDetailScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const {
    subjects, tasks, sessions, darkMode,
    addTask, toggleTask, deleteTask, deleteSubject,
  } = useApp();
  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  const [title, setTitle] = useState('');

  const subject = subjects.find(s => s.id === subjectId);

  if (!subject) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Subject not found.</Text>
      </View>
    );
  }

  const subjectTasks = tasks.filter(t => t.subjectId === subjectId);
  const pending = subjectTasks.filter(t => !t.done);
  const done = subjectTasks.filter(t => t.done);
  const totalMinutes = sessions
    .filter(s => s.subjectId === subjectId)
    .reduce((sum, s) => sum + s.minutes, 0);

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      dueDate: new Date().toISOString(),
      subjectId: subject.id,
    });
    setTitle('');
  };

  const handleDeleteSubject = () => {
    Alert.alert(
      'Delete subject?',
      `"${subject.name}" will be removed. Its tasks will stay but lose the subject link.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSubject(subject.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.header, { borderLeftColor: subject.color, backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subjectName}>{subject.name}</Text>
            <Text style={styles.subjectMeta}>
              {pending.length} pending · {done.length} done · {totalMinutes} min studied
            </Text>
          </View>
          <TouchableOpacity onPress={handleDeleteSubject} style={{ padding: 6 }}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Add task to ${subject.name}...`}
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: subject.color }]}
            onPress={handleAdd}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={subjectTasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={() => toggleTask(item.id)}
              onDelete={() => deleteTask(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No tasks for this subject yet.</Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  subjectName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  subjectMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    fontSize: 15,
    color: colors.text,
  },
  addBtn: {
    marginLeft: 8,
    width: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', marginTop: 40, color: colors.muted },
}); 