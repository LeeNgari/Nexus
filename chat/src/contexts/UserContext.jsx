import { createContext, useContext } from "react";

// Create a context for the user
export const UserContext = createContext(null);

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);
