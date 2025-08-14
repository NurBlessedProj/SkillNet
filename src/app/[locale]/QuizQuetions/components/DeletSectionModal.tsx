"use client";
import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTranslations, useLocale } from "next-intl";

interface DeleteSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: {
    id: number;
    name: string;
  };
  onDelete: () => void;
}

const DeleteSectionModal: React.FC<DeleteSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  onDelete,
}) => {
  const t  = useTranslations(); // Initialize translation hook
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      // First, delete related questions
      const { error: questionsError } = await supabase
        .from("questions")
        .delete()
        .eq("Function", section.name);

      if (questionsError) throw questionsError;

      // Then delete the section
      const { error: sectionError } = await supabase
        .from("section")
        .delete()
        .eq("id", section.id);

      if (sectionError) throw sectionError;

      onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error(t("deleteSectionModal.logs.error"), err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {t("deleteSectionModal.title")}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-md mb-4">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">
                      {t("deleteSectionModal.warning.permanent")}
                      <span className="font-semibold"> {section.name} </span>
                      {t("deleteSectionModal.warning.andQuestions")}
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 rounded-md"
                    disabled={loading}
                  >
                    {t("deleteSectionModal.buttons.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2
                      ${
                        loading
                          ? "bg-red-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("deleteSectionModal.buttons.deleting")}
                      </>
                    ) : (
                      t("deleteSectionModal.buttons.delete")
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteSectionModal;
