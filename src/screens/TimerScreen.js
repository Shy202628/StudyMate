
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { lightColors, darkColors } from '../theme/colors';

const RING_SIZE = 260;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerScreen() {
  const {
    subjects,
    addSession,
    sessions,
    darkMode,
    timerSettings,
  } = useApp();

  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  // Read the durations saved in Settings.
  const WORK_SECONDS = (timerSettings?.focusLength ?? 25) * 60;
  const BREAK_SECONDS = (timerSettings?.breakLength ?? 5) * 60;

  const [mode, setMode] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState(null);

  const intervalRef = useRef(null);
  const finishRef = useRef(false);
  const previousDurationsRef = useRef({
    work: WORK_SECONDS,
    break: BREAK_SECONDS,
  });

  const total = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;

  // Keep the selected module valid if a module is deleted.
  useEffect(() => {
    if (subjectId && !subjects.some(s => s.id === subjectId)) {
      setSubjectId(null);
    }
  }, [subjects, subjectId]);

  // Update the timer when durations change in Settings.
  // If the timer is running, pause it and reset to the new duration.
  useEffect(() => {
    const oldDurations = previousDurationsRef.current;

    const workChanged = oldDurations.work !== WORK_SECONDS;
    const breakChanged = oldDurations.break !== BREAK_SECONDS;

    if (workChanged || breakChanged) {
      setRunning(false);
      finishRef.current = false;

      setSecondsLeft(
        mode === 'work' ? WORK_SECONDS : BREAK_SECONDS
      );

      previousDurationsRef.current = {
        work: WORK_SECONDS,
        break: BREAK_SECONDS,
      };
    }
  }, [WORK_SECONDS, BREAK_SECONDS, mode]);

  // Run the countdown one second at a time.
  useEffect(() => {
    if (!running) return undefined;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(previous => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Handle the end of a focus or break session.
  useEffect(() => {
    if (secondsLeft !== 0 || finishRef.current) return;

    finishRef.current = true;
    setRunning(false);

    if (mode === 'work') {
      if (subjectId) {
        addSession({
          subjectId,
          minutes: WORK_SECONDS / 60,
          date: new Date().toISOString(),
        });
      }

      setMode('break');
      setSecondsLeft(BREAK_SECONDS);

      Alert.alert(
        'Focus session complete! 🍅',
        `Great work! Time for a ${BREAK_SECONDS / 60}-minute break.`
      );
    } else {
      setMode('work');
      setSecondsLeft(WORK_SECONDS);

      Alert.alert(
        'Break over',
        `Ready for another ${WORK_SECONDS / 60}-minute focus session?`
      );
    }
  }, [
    secondsLeft,
    mode,
    subjectId,
    addSession,
    WORK_SECONDS,
    BREAK_SECONDS,
  ]);

  const reset = () => {
    setRunning(false);
    finishRef.current = false;
    setSecondsLeft(mode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  };

  const toggleMode = () => {
    setRunning(false);
    finishRef.current = false;

    if (mode === 'work') {
      setMode('break');
      setSecondsLeft(BREAK_SECONDS);
    } else {
      setMode('work');
      setSecondsLeft(WORK_SECONDS);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const progress = Math.min(
    1,
    Math.max(0, 1 - secondsLeft / total)
  );

  const selectedSubject = subjects.find(s => s.id === subjectId);

  const today = new Date();

  const sessionsToday = sessions.filter(session => {
    if (!session.date) return false;

    const date = new Date(session.date);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.modeTitle}>
          {mode === 'work' ? 'Focus time' : 'Break time'}
        </Text>

        <Text style={styles.subTitle}>
          {mode === 'work'
            ? selectedSubject
              ? `Studying ${selectedSubject.name}`
              : 'Pick a module below'
            : 'Stretch, drink water, rest your eyes'}
        </Text>

        {/* Circular timer and progress ring */}
        <View style={styles.circleOuter}>
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          >
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />

            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>

          <View
            style={[
              styles.timerCenter,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={styles.timeText}>
              {mm}:{ss}
            </Text>

            <Text style={styles.ofText}>
              of {total / 60} minutes
            </Text>

            <Text style={[styles.progressText, { color: colors.primary }]}>
              {Math.round(progress * 100)}% complete
            </Text>
          </View>
        </View>

        {/* Module selection */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.moduleScroll}
          contentContainerStyle={styles.moduleContent}
        >
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.moduleBtn,
                subjectId === subject.id && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '10',
                },
              ]}
              onPress={() => setSubjectId(subject.id)}
            >
              <Text
                style={[
                  styles.moduleBtnText,
                  subjectId === subject.id && { color: colors.primary },
                ]}
              >
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timer controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: colors.primary }]}
            onPress={() => setRunning(previous => !previous)}
          >
            <Text style={styles.mainBtnText}>
              {running ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: colors.card }]}
            onPress={reset}
          >
            <Text style={[styles.mainBtnText, { color: colors.text }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.breakBtn, { backgroundColor: colors.card }]}
          onPress={toggleMode}
        >
          <Text style={[styles.breakBtnText, { color: colors.text }]}>
            {mode === 'work' ? 'Take a break' : 'Back to focus'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sessionsText}>
          {sessionsToday} focus session{sessionsToday === 1 ? '' : 's'} finished today
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    screen: { flex: 1 },
    container: {
      flexGrow: 1,
      alignItems: 'center',
      paddingTop: 40,
      paddingBottom: 30,
    },
    modeTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subTitle: {
      fontSize: 15,
      color: colors.muted,
      marginTop: 8,
      marginBottom: 30,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    circleOuter: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 30,
    },
    timerCenter: {
      position: 'absolute',
      width: RING_SIZE - STROKE_WIDTH * 2,
      height: RING_SIZE - STROKE_WIDTH * 2,
      borderRadius: (RING_SIZE - STROKE_WIDTH * 2) / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeText: {
      fontSize: 52,
      fontWeight: 'bold',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    ofText: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 4,
    },
    progressText: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 8,
    },
    moduleScroll: {
      width: '100%',
      maxHeight: 50,
      marginBottom: 24,
    },
    moduleContent: {
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    moduleBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 10,
    },
    moduleBtnText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    controlsRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    mainBtn: {
      paddingHorizontal: 30,
      paddingVertical: 16,
      borderRadius: 30,
      width: 130,
      alignItems: 'center',
    },
    mainBtnText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    breakBtn: {
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 30,
    },
    breakBtnText: {
      fontSize: 16,
      fontWeight: '600',
    },
    sessionsText: {
      marginTop: 20,
      color: colors.muted,
      fontSize: 14,
    },
  });

 