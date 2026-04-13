export const NAVTALK_AVATARS = {
  ethan:  { id: 'navtalk.Ethan',  name: 'Ethan' },
  leo:    { id: 'navtalk.Leo',    name: 'Leo' },
  lily:   { id: 'navtalk.Lily',   name: 'Lily' },
  emma:   { id: 'navtalk.Emma',   name: 'Emma' },
  sophia: { id: 'navtalk.Sophia',  name: 'Sophia' },
  mia:    { id: 'navtalk.Mia',    name: 'Mia' },
  chloe:  { id: 'navtalk.Chloe',  name: 'Chloe' },
  zoe:    { id: 'navtalk.Zoe',    name: 'Zoe' },
  ava:    { id: 'navtalk.Ava',    name: 'Ava' },
} as const;

export type AvatarId = typeof NAVTALK_AVATARS[keyof typeof NAVTALK_AVATARS]['id'];

export const JOB_AVATAR_MAP: Record<string, AvatarId> = {
  JAVA_BACKEND:       'navtalk.Ethan',
  WEB_FRONTEND:       'navtalk.Zoe',
  PYTHON_ALGORITHM:   'navtalk.Sophia',
};

export function getAvatarImageUrl(avatarId: AvatarId): string {
  return `https://api.navtalk.ai/uploadFiles/${avatarId}.png`;
}
