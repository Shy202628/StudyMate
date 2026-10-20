
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { lightColors, darkColors } from '../theme/colors';

const getLocalDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProgressScreen() {
  const { tasks, sessions, subjects, darkMode } = useApp();
  const colors = darkMode ? darkColors : lightColors;
  const styles = createStyles(colors);

  const today = new Date();
  const todayStr = getLocalDateKey(today);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return date;
  });

  const minutesPerDay = last7Days.map(date => {
    const dateStr = getLocalDateKey(date);

    return sessions
      .filter(session =>
        session.date &&
        getLocalDateKey(new Date(session.date)) === dateStr
      )
      .reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);
  });

  const total7DayMins = minutesPerDay.reduce((sum, mins) => sum + mins, 0);
  const total7DayHours = (total7DayMins / 60).toFixed(1);

  const todayMins = sessions
    .filter(session =>
      session.date &&
      getLocalDateKey(new Date(session.date)) === todayStr
    )
    .reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);

  const dailyGoal = 60;
  const completedTasks = tasks.filter(task => task.done).length;
  const pendingTasks = tasks.length - completedTasks;
  const completionRate = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const sessionsToday = sessions.filter(session =>
    session.date &&
    getLocalDateKey(new Date(session.date)) === todayStr
  ).length;

  const subjectStats = subjects
    .map(subject => {
      const mins = sessions
        .filter(session => session.subjectId === subject.id)
        .reduce((sum, session) => sum + (Number(session.minutes) || 0), 0);

      return { ...subject, mins };
    })
    .filter(subject => subject.mins > 0)
    .sort((a, b) => b.mins - a.mins);

  const maxSubMins = Math.max(...subjectStats.map(subject => subject.mins), 1);
  const maxMinutes = Math.max(...minutesPerDay, 60);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.header}>Your progress</Text>
      <Text style={styles.subHeader}>
        Small steps add up. Here's how you're doing.
      </Text>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={styles.summaryIcon}>✓</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {completedTasks}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            Tasks done
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={styles.summaryIcon}>◷</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {sessionsToday}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            Focus sessions today
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={styles.summaryIcon}>◴</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {total7DayHours}h
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>
            This week
          </Text>
        </View>
      </View>

      {/* Task completion */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Task completion
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {completionRate}%
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${completionRate}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <Text style={[styles.helperText, { color: colors.muted }]}>
          {completedTasks} completed · {pendingTasks} remaining · {tasks.length} total
        </Text>
      </View>

      {/* Daily goal */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Today's study goal
          </Text>
          <Text style={[styles.statValue, { color: colors.muted }]}>
            {todayMins} / {dailyGoal} min
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min((todayMins / dailyGoal) * 100, 100)}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <Text style={[styles.helperText, { color: colors.muted }]}>
          {todayMins >= dailyGoal
            ? 'Daily goal reached. Great work!'
            : `${dailyGoal - todayMins} minutes to reach today's goal.`}
        </Text>
      </View>

      {/* Weekly study chart */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 20 }]}>
          Study time this week
        </Text>

        <View style={styles.chartRow}>
          {minutesPerDay.map((mins, index) => {
            const heightPct = (mins / maxMinutes) * 100;
            const date = last7Days[index];
            const isToday = getLocalDateKey(date) === todayStr;
            const dayName = date.toLocaleDateString('en-US', {
              weekday: 'narrow',
            });

            return (
              <View key={getLocalDateKey(date)} style={styles.chartCol}>
                <Text style={[styles.barValue, { color: colors.muted }]}>
                  {mins > 0 ? mins : ''}
                </Text>

                <View
                  style={[
                    styles.chartBarBg,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: isToday ? colors.primary : colors.muted,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.chartLabel,
                    { color: isToday ? colors.primary : colors.muted },
                  ]}
                >
                  {dayName}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Study time by subject */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>
          Study time by module
        </Text>

        {subjectStats.length === 0 ? (
          <Text style={[styles.helperText, { color: colors.muted }]}>
            No completed focus sessions recorded by module yet. Select a module
            on the Timer screen and finish a focus session to see your results here.
          </Text>
        ) : (
          subjectStats.map(subject => (
            <View key={subject.id} style={styles.subjectRow}>
              <View style={styles.rowBetween}>
                <Text style={[styles.subjectName, { color: colors.text }]}>
                  {subject.name}
                </Text>
                <Text style={[styles.subjectHours, { color: colors.muted }]}>
                  {(subject.mins / 60).toFixed(1)} h
                </Text>
              </View>

              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(subject.mins / maxSubMins) * 100}%`,
                      backgroundColor: subject.color || colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>
           <Text style={styles.streakMessage}>
        5-day streak. Study a little every day to keep it going
      </Text> 

    </ScrollView>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingTop: 32,
      paddingBottom: 36,
    },
    header: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.text,
    },
    subHeader: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 6,
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    summaryCard: {
      flex: 1,
      minHeight: 112,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryIcon: {
      fontSize: 20,
      color: colors.primary,
      marginBottom: 5,
    },
    summaryValue: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    summaryLabel: {
      fontSize: 11,
      textAlign: 'center',
      marginTop: 4,
    },
    card: {
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    statValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    helperText: {
      fontSize: 12,
      lineHeight: 18,
      marginTop: 10,
    },
    progressBarBg: {
      height: 8,
      borderRadius: 4,
      marginTop: 12,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    chartRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 145,
    },
    chartCol: {
      alignItems: 'center',
      flex: 1,
    },
    barValue: {
      fontSize: 10,
      marginBottom: 4,
    },
    chartBarBg: {
      width: 22,
      height: 100,
      borderRadius: 6,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    chartBarFill: {
      width: '100%',
      borderRadius: 6,
    },
    chartLabel: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: 'bold',
    },
    subjectRow: {
      marginBottom: 16,
    },
    subjectName: {
      fontWeight: '600',
      flex: 1,
    },
    subjectHours: {
      fontWeight: '600',
    },
        streakMessage: {
      textAlign: 'center',
      fontSize: 13,
      color: colors.muted,
      marginTop: 4,
      marginBottom: 12,
      paddingHorizontal: 10,
    }, 
  });
