"use client";
import { useState, useEffect, useContext } from "react";
import { supabase } from "@/lib/supabase";
import EditForm from "./editForm";
import Loader from "@/components/spinnerLoade";
import {
  Camera,
  Pencil,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ContextData } from "@/components/context";
import ProtectedRoute from "@/components/ProtectedRoute";

// Add this at the top of your file or in a separate utility file
const countryCodeToName: Record<string, string> = {
  AF: "Afghanistan",
  AL: "Albania",
  DZ: "Algeria",
  AD: "Andorra",
  AO: "Angola",
  AG: "Antigua and Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BT: "Bhutan",
  BO: "Bolivia",
  BA: "Bosnia and Herzegovina",
  BW: "Botswana",
  BR: "Brazil",
  BN: "Brunei",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  CV: "Cabo Verde",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "Congo, Democratic Republic of the",
  CR: "Costa Rica",
  CI: "Côte d'Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  ET: "Ethiopia",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GR: "Greece",
  GD: "Grenada",
  GT: "Guatemala",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HN: "Honduras",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KP: "North Korea",
  KR: "South Korea",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Laos",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MR: "Mauritania",
  MU: "Mauritius",
  MX: "Mexico",
  FM: "Micronesia",
  MD: "Moldova",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  MK: "North Macedonia",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  QA: "Qatar",
  RO: "Romania",
  RU: "Russia",
  RW: "Rwanda",
  KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia",
  VC: "Saint Vincent and the Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome and Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  SS: "South Sudan",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SZ: "Eswatini",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syria",
  TW: "Taiwan",
  TJ: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TO: "Tonga",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  TM: "Turkmenistan",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VA: "Vatican City",
  VE: "Venezuela",
  VN: "Vietnam",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

interface ProfileData {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  country_of_birth?: string;
  gender?: string;
  language?: string;
  languages?: string[];
  about?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  current_job?: string;
  years_of_experience?: string | number;
  highest_qualification?: string;
  qualification_details?: {
    qualification_type: string;
    qualification_details: {
      subjects?: Array<{ subject: string; grade: string }>;
      field?: string;
      specialization?: string;
      grade?: string;
      title?: string;
      institution?: string;
      thesis?: string;
      summary?: string;
    };
  };
  skills?: string[];
  image_url?: string;
  resume_url?: string;
  email?: string;
}

const ProfileDisplay = () => {
  const t = useTranslations("Profile.Candidate");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = useContext(ContextData);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        console.log("Fetching profile data...");

        // Get user session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Failed to get user session");
          return;
        }

        if (!sessionData?.session?.user) {
          console.error("No user found in session");
          setError("No user found in session");
          return;
        }

        const email = sessionData.session.user.email;
        console.log("User email:", email);

        if (!email) {
          console.error("User email is missing");
          setError("User email is missing");
          return;
        }

        // Fetch profile data
        const { data, error } = await supabase
          .from("profiles_data")
          .select("*")
          .eq("email", email)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);

          // If error is "No rows found", it means the profile doesn't exist yet
          if (error.code === "PGRST116") {
            console.log("No profile found, creating a new one");

            // Create a new profile record
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles_data")
              .insert([{ email }])
              .select();

            if (insertError) {
              console.error("Error creating profile:", insertError);
              setError("Failed to create profile");
              return;
            }

            // Set the newly created profile
            if (newProfile && newProfile.length > 0) {
              setProfileData({
                ...newProfile[0],
                skills: [],
                languages: [],
              });
              console.log("New profile created:", newProfile[0]);
            }
          } else {
            setError(`Error fetching profile: ${error.message}`);
          }
        } else {
          console.log("Profile data fetched successfully:", data);

          // Parse languages if it's a JSON string
          let parsedLanguages = [];
          if (data?.languages) {
            try {
              parsedLanguages =
                typeof data.languages === "string"
                  ? JSON.parse(data.languages)
                  : data.languages;
            } catch (e) {
              console.error("Error parsing languages:", e);
              parsedLanguages = [];
            }
          }

          setProfileData({
            ...data,
            skills: Array.isArray(data?.skills) ? data.skills : [],
            languages: parsedLanguages,
          });
        }
      } catch (error) {
        console.error("Unexpected error in fetchProfileData:", error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Then modify your renderProfileField function to handle country codes specially
  const renderProfileField = (
    value: any,
    defaultValue: string = t("notProvided")
  ) => {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }

    return value;
  };

  // Add a specific function for rendering country
  const renderCountryField = (
    countryCode: string,
    defaultValue: string = t("notProvided")
  ) => {
    if (!countryCode) {
      return defaultValue;
    }

    return countryCodeToName[countryCode] || countryCode;
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

  if (isEditing) {
    return <EditForm />;
  }

  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <div
        className={`min-h-screen h-screen bg-gradient-to-br from-emerald-50 pb-20 to-white dark:from-gray-900 dark:to-gray-800 overflow-y-auto ${
          context?.toggle ? "pl-16" : ""
        }`}
      >
        <div className="max-w- mx-auto px-6 py-12">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {t("title")}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Pencil className="w-4 h-4" />
                {t("editButton")}
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-gray-700 dark:to-gray-600 shadow-lg">
                  {profileData?.image_url ? (
                    <img
                      src={profileData.image_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileData?.first_name && profileData?.last_name
                    ? `${profileData.first_name} ${profileData.last_name}`
                    : "Complete your profile"}
                </h2>
                {profileData?.current_job && (
                  <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                    {profileData.current_job}
                  </p>
                )}
                {profileData?.about && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {profileData.about}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Personal Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t("fields.firstName")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.first_name || t("notProvided")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t("fields.lastName")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.last_name || t("notProvided")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t("fields.phoneNumber")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.phone_number || t("notProvided")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("fields.dateOfBirth")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.date_of_birth || t("notProvided")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t("fields.countryOfBirth")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {renderCountryField(profileData?.country_of_birth || "")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t("fields.gender")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.gender || t("notProvided")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {t("fields.languages")}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profileData?.languages &&
                  profileData.languages.length > 0 ? (
                    profileData.languages.map(
                      (language: string, index: number) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm font-medium"
                        >
                          {language}
                        </span>
                      )
                    )
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      {t("noLanguages")}
                    </p>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t("fields.currentJob")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.current_job || t("notProvided")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t("fields.yearsOfExperience")}
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profileData?.years_of_experience || t("notProvided")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {t("fields.skills")}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profileData?.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      {t("noSkills")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Qualifications & Social */}
            <div className="space-y-8">
              {/* Qualifications */}
              {profileData?.highest_qualification && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("qualifications.title")}
                  </h3>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                      {profileData.qualification_details?.qualification_type}
                    </h4>

                    {profileData.qualification_details?.qualification_type ===
                      "Advanced Level" && (
                      <div className="space-y-3">
                        {profileData.qualification_details.qualification_details.subjects?.map(
                          (subject, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {subject.subject}
                              </span>
                              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">
                                Grade {subject.grade}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {profileData.qualification_details?.qualification_type ===
                      "Higher National Diploma" && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Field:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.field
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Specialization:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.specialization
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Grade:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.grade
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {profileData.qualification_details?.qualification_type ===
                      "Bachelor's Degree" && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Degree:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.title
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Institution:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.institution
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Grade:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.grade
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {profileData.qualification_details?.qualification_type ===
                      "Master's Degree" && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Degree:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.title
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Institution:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.institution
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Thesis:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.thesis
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Grade:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.grade
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {profileData.qualification_details?.qualification_type ===
                      "PhD Degree" && (
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Field:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.field
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Institution:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.institution
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Thesis:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.thesis
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Summary:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {
                              profileData.qualification_details
                                .qualification_details.summary
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Social Links
                </h3>
                <div className="space-y-4">
                  {profileData?.instagram && (
                    <a
                      href={profileData.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">IG</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        Instagram
                      </span>
                    </a>
                  )}

                  {profileData?.twitter && (
                    <a
                      href={profileData.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">X</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        Twitter
                      </span>
                    </a>
                  )}

                  {profileData?.website && (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        Website
                      </span>
                    </a>
                  )}

                  {!profileData?.instagram &&
                    !profileData?.twitter &&
                    !profileData?.website && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No social links added yet
                      </p>
                    )}
                </div>
              </div>

              {/* Resume */}
              {profileData?.resume_url && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {t("resume.title")}
                  </h3>
                  <Link
                    href={profileData.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">PDF</span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {t("resume.viewButton")}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfileDisplay;
