"use client";
import { useState } from "react";
import AuthLayout from "./layout";
import { LoginUser } from "@/app/apis/auth/loginUser";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import MobileNavbar from "@/components/MobileNavbar";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function Auth() {
  const { Login, loading, error } = LoginUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await Login(email, password);
  };

  return (
    <AuthLayout>
      {/* Mobile Navbar */}
      <MobileNavbar />

      {/* Main Container */}
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 md:pt-0">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-16 py-8">
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Welcome Text */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("Auth.welcomeBack")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {t("Auth.welcomeSubtitle")}
              </p>
            </div>

            {/* Login Form */}
            <div className="p-4 sm:p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    {t("Auth.emailLabel")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="block w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
                      placeholder={t("Auth.emailPlaceholder")}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    {t("Auth.passwordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="block w-full pl-10 pr-12 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
                      placeholder={t("Auth.passwordPlaceholder")}
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

                {/* Forgot Password Link */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/${locale}/auth/forgot-password`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    {t("Auth.forgotPassword")}
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="animate-spin  rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="text-white">{t("Auth.signIn")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm text-center">
                      {t("Auth.error", { error })}
                    </p>
                  </div>
                )}

                {/* Register Links */}
                <div className="text-center space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {t("Auth.noAccount")}{" "}
                    <Link
                      href={`/${locale}/auth/register-candidate`}
                      className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                      {t("Auth.registerAsCandidate")}
                    </Link>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {t("Auth.areRecruiter")}{" "}
                    <Link
                      href={`/${locale}/auth/register-recruiter`}
                      className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                      {t("Auth.registerAsRecruiter")}
                    </Link>
                  </p>
                </div>
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
              <div className="flex justify-start ">
                <img
                  src="/logo_side.png"
                  className="h-20 md:h-20 w-auto"
                  alt={t("Auth.logoAlt")}
                />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                {t("Auth.welcomeToSkillNet")}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-emerald-100 mb-6 md:mb-8 leading-relaxed">
                {t("Auth.welcomeDescription")}
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    {t("Auth.featureRealTimeRecognition")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    {t("Auth.featureAutomatedProctoring")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    {t("Auth.featureIntelligentAssessment")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-300 rounded-full"></div>
                  <span className="text-sm md:text-base text-emerald-100">
                    {t("Auth.featureAnalyticsDashboard")}
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
