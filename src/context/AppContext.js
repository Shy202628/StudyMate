
import { createContext, useContext, useEffect, useState } from 'react';
import { load, save, KEYS } from '../storage/storage';

const AppContext = createContext();

const DEFAULT_TIMER_SETTINGS = {
  focusLength: 25,
  breakLength: 5,
  dailyGoal: 120,
};

export const AppProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [timerSettings, setTimerSettings] = useState(DEFAULT_TIMER_SETTINGS);
  const [screenshotPreference, setScreenshotPreference] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [
          savedSubjects,
          savedTasks,
          savedSessions,
          savedTheme,
          savedExams,
          savedTimerSettings,
          savedScreenshotPreference,
        ] = await Promise.all([
          load(KEYS.SUBJECTS),
          load(KEYS.TASKS),
          load(KEYS.SESSIONS),
          load(KEYS.THEME, false),
          load(KEYS.EXAMS),
          load(KEYS.TIMER_SETTINGS, DEFAULT_TIMER_SETTINGS),
          load(KEYS.SCREENSHOT_PREFERENCE, false),
        ]);

        if (!mounted) return;

        setSubjects(Array.isArray(savedSubjects) ? savedSubjects : []);
        setTasks(Array.isArray(savedTasks) ? savedTasks : []);
        setSessions(Array.isArray(savedSessions) ? savedSessions : []);
        setDarkMode(Boolean(savedTheme));
        setExams(Array.isArray(savedExams) ? savedExams : []);
        setTimerSettings({
          ...DEFAULT_TIMER_SETTINGS,
          ...(savedTimerSettings &&
          typeof savedTimerSettings === 'object' &&
          !Array.isArray(savedTimerSettings)
            ? savedTimerSettings
            : {}),
        });
        setScreenshotPreference(Boolean(savedScreenshotPreference));
      } catch (error) {
        console.log('App data loading error', error);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (ready) save(KEYS.SUBJECTS, subjects);
  }, [subjects, ready]);

  useEffect(() => {
    if (ready) save(KEYS.TASKS, tasks);
  }, [tasks, ready]);

  useEffect(() => {
    if (ready) save(KEYS.SESSIONS, sessions);
  }, [sessions, ready]);

  useEffect(() => {
    if (ready) save(KEYS.THEME, darkMode);
  }, [darkMode, ready]);

  useEffect(() => {
    if (ready) save(KEYS.EXAMS, exams);
  }, [exams, ready]);

  useEffect(() => {
    if (ready) save(KEYS.TIMER_SETTINGS, timerSettings);
  }, [timerSettings, ready]);

  useEffect(() => {
    if (ready) save(KEYS.SCREENSHOT_PREFERENCE, screenshotPreference);
  }, [screenshotPreference, ready]);

  // Modules (called subjects in the existing app)
  const addSubject = (subject) => {
    const name = subject?.name?.trim();
    if (!name) return;

    const exists = subjects.some(
      (item) => item.name?.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) return;

    const colors = [
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

    const usedColors = subjects.map((item) => item.color);
    const availableColors = colors.filter(
      (color) => !usedColors.includes(color)
    );

    const color =
      subject.color ||
      (availableColors.length
        ? availableColors[0]
        : colors[subjects.length % colors.length]);

    setSubjects((prev) => [
      ...prev,
      {
        ...subject,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        name,
        color,
      },
    ]);
  };

  const updateSubject = (id, changes) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, ...changes } : subject
      )
    );
  };

  const deleteSubject = (id) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));

    // Remove links to the deleted module from tasks and exams.
    setTasks((prev) =>
      prev.map((task) =>
        task.subjectId === id
          ? { ...task, subjectId: undefined }
          : task
      )
    );

    setExams((prev) => prev.filter((exam) => exam.subjectId !== id));
  };

  // Tasks
  const addTask = (task) => {
    let finalSubjectId = task.subjectId;
    const moduleName = task.moduleName?.trim();

    if (moduleName) {
      const existing = subjects.find(
        (subject) =>
          subject.name?.trim().toLowerCase() === moduleName.toLowerCase()
      );

      if (existing) {
        finalSubjectId = existing.id;
      } else {
        const colors = [
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

        const usedColors = subjects.map((subject) => subject.color);
        const availableColors = colors.filter(
          (color) => !usedColors.includes(color)
        );
        const color = availableColors.length
          ? availableColors[0]
          : colors[subjects.length % colors.length];

        const newSubject = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          name: moduleName,
          color,
          teacher: '',
          examDate: null,
        };

        setSubjects((prev) => [...prev, newSubject]);
        finalSubjectId = newSubject.id;
      }
    }

    const { moduleName: ignoredModuleName, ...taskData } = task;

    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        done: false,
        priority: 'medium',
        subjectId: finalSubjectId,
        notes: '',
        ...taskData,
      },
    ]);
  };

  const updateTask = (id, changes) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...changes } : task))
    );
  };

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );

  const deleteTask = (id) =>
    setTasks((prev) => prev.filter((task) => task.id !== id));

  // Exam countdowns
  const addExam = (exam) => {
    if (!exam.subjectId || !exam.examDate) return;

    setExams((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        name: exam.name?.trim() || '',
        subjectId: exam.subjectId,
        examDate: exam.examDate,
      },
    ]);
  };

  const updateExam = (id, changes) => {
    setExams((prev) =>
      prev.map((exam) => (exam.id === id ? { ...exam, ...changes } : exam))
    );
  };

  const deleteExam = (id) =>
    setExams((prev) => prev.filter((exam) => exam.id !== id));

  // Timer and daily study goal
  const updateTimerSettings = (changes) => {
    setTimerSettings((prev) => {
      const next = { ...prev, ...changes };

      for (const key of ['focusLength', 'breakLength', 'dailyGoal']) {
        if (
          !Number.isFinite(Number(next[key])) ||
          Number(next[key]) < 1
        ) {
          return prev;
        }
        next[key] = Math.floor(Number(next[key]));
      }

      return next;
    });
  };

  const addSession = (session) =>
    setSessions((prev) => [
      ...prev,
      { ...session, id: Date.now().toString() },
    ]);

  const clearAllData = () => {
    setSubjects([]);
    setTasks([]);
    setSessions([]);
    setExams([]);
    setTimerSettings(DEFAULT_TIMER_SETTINGS);
    setScreenshotPreference(false);
  };

  return (
    <AppContext.Provider
      value={{
        subjects,
        tasks,
        sessions,
        exams,
        timerSettings,
        screenshotPreference,
        darkMode,
        ready,

        addSubject,
        updateSubject,
        deleteSubject,

        addTask,
        updateTask,
        toggleTask,
        deleteTask,

        addExam,
        updateExam,
        deleteExam,

        updateTimerSettings,
        setScreenshotPreference,

        addSession,
        toggleDark: () => setDarkMode((value) => !value),
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
