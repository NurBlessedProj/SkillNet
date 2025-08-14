import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const FacialRegistration = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const save = async (images: string[], descriptors: Float32Array[]) => {
    setLoading(true);

    try {
      // Get the current user's session
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.error("No user session found");
        setLoading(false);
        return;
      }

      // Use the user's email as username
      const email = session.session.user.email;
      if (!email) {
        console.error("Email not found in session");
        setLoading(false);
        return;
      }

      // Convert Float32Array descriptors to regular arrays for storage
      const descriptorArrays = descriptors.map((d) => Array.from(d));

      // Save the first image as profile photo and all descriptors to Supabase
      const { data, error } = await supabase.from("face_recognition").insert({
        user_email: email,
        face_descriptors: descriptorArrays,
        profile_image: images[0], // Store the first image as the profile image
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Update the user's profile to mark face as registered
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          face_registered: true,
          active: true, // Update active status to true
        })
        .eq("email", email);

      if (updateError) {
        throw updateError;
      }

      console.log("Face data saved to Supabase");
      return data;
    } catch (error: any) {
      console.error("Error saving face data to Supabase:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, save };
};
