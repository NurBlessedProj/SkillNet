// components/ui/modal.tsx
"use client";

import React, { Fragment, ReactNode } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { X, Plus, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  title?: string;
  width?: "sm" | "md" | "lg" | "xl" | "full";
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
  variant?: "danger" | "default";
  trigger?: {
    type: "button" | "icon";
    label?: string;
    variant?: "primary" | "danger" | "ghost";
    icon?: "add" | "delete" | "logout";
  };
}

const Modal: React.FC<ModalProps> = ({
  open,
  setOpen,
  title,
  children,
  width = "md",
  variant = "default",
  trigger,
}) => {
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  const TriggerButton = () => {
    if (!trigger) return null;

    const iconMap = {
      add: Plus,
      delete: Trash2,
      logout: LogOut,
    };

    const Icon = trigger.icon ? iconMap[trigger.icon] : null;

    if (trigger.type === "icon") {
      return (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "p-2 rounded-full transition-colors",
            trigger.variant === "danger" && "text-red-600 hover:bg-red-50",
            trigger.variant === "primary" && "text-blue-600 hover:bg-blue-50",
            trigger.variant === "ghost" && "text-gray-600 hover:bg-gray-100"
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </button>
      );
    }

    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "px-4 py-2 rounded-md font-medium transition-colors",
          trigger.variant === "danger" &&
            "bg-red-600 text-white hover:bg-red-700",
          trigger.variant === "primary" &&
            "bg-blue-600 text-white hover:bg-blue-700",
          trigger.variant === "ghost" &&
            "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {trigger.label}
        </div>
      </button>
    );
  };

  return (
    <>
      <TriggerButton />

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className={cn(
                    "relative w-full transform rounded-lg bg-white shadow-xl transition-all",
                    widthClasses[width]
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4">{children}</div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default Modal;
