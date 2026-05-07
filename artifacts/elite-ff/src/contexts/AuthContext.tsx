import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser, useClerk } from "@clerk/react";

export interface User {
  id: number;
  username: string;
  role: "host" | "player";
  isHost: boolean;
  email?: string | null;
  profileImageUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  accounts: { username: string; role: "host" | "player" }[];
  login: () => void;
  logout: () => void;
  addAccount: () => void;
  switchAccount: (_username: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accounts: [],
  login: () => {},
  logout: () => {},
  addAccount: () => {},
  switchAccount: () => {},
});

const HOST_EMAILS = ["venomx2424@gmail.com", "knightxvenom@gmail.com"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [dbUser, setDbUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      return;
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;

    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data) {
          setDbUser({
            id: data.id,
            username: data.username,
            role: data.role === "host" ? "host" : "player",
            isHost: data.role === "host",
            email: data.email ?? email,
            profileImageUrl: clerkUser.imageUrl ?? null,
          });
        } else {
          const isHost = email ? HOST_EMAILS.includes(email.toLowerCase()) : false;
          setDbUser({
            id: 0,
            username: clerkUser.fullName || clerkUser.username || email?.split("@")[0] || "Player",
            role: isHost ? "host" : "player",
            isHost,
            email,
            profileImageUrl: clerkUser.imageUrl ?? null,
          });
        }
      })
      .catch(() => {
        const isHost = email ? HOST_EMAILS.includes(email.toLowerCase()) : false;
        setDbUser({
          id: 0,
          username: clerkUser.fullName || clerkUser.username || email?.split("@")[0] || "Player",
          role: isHost ? "host" : "player",
          isHost,
          email,
          profileImageUrl: clerkUser.imageUrl ?? null,
        });
      });
  }, [isLoaded, isSignedIn, clerkUser]);

  function login() {
    clerk.openSignIn();
  }

  function logout() {
    clerk.signOut();
    setDbUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user: dbUser,
      accounts: dbUser ? [{ username: dbUser.username, role: dbUser.role }] : [],
      login,
      logout,
      addAccount: login,
      switchAccount: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
