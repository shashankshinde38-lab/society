"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div
        className="card border-0 shadow-lg p-4 p-sm-5 bg-white"
        style={{ maxWidth: "480px", width: "100%", borderRadius: "20px" }}
      >
        <div className="text-center mb-4">
          <div
            className="bg-primary text-white p-2 rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: "48px", height: "48px" }}
          >
            <Building2 size={26} />
          </div>
          <h3 className="fw-bold text-dark mb-1">Set New Password</h3>
          <p className="text-secondary small">
            Please enter and confirm your new administrator password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">
              New Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Lock size={17} className="text-secondary" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={`form-control border-start-0 border-end-0 ps-0 ${
                  errors.password ? "is-invalid" : ""
                }`}
                placeholder="Enter new password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-group-text bg-light border-start-0 text-secondary"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
              {errors.password && (
                <div className="invalid-feedback">{errors.password.message}</div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">
              Confirm New Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Lock size={17} className="text-secondary" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={`form-control border-start-0 ps-0 ${
                  errors.confirmPassword ? "is-invalid" : ""
                }`}
                placeholder="Repeat new password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword.message}</div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 justify-content-center py-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save New Password</span>
              </>
            )}
          </button>

          <div className="text-center">
            <Link href="/login" className="small text-secondary text-decoration-none">
              Cancel and return to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
