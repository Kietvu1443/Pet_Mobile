import viCommon from './locales/vi/common';
import viTabs from './locales/vi/tabs';
import viSettings from './locales/vi/settings';
import viProfile from './locales/vi/profile';
import viAuth from './locales/vi/auth';
import viHousing from './locales/vi/housing';
import viRole from './locales/vi/role';
import viFavorites from './locales/vi/favorites';
import viLostPets from './locales/vi/lostPets';
import viLegal from './locales/vi/legal';

import enCommon from './locales/en/common';
import enTabs from './locales/en/tabs';
import enSettings from './locales/en/settings';
import enProfile from './locales/en/profile';
import enAuth from './locales/en/auth';
import enHousing from './locales/en/housing';
import enRole from './locales/en/role';
import enFavorites from './locales/en/favorites';
import enLostPets from './locales/en/lostPets';
import enLegal from './locales/en/legal';

export const resources = {
  vi: {
    common: viCommon,
    tabs: viTabs,
    settings: viSettings,
    profile: viProfile,
    auth: viAuth,
    housing: viHousing,
    role: viRole,
    favorites: viFavorites,
    lostPets: viLostPets,
    legal: viLegal,
  },
  en: {
    common: enCommon,
    tabs: enTabs,
    settings: enSettings,
    profile: enProfile,
    auth: enAuth,
    housing: enHousing,
    role: enRole,
    favorites: enFavorites,
    lostPets: enLostPets,
    legal: enLegal,
  },
} as const;
