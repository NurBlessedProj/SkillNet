"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/modal";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation"; // Import router

interface DeleteModalProps {
  id: string;
  email?: string;
  tableName: string;
  itemName?: string;
  onDelete?: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  id,
  email,
  tableName,
  itemName = "item",
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations(); // Initialize translation hook
  const router = useRouter(); // Use Next.js router

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Special handling for examiners table
      if (tableName === "examiners") {
        // Check if the examiner has any review assignments
        const { data: reviewAssignments, error: checkError } = await supabase
          .from("review_assignments")
          .select("id")
          .eq("examiner_id", id)
          .limit(1);

        if (checkError) throw checkError;

        // If examiner has review assignments, mark them as inactive instead of deleting
        if (reviewAssignments && reviewAssignments.length > 0) {
          // Get the user_id from the examiners table
          const { data: examinerData, error: examinerError } = await supabase
            .from("examiners")
            .select("user_id")
            .eq("id", id)
            .single();

          if (examinerError) throw examinerError;

          // Update examiner status to inactive
          const { error: updateExaminerError } = await supabase
            .from("examiners")
            .update({ status: "inactive" })
            .eq("id", id);

          if (updateExaminerError) throw updateExaminerError;

          // Update profile to inactive if user_id exists
          if (examinerData?.user_id) {
            const { error: updateProfileError } = await supabase
              .from("profiles")
              .update({ active: false })
              .eq("id", examinerData.user_id);

            if (updateProfileError) throw updateProfileError;
          }

          toast.success(t("Examiners.deactivateSuccess"));

          // Close the modal
          setOpen(false);

          // Call the onDelete callback if provided
          if (onDelete) {
            onDelete();
          }

          return;
        }
      }

      // For other tables or examiners without assignments, proceed with default deletion
      if (email && tableName !== "examiners") {
        // Delete from profiles_data if email is provided and not an examiner
        const { error: profileError } = await supabase
          .from("profiles_data")
          .delete()
          .eq("email", email);

        if (profileError) throw profileError;

        // Delete from answers if email is provided and not an examiner
        const { error: answersError } = await supabase
          .from("answers")
          .delete()
          .eq("email", email);

        if (answersError) throw answersError;
      }

      // For examiners table, handle deletion with user_id update
      if (tableName === "examiners") {
        // Get the user_id from the examiners table
        const { data: examinerData, error: examinerError } = await supabase
          .from("examiners")
          .select("user_id")
          .eq("id", id)
          .single();

        if (examinerError) throw examinerError;

        // Delete from examiners table
        const { error: deleteExaminerError } = await supabase
          .from("examiners")
          .delete()
          .eq("id", id);

        if (deleteExaminerError) throw deleteExaminerError;

        // Update profile to inactive if user_id exists
        if (examinerData?.user_id) {
          const { error: updateProfileError } = await supabase
            .from("profiles")
            .update({ active: false })
            .eq("id", examinerData.user_id);

          if (updateProfileError) throw updateProfileError;
        }
      }

      toast.success(`${itemName} deleted successfully`);

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      }

      // Close the modal
      setOpen(false);

      // Refresh the current route without a full page reload
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(`Failed to delete ${itemName}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
      >
        <Trash2 className="h-5 w-5" />
      </button>

      <Modal
        open={open}
        setOpen={setOpen}
        title={`Delete ${itemName}`}
        variant="danger"
        width="sm"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            {`Are you sure you want to delete this ${itemName}? This action cannot be undone.`}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeleteModal;
