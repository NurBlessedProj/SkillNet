"use client";
import { ReactNode, useState, FC, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Pencil } from "lucide-react";

interface props {
  children: ReactNode;
  edit: string;
  isOpen?: boolean;
  onClose?: () => void;
  hideButton?: boolean; // Add this prop to optionally hide the button
  title?: string; // Optional custom title
}

const Slider: FC<props> = ({
  children,
  edit,
  isOpen,
  onClose,
  hideButton = false, // Default to showing the button
  title,
}) => {
  const [localOpen, setLocalOpen] = useState(false);

  // Use either controlled (isOpen) or uncontrolled (localOpen) state
  const open = isOpen !== undefined ? isOpen : localOpen;
  const handleClose = onClose || (() => setLocalOpen(false));

  // Use custom title if provided, otherwise use the edit prop
  const displayTitle = title || edit;

  return (
    <div>
      {/* Only render the button if hideButton is false */}
      {!hideButton && (
        <div>
          {edit === "Upload Questions" && (
            <button
              className="text-white px-4 space-x-2 flex items-center py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              onClick={() => setLocalOpen(true)}
            >
              <i className="ri-upload-cloud-line mr-2" />
              <span>Bulk Upload</span>
            </button>
          )}
          {edit === "Télécharger des questions" && (
            <button
              className="text-white px-4 space-x-2 flex items-center py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              onClick={() => setLocalOpen(true)}
            >
              <i className="ri-upload-cloud-line mr-2" />
              <span>Téléchargement en masse</span>
            </button>
          )}
          {edit === "New Question" && (
            <button
              className="text-white px-4 space-x-2 flex items-center py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              onClick={() => setLocalOpen(true)}
            >
              <i className="ri-add-line mr-2" />
              <span>New Question</span>
            </button>
          )}
          {edit === "Nouvelle question" && (
            <button
              className="text-white px-4 space-x-2 flex items-center py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              onClick={() => setLocalOpen(true)}
            >
              <i className="ri-add-line mr-2" />
              <span>Nouvelle question</span>
            </button>
          )}
          {edit === "Update Question" && (
            <button
              className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
              onClick={() => setLocalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {edit === "Modifier la Question" && (
            <button
              className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
              onClick={() => setLocalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-5xl">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                          {displayTitle}
                        </Dialog.Title>
                        <button
                          type="button"
                          onClick={handleClose}
                          className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="relative flex-1 px-6 py-6 overflow-y-auto">
                        {children}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default Slider;
