import type { EditAccountMode } from './editAccountModes';

export const mapActionToMode = (label: string): EditAccountMode | null => {
  switch (label) {
    case 'Edit photo':
      return 'avatar';
    case 'Change username':
      return 'username';
    case 'Change email':
      return 'login';
    case 'Change password':
      return 'password';
    default:
      return null;
  }
};
