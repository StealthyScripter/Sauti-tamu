import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Mobile phone dimensions
const MOBILE_MAX_WIDTH = 430;
const MOBILE_MAX_HEIGHT = 932;

// Actual container dimensions
const containerWidth = Math.min(screenWidth, MOBILE_MAX_WIDTH);
const containerHeight = Math.min(screenHeight, MOBILE_MAX_HEIGHT);

export const mobileStyles = StyleSheet.create({
  // MAIN CONTAINERS - Responsive width and height
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: 'center',
    width: containerWidth,
    minHeight: '100%',
  },

  containerWithSafeArea: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100, // Space for tab bar
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: 'center',
    width: containerWidth,
    minHeight: '100%',
  },

  callContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    paddingHorizontal: 20,
    paddingVertical: 40,
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: 'center',
    width: containerWidth,
    minHeight: containerHeight,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    maxWidth: MOBILE_MAX_WIDTH,
    alignSelf: 'center',
    width: containerWidth,
    minHeight: '100%',
  },

  // CARDS & LISTS
  card: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },

  // BUTTONS - Responsive sizing
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    marginVertical: 12,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: Math.min(containerHeight * 0.052, 48),
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: Math.min(containerHeight * 0.052, 48),
  },

  callButton: {
    backgroundColor: '#00ff88',
    paddingVertical: Math.min(containerHeight * 0.017, 16),
    paddingHorizontal: Math.min(containerWidth * 0.11, 48),
    borderRadius: 40,
    marginTop: Math.min(containerHeight * 0.021, 20),
    minWidth: Math.min(containerWidth * 0.28, 120),
    minHeight: Math.min(containerHeight * 0.06, 56),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  endCallButton: {
    width: Math.min(containerWidth * 0.186, 80),
    height: Math.min(containerWidth * 0.186, 80),
    borderRadius: Math.min(containerWidth * 0.093, 40),
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Math.min(containerHeight * 0.021, 20),
  },

  // AVATARS - Responsive to both width and height
  avatarLarge: {
    width: Math.min(containerWidth * 0.28, containerHeight * 0.129, 120),
    height: Math.min(containerWidth * 0.28, containerHeight * 0.129, 120),
    borderRadius: Math.min(containerWidth * 0.14, containerHeight * 0.065, 60),
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Math.min(containerHeight * 0.021, 20),
  },

  avatarMedium: {
    width: Math.min(containerWidth * 0.19, containerHeight * 0.086, 80),
    height: Math.min(containerWidth * 0.19, containerHeight * 0.086, 80),
    borderRadius: Math.min(containerWidth * 0.095, containerHeight * 0.043, 40),
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Math.min(containerHeight * 0.017, 16),
  },

  avatarSmall: {
    width: Math.min(containerWidth * 0.11, containerHeight * 0.051, 48),
    height: Math.min(containerWidth * 0.11, containerHeight * 0.051, 48),
    borderRadius: Math.min(containerWidth * 0.055, containerHeight * 0.026, 24),
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: Math.min(containerWidth * 0.042, containerHeight * 0.019, 18),
  },

  avatarTextLarge: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: Math.min(containerWidth * 0.084, containerHeight * 0.039, 36),
  },

  // FORMS
  formGroup: {
    marginBottom: Math.min(containerHeight * 0.017, 16),
    width: '100%',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    padding: Math.min(containerHeight * 0.017, 16),
    borderRadius: 8,
    fontSize: Math.min(containerWidth * 0.037, containerHeight * 0.017, 16),
    minHeight: Math.min(containerHeight * 0.052, 48),
    width: '100%',
  },

  label: {
    color: '#00ff88',
    marginBottom: 4,
    fontWeight: '500',
    fontSize: Math.min(containerWidth * 0.033, containerHeight * 0.015, 14),
  },

  // DISPLAY
  numberDisplay: {
    marginVertical: Math.min(containerHeight * 0.021, 20),
    padding: Math.min(containerHeight * 0.021, 20),
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    width: '100%',
    minHeight: Math.min(containerHeight * 0.086, 80),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // SETTINGS
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: Math.min(containerHeight * 0.017, 16),
    borderRadius: 12,
    marginBottom: 12,
    minHeight: Math.min(containerHeight * 0.064, 60),
    width: '100%',
  },

  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: Math.min(containerHeight * 0.017, 16),
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
  },

  // KEYPAD - Always 3 columns, responsive sizing
  keypad: {
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: Math.min(containerHeight * 0.021, 20),
  },

  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: Math.min(containerHeight * 0.009, 8),
    width: '100%',
  },

  keypadButton: {
    width: Math.min((containerWidth - 80) / 3.5, (containerHeight - 200) / 8, 85),
    height: Math.min((containerWidth - 80) / 3.5, (containerHeight - 200) / 8, 85),
    backgroundColor: '#1a1a2e',
    borderRadius: Math.min((containerWidth - 80) / 7, (containerHeight - 200) / 16, 42.5),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 60,
  },

  // CALL CONTROLS
  callControlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: Math.min(containerHeight * 0.021, 20),
    gap: Math.min(containerWidth * 0.047, 20),
    width: '100%',
  },

  callControlButton: {
    width: Math.min(containerWidth * 0.149, containerHeight * 0.069, 64),
    height: Math.min(containerWidth * 0.149, containerHeight * 0.069, 64),
    borderRadius: Math.min(containerWidth * 0.074, containerHeight * 0.034, 32),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // TEXT STYLES - Responsive to container dimensions
  header: {
    color: '#fff',
    fontSize: Math.min(containerWidth * 0.056, containerHeight * 0.026, 24),
    fontWeight: 'bold',
    marginBottom: Math.min(containerHeight * 0.017, 16),
  },

  title: {
    color: '#fff',
    fontSize: Math.min(containerWidth * 0.075, containerHeight * 0.034, 32),
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#00ff88',
    fontSize: Math.min(containerWidth * 0.035, containerHeight * 0.017, 16),
    textAlign: 'center',
  },

  bodyText: {
    color: '#fff',
    fontSize: Math.min(containerWidth * 0.042, containerHeight * 0.019, 18),
  },

  bodyTextBold: {
    color: '#fff',
    fontSize: Math.min(containerWidth * 0.042, containerHeight * 0.019, 18),
    fontWeight: '600',
  },

  smallText: {
    color: '#ccc',
    fontSize: Math.min(containerWidth * 0.028, containerHeight * 0.013, 12),
  },

  numberText: {
    color: '#fff',
    fontSize: Math.min(containerWidth * 0.055, containerHeight * 0.026, 24),
    textAlign: 'center',
  },

  keyText: {
    color: '#fff',
    fontSize: Math.min(containerWidth * 0.055, containerHeight * 0.026, 24),
    fontWeight: '600',
  },

  keyLetters: {
    color: '#888',
    fontSize: Math.min(containerWidth * 0.025, containerHeight * 0.011, 10),
    marginTop: 2,
    textAlign: 'center',
  },

  greenText: {
    color: '#00ff88',
    fontSize: Math.min(containerWidth * 0.033, containerHeight * 0.015, 14),
  },

  greenTextLarge: {
    color: '#00ff88',
    fontSize: Math.min(containerWidth * 0.056, containerHeight * 0.026, 24),
    fontWeight: '700',
  },

  whiteText: {
    color: '#fff',
  },

  deleteButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },

  deleteText: {
    color: '#00ff88',
    fontSize: Math.min(containerWidth * 0.047, containerHeight * 0.021, 20),
  },

  // CARDS WITH SPECIFIC STYLES
  infoCard: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    padding: Math.min(containerHeight * 0.017, 16),
    borderRadius: 12,
    marginVertical: Math.min(containerHeight * 0.017, 16),
    borderWidth: 1,
    borderColor: '#00ff88',
    width: '100%',
  },

  // SECTION STYLES
  section: {
    marginTop: Math.min(containerHeight * 0.026, 24),
  },

  sectionTitle: {
    color: '#00ff88',
    fontSize: Math.min(containerWidth * 0.033, containerHeight * 0.015, 14),
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // VERSION TEXT
  versionText: {
    color: '#666',
    fontSize: Math.min(containerWidth * 0.028, containerHeight * 0.013, 12),
    textAlign: 'center',
    marginTop: Math.min(containerHeight * 0.026, 24),
  },
});

export default mobileStyles;