import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "participant" | "organizer" | "admin";

export const DEFAULT_HOME_PATH = "/";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({ role: "participant", setRole: () => {} });

export const useRole = () => useContext(RoleContext);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>("participant");
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};
