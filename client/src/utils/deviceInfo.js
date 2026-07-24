// Auto-detect device type, browser, OS, and generate friendly alias

const ALIAS_ADJECTIVES = ['Quantum', 'Cyber', 'Neon', 'Cosmic', 'Solar', 'Hyper', 'Swift', 'Astra', 'Sonic', 'Starlight'];
const ALIAS_ANIMALS = ['Falcon', 'Phoenix', 'Otter', 'Panda', 'Lynx', 'Dolphin', 'Panther', 'Viper', 'Eagle', 'Cheetah'];

export function generatePeerName() {
  const adj = ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
  const animal = ALIAS_ANIMALS[Math.floor(Math.random() * ALIAS_ANIMALS.length)];
  return `${adj} ${animal}`;
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let deviceType = 'desktop';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

  if (/mobile|android|iphone|ipad/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet/i.test(ua)) {
    deviceType = 'tablet';
  }

  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  return {
    name: generatePeerName(),
    os,
    browser,
    deviceType,
    userAgent: ua
  };
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatTime(seconds) {
  if (!seconds || !isFinite(seconds) || seconds < 0) return 'calculating...';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
}
