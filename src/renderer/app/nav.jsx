import { createContext, useContext } from 'react';

// Navigation interne : route = { page, uid?, step?, scene? }
export const NavCtx = createContext(() => {});
export const useNav = () => useContext(NavCtx);

// Visites guidées : lancer une visite depuis n'importe quel écran.
export const TourCtx = createContext({ start: () => {}, active: null });
export const useTour = () => useContext(TourCtx);
