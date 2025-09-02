import { createContext } from "react";
import { AppContextType } from "../constants/utils";

export const AppContext = createContext<AppContextType | null>(null)