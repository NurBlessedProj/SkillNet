"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../layout";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import MobileNavbar from "@/components/MobileNavbar";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocale } from "next-intl";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { success, error: showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showError(t("ResetPassword.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      success(t("ResetPassword.successMessage"));

      // Use client-side navigation instead of direct URL change
      router.push(`/${locale}/auth`);
    } catch (error: any) {
      showError(error.message || t("ResetPassword.errorMessage"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Mobile Navbar */}
      <MobileNavbar />

      {/* Main Container */}
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 md:pt-0">
        {/* Left Side - Reset Password Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-16 py-8">
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Welcome Text */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("ResetPassword.title")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Create a new secure password for your account
              </p>
            </div>

            {/* Reset Password Form */}
            <div className="p-4 sm:p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    {t("ResetPassword.newPasswordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
                      placeholder={t("ResetPassword.newPasswordPlaceholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    {t("ResetPassword.confirmPasswordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
                      placeholder={t(
                        "ResetPassword.confirmPasswordPlaceholder"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="text-white">
                        {t("ResetPassword.updatePassword")}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side - Decorative Content */}
        <div className="hidden md:flex md:w-1/2 lg:w-1/2 relative bg-emerald-600">
          {/* Language Selector - Top Right */}
          <div className="absolute top-8 right-8 z-20">
            <LanguageSelector variant="transparent" />
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 bg-emerald-700 opacity-10"></div>

          {/* Decorative Elements */}
          <div className="absolute inset-0">
            {/* Geometric Shapes */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-emerald-500 opacity-20 rounded-full"></div>
            <div className="absolute bottom-32 left-16 w-24 h-24 bg-emerald-400 opacity-30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-300 opacity-25 rounded-full"></div>
          </div>

          {/* Decorative Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 rounded-full blur-3xl"></div>
            {/* Professional recruitment image */}
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Professional recruitment"
                className="w-full h-full object-cover rounded-2xl"
                style={{
                  filter: "brightness(0.7) contrast(1.3) saturate(1.1)",
                }}
                onError={(e) => {
                  // Fallback to a different image if the first one fails
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/50 to-emerald-800/70 rounded-2xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-6 md:px-8 lg:px-12 text-white">
            <div className="max-w-sm md:max-w-md">
              {/* Logo */}
              <div className="flex justify-center mb-6 md:mb-8">
                <img
                  src="/skillnet_logo.png"
                  className="h-16 md:h-20 w-auto"
                  alt={t("Auth.logoAlt")}
                />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                Set New Password
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-emerald-100 mb-6 md:mb-8 leading-relaxed">
                Create a strong, secure password to protect your account and
                data.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    Strong Password Security
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    Account Protection
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    Secure Access Control
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    Data Privacy Assurance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
