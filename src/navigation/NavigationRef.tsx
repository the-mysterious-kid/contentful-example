import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList } from '../types/navigationtypes';

export const navigationRef =
    createRef<NavigationContainerRef<RootStackParamList>>();

export function navigateTo(name: string, params?: object) {
    if (navigationRef.current) {
        navigationRef.current.navigate(name, params);
    }
}