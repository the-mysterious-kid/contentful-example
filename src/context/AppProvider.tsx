import React, { useState } from 'react'
import { AppContext } from './AppContext'
import i18n from './Language/i18n';

const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<string>(i18n.language)
    const handleChangeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setLanguage(lng);
    };
    return (
        <AppContext.Provider value={{ language, handleChangeLanguage }}>
            {children}
        </AppContext.Provider>
    )
}

export { AppProvider }