// No auth system exists yet, so the app runs as a single mock current user
// rather than simulating multiple logins. "Oversight" vs "My queue" and the
// sidebar identity are both derived from this one constant.
export const CURRENT_USER = { name: 'M. Reyes', role: 'Certified coder' };

export const ASSIGNEE_ROLES = {
  'M. Reyes': 'Certified coder · CPC',
  'J. Whitcombe': 'Certified coder · CPC',
  'D. Marsh': 'Data analyst',
};
