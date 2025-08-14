"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Slider from "@/components/slideOver";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { fetchSectionData } from "@/app/apis/getData/getSectionData";

interface Examiner {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  created_at: string;
  last_login: string | null;
  assignedTests: number;
  completedReviews: number;
  disciplines?: string[];
  subcategories?: string[];
}

interface AddExaminerSliderProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  examiner: Examiner | null;
  onSave: () => void;
}

const AddExaminerSlider: React.FC<AddExaminerSliderProps> = ({
  isOpen,
  onClose,
  mode,
  examiner,
  onSave,
}) => {
  const t = useTranslations("Examiners");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "active" as "active" | "inactive",
    sendInvite: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch disciplines (sections) on component mount
  useEffect(() => {
    const getSectionData = async () => {
      try {
        const data = await fetchSectionData();
        if (data && data.length > 0) {
          const formattedData = data.map((item) => ({
            label: item.name,
            value: item.name,
          }));
          setDisciplines(formattedData);
        } else {
          setError(t("errors.noDisciplines"));
        }
      } catch (err) {
        setError(t("errors.fetchingData"));
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    getSectionData();
  }, [t]);

  // Fetch subcategories when disciplines change
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedDisciplines.length === 0) {
        setAvailableSubcategories([]);
        return;
      }

      try {
        // For each selected discipline, fetch subcategories
        const subcategoriesPromises = selectedDisciplines.map(
          async (discipline) => {
            const { data, error } = await supabase
              .from("questions")
              .select("sub_category")
              .eq("Function", discipline)
              .not("sub_category", "is", null);

            if (error) throw error;

            // Get unique subcategories
            const uniqueSubcategories = [
              ...new Set(data.map((item) => item.sub_category)),
            ];
            return uniqueSubcategories.map((subcat) => ({
              label: subcat,
              value: subcat,
              discipline: discipline,
            }));
          }
        );

        const subcategoriesResults = await Promise.all(subcategoriesPromises);
        const allSubcategories = subcategoriesResults.flat();

        setAvailableSubcategories(allSubcategories);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        setError(t("errors.fetchSubcategories"));
      }
    };

    fetchSubcategories();
  }, [selectedDisciplines, t]);

  // Initialize form when examiner data changes
  useEffect(() => {
    if (mode === "edit" && examiner) {
      setFormData({
        name: examiner.name,
        email: examiner.email,
        password: "",
        confirmPassword: "",
        status: examiner.status,
        sendInvite: false,
      });

      // Set selected disciplines and subcategories if available
      if (examiner.disciplines) {
        setSelectedDisciplines(examiner.disciplines);
      }

      if (examiner.subcategories) {
        setSelectedSubcategories(examiner.subcategories);
      }
    } else {
      // Reset form for add mode
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        status: "active",
        sendInvite: true,
      });
      setSelectedDisciplines([]);
      setSelectedSubcategories([]);
    }
  }, [mode, examiner, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      status: e.target.value as "active" | "inactive",
    });
  };

  const handleDisciplineChange = (discipline: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedDisciplines([...selectedDisciplines, discipline]);
    } else {
      setSelectedDisciplines(
        selectedDisciplines.filter((d) => d !== discipline)
      );

      // Remove any subcategories associated with this discipline
      const disciplineSubcats = availableSubcategories
        .filter((subcat) => subcat.discipline === discipline)
        .map((subcat) => subcat.value);

      setSelectedSubcategories(
        selectedSubcategories.filter(
          (subcat) => !disciplineSubcats.includes(subcat)
        )
      );
    }
  };

  const handleSubcategoryChange = (subcategory: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedSubcategories([...selectedSubcategories, subcategory]);
    } else {
      setSelectedSubcategories(
        selectedSubcategories.filter((s) => s !== subcategory)
      );
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email) {
      toast.error(t("form.requiredFields"));
      return false;
    }

    if (mode === "add") {
      if (!formData.password) {
        toast.error(t("form.passwordRequired"));
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error(t("form.passwordMismatch"));
        return false;
      }

      if (formData.password.length < 6) {
        toast.error(t("form.passwordTooShort"));
        return false;
      }
    }

    if (selectedDisciplines.length === 0) {
      toast.error(t("form.disciplineRequired"));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setProcessing(true);
    try {
      if (mode === "add") {
        // 1. Create user account with admin API to bypass email verification
        const { data: adminAuthData, error: adminAuthError } =
          await supabase.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true, // This automatically confirms the email
            user_metadata: {
              role: "examiner",
              name: formData.name,
            },
          });

        if (adminAuthError) {
          console.error("Admin auth error:", adminAuthError);

          // Fallback to regular signup if admin API fails (might not have admin rights)
          const { data: userData, error: userError } =
            await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                data: {
                  role: "examiner",
                  name: formData.name,
                },
              },
            });

          if (userError) throw userError;

          if (!userData.user?.id) {
            throw new Error("Failed to create user account");
          }

          // Manually confirm the user's email if possible
          try {
            await supabase.rpc("confirm_user_email", {
              user_id: userData.user.id,
            });
          } catch (confirmError) {
            console.warn("Could not auto-confirm email:", confirmError);
            // Continue anyway, we'll handle this with the invitation
          }

          var userId = userData.user.id;
        } else {
          var userId = adminAuthData.user.id;
        }

        // 2. Create profile entry with role "examiner"
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: userId,
            email: formData.email,
            role: "examiner",
            active: formData.status === "active",
            created_at: new Date().toISOString(),
            // Use the first selected discipline as the main section
            section:
              selectedDisciplines.length > 0 ? selectedDisciplines[0] : null,
            face_registered: false,
          },
        ]);

        if (profileError) {
          // If profile creation fails, we should clean up the auth user
          await supabase.auth.admin.deleteUser(userId);
          throw profileError;
        }

        // 3. Create examiner entry with disciplines and subcategories
        const { error: examinerError } = await supabase
          .from("examiners")
          .insert([
            {
              user_id: userId,
              name: formData.name,
              email: formData.email,
              status: formData.status,
              created_at: new Date().toISOString(),
              disciplines: selectedDisciplines,
              subcategories: selectedSubcategories,
              last_login: null,
            },
          ]);

        if (examinerError) {
          // If examiner creation fails, clean up both auth user and profile
          await supabase.auth.admin.deleteUser(userId);
          await supabase.from("profiles").delete().eq("id", userId);
          throw examinerError;
        }
        const currentDomain = window.location.origin;
        // If sendInvite is checked, send invitation email
        if (formData.sendInvite) {
          try {
            // Send invitation email using your existing email service
            await fetch("/api/send-invite", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: formData.email,
                role: "examiner",
                name: formData.name,
                disciplines: selectedDisciplines,
                subcategories: selectedSubcategories,
                currentDomain,
              }),
            });
          } catch (emailError) {
            console.error("Failed to send invitation email:", emailError);
            // Don't fail the whole operation if just the email fails
            toast.warning(t("inviteEmailFailed"));
          }
        }

        toast.success(t("addSuccess"));
      } else if (mode === "edit" && examiner) {
        // 1. Update examiner profile
        const { error: examinerError } = await supabase
          .from("examiners")
          .update({
            name: formData.name,
            status: formData.status,
            disciplines: selectedDisciplines,
            subcategories: selectedSubcategories,
            updated_at: new Date().toISOString(),
          })
          .eq("email", examiner.email);

        if (examinerError) throw examinerError;

        // 2. Update main profile status and section
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            active: formData.status === "active",
            section:
              selectedDisciplines.length > 0 ? selectedDisciplines[0] : null,
          })
          .eq("email", examiner.email);

        if (profileError) throw profileError;

        // 3. If password is provided, update password
        if (formData.password) {
          // Get the user ID first
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", examiner.email)
            .single();

          if (userError) throw userError;

          if (userData?.id) {
            const { error: passwordError } =
              await supabase.auth.admin.updateUserById(userData.id, {
                password: formData.password,
              });

            if (passwordError) throw passwordError;
          }
        }

        toast.success(t("updateSuccess"));
      }

      onSave();
    } catch (error: any) {
      console.error("Failed to save examiner:", error);
      toast.error(t("saveError", { error: error.message }));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Slider
      edit={mode === "add" ? t("slider.addTitle") : t("slider.editTitle")}
      isOpen={isOpen}
      onClose={onClose}
      hideButton={true}
    >
      <div className="mx-auto space-y-8">
        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              {t("form.name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t("form.namePlaceholder")}
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              {t("form.email")} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                mode === "edit" ? "bg-gray-100" : ""
              }`}
              placeholder={t("form.emailPlaceholder")}
              required
              disabled={mode === "edit"}
            />
            {mode === "edit" && (
              <p className="text-xs text-gray-500 mt-1">
                {t("form.emailNotEditable")}
              </p>
            )}
          </div>

          {/* Password Fields - show in add mode or optionally in edit mode */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                {t(mode === "add" ? "form.password" : "form.newPassword")}
                {mode === "add" && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t(
                    mode === "add"
                      ? "form.passwordPlaceholder"
                      : "form.newPasswordPlaceholder"
                  )}
                  required={mode === "add"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {mode === "edit" && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("form.leaveBlankPassword")}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                {t("form.confirmPassword")}
                {mode === "add" && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t("form.confirmPasswordPlaceholder")}
                  required={mode === "add"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              {t("form.status")}
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleStatusChange}
              className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>
          </div>

          {/* Send Invite Checkbox - only show in add mode */}
          {mode === "add" && (
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="sendInvite"
                name="sendInvite"
                checked={formData.sendInvite}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sendInvite" className="text-sm text-gray-700">
                {t("form.sendInvite")}
              </label>
            </div>
          )}
        </div>

        {/* Disciplines Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("form.assignDisciplines")}{" "}
            <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-600">{t("form.disciplinesInfo")}</p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {disciplines.map((discipline) => (
                <div
                  key={discipline.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id={`discipline-${discipline.value}`}
                    checked={selectedDisciplines.includes(discipline.value)}
                    onChange={(e) =>
                      handleDisciplineChange(discipline.value, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`discipline-${discipline.value}`}
                    className="text-sm text-gray-700"
                  >
                    {discipline.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subcategories Section - only show if disciplines are selected */}
        {selectedDisciplines.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {t("form.assignSubcategories")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("form.subcategoriesInfo")}
            </p>

            {availableSubcategories.length > 0 ? (
              <div className="space-y-4">
                {selectedDisciplines.map((discipline) => {
                  const disciplineSubcategories = availableSubcategories.filter(
                    (subcat) => subcat.discipline === discipline
                  );

                  return disciplineSubcategories.length > 0 ? (
                    <div key={discipline} className="border-t pt-3">
                      <h4 className="font-medium text-gray-700 mb-2">
                        {discipline}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {disciplineSubcategories.map((subcat) => (
                          <div
                            key={`${discipline}-${subcat.value}`}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`subcat-${subcat.value}`}
                              checked={selectedSubcategories.includes(
                                subcat.value
                              )}
                              onChange={(e) =>
                                handleSubcategoryChange(
                                  subcat.value,
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`subcat-${subcat.value}`}
                              className="text-sm text-gray-700"
                            >
                              {subcat.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                {t("form.noSubcategoriesAvailable")}
              </div>
            )}
          </div>
        )}

        {/* Permissions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("form.permissions")}
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">{t("form.permissionsInfo")}</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <span className="mr-2">•</span>
                {t("form.permissionReview")}
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                {t("form.permissionApprove")}
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                {t("form.permissionReject")}
              </li>
            </ul>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmit}
            disabled={processing}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200
              ${
                processing
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
              text-white shadow-sm
            `}
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("buttons.saving")}</span>
              </div>
            ) : (
              t("buttons.save")
            )}
          </button>
        </div>
      </div>
    </Slider>
  );
};

export default AddExaminerSlider;
