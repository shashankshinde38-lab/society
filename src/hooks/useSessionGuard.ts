"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DataStorage } from "@/services/dataStorage";
import { AdminUser } from "@/types/database.types";
import { toast } from "sonner";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const ACTIVITY_THROTTLE_MS = 60 * 1000; // Send heartbeat at most once per 60 seconds

export function useSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);

  // Perform secure client logout and redirect
  const handleClientLogout = useCallback(
    async (reason: "idle" | "expired" | "manual" = "expired") => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      try {
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch {
        // Continue even if network error
      }

      DataStorage.setCurrentUser(null);
      setCurrentUser(null);
      setUserEmail(null);

      const targetUrl = `/login?reason=${reason}&redirect=${encodeURIComponent(pathname || "/dashboard")}`;
      window.location.href = targetUrl;
    },
    [pathname]
  );

  // Check server session state
  const verifySessionWithServer = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        handleClientLogout("expired");
        return false;
      }

      const data = await res.json();
      if (!data.authenticated || !data.user) {
        handleClientLogout("expired");
        return false;
      }

      // Synchronize active user profile
      const email = data.user.email.toLowerCase();
      const registeredUsers = DataStorage.getUsers();
      const foundUser = registeredUsers.find((u) => u.email.toLowerCase() === email);

      const matchedUser: AdminUser = foundUser || {
        id: data.user.userId || "usr-" + Date.now(),
        name: data.user.email.split("@")[0],
        email: data.user.email,
        role_id: data.user.roleId || "role-super-admin",
        role_name: data.user.roleName || "Super Admin",
        status: "ACTIVE",
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      DataStorage.setCurrentUser(matchedUser);
      setCurrentUser(matchedUser);
      setUserEmail(matchedUser.email);
      setIsVerifying(false);
      return true;
    } catch {
      // Network hiccup - if already verified once, allow retry; otherwise logout
      if (isVerifying) {
        handleClientLogout("expired");
      }
      return false;
    }
  }, [handleClientLogout, isVerifying]);

  // Reset idle timer and send throttled heartbeat to server
  const registerUserActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Throttle heartbeat calls to server (maximum once per minute)
    if (now - lastHeartbeatRef.current > ACTIVITY_THROTTLE_MS) {
      lastHeartbeatRef.current = now;
      fetch("/api/auth/session", { method: "GET" }).catch(() => {});
    }

    // Reset idle timeout timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      toast.error("Session expired due to 30 minutes of inactivity. Please log in again.");
      handleClientLogout("idle");
    }, IDLE_TIMEOUT_MS);
  }, [handleClientLogout]);

  // 1. Initial verification on mount
  useEffect(() => {
    verifySessionWithServer();
  }, [verifySessionWithServer]);

  // 2. Setup user activity listeners (mouse, keys, scroll, touch)
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const onActivity = () => registerUserActivity();

    events.forEach((evt) => {
      window.addEventListener(evt, onActivity, { passive: true });
    });

    // Start initial idle timer
    registerUserActivity();

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, onActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [registerUserActivity]);

  // 3. Tab Visibility & Focus: Check session whenever returning to tab or waking machine
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeElapsed = Date.now() - lastActivityRef.current;
        if (timeElapsed > IDLE_TIMEOUT_MS) {
          toast.error("Session expired while you were away.");
          handleClientLogout("idle");
        } else {
          verifySessionWithServer();
        }
      }
    };

    const onFocus = () => {
      verifySessionWithServer();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [handleClientLogout, verifySessionWithServer]);

  // 4. Cross-tab logout synchronization (via StorageEvent)
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes("current_user") && !e.newValue) {
        handleClientLogout("manual");
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
    };
  }, [handleClientLogout]);

  return {
    isVerifying,
    currentUser,
    userEmail,
    handleClientLogout,
  };
}
