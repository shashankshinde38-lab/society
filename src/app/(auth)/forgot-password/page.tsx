"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setSentEmail(data.email);
      setSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link");
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
          <h3 className="fw-bold text-dark mb-1">Reset Password</h3>
          <p className="text-secondary small">
            Enter your registered admin email to receive password recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-3">
            <div
              className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: "60px", height: "60px" }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h5 className="fw-bold text-dark mb-2">Check Your Email</h5>
            <p className="text-secondary small mb-4">
              We have sent a secure recovery link to <strong>{sentEmail}</strong>. Click the link in
              the email to create a new password.
            </p>
            <Link href="/login" className="btn btn-outline-secondary w-100 py-2">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">
                Registered Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Mail size={17} className="text-secondary" />
                </span>
                <input
                  type="email"
                  {...register("email")}
                  className={`form-control border-start-0 ps-0 ${
                    errors.email ? "is-invalid" : ""
                  }`}
                  placeholder="admin@parijatsociety.org"
                  disabled={loading}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
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
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Recovery Instructions</span>
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="small text-secondary text-decoration-none d-inline-flex align-items-center gap-1"
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
