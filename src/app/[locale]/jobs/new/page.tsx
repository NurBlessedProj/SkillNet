"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // For React Quill styles
import Select, { MultiValue } from "react-select";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase"; // Assuming you have a Supabase client file
import { GetJobs } from "@/app/apis/job/getJob";

// Dynamically import ReactQuill for better SSR handling
const ReactQuillDynamic = dynamic(() => import("react-quill"), { ssr: false });

interface JobPostingFormData {
  companyName: string;
  companyDescription: string;
  category: string[]; // For job categories
  skills: string[]; // New field for selected skills
  salaryRange: [number, number];
  responsibilities: string;
  whoYouAre: string;
  additionalRequirements: string;
  endDate: string;
  capacity: number; // Current capacity
  capacityNeeded: number; // Capacity needed
  status: string;
  jobType: string;
  role: string;
  email: string; // Add email to the form data
  logoUrl: string; // Add logo URL to the form data
}

const categories = [
  { value: "Software", label: "Software" },
  { value: "Marketing", label: "Marketing" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
];

const skills = [
  { value: "Marketing", label: "Marketing" },
  { value: "Finance", label: "Finance" },
  { value: "Sales", label: "Sales" },
  { value: "Product Management", label: "Product Management" },
  { value: "Engineering", label: "Engineering" },
];

const jobTypes = [
  { value: "Full Time", label: "Full Time" },
  { value: "Part Time", label: "Part Time" },
  { value: "Internship", label: "Internship" },
  { value: "Contract", label: "Contract" },
  { value: "Freelance", label: "Freelance" },
];

const statuses = [
  { value: "Live", label: "Live" },
  { value: "Pending", label: "Pending" },
  { value: "Refuse", label: "Refuse" },
];

const JobPostingForm = () => {
  const [responsibilities, setResponsibilities] = useState<string>("");
  const [whoYouAre, setWhoYouAre] = useState<string>("");
  const [additionalRequirements, setAdditionalRequirements] =
    useState<string>("");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    50000, 100000,
  ]);
  const [endDate, setEndDate] = useState<string>("");
  const [capacity, setCapacity] = useState<number>(1); // Default capacity
  const [capacityNeeded, setCapacityNeeded] = useState<number>(1); // Default capacity needed
  const [status, setStatus] = useState<string>("Live");
  const [jobType, setJobType] = useState<string>("Full Time");
  const [role, setRole] = useState<string>(""); // New role state
  const [skillsSelected, setSkillsSelected] = useState<string[]>([]); // State for selected skills
  const [email, setEmail] = useState<string>(""); // State to store email from auth
  const [logoFile, setLogoFile] = useState<File | null>(null); // State for logo file
  const [logoUrl, setLogoUrl] = useState<string>(""); // State for logo URL
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false); // State for logo upload loading
  const [uploadError, setUploadError] = useState<string | null>(null); // State for logo upload errors
  const [companyName, setCompanyName] = useState<string>(""); // State for company name
  const [companyDescription, setCompanyDescription] = useState<string>(""); // State for company description

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobPostingFormData>();

  // Fetch authenticated user email and profile data from Supabase on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        alert("You must be logged in to post a job");
        return;
      }

      // Set the authenticated user's email
      setEmail(user.email || "");

      // Fetch the existing profile data from profile_recruter table
      const { data, error: profileError } = await supabase
        .from("profile_recruter")
        .select("logo_url, name, description")
        .eq("email", user.email)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (data) {
        // Populate the company name, description, and logo URL
        setCompanyName(data.name || "");
        setCompanyDescription(data.description || "");
        setLogoUrl(data.logo_url || "");
      }
    };

    fetchProfile();
  }, []);

  // Function to upload logo to Supabase Storage and return its public URL
  const uploadLogo = async (file: File) => {
    if (!file) return null;

    const filePath = `logos/${file.name}`;
    const { data, error } = await supabase.storage
      .from("skillnet") // Replace with your bucket name
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    // Get the public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("skillnet").getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error("Failed to get public URL");
    }

    return publicUrl;
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const submitForm = async (data: JobPostingFormData) => {
    try {
      console.log("Preparing form data...");

      // Upload logo if a file is selected
      let logoUrl: any = "";
      if (logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadLogo(logoFile);
        setLogoUrl(logoUrl);
        setUploadingLogo(false);
      }

      const formData = {
        company_name: companyName, // Use the fetched company name
        company_description: companyDescription, // Use the fetched company description
        categories: data.category, // Array of selected categories
        skills: skillsSelected, // Selected skills
        salary_min: salaryRange[0], // Minimum salary
        salary_max: salaryRange[1], // Maximum salary
        responsibilities,
        who_you_are: whoYouAre, // Who you are
        additional_requirements: additionalRequirements, // Additional requirements
        end_date: endDate, // End date
        capacity, // Current capacity
        capacity_needed: capacityNeeded, // Capacity needed
        status,
        job_type: jobType,
        role, // Add the role field here
        email, // Add email to form data
        logo_url: logoUrl || logoUrl, // Use the fetched logo URL or the newly uploaded one
      };

      console.log("Form data to be inserted:", formData);

      // Save form data to the 'job_postings' table in Supabase
      const { error: insertError } = await supabase
        .from("job_postings")
        .insert([formData]);

      if (insertError) {
        console.error("Error inserting data into the job table:", insertError);
        throw insertError;
      }

      console.log("Job posting created successfully");
      alert("Job posting created successfully");
    } catch (error: any) {
      console.error("Error during form submission:", error);
      setUploadError(error.message); // Show any errors
    } finally {
      setUploadingLogo(false); // Reset uploading state
    }
  };

  const onSubmit: SubmitHandler<JobPostingFormData> = (data) => {
    console.log("Form submitted with data:", data);
    submitForm(data);
  };

  return (
    <div className="container mx-auto p-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Company Name */}
        <div className="mb-2">
          <input
            type="hidden"
            id="companyName"
            value={companyName} // Use the fetched company name
            disabled // Disable the field
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
          />
        </div>

        {/* Email (Authenticated User's Email) */}
        <div className="mb-6">
          <input
            type="hidden"
            id="email"
            value={email} // The email is pre-filled with the authenticated user's email
            disabled
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
          />
        </div>

        {/* Company Description */}
        <div className="mb-6">
          {/* <label htmlFor="companyDescription" className="block text-lg font-medium text-gray-700">Description of the Company</label> */}
          <textarea
            id="companyDescription"
            value={companyDescription} // Use the fetched company description
            disabled // Disable the field
            className="mt-2 p-3 w-full border border-gray-300 rounded-md hidden focus:outline-none focus:ring-2 focus:ring-blue-600 bg-gray-100"
            rows={4}
          />
        </div>

        {/* Logo Upload */}
        <div className="mb-6 hidden">
          <label
            htmlFor="logo"
            className="block text-lg font-medium text-gray-700"
          >
            Company Logo
          </label>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Company Logo"
              className="w-12 h-12 mx-2 mt-7 border p-2"
            />
          ) : (
            <input
              type="file"
              id="logo"
              onChange={handleLogoChange}
              className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              accept="image/*" // Accept only image files
            />
          )}
          {uploadingLogo && (
            <p className="text-blue-500 text-sm">Uploading logo...</p>
          )}
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
        </div>

        {/* Category */}
        <div className="mb-6">
          <label
            htmlFor="category"
            className="block text-lg font-medium text-gray-700"
          >
            Category
          </label>
          <Select
            options={categories}
            isMulti
            name="category"
            onChange={(value: MultiValue<{ value: string }>) =>
              setValue(
                "category",
                value.map((v) => v.value)
              )
            }
            className="mt-2 w-full"
          />
        </div>

        {/* Skills */}
        <div className="mb-6">
          <label
            htmlFor="skills"
            className="block text-lg font-medium text-gray-700"
          >
            Skills
          </label>
          <Select
            options={skills}
            isMulti
            name="skills"
            onChange={(value: MultiValue<{ value: string }>) =>
              setSkillsSelected(value.map((v) => v.value))
            }
            className="mt-2 w-full"
          />
        </div>

        {/* Role */}
        <div className="mb-6">
          <label
            htmlFor="role"
            className="block text-lg font-medium text-gray-700"
          >
            Role
          </label>
          <input
            type="text"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Status */}
        <div className="mb-6">
          <label
            htmlFor="status"
            className="block text-lg font-medium text-gray-700"
          >
            Status
          </label>
          <Select
            options={statuses}
            value={statuses.find((option) => option.value === status)}
            onChange={(selectedOption) =>
              setStatus(selectedOption?.value || "Live")
            }
            className="mt-2 w-full"
          />
        </div>

        {/* Job Type */}
        <div className="mb-6">
          <label
            htmlFor="jobType"
            className="block text-lg font-medium text-gray-700"
          >
            Job Type
          </label>
          <Select
            options={jobTypes}
            value={jobTypes.find((option) => option.value === jobType)}
            onChange={(selectedOption) =>
              setJobType(selectedOption?.value || "Full Time")
            }
            className="mt-2 w-full"
          />
        </div>

        {/* Salary Range */}
        <div className="mb-6">
          <label
            htmlFor="salaryRange"
            className="block text-lg font-medium text-gray-700"
          >
            Salary Range
          </label>
          <input
            type="range"
            min="0"
            max="200000"
            step="5000"
            value={salaryRange[0]}
            onChange={(e) => setSalaryRange([+e.target.value, salaryRange[1]])}
            className="w-full mt-2"
          />
          <input
            type="range"
            min="0"
            max="200000"
            step="5000"
            value={salaryRange[1]}
            onChange={(e) => setSalaryRange([salaryRange[0], +e.target.value])}
            className="w-full mt-2"
          />
          <div className="flex justify-between">
            <span>${salaryRange[0]}</span>
            <span>${salaryRange[1]}</span>
          </div>
        </div>

        {/* End Date */}
        <div className="mb-6">
          <label
            htmlFor="endDate"
            className="block text-lg font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Capacity */}
        <div className="mb-6">
          <label
            htmlFor="capacity"
            className="block text-lg font-medium text-gray-700"
          >
            Capacity
          </label>
          <input
            type="number"
            id="capacity"
            value={capacity}
            onChange={(e) => setCapacity(+e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            min="1"
          />
        </div>

        {/* Capacity Needed */}
        <div className="mb-6">
          <label
            htmlFor="capacityNeeded"
            className="block text-lg font-medium text-gray-700"
          >
            Positions Needed
          </label>
          <input
            type="number"
            id="capacityNeeded"
            value={capacityNeeded}
            onChange={(e) => setCapacityNeeded(+e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            min="1"
          />
        </div>

        {/* Responsibilities */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700">
            Responsibilities
          </label>
          <ReactQuillDynamic
            value={responsibilities}
            onChange={setResponsibilities}
            className="mt-2 "
            placeholder="Enter responsibilities"
          />
        </div>

        {/* Who You Are */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700">
            Who You Are
          </label>
          <ReactQuillDynamic
            value={whoYouAre}
            onChange={setWhoYouAre}
            className="mt-2 "
            placeholder="Enter requirements for the applicant"
          />
        </div>

        {/* Additional Requirements */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700">
            Additional Requirements
          </label>
          <ReactQuillDynamic
            value={additionalRequirements}
            onChange={setAdditionalRequirements}
            className="mt-2 "
            placeholder="Enter any other requirements"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          disabled={uploadingLogo}
        >
          {uploadingLogo ? "Uploading..." : "Post Job"}
        </button>
      </form>
    </div>
  );
};

export default JobPostingForm;
