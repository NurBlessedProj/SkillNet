"use client";
import React, { useState } from "react";
import { LogoutUser } from "../../../apis/auth/logout";
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const Logout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const User = LogoutUser();
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const handleLogout = async () => {
    try {
      await User.Logout();
      router.push(`/${locale}`);
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Modern Logout Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md"
        title={t("Logout.logout")}
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
        <span className="hidden lg:block text-sm font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {t("Logout.logout")}
        </span>
      </button>

      {/* Enhanced Modal */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          {/* Modal Content */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t("Logout.confirmLogout")}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-lg opacity-60"></div>
                        <div className="relative p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-full border border-red-200 dark:border-red-700">
                          <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <Dialog.Description className="text-center text-gray-600 dark:text-gray-300 leading-relaxed">
                      {t("Logout.confirmMessage")}
                    </Dialog.Description>

                    {/* Warning */}
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {t("Logout.warningMessage") ||
                          "Any unsaved changes will be lost."}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 font-medium"
                    >
                      {t("Logout.cancel")}
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={User.loading}
                      className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 font-medium shadow-lg hover:shadow-xl"
                    >
                      {User.loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>{t("Logout.loggingOut")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>{t("Logout.logout")}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Logout;
