import React from "react";
import { useTranslations, useLocale } from "next-intl";

const Profile = ({ data }: any) => {
  const t = useTranslations(); // Initialize translation hook
  const locale = useLocale(); // Get the current locale

  const birthDate = data?.date_of_birth ? new Date(data.date_of_birth) : null;

  // Format the birthdate according to the current language
  const formattedDate = birthDate
    ? birthDate.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "";

  // Calculate the age
  let age = 0;
  if (birthDate) {
    const currentDate = new Date();
    age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    const dayDiff = currentDate.getDate() - birthDate.getDate();

    // Adjust age if the birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
  }

  // Render qualification details based on type
  const renderQualificationDetails = () => {
    // Check if qualification_details exists directly in data
    const qualificationDetails = data?.qualification_details || {};

    // If qualification_details is a string, try to parse it
    let parsedDetails = qualificationDetails;
    if (typeof qualificationDetails === "string") {
      try {
        parsedDetails = JSON.parse(qualificationDetails);
      } catch (e) {
        console.error("Failed to parse qualification details:", e);
      }
    }

    // Get qualification type either from the parsed object or directly from data
    const qualificationType =
      parsedDetails?.qualification_type || data?.highest_qualification;

    // Get details either from the nested property or from the parsed object itself
    const details = parsedDetails?.qualification_details || parsedDetails;

    if (!qualificationType) return null;

    switch (qualificationType) {
      case "Advanced Level":
        return (
          <div className="mt-4">
            <h6 className="text-gray-500 mb-2">
              {t("application.profile.education.aLevelSubjects")}
            </h6>
            <div className="grid gap-2">
              {details?.subjects?.map((subject: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                >
                  <span>{subject.subject}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                    {t("application.profile.education.grade")}: {subject.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "Higher National Diploma":
        return (
          <div className="mt-4 space-y-2">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.fieldOfStudy")}
              </h6>
              <p>{details?.field || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.specialization")}
              </h6>
              <p>{details?.specialization || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.grade")}
              </h6>
              <p>{details?.grade || "-"}</p>
            </div>
          </div>
        );

      case "Bachelor's Degree":
        return (
          <div className="mt-4 space-y-2">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.degreeTitle")}
              </h6>
              <p>{details?.title || data?.degree_title || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.institution")}
              </h6>
              <p>{details?.institution || data?.institution || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.grade")}
              </h6>
              <p>{details?.grade || data?.grade || "-"}</p>
            </div>
          </div>
        );

      case "Master's Degree":
        return (
          <div className="mt-4 space-y-2">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.degreeTitle")}
              </h6>
              <p>{details?.title || data?.degree_title || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.institution")}
              </h6>
              <p>{details?.institution || data?.institution || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.thesis")}
              </h6>
              <p>{details?.thesis || data?.thesis || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.grade")}
              </h6>
              <p>{details?.grade || data?.grade || "-"}</p>
            </div>
          </div>
        );

      case "PhD Degree":
        return (
          <div className="mt-4 space-y-2">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.fieldOfResearch")}
              </h6>
              <p>{details?.field || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.institution")}
              </h6>
              <p>{details?.institution || data?.institution || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.thesisTitle")}
              </h6>
              <p>{details?.thesis || data?.thesis || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.researchSummary")}
              </h6>
              <p className="whitespace-pre-wrap">{details?.summary || "-"}</p>
            </div>
          </div>
        );

      default:
        // For any other qualification type, show a generic view with available data
        return (
          <div className="mt-4 space-y-2">
            {data?.degree_title && (
              <div>
                <h6 className="text-gray-500">
                  {t("application.profile.education.degreeTitle")}
                </h6>
                <p>{data.degree_title}</p>
              </div>
            )}
            {data?.institution && (
              <div>
                <h6 className="text-gray-500">
                  {t("application.profile.education.institution")}
                </h6>
                <p>{data.institution}</p>
              </div>
            )}
            {data?.thesis && (
              <div>
                <h6 className="text-gray-500">
                  {t("application.profile.education.thesis")}
                </h6>
                <p>{data.thesis}</p>
              </div>
            )}
            {data?.grade && (
              <div>
                <h6 className="text-gray-500">
                  {t("application.profile.education.grade")}
                </h6>
                <p>{data.grade}</p>
              </div>
            )}
            {/* Display any other education-related fields that might be available */}
            {data?.field_of_study && (
              <div>
                <h6 className="text-gray-500">
                  {t("application.profile.education.fieldOfStudy")}
                </h6>
                <p>{data.field_of_study}</p>
              </div>
            )}
          </div>
        );
    }
  };

  // Improved skills parsing function
  const renderSkills = () => {
    try {
      // Try different possible formats of skills data
      let skillsArray = [];

      if (data?.skills) {
        if (typeof data.skills === "string") {
          // Try to parse as JSON string
          try {
            const parsed = JSON.parse(data.skills);
            if (Array.isArray(parsed)) {
              skillsArray = parsed;
            } else if (typeof parsed === "object") {
              skillsArray = Object.values(parsed);
            } else {
              // Handle string format like "[skill1,skill2]"
              const skillsString = data.skills.slice(1, -1) || "";
              skillsArray = skillsString
                ? skillsString.split(",").map((s:any) => s.trim().replace(/"/g, ""))
                : [];
            }
          } catch (e) {
            // If JSON parsing fails, try comma-separated format
            skillsArray = data.skills.split(",").map((s: string) => s.trim());
          }
        } else if (Array.isArray(data.skills)) {
          skillsArray = data.skills;
        }
      }

      // Check if we have any valid skills after parsing
      if (
        !skillsArray.length ||
        (skillsArray.length === 1 && !skillsArray[0].trim())
      ) {
        return (
          <p className="text-gray-500 italic text-sm">
            {t("application.profile.professional.noSkills")}
          </p>
        );
      }

      // Render skills
      return skillsArray.map((skill: string, key: number) => (
        <button
          key={key}
          className="bg-blue-50 text-[#4640DE] text-sm px-3 py-1 rounded-sm mr-2 mb-2"
        >
          {typeof skill === "string" ? skill.replace(/"/g, "").trim() : skill}
        </button>
      ));
    } catch (error) {
      console.error("Error parsing skills:", error);
      return (
        <p className="text-gray-500 italic text-sm">
          {t("application.profile.professional.noSkills")}
        </p>
      );
    }
  };

  // Render languages
  const renderLanguages = () => {
    try {
      // Try different possible formats of language data
      let languagesArray = [];

      // Check both language (singular) and languages (plural) fields
      const languageData = data?.languages || data?.language || null;

      if (languageData) {
        if (typeof languageData === "string") {
          // Try to parse as JSON string
          try {
            const parsed = JSON.parse(languageData);
            if (Array.isArray(parsed)) {
              languagesArray = parsed;
            } else if (typeof parsed === "object") {
              languagesArray = Object.values(parsed);
            } else {
              // Handle string format
              languagesArray = [parsed];
            }
          } catch (e) {
            // If JSON parsing fails, use as is
            languagesArray = [languageData];
          }
        } else if (Array.isArray(languageData)) {
          languagesArray = languageData;
        } else if (typeof languageData === "object") {
          languagesArray = [
            languageData.value ||
              languageData.name ||
              JSON.stringify(languageData),
          ];
        }
      }

      // If no languages found
      if (!languagesArray.length) {
        return <p>-</p>;
      }

      // Format languages as comma-separated list
      return (
        <p>
          {languagesArray
            .map((lang) =>
              typeof lang === "string" ? lang.replace(/"/g, "") : lang
            )
            .join(", ")}
        </p>
      );
    } catch (error) {
      console.error("Error parsing languages:", error);
      return <p>-</p>;
    }
  };

  return (
    <div className="w-full px-16 mt-12">
      {/* Personal Info Section */}
      <div className="mb-8">
        <h5 className="font-semibold text-2xl mb-5">
          {t("application.profile.sections.personalInformation")}
        </h5>
        <div className="flex w-full">
          <div className="w-[40%] space-y-3">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.personal.fullName")}
              </h6>
              <p>
                {data?.first_name || ""} {data?.last_name || ""}
              </p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.personal.dateOfBirth")}
              </h6>
              <p>
                {formattedDate}{" "}
                {age > 0
                  ? `(${age} ${age === 1 ? "year old" : "years old"})`
                  : ""}
              </p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.personal.address")}
              </h6>
              <p>{data?.address || "-"}</p>
            </div>
          </div>
          <div className="w-[40%] space-y-3">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.personal.gender")}
              </h6>
              <p>{data?.gender || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.personal.language")}
              </h6>
              <div>{renderLanguages()}</div>
            </div>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      {/* Educational Info Section */}
      <div className="mb-8">
        <h5 className="font-semibold text-2xl mb-5">
          {t("application.profile.sections.educationalInformation")}
        </h5>
        <div className="w-full">
          <div className="space-y-3">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.education.highestQualification")}
              </h6>
              <p>{data?.highest_qualification || "-"}</p>
              {renderQualificationDetails()}
            </div>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      {/* Professional Info Section */}
      <div className="mb-8">
        <h5 className="font-semibold text-2xl mb-5">
          {t("application.profile.sections.professionalInformation")}
        </h5>
        <div className="flex w-full">
          <div className="w-[40%] space-y-3">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.professional.currentJob")}
              </h6>
              <p>{data?.current_job || "-"}</p>
            </div>
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.professional.experience")}
              </h6>
              <p>
                {data?.years_of_experience || "0"}{" "}
                {Number(data?.years_of_experience) === 1 ? "Year" : "Years"}
              </p>
            </div>
          </div>
          <div className="w-[40%] space-y-3">
            <div>
              <h6 className="text-gray-500">
                {t("application.profile.professional.skills")}
              </h6>
              <div className="flex gap-1 flex-wrap">{renderSkills()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
