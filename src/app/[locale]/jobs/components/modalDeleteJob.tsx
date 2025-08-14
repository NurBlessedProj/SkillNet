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

const DeleteModalJob: React.FC<DeleteModalProps> = ({
  id,
  email,
  tableName,
  itemName = "item",
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter(); // Use Next.js router

  // Initialize translation hook - try without namespace first
  const t = useTranslations();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Delete from the specified table using id
      const { error } = await supabase.from(tableName).delete().eq("id", id);

      if (error) throw error;

      // Use simple strings for toast messages
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

export default DeleteModalJob;
