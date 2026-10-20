// Light theme — soft, friendly, student-friendly palette
export const lightColors = {
  primary: '#A78BFA',      // soft lavender
  background: '#FBFAF7',   // warm cream
  card: '#F3F0FA',         // pale lavender card
  text: '#2A2A35',         // deep charcoal
  muted: '#8B8B9A',        // grey-purple
  border: '#E8E5F2',       // very light lavender border
  danger: '#F27A7D',       // soft coral red
  success: '#7FBF8F',      // sage green
  priority: {
    low: '#7FBF8F',        // sage
    medium: '#F2B87A',     // warm amber
    high: '#F27A7D',       // soft coral
  },
};

// Dark theme — comfortable at night, same accents
export const darkColors = {
  primary: '#B5A0F5',      // slightly brighter lavender
  background: '#15141B',   // deep plum-black
  card: '#211F2B',         // dark plum card
  text: '#F2F0F7',         // off-white
  muted: '#8B8B9A',
  border: '#2E2C3A',
  danger: '#F58A8D',
  success: '#8FCF9F',
  priority: {
    low: '#8FCF9F',
    medium: '#F5C68A',
    high: '#F58A8D',
  },
};

// Default export for any file still importing `colors` directly
export const colors = lightColors; 