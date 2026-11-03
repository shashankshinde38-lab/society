"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setAdminSession } from "@/features/auth/authActions";
import { DataStorage } from "@/services/dataStorage";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const emailTrimmed = data.email.trim().toLowerCase();

      // 1. Check registered Admin Users from DataStorage
      const registeredUsers = DataStorage.getUsers();
      const matchedUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === emailTrimmed
      );

      if (matchedUser) {
        if (matchedUser.status === "INACTIVE") {
          toast.error("This account has been deactivated. Please contact your administrator.");
          setLoading(false);
          return;
        }
        // Match user's stored password (or initial default admin@123 if untouched)
        const validPassword = matchedUser.password || "admin@123";
        if (data.password === validPassword) {
          DataStorage.updateUser(matchedUser.id, {
            last_login: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          });
          DataStorage.setCurrentUser(matchedUser);
          await setAdminSession(matchedUser.email);
          toast.success(`Welcome, ${matchedUser.name}!`);
          router.push("/dashboard");
          router.refresh();
          return;
        } else {
          toast.error("Invalid email or password. Please try again.");
          setLoading(false);
          return;
        }
      }

      // 2. Check default master admin fallback credentials
      if (emailTrimmed === "admin@gmail.com" && data.password === "admin@123") {
        await setAdminSession("admin@gmail.com");
        toast.success("Welcome, Administrator! Redirecting to dashboard...");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // 3. Supabase Auth fallback verification
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      if (authData?.user) {
        await setAdminSession(authData.user.email || data.email);
        toast.success("Welcome back! Redirecting to dashboard...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div
        className="card border-0 shadow-lg overflow-hidden"
        style={{ maxWidth: "1000px", width: "100%", borderRadius: "20px" }}
      >
        <div className="row g-0">
          {/* Left Branding Hero */}
          <div
            className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative"
            style={{
              background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)",
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div
                  className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "42px", height: "42px" }}
                >
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">Parijat Society</h4>
                  <span className="small text-light opacity-75">Management ERP</span>
                </div>
              </div>

              <h2 className="fw-extrabold mb-3" style={{ fontSize: "1.75rem", lineHeight: 1.25 }}>
                Professional Society Management & Accounting
              </h2>
              <p className="text-light opacity-75 small">
                Complete financial tracking, automated maintenance dues, real-time wallet ledger, and resident records.
              </p>
            </div>

            <div className="pt-4 border-top border-light border-opacity-25">
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Atomic advance and maintenance calculations</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Instant receipt generation & email notifications</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Secured with Supabase Row Level Security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="col-12 col-lg-7 p-4 p-sm-5 bg-white">
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 d-lg-none mb-3">
                <div
                  className="bg-primary text-white p-2 rounded-2 d-flex align-items-center justify-content-center"
                  style={{ width: "36px", height: "36px" }}
                >
                  <Building2 size={20} />
                </div>
                <span className="fw-bold text-dark fs-5">Parijat Society</span>
              </div>
              <h3 className="fw-bold text-dark mb-1">Admin Sign In</h3>
              <p className="text-secondary small">
                Enter your administrative credentials to manage society records
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Mail size={17} className="text-secondary" />
                  </span>
                  <input
                    type="email"
                    {...register("email")}
                    className={`form-control border-start-0 ps-0 ${errors.email ? "is-invalid" : ""
                      }`}
                    placeholder="name@parijatsociety.org"
                    disabled={loading}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email.message}</div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-secondary mb-0">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="small text-primary text-decoration-none fw-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={17} className="text-secondary" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`form-control border-start-0 border-end-0 ps-0 ${errors.password ? "is-invalid" : ""
                      }`}
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div className="d-flex align-items-center mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    {...register("rememberMe")}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="rememberMe">
                    Remember me on this browser
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary-custom w-100 justify-content-center py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-top text-center">
              <span className="text-secondary small">
                {/* Society Setup & Configuration:{" "} */}
                {/* <Link href="/app-setup" className="text-primary fw-semibold text-decoration-none">
                  App Setup Page
                </Link> */}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
