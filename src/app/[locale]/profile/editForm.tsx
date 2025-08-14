"use client";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/lib/supabase";
import CreatableSelect from "react-select/creatable";
import Loader from "@/components/spinnerLoade";
import { Camera, Upload, ArrowLeft, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ContextData } from "@/components/context";
import { getCountries, LocationOption } from "@/components/LocationUstils";

interface EditFormProps {
  setIsEditing: (value: boolean) => void;
}

interface ProfileData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  country_of_birth?: string;
  gender?: string;
  languages?: string[];
  about?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  current_job?: string;
  years_of_experience?: string | number;
  highest_qualification?: string;
  qualification_details?: {
    qualification_type?: string;
    qualification_details?: any;
  };
  skills?: string[];
  image_url?: string;
  resume_url?: string;
  email?: string;
}

const EditForm = () => {
  const t = useTranslations("Profile.Candidate");

  const {
    control,
    handleSubmit,
    setValue,
    register,
    watch,
    formState: { errors },
  }: any = useForm();
  const [file, setFile] = useState(null);
  const [image, setImage] = useState<any | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitText, setSubmitText] = useState(t("editButton"));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();

  const [countries, setCountries] = useState<LocationOption[]>([]);
  useEffect(() => {
    setCountries(getCountries());
  }, []);
  const context = useContext(ContextData);

  const [customSkills, setCustomSkills] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Custom styles for react-select
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? "#10b981" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(16, 185, 129, 0.5)" : "none",
      borderRadius: "0.75rem",
      backgroundColor: "#ffffff",
      minHeight: "48px",
      "&:hover": {
        borderColor: "#10b981",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#10b981"
        : state.isFocused
        ? "#d1fae5"
        : "white",
      color: state.isSelected ? "white" : "#374151",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "0.75rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    }),
  };

  const inputClasses =
    "mt-2 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400";
  const labelClasses =
    "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";
  const errorClasses =
    "mt-1 text-sm text-red-600 dark:text-red-400 font-medium";
  const selectClasses =
    "mt-2 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition-colors duration-200";

  // Add this state for managing A-Level subjects
  const [aLevelSubjects, setALevelSubjects] = useState([
    { subject: "", grade: "" },
  ]);

  // Add this function to handle adding more subjects
  const addSubject = () => {
    setALevelSubjects([...aLevelSubjects, { subject: "", grade: "" }]);
  };

  // Add this function to handle removing subjects
  const removeSubject = (index: number) => {
    const updatedSubjects = aLevelSubjects.filter((_, i) => i !== index);
    setALevelSubjects(updatedSubjects);
  };

  useEffect(() => {
    const checkUserProfile = async () => {
      const { data, error }: any = await supabase.auth.getSession();
      if (data) {
        const email = data.session.user?.email;
        if (email) {
          setUserEmail(email);
          const { data, error } = await supabase
            .from("profiles_data")
            .select("*")
            .eq("email", email)
            .single();

          if (data) {
            setUserData(data);
            setValue("firstname", data.first_name);
            setValue("lastname", data.last_name);
            setValue("phone", data.phone_number);
            setValue("dob", data.date_of_birth);
            setValue("gender", data.gender);
            setValue("country_of_birth", data.country_of_birth);

            // Handle languages as array
            if (data.languages && Array.isArray(data.languages)) {
              setValue(
                "languages",
                data.languages.map((lang: string) => ({
                  value: lang,
                  label: lang,
                }))
              );
            } else if (data.language) {
              // For backward compatibility with old data structure
              setValue("languages", [
                { value: data.language, label: data.language },
              ]);
            }

            setValue("instagram", data.instagram);
            setValue("twitter", data.twitter);
            setValue("website", data.website);
            setValue("address", data.address);
            setValue("about", data.about);
            setValue(
              "skills",
              data.skills
                ? Array.isArray(data.skills)
                  ? data.skills.map((skill: any) => ({
                      value: skill,
                      label: skill,
                    }))
                  : []
                : []
            );
            setValue("qualification", data.highest_qualification);
            if (
              data.qualification_details?.qualification_type ===
              "Advanced Level"
            ) {
              const subjects =
                data.qualification_details.qualification_details.subjects || [];
              setALevelSubjects(subjects);
            }
            setValue("current_job", data.current_job);
            setValue("experience", data.years_of_experience);
            setImagePreview(data.image_url);
          }
        }
      }
      setLoading(false);
    };

    checkUserProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    if (!file) return null;
    const filePath = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("skillnet")
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("skillnet").getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setSubmitText("Updating...");
      setUploadError(null);

      // Prepare qualification details based on the selected type
      let qualificationDetails = {
        qualification_type: data.qualification,
        qualification_details: null as any,
      };
      switch (data.qualification) {
        case "Advanced Level":
          qualificationDetails = {
            qualification_type: "Advanced Level",
            qualification_details: {
              subjects: aLevelSubjects.filter(
                (subject) => subject.subject && subject.grade
              ),
            },
          };
          break;
        case "Higher National Diploma":
          qualificationDetails.qualification_details = {
            field: data.hnd?.field,
            specialization: data.hnd?.specialization,
            grade: data.hnd?.grade,
          };
          break;
        case "Bachelor's Degree":
          qualificationDetails.qualification_details = {
            title: data.bachelor?.title,
            institution: data.bachelor?.institution,
            grade: data.bachelor?.grade,
          };
          break;
        case "Master's Degree":
          qualificationDetails.qualification_details = {
            title: data.masters?.title,
            institution: data.masters?.institution,
            thesis: data.masters?.thesis,
            grade: data.masters?.grade,
          };
          break;
        case "PhD Degree":
          qualificationDetails.qualification_details = {
            field: data.phd?.field,
            institution: data.phd?.institution,
            thesis: data.phd?.thesis,
            summary: data.phd?.summary,
          };
          break;
      }

      let resumeUrl = null;
      let imageUrl = null;

      if (file) {
        try {
          resumeUrl = await uploadFile(file as unknown as File, "resumes");
        } catch (error: any) {
          throw new Error(`Resume upload failed: ${error.message}`);
        }
      }

      if (image) {
        try {
          imageUrl = await uploadFile(image as unknown as File, "images");
        } catch (error: any) {
          throw new Error(`Image upload failed: ${error.message}`);
        }
      }

      // Prepare update data
      const updateData = {
        first_name: data.firstname,
        last_name: data.lastname,
        phone_number: data.phone,
        date_of_birth: data.dob,
        country_of_birth: data.country_of_birth?.value || data.country_of_birth,
        gender: data.gender?.value || data.gender,
        // Update to use languages array
        languages: data.languages?.map((lang: any) => lang.value) || [],
        instagram: data.instagram,
        twitter: data.twitter,
        website: data.website,
        address: data.address,
        about: data.about,
        skills: data.skills?.map((skill: any) => skill.value) || [],
        highest_qualification: data.qualification,
        qualification_details: qualificationDetails,
        current_job: data.current_job,
        years_of_experience: data.experience?.value || data.experience,
        resume_url: resumeUrl || userData?.resume_url,
        image_url: imageUrl || userData?.image_url,
        email: userEmail,
      };

      // Update or insert profile data
      const { data: existingProfile } = await supabase
        .from("profiles_data")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (!existingProfile) {
        // Insert new profile
        const { error: insertError } = await supabase
          .from("profiles_data")
          .insert([updateData]);

        if (insertError) throw insertError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles_data")
          .update(updateData)
          .eq("email", userEmail);

        if (updateError) throw updateError;
      }

      router.refresh();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setUploadError(error.message);
    } finally {
      setIsSubmitting(false);
      setSubmitText(t("editButton"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-transparent border-t-gray-300 rounded-full animate-spin animate-delay-150"></div>
            </div>
          </div>
          <div className="text-gray-600 dark:text-gray-400">{t("loading")}</div>
        </div>
      </div>
    );
  }

  // Language options for the select component
  const languageOptions = [
    { value: "English", label: "English" },
    { value: "French", label: "French" },
    { value: "Spanish", label: "Spanish" },
    { value: "German", label: "German" },
    { value: "Chinese", label: "Chinese" },
    { value: "Arabic", label: "Arabic" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Russian", label: "Russian" },
    { value: "Japanese", label: "Japanese" },
    { value: "Hindi", label: "Hindi" },
    { value: "Swahili", label: "Swahili" },
  ];

  return (
    <div
      className={`min-h-screen h-screen bg-gradient-to-br from-emerald-50 pb-20 to-white dark:from-gray-900 dark:to-gray-800 overflow-y-auto ${
        context?.toggle ? "pl-16" : ""
      }`}
    >
      <div className=" mx-auto px-6 py-12 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => window.history.back()}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t("editButton")}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          {/* Profile Image Upload */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Profile Photo
            </h3>
            <div className="flex items-center space-x-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-gray-700 dark:to-gray-600 shadow-lg">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-emerald-500" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors duration-200 shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </label>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Upload a professional photo
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Make your profile stand out with a professional photo
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>{t("fields.firstName")}</label>
                <input
                  type="text"
                  {...register("firstname", {
                    required: "First name is required",
                  })}
                  className={inputClasses}
                  placeholder="Enter your first name"
                />
                {errors.firstname && (
                  <p className={errorClasses}>
                    {errors.firstname.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClasses}>{t("fields.lastName")}</label>
                <input
                  type="text"
                  {...register("lastname", {
                    required: "Last name is required",
                  })}
                  className={inputClasses}
                  placeholder="Enter your last name"
                />
                {errors.lastname && (
                  <p className={errorClasses}>
                    {errors.lastname.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClasses}>
                  {t("fields.phoneNumber")}
                </label>
                <input
                  type="tel"
                  {...register("phone", {
                    required: "Phone number is required",
                  })}
                  className={inputClasses}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className={errorClasses}>
                    {errors.phone.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClasses}>
                  {t("fields.dateOfBirth")}
                </label>
                <input
                  type="date"
                  {...register("dob", {
                    required: "Date of birth is required",
                  })}
                  className={inputClasses}
                />
                {errors.dob && (
                  <p className={errorClasses}>{errors.dob.message as string}</p>
                )}
              </div>

              <div>
                <label className={labelClasses}>
                  {t("fields.countryOfBirth")}
                </label>
                <Controller
                  name="country_of_birth"
                  control={control}
                  rules={{ required: "Country of birth is required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={countries}
                      styles={selectStyles}
                      className="mt-1"
                      placeholder="Select Country"
                      isClearable
                    />
                  )}
                />
                {errors.country_of_birth && (
                  <p className={errorClasses}>
                    {errors.country_of_birth.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClasses}>{t("fields.gender")}</label>
                <Controller
                  name="gender"
                  control={control}
                  rules={{ required: "Gender is required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "female", label: "Female" },
                        { value: "male", label: "Male" },
                      ]}
                      styles={selectStyles}
                      className="mt-1"
                      placeholder="Select Gender"
                    />
                  )}
                />
                {errors.gender && (
                  <p className={errorClasses}>
                    {errors.gender.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className={labelClasses}>{t("fields.languages")}</label>
              <Controller
                name="languages"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti={true}
                    options={languageOptions}
                    styles={selectStyles}
                    className="mt-1"
                    placeholder="Select languages"
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("fields.languagesDescription")}
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              About
            </h3>
            <label className={labelClasses}>{t("fields.about")}</label>
            <textarea
              {...register("about")}
              rows={4}
              className={inputClasses}
              placeholder={t("fields.aboutPlaceholder")}
            />
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Social Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClasses}>{t("fields.instagram")}</label>
                <input
                  type="url"
                  {...register("instagram")}
                  className={inputClasses}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <label className={labelClasses}>{t("fields.twitter")}</label>
                <input
                  type="url"
                  {...register("twitter")}
                  className={inputClasses}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label className={labelClasses}>{t("fields.website")}</label>
                <input
                  type="url"
                  {...register("website")}
                  className={inputClasses}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>{t("fields.currentJob")}</label>
                <input
                  type="text"
                  {...register("current_job")}
                  className={inputClasses}
                  placeholder={t("fields.currentJobPlaceholder")}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  {t("fields.yearsOfExperience")}
                </label>
                <Controller
                  name="experience"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        ...Array(10)
                          .fill(0)
                          .map((_, i) => ({
                            value: String(i + 1),
                            label: `${i + 1} year${i !== 0 ? "s" : ""}`,
                          })),
                        { value: "+10", label: "+10 years" },
                      ]}
                      styles={selectStyles}
                      className="mt-1"
                      placeholder={t("fields.yearsOfExperiencePlaceholder")}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Qualifications & Skills */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Qualifications & Skills
            </h3>
            <div className="space-y-6">
              <div>
                <label className={labelClasses}>
                  {t("qualifications.title")}
                </label>
                <Controller
                  name="qualification"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <Select
                      {...field}
                      value={qualificationOptions.find(
                        (option) => option.value === value
                      )}
                      onChange={(selectedOption) =>
                        onChange(selectedOption?.value)
                      }
                      options={qualificationOptions}
                      className={selectClasses}
                      styles={selectStyles}
                      placeholder="Select Qualification"
                      isClearable
                    />
                  )}
                />
              </div>

              {/* Qualification Details */}
              {watch("qualification") === "Advanced Level" && (
                <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {t("qualifications.advancedLevel.title")}
                    </h4>
                    <button
                      type="button"
                      onClick={addSubject}
                      className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Add Subject
                    </button>
                  </div>

                  {aLevelSubjects.map((subject, index) => (
                    <div
                      key={index}
                      className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClasses}>Subject</label>
                            <input
                              type="text"
                              value={subject.subject}
                              onChange={(e) => {
                                const newSubjects = [...aLevelSubjects];
                                newSubjects[index].subject = e.target.value;
                                setALevelSubjects(newSubjects);
                              }}
                              className={inputClasses}
                              placeholder="Enter subject name"
                            />
                          </div>
                          <div>
                            <label className={labelClasses}>
                              {t("qualifications.advancedLevel.grade")}
                            </label>
                            <select
                              value={subject.grade}
                              onChange={(e) => {
                                const newSubjects = [...aLevelSubjects];
                                newSubjects[index].grade = e.target.value;
                                setALevelSubjects(newSubjects);
                              }}
                              className={selectClasses}
                            >
                              <option value="">Select Grade</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                            </select>
                          </div>
                        </div>
                        {aLevelSubjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubject(index)}
                            className="ml-4 p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other qualification types would go here */}
              {/* ... existing qualification detail sections ... */}

              <div>
                <label className={labelClasses}>{t("fields.skills")}</label>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      {...field}
                      isMulti={true}
                      options={[
                        ...customSkills,
                        { value: "React", label: "React" },
                        { value: "Node.js", label: "Node.js" },
                        { value: "Tailwind CSS", label: "Tailwind CSS" },
                        { value: "Next.js", label: "Next.js" },
                        { value: "JavaScript", label: "JavaScript" },
                      ]}
                      styles={selectStyles}
                      className="mt-1"
                      placeholder="Type a skill and press Enter"
                      onChange={(newValue) => {
                        field.onChange(newValue);
                      }}
                      formatCreateLabel={(inputValue: string) =>
                        `Add "${inputValue}"`
                      }
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Resume
            </h3>
            <label className={labelClasses}>{t("resume.title")}</label>
            <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-12 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors duration-200">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label className="relative cursor-pointer rounded-lg bg-white dark:bg-gray-800 font-semibold text-emerald-600 dark:text-emerald-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 hover:text-emerald-500 dark:hover:text-emerald-300">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e: any) => setFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                  PDF, DOC up to 10MB
                </p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {(file as any).name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2
    ${
      isSubmitting
        ? "bg-gray-400 cursor-not-allowed text-white"
        : "bg-emerald-600 hover:bg-emerald-700 text-white"
    }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{submitText}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error updating profile
                  </h3>
                  <div className="mt-2 text-sm text-red-700">{uploadError}</div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditForm;

const qualificationOptions = [
  { value: "", label: "Select a qualification" },
  { value: "Advanced Level", label: "Advanced Level" },
  { value: "Higher National Diploma", label: "Higher National Diploma" },
  { value: "Bachelor's Degree", label: "Bachelor's Degree" },
  { value: "Master's Degree", label: "Master's Degree" },
  { value: "PhD Degree", label: "PhD Degree" },
];

const hndFieldOptions = [
  { value: "Engineering", label: "Engineering" },
  { value: "Business", label: "Business" },
  { value: "Computing", label: "Computing" },
  { value: "Science", label: "Science" },
  { value: "Arts", label: "Arts" },
];

const hndGradeOptions = [
  { value: "Distinction", label: "Distinction" },
  { value: "Merit", label: "Merit" },
  { value: "Pass", label: "Pass" },
];

const gradeOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
];
