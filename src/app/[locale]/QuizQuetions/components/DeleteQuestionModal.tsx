"use client";
import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

interface DeleteQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    Serial: string;
    Question: string;
  };
  onDelete: () => void;
}

const DeleteQuestionModal: React.FC<DeleteQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
  onDelete,
}) => {
  const t = useTranslations(); // Initialize translation hook
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("Serial", question.Serial);

      if (error) throw error;

      toast.success(t("deleteQuestionModal.toast.success"));
      onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message);
      toast.error(t("deleteQuestionModal.toast.error", { error: err.message }));
      console.error(t("deleteQuestionModal.logs.error"), err);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("deleteQuestionModal.title")}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-2">
                        {t("deleteQuestionModal.confirmation.prompt")}
                      </p>
                      <p className="text-sm italic line-clamp-3">
                        "{question.Question}"
                      </p>
                      <p className="text-xs mt-2">
                        {t("deleteQuestionModal.confirmation.warning")}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={loading}
                  >
                    {t("deleteQuestionModal.buttons.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-colors
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
                        {t("deleteQuestionModal.buttons.deleting")}
                      </>
                    ) : (
                      t("deleteQuestionModal.buttons.delete")
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

export default DeleteQuestionModal;
