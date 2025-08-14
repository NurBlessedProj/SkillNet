"use client";
import { useContext, useEffect, useState } from "react";
import { ContextData } from "@/components/context";
import { useRouter, usePathname } from "next/navigation";
import { AuthUser } from "@/app/apis/auth/islogin";
import CryptoJS from "crypto-js";
import { useTranslations } from "next-intl";
import {
  BookOpenIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  EyeIcon,
  UserIcon,
  UserCircleIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { LayoutDashboardIcon } from "lucide-react";

const SidebarsExpenses = () => {
  const context = useContext(ContextData);
  const router = useRouter();
  const pathname = usePathname();
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("");
  const [currentLocale, setCurrentLocale] = useState("en");
  const auth: any = AuthUser();

  // Get translations
  const t = useTranslations("Navigation");

  // Get user display text based on role with translations
  const getRoleDisplayText = (role: string) => {
    if (role === "admin") return t("roles.recruiter");
    if (role === "user") return t("roles.candidate");
    if (role === "s_admin") return t("roles.admin");
    if (role === "examiner") return t("roles.examiner");
    return t("roles.guest");
  };

  const displayText = getRoleDisplayText(role);

  useEffect(() => {
    const encryptedProfile = localStorage.getItem("userProfile");

    if (encryptedProfile) {
      const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
      const decryptedProfile = bytes.toString(CryptoJS.enc.Utf8);

      if (decryptedProfile) {
        try {
          if (
            !["s_admin", "admin", "user", "examiner"].includes(decryptedProfile)
          ) {
            router.push("/auth");
            return;
          }
          setRole(decryptedProfile);
        } catch (error) {
          console.error("Error parsing user profile:", error);
          router.push("/auth");
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (!role) return;

    const string = window.location.href;
    const split = string.split("/");

    // Get the locale and the actual route
    const locale = split[3] || "";
    const currentUrl = split[4] || "";

    setCurrentLocale(locale);
    setUrl(currentUrl);

    if (
      role === "user" &&
      currentUrl && // Only check if there's a route (not on homepage)
      !["course", "questions", "profile", "viewJobs", "jobs", "test"].includes(
        currentUrl
      )
    ) {
      router.push("/404");
    } else if (
      role === "admin" &&
      currentUrl && // Only check if there's a route
      ![
        "profile",
        "candidates",
        "jobs",
        "profile_recruiter",
        "evaluation_check",
      ].includes(currentUrl)
    ) {
      router.push("/404");
    } else if (
      role === "s_admin" &&
      currentUrl && // Only check if there's a route
      ![
        "dashboard",
        "course",
        "QuizQuetions",
        "jobs",
        "candidates",
        "questions",
        "evaluation_check",
        "examiners",
      ].includes(currentUrl)
    ) {
      router.push("/404");
    } else if (
      role === "examiner" &&
      currentUrl && // Only check if there's a route
      !["evaluation_check"].includes(currentUrl)
    ) {
      router.push("/404");
    }
  }, [router, role, pathname]);

  // Function to create menu item path
  const createMenuItemPath = (route: string) => {
    return `/${currentLocale}/${route}`;
  };

  // Navigation items configuration
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: t("routes.dashboard"),
        href: "dashboard",
        icon: ChartBarIcon,
        active: url === "dashboard" || url === undefined,
        roles: ["s_admin"],
      },
      {
        name: t("routes.QuizQuetions"),
        href: "QuizQuetions",
        icon: QuestionMarkCircleIcon,
        active: url === "QuizQuetions",
        roles: ["s_admin"],
      },
      {
        name: t("routes.jobs"),
        href: "jobs",
        icon: BriefcaseIcon,
        active: url === "jobs",
        roles: ["s_admin", "admin"],
      },
      {
        name: t("routes.candidates"),
        href: "candidates",
        icon: UserIcon,
        active: url === "candidates",
        roles: ["s_admin", "admin"],
      },
      {
        name: t("routes.evaluation_check"),
        href: "evaluation_check",
        icon: ClipboardDocumentCheckIcon,
        active: url === "evaluation_check",
        roles: ["s_admin", "examiner"],
      },
      {
        name: t("routes.examiners"),
        href: "examiners",
        icon: EyeIcon,
        active: url === "examiners",
        roles: ["s_admin"],
      },
      {
        name: t("routes.test"),
        href: "test",
        icon: LayoutDashboardIcon,
        active: url === "test",
        roles: ["user"],
      },
      {
        name: t("routes.viewJobs"),
        href: "viewJobs",
        icon: ViewColumnsIcon,
        active: url === "viewJobs",
        roles: ["user"],
      },
      {
        name: t("routes.profile"),
        href: "profile",
        icon: UserCircleIcon,
        active: url === "profile",
        roles: ["user"],
      },
      {
        name: t("routes.profile_recruiter"),
        href: "profile_recruiter",
        icon: UserCircleIcon,
        active: url === "profile_recruiter",
        roles: ["admin"],
      },
    ];

    return baseItems.filter((item) => item.roles.includes(role));
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile overlay */}
      {context?.mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => context?.setMobileMenuOpen?.(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-xl transition-all duration-300 ease-in-out z-40 flex flex-col ${
          context?.toggle ? "w-16" : "w-64"
        } ${
          context?.mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-start border-b border-emerald-500/20 flex-shrink-0">
          <div className="flex items-start">
            {context?.toggle ? (
              <div className="w-fit h-14 flex items-center justify-center ">
                <img
                  src="/logo_small.png"
                  className="h w-auto mx-auto"
                  alt="SkillNet Logo"
                />
              </div>
            ) : (
              <img
                src="/logo_side.png"
                className="h-20 w-auto "
                alt="SkillNet Logo"
              />
            )}
          </div>
        </div>

        {/* Navigation - Takes up remaining space */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(createMenuItemPath(item.href))}
                className={`group flex items-center w-full px-3 py-3 text-sm font-medium transition-all duration-200 ease-in-out ${
                  item.active
                    ? "bg-white/20 text-white shadow-lg border-l-4 border-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${context?.toggle ? "justify-center" : "justify-start"}`}
              >
                <Icon
                  className={`flex-shrink-0 h-5 w-5 transition-all duration-200 ${
                    item.active
                      ? "text-white"
                      : "text-white/80 group-hover:text-white"
                  }`}
                  aria-hidden="true"
                />
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    context?.toggle
                      ? "w-0 opacity-0"
                      : "w-auto opacity-100 ml-3"
                  }`}
                >
                  <span className="whitespace-nowrap">{item.name}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section - Fixed at bottom */}
        <div className="border-t border-emerald-500/20 p-4 flex-shrink-0">
          <div
            className={`flex items-center ${
              context?.toggle ? "justify-center" : "space-x-3"
            }`}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`flex flex-col min-w-0 flex-1 overflow-hidden transition-all duration-200 ease-in-out ${
                context?.toggle ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <h3 className="text-sm font-medium text-white truncate">
                {displayText}
              </h3>
              <span className="text-xs text-white/70 truncate">
                {auth.user?.email || t("user.noEmail")}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarsExpenses;
