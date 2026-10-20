
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { lightColors, darkColors } from '../theme/colors';
import { load, save } from '../storage/storage';

const PROFILE_NAME_KEY = 'studymate_profile_name';

const MODULE_COLORS = [
  '#4A90D9',
  '#E5484D',
  '#2FA84F',
  '#F5A623',
  '#8E44AD',
  '#E91E63',
  '#16A085',
  '#34495E',
  '#D16BA5',
  '#5C7AEA',
];

export default function SettingsScreen() {
  const {
    darkMode,
    toggleDark,
    subjects,
    tasks,
    sessions,
    exams,
    timerSettings,
    screenshotPreference,
    setScreenshotPreference,
    addSubject,
    deleteSubject,
    addExam,
    deleteExam,
    updateTimerSettings,
    clearAllData,
  } = useApp();

  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  const [name, setName] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleColor, setNewModuleColor] = useState(MODULE_COLORS[0]);

  const [examName, setExamName] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [showModulePicker, setShowModulePicker] = useState(false);

  const [focusInput, setFocusInput] = useState(
    String(timerSettings.focusLength)
  );
  const [breakInput, setBreakInput] = useState(
    String(timerSettings.breakLength)
  );
  const [goalInput, setGoalInput] = useState(
    String(timerSettings.dailyGoal)
  );

  useEffect(() => {
    let active = true;

    load(PROFILE_NAME_KEY, '').then(savedName => {
      if (active) {
        setName(typeof savedName === 'string' ? savedName : '');
        setProfileLoaded(true);
      }
    }).catch(() => {
      if (active) setProfileLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (profileLoaded) {
      save(PROFILE_NAME_KEY, name);
    }
  }, [name, profileLoaded]);

  useEffect(() => {
    setFocusInput(String(timerSettings.focusLength));
    setBreakInput(String(timerSettings.breakLength));
    setGoalInput(String(timerSettings.dailyGoal));
  }, [
    timerSettings.focusLength,
    timerSettings.breakLength,
    timerSettings.dailyGoal,
  ]);

  const handleClear = () => {
    Alert.alert(
      'Clear all data?',
      'This will permanently remove your modules, tasks, study sessions, and exams. Your profile name and appearance setting will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear data',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert(
              'Data cleared',
              'Your modules, tasks, study sessions, and exams have been cleared.'
            );
          },
        },
      ]
    );
  };

  // Modules
  const handleAddModule = () => {
    const trimmedName = newModuleName.trim();

    if (!trimmedName) {
      Alert.alert('Module name required', 'Please enter a module name.');
      return;
    }

    const alreadyExists = subjects.some(
      subject =>
        subject.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      Alert.alert(
        'Module already exists',
        'This module is already in your module list.'
      );
      return;
    }

    addSubject({
      name: trimmedName,
      color: newModuleColor,
      teacher: '',
      examDate: null,
    });

    setNewModuleName('');

    const usedColors = subjects.map(subject => subject.color);
    const nextColor = MODULE_COLORS.find(
      color => !usedColors.includes(color) && color !== newModuleColor
    );

    setNewModuleColor(nextColor || MODULE_COLORS[0]);
  };

  const confirmDeleteModule = subject => {
    Alert.alert(
      'Delete module?',
      `Are you sure you want to delete "${subject.name}"? Exams linked to this module will also be removed. Tasks will remain, but will no longer be linked to this module.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete module',
          style: 'destructive',
          onPress: () => deleteSubject(subject.id),
        },
      ]
    );
  };

  // Exams
  const handleAddExam = () => {
    if (!subjects.length) {
      Alert.alert(
        'Add a module first',
        'Create a module before adding an examination.'
      );
      return;
    }

    if (!examSubjectId) {
      Alert.alert('Choose a module', 'Please select the exam module.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      Alert.alert(
        'Check exam date',
        'Enter the date in YYYY-MM-DD format, for example 2026-11-11.'
      );
      return;
    }

    const [year, month, day] = examDate.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      Alert.alert(
        'Invalid date',
        'Please enter a real calendar date.'
      );
      return;
    }

    if (parsedDate.getTime() < new Date().setHours(0, 0, 0, 0)) {
      Alert.alert(
        'Past date',
        'Please choose today or a future examination date.'
      );
      return;
    }

    addExam({
      name: examName.trim(),
      subjectId: examSubjectId,
      examDate,
    });

    setExamName('');
    setExamSubjectId('');
    setExamDate('');
    setShowModulePicker(false);

    Alert.alert('Exam added', 'Your examination countdown has been saved.');
  };

  const confirmDeleteExam = exam => {
    Alert.alert(
      'Remove exam?',
      'Are you sure you want to remove this examination countdown?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteExam(exam.id),
        },
      ]
    );
  };

  const getDaysRemaining = dateString => {
    const [year, month, day] = dateString.split('-').map(Number);
    const examDay = new Date(year, month - 1, day);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    examDay.setHours(0, 0, 0, 0);

    const difference = Math.round(
      (examDay.getTime() - today.getTime()) / 86400000
    );

    if (difference < 0) return 'Exam date passed';
    if (difference === 0) return 'Exam day is today!';
    if (difference === 1) return '1 day left';

    return `${difference} days left`;
  };

  // Timer settings
  const changeSetting = (key, amount) => {
    const current = Number(timerSettings[key]) || 1;
    const next = Math.max(1, Math.min(1440, current + amount));

    updateTimerSettings({ [key]: next });
  };

  const saveNumberSetting = (key, value) => {
    const trimmed = value.trim();

    if (!/^\d+$/.test(trimmed)) {
      Alert.alert(
        'Invalid number',
        'Please enter a whole number greater than zero.'
      );
      return;
    }

    const number = Number(trimmed);

    if (number < 1 || number > 1440) {
      Alert.alert(
        'Value out of range',
        'Enter a value between 1 and 1440 minutes.'
      );
      return;
    }

    updateTimerSettings({ [key]: number });
  };

  const renderNumberSetting = (
    title,
    description,
    value,
    setValue,
    settingKey
  ) => (
    <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.rowTitle, { color: colors.text }]}>
        {title}
      </Text>

      {description ? (
        <Text style={[styles.rowDescription, { color: colors.muted }]}>
          {description}
        </Text>
      ) : null}

      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => changeSetting(settingKey, -1)}
          accessibilityLabel={`Decrease ${title}`}
        >
          <Ionicons name="remove" size={23} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.numberInput,
            {
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={value}
          onChangeText={text => setValue(text.replace(/[^0-9]/g, ''))}
          onEndEditing={() => saveNumberSetting(settingKey, value)}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={4}
          accessibilityLabel={title}
        />

        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => changeSetting(settingKey, 1)}
          accessibilityLabel={`Increase ${title}`}
        >
          <Ionicons name="add" size={23} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.helperText, { color: colors.muted }]}>
        Minutes
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: colors.text }]}>
        Settings
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Make StudyMate work for you.
      </Text>

      {/* Profile */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        PROFILE
      </Text>

      <View style={[styles.row, { backgroundColor: colors.card }]}>
        <Ionicons
          name="person-circle-outline"
          size={24}
          color={colors.primary}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Type your name"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          maxLength={60}
          returnKeyType="done"
        />
        {name.trim().length > 0 && (
          <TouchableOpacity
            onPress={() => setName('')}
            accessibilityLabel="Clear profile name"
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.helperText, { color: colors.muted }]}>
        Your name is saved on this device.
      </Text>

      {/* Appearance */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        APPEARANCE
      </Text>

      <View style={[styles.row, { backgroundColor: colors.card }]}>
        <View style={styles.rowLeft}>
          <Ionicons
            name={darkMode ? 'moon' : 'sunny'}
            size={22}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.rowDescription, { color: colors.muted }]}>
              {darkMode
                ? 'A darker look for your study space'
                : 'A light, clean appearance'}
            </Text>
          </View>
        </View>
        <Switch
          value={darkMode}
          onValueChange={toggleDark}
          trackColor={{ false: '#ccc', true: colors.primary }}
          accessibilityLabel="Toggle dark mode"
        />
      </View>

      {/* Modules */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        MY MODULES
      </Text>
      <Text style={[styles.helperText, { color: colors.muted }]}>
        Manage the modules available in your Planner.
      </Text>

      {subjects.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Ionicons
            name="book-outline"
            size={30}
            color={colors.muted}
          />
          <Text style={[styles.rowDescription, { color: colors.muted }]}>
            No modules added yet. Add your first module below.
          </Text>
        </View>
      ) : (
        subjects.map(subject => (
          <View
            key={subject.id}
            style={[styles.moduleRow, { backgroundColor: colors.card }]}
          >
            <View
              style={[
                styles.colorDot,
                { backgroundColor: subject.color || colors.primary },
              ]}
            />
            <Text
              style={[styles.moduleName, { color: colors.text }]}
              numberOfLines={2}
            >
              {subject.name}
            </Text>
            <TouchableOpacity
              onPress={() => confirmDeleteModule(subject)}
              style={styles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${subject.name}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          Add another module
        </Text>

        <TextInput
          style={[
            styles.textField,
            {
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={newModuleName}
          onChangeText={setNewModuleName}
          placeholder="Enter module name"
          placeholderTextColor={colors.muted}
          maxLength={100}
          returnKeyType="done"
        />

        <Text style={[styles.rowDescription, { color: colors.text }]}>
          Choose a module colour
        </Text>

        <View style={styles.colorPalette}>
          {MODULE_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              onPress={() => setNewModuleColor(color)}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                newModuleColor === color && styles.selectedColor,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Choose colour ${color}`}
            >
              {newModuleColor === color && (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleAddModule}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Add Module</Text>
        </TouchableOpacity>
      </View>

      {/* Exam Countdown */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        EXAM COUNTDOWN
      </Text>
      <Text style={[styles.helperText, { color: colors.muted }]}>
        Add an examination and see how many days remain.
      </Text>

      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Exam name (optional)
        </Text>
        <TextInput
          style={[
            styles.textField,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={examName}
          onChangeText={setExamName}
          placeholder="e.g. Mid-semester, End-semester"
          placeholderTextColor={colors.muted}
          maxLength={100}
          returnKeyType="done"
        />

        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Module
        </Text>
        <TouchableOpacity
          style={[
            styles.selectField,
            { borderColor: colors.border },
          ]}
          onPress={() => setShowModulePicker(value => !value)}
        >
          <Text
            style={[
              styles.selectText,
              { color: examSubjectId ? colors.text : colors.muted },
            ]}
          >
            {subjects.find(s => s.id === examSubjectId)?.name ||
              'Choose a module'}
          </Text>
          <Ionicons
            name={showModulePicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>

        {showModulePicker &&
          subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.moduleChoice,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => {
                setExamSubjectId(subject.id);
                setShowModulePicker(false);
              }}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: subject.color || colors.primary },
                ]}
              />
              <Text style={[styles.moduleName, { color: colors.text }]}>
                {subject.name}
              </Text>
              {examSubjectId === subject.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}

        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Exam date
        </Text>
        <TextInput
          style={[
            styles.textField,
            { color: colors.text, borderColor: colors.border },
          ]}
          value={examDate}
          onChangeText={setExamDate}
          placeholder="YYYY-MM-DD (e.g. 2026-11-11)"
          placeholderTextColor={colors.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleAddExam}
          accessibilityRole="button"
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Add Exam Countdown</Text>
        </TouchableOpacity>
      </View>

      {exams.map(exam => {
        const subject = subjects.find(s => s.id === exam.subjectId);

        return (
          <View
            key={exam.id}
            style={[
              styles.examCard,
              { backgroundColor: colors.card, borderLeftColor: subject?.color || colors.primary },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {exam.name || 'Upcoming examination'}
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                {subject?.name || 'Module unavailable'} · {exam.examDate}
              </Text>
              <Text style={[styles.countdownText, { color: colors.primary }]}>
                {getDaysRemaining(exam.examDate)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => confirmDeleteExam(exam)}
              accessibilityLabel="Remove examination countdown"
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Timer and Daily Goal */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        TIMER AND DAILY GOAL
      </Text>
      <Text style={[styles.helperText, { color: colors.muted }]}>
        Personalise your focus sessions and daily study target.
      </Text>

      {renderNumberSetting(
        'Focus length (minutes)',
        'How long you study before taking a break.',
        focusInput,
        setFocusInput,
        'focusLength'
      )}

      {renderNumberSetting(
        'Break length (minutes)',
        'How long you rest between focus sessions.',
        breakInput,
        setBreakInput,
        'breakLength'
      )}

      {renderNumberSetting(
        'Daily study goal (minutes)',
        'Your target for focused study each day.',
        goalInput,
        setGoalInput,
        'dailyGoal'
      )}

      {/* Data summary */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        YOUR DATA
      </Text>

      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {subjects.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Modules
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {tasks.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Tasks
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {sessions.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Focus sessions
          </Text>
        </View>
      </View>

      {/* Clear data */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card }]}
        onPress={handleClear}
        accessibilityRole="button"
      >
        <View style={styles.rowLeft}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.danger }]}>
              Clear Tasks & Data
            </Text>
            <Text style={[styles.rowDescription, { color: colors.muted }]}>
              Remove modules, tasks, sessions, and exams
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </TouchableOpacity>

      <Text style={[styles.footer, { color: colors.muted }]}>
        StudyMate · Your study journey, one step at a time.
      </Text>
    </ScrollView>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 32,
      paddingBottom: 40,
    },
    header: {
      fontSize: 30,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 14,
      marginTop: 6,
      marginBottom: 12,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      marginTop: 22,
      marginBottom: 8,
      marginLeft: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
      gap: 10,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    rowDescription: {
      fontSize: 12,
      marginTop: 4,
      lineHeight: 18,
    },
    input: {
      flex: 1,
      fontSize: 15,
      marginLeft: 8,
      paddingVertical: 4,
    },
    helperText: {
      fontSize: 12,
      marginLeft: 4,
      marginTop: 2,
      marginBottom: 8,
      lineHeight: 18,
    },
    emptyCard: {
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    moduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
      gap: 10,
    },
    colorDot: {
      width: 15,
      height: 15,
      borderRadius: 5,
    },
    moduleName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    deleteButton: {
      padding: 5,
    },
    formCard: {
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      marginTop: 4,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 7,
    },
    textField: {
      minHeight: 46,
      borderWidth: 1,
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      marginTop: 8,
    },
    selectField: {
      minHeight: 46,
      borderWidth: 1,
      borderRadius: 9,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    selectText: {
      flex: 1,
      fontSize: 14,
    },
    moduleChoice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    colorPalette: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 12,
      marginBottom: 16,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedColor: {
      borderWidth: 3,
      borderColor: '#222222',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 13,
      borderRadius: 10,
      marginTop: 14,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    settingCard: {
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
    },
    stepper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      marginTop: 12,
    },
    stepButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberInput: {
      width: 90,
      height: 46,
      borderWidth: 1,
      borderRadius: 9,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '700',
    },
    examCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      gap: 10,
    },
    countdownText: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: 8,
    },
    statsCard: {
      flexDirection: 'row',
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 8,
      marginBottom: 8,
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      paddingHorizontal: 4,
    },
    statNumber: {
      fontSize: 22,
      fontWeight: '700',
    },
    statLabel: {
      fontSize: 11,
      marginTop: 4,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
    },
    footer: {
      textAlign: 'center',
      fontSize: 12,
      marginTop: 28,
      lineHeight: 18,
    },
  });

