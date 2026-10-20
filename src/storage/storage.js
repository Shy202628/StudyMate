
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  TASKS: 'studymate_tasks',
  SUBJECTS: 'studymate_subjects',
  SESSIONS: 'studymate_sessions',
  THEME: 'studymate_theme',
  USER: 'studymate_user',
  EXAMS: 'studymate_exams',
  TIMER_SETTINGS: 'studymate_timer_settings',
  SCREENSHOT_PREFERENCE: 'studymate_screenshot_preference',
};

export const load = async (key, fallback = []) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.log('load error', e);
    return fallback;
  }
};

export const save = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log('save error', e);
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (e) {
    console.log('clear error', e);
  }
};
 