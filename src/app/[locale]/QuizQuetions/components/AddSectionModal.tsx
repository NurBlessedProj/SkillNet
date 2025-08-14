"use client";
import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { PlusCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl"; // Add this import

const AddSectionModal = ({
  onSectionAdded,
}: {
  onSectionAdded: () => void;
}) => {
  const t = useTranslations(); // Initialize the translation hook
  const [isOpen, setIsOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First, check if a section with the same name already exists
      const { data: existingSection, error: checkError } = await supabase
        .from("section")
        .select("id")
        .eq("name", sectionName)
        .limit(1);

      if (checkError) throw checkError;

      // If a section with the same name exists, show an error
      if (existingSection && existingSection.length > 0) {
        setError(
          t("Quiz.addSection.duplicateNameError") ||
            "A section with this name already exists"
        );
        setLoading(false);
        return;
      }

      // Insert the new section
      const { data, error } = await supabase.from("section").insert([
        {
          name: sectionName,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSectionName("");
      setIsOpen(false);
      onSectionAdded(); // Refresh the sections list
    } catch (err: any) {
      setError(err.message);
      console.error("Error adding section:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        title={t("Quiz.addSection.buttonTitle")}
      >
        <PlusCircle className="w-5 h-5" />
      </button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsOpen(false)}
        >
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
                      {t("Quiz.addSection.title")}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label
                        htmlFor="sectionName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {t("Quiz.addSection.sectionNameLabel")}
                      </label>
                      <input
                        type="text"
                        id="sectionName"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        placeholder={t(
                          "Quiz.addSection.sectionNamePlaceholder"
                        )}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-colors"
                      >
                        {t("Quiz.common.cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white transition-colors ${
                          loading
                            ? "bg-emerald-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {loading
                          ? t("Quiz.common.adding")
                          : t("Quiz.addSection.addButton")}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default AddSectionModal;
