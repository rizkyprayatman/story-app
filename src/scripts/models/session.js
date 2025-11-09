export function getToken() {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  } catch (e) {
    return null;
  }
}

export function getUserId() {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
  } catch (e) {
    return null;
  }
}

export function getName() {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem('name') : null;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('userId');
      window.localStorage.removeItem('name');
    }
  } catch (e) {}
}
