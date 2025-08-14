import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const CreateAnswers = () => {
  const [loading, setLoading] = useState(false);

  // Function to find ALL suitable examiners based on discipline and subcategories
  const findAllSuitableExaminers = async (
    discipline: string,
    subcategory: string[]
  ) => {
    try {
      console.log(
        `Looking for examiners for discipline: ${discipline}, subcategories:`,
        subcategory
      );

      // Query examiners who can handle this discipline and subcategory
      const { data: examiners, error } = await supabase
        .from("examiners")
        .select("*")
        .eq("status", "active");

      if (error) {
        console.error("Error fetching examiners:", error);
        return [];
      }

      console.log(`Found ${examiners?.length || 0} active examiners`);

      // Filter examiners who match the discipline and at least one subcategory
      const matchingExaminers = examiners.filter((examiner) => {
        try {
          // Parse the disciplines - handle various formats
          let examinerDisciplines;

          // First check if disciplines is already an array
          if (Array.isArray(examiner.disciplines)) {
            examinerDisciplines = examiner.disciplines;
          } else if (typeof examiner.disciplines === "string") {
            try {
              // Try to parse as JSON
              examinerDisciplines = JSON.parse(examiner.disciplines);
            } catch (e) {
              // If that fails, try to clean up the string and parse again
              const cleanedDisciplines = examiner.disciplines
                .replace(/^"/, "") // Remove leading quote
                .replace(/"$/, "") // Remove trailing quote
                .replace(/\\"/g, '"'); // Replace escaped quotes

              try {
                examinerDisciplines = JSON.parse(cleanedDisciplines);
              } catch (e2) {
                // If still fails, try to extract values using regex
                const matches = examiner.disciplines.match(/["']([^"']+)["']/g);
                examinerDisciplines = matches
                  ? matches.map((m: any) => m.replace(/["']/g, ""))
                  : [];
              }
            }
          } else {
            // If it's neither an array nor a string, use an empty array
            examinerDisciplines = [];
          }

          // Parse the subcategories - handle various formats
          let examinerSubcategories;

          // First check if subcategories is already an array
          if (Array.isArray(examiner.subcategories)) {
            examinerSubcategories = examiner.subcategories;
          } else if (typeof examiner.subcategories === "string") {
            try {
              // Try to parse as JSON
              examinerSubcategories = JSON.parse(examiner.subcategories);
            } catch (e) {
              // If that fails, try to clean up the string and parse again
              const cleanedSubcategories = examiner.subcategories
                .replace(/^"/, "") // Remove leading quote
                .replace(/"$/, "") // Remove trailing quote
                .replace(/\\"/g, '"'); // Replace escaped quotes

              try {
                examinerSubcategories = JSON.parse(cleanedSubcategories);
              } catch (e2) {
                // If still fails, try to extract values using regex
                const matches =
                  examiner.subcategories.match(/["']([^"']+)["']/g);
                examinerSubcategories = matches
                  ? matches.map((m: any) => m.replace(/["']/g, ""))
                  : [];
              }
            }
          } else {
            // If it's neither an array nor a string, use an empty array
            examinerSubcategories = [];
          }

          // If disciplines or subcategories are strings, convert to arrays
          if (typeof examinerDisciplines === "string") {
            examinerDisciplines = [examinerDisciplines];
          }

          if (typeof examinerSubcategories === "string") {
            examinerSubcategories = [examinerSubcategories];
          }

          // Ensure we have arrays
          if (!Array.isArray(examinerDisciplines)) {
            examinerDisciplines = Object.values(examinerDisciplines || {});
          }

          if (!Array.isArray(examinerSubcategories)) {
            examinerSubcategories = Object.values(examinerSubcategories || {});
          }

          console.log(
            `Examiner ${examiner.name} disciplines:`,
            examinerDisciplines
          );
          console.log(
            `Examiner ${examiner.name} subcategories:`,
            examinerSubcategories
          );

          // Check if examiner handles this discipline
          const handlesDiscipline =
            Array.isArray(examinerDisciplines) &&
            examinerDisciplines.some((d) => {
              // Case insensitive comparison
              return (
                typeof d === "string" &&
                d.toLowerCase() === discipline.toLowerCase()
              );
            });

          // Check if examiner handles at least one of the subcategories
          const handlesSubcategory =
            Array.isArray(examinerSubcategories) &&
            examinerSubcategories.some((s) => {
              return (
                typeof s === "string" &&
                subcategory.some((sc) => s.toLowerCase() === sc.toLowerCase())
              );
            });

          console.log(
            `Examiner ${examiner.name} handles discipline: ${handlesDiscipline}, handles subcategory: ${handlesSubcategory}`
          );

          return handlesDiscipline && handlesSubcategory;
        } catch (e) {
          console.error(`Error parsing examiner ${examiner.id} data:`, e);
          return false;
        }
      });

      console.log(`Found ${matchingExaminers.length} matching examiners`);

      // Return ALL matching examiners instead of just the first one
      return matchingExaminers;
    } catch (err) {
      console.error("Error finding suitable examiners:", err);
      return [];
    }
  };

  // Fallback function to save snapshots as metadata only (without images)
  const saveSnapshotsAsMetadataOnly = (snapshots: any[]) => {
    console.log("Falling back to metadata-only snapshot storage");
    // Return empty array for URLs but we'll still save the verification data
    return [];
  };

  // Process snapshots to ensure they're in a format that can be stored in JSONB
  const processSnapshotsForStorage = (snapshots: any[]) => {
    if (!snapshots || snapshots.length === 0) return [];

    try {
      // Create a simple array of objects with only the essential properties
      const processed = [];

      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];

        // Create a new simple object with only primitive values
        const processedSnapshot = {
          timestamp:
            typeof snapshot.timestamp === "string"
              ? snapshot.timestamp
              : new Date().toISOString(),
          status:
            typeof snapshot.verificationStatus === "string"
              ? snapshot.verificationStatus
              : "unknown",
          verified: snapshot.verified === true,
          hasFace:
            snapshot.embedding !== undefined && snapshot.embedding !== null,
          multipleFaces: snapshot.multipleFacesDetected === true,
        };

        processed.push(processedSnapshot);
      }

      return processed;
    } catch (error) {
      console.error("Error processing snapshots:", error);
      return [];
    }
  };

  // Function to save snapshots to Supabase storage
  const saveSnapshots = async (
    snapshots: any[],
    testId: string,
    email: string
  ) => {
    if (!snapshots || snapshots.length === 0) {
      console.log("No snapshots to save");
      return [];
    }

    const savedSnapshotUrls: string[] = [];

    try {
      // Use the existing bucket "skillnet" instead of creating a new one
      const bucketName = "skillnet";

      console.log(`Using existing bucket: ${bucketName}`);

      // Create a folder for this test using the test ID
      const folderPath = `test-snapshots/${testId}`;

      // Save each snapshot
      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];

        // Skip snapshots without dataUrl
        if (!snapshot.dataUrl) continue;

        try {
          // Convert data URL to Blob
          const response = await fetch(snapshot.dataUrl);
          const blob = await response.blob();

          // Generate a filename with timestamp
          const timestamp = new Date(
            snapshot.timestamp || Date.now()
          ).getTime();
          const filename = `snapshot_${i}_${timestamp}.jpg`;
          const filePath = `${folderPath}/${filename}`;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });

          if (error) {
            console.error(`Error uploading snapshot ${i}:`, error);
          } else {
            // Get the public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);

            if (urlData && urlData.publicUrl) {
              savedSnapshotUrls.push(urlData.publicUrl);
            }
          }
        } catch (err) {
          console.error(`Error processing snapshot ${i}:`, err);
        }
      }

      console.log(`Saved ${savedSnapshotUrls.length} snapshots to storage`);
      return savedSnapshotUrls;
    } catch (err) {
      console.error("Error saving snapshots:", err);
      // Fallback to metadata-only approach
      return saveSnapshotsAsMetadataOnly(snapshots);
    }
  };

  // Enhanced Save function to include multiple examiner assignments
  const Save = async (
    email: string,
    score: number,
    subject_score: any,
    exam: string,
    overall: number,
    snapshots?: any[]
  ) => {
    setLoading(true);

    try {
      // Generate a unique ID for this test
      const testId = uuidv4();

      // Parse subject_score to extract subcategories
      let subcategories: string[] = [];
      let parsedSubjectScore;

      try {
        // Ensure subject_score is properly parsed
        parsedSubjectScore =
          typeof subject_score === "string"
            ? JSON.parse(subject_score)
            : subject_score;

        if (parsedSubjectScore && parsedSubjectScore.subCategory) {
          subcategories = Array.isArray(parsedSubjectScore.subCategory)
            ? parsedSubjectScore.subCategory
            : [parsedSubjectScore.subCategory];
        }
      } catch (e) {
        console.error("Error parsing subject score:", e);
        // If parsing fails, use an empty object
        parsedSubjectScore = {};
      }

      // Find ALL suitable examiners
      const matchingExaminers = await findAllSuitableExaminers(
        exam,
        subcategories
      );

      // Save snapshots to storage if provided
      let snapshotUrls: string[] = [];
      let snapshotMetadata: Record<string, any> | null = null;

      if (snapshots && snapshots.length > 0) {
        try {
          // Process snapshots to ensure they're in a format that can be stored in JSONB
          const processedSnapshots = processSnapshotsForStorage(snapshots);

          // Save snapshots to storage
          snapshotUrls = await saveSnapshots(snapshots, testId, email);

          // Create metadata about the snapshots - using a simple object structure
          snapshotMetadata = {
            totalCount: snapshots.length,
            savedCount: snapshotUrls.length,
            urls: snapshotUrls,
            results: processedSnapshots,
          };

          console.log("Created snapshot metadata:", {
            totalCount: snapshots.length,
            savedCount: snapshotUrls.length,
            urlsCount: snapshotUrls.length,
            resultsCount: processedSnapshots.length,
          });
        } catch (e) {
          console.error("Error processing snapshots:", e);
          // If snapshot processing fails, continue without snapshots
          snapshotMetadata = { error: "Failed to process snapshots" };
        }
      }

      // Ensure subject_score is a valid JSON string
      const finalSubjectScore =
        typeof subject_score === "string"
          ? subject_score
          : JSON.stringify(subject_score);

      // Prepare the record to insert
      const record: Record<string, any> = {
        id: testId,
        email,
        score,
        subject_score: finalSubjectScore,
        exam,
        overall,
        created_at: new Date().toISOString(),
        review_status: "pending",
        // No longer setting assigned_to since we're assigning to multiple examiners
      };

      // Only add snapshot_metadata if we have it
      if (snapshotMetadata) {
        try {
          // Convert any arrays to objects to avoid JSONB casting issues
          const safeMetadata: Record<string, any> = { ...snapshotMetadata };

          // Convert urls array to an object with numbered keys
          if (Array.isArray(safeMetadata.urls)) {
            const urlsObj: Record<string, string> = {};
            safeMetadata.urls.forEach((url: string, index: number) => {
              urlsObj[`url_${index}`] = url;
            });
            safeMetadata.urls = urlsObj;
          }

          // Convert results array to an object with numbered keys
          if (Array.isArray(safeMetadata.results)) {
            const resultsObj: Record<string, any> = {};
            safeMetadata.results.forEach((result: any, index: number) => {
              resultsObj[`result_${index}`] = result;
            });
            safeMetadata.results = resultsObj;
          }

          // Ensure it's a valid JSON object, not an array
          record.snapshot_metadata = JSON.stringify(safeMetadata);
          console.log(
            "Added snapshot metadata to record:",
            typeof record.snapshot_metadata
          );
        } catch (e) {
          console.error("Error stringifying snapshot metadata:", e);
          // If JSON.stringify fails, use a simple error object
          record.snapshot_metadata = JSON.stringify({
            error: "Invalid metadata format",
          });
        }
      }

      // Insert data into the 'answers' table first
      const { data, error } = await supabase
        .from("answers")
        .insert(record)
        .select();

      if (error) {
        console.error("Error inserting data:", error.message);
        return { error: error.message };
      }

      console.log("Data inserted successfully:", data);

      // Create review assignments for ALL matching examiners
      let assignmentCount = 0;
      if (matchingExaminers.length > 0) {
        try {
          // Create an array of assignment objects for batch insert
          const assignments = matchingExaminers.map((examiner) => ({
            id: uuidv4(),
            examiner_id: examiner.id,
            test_id: testId,
            assigned_at: new Date().toISOString(),
            status: "pending",
          }));

          // Batch insert all assignments
          const { data: assignmentData, error: insertError } = await supabase
            .from("review_assignments")
            .insert(assignments);

          if (insertError) {
            console.error("Error creating review assignments:", insertError);
          } else {
            assignmentCount = assignments.length;
            console.log(`Test assigned to ${assignmentCount} examiners`);
          }
        } catch (assignmentError) {
          console.error("Error with review assignments:", assignmentError);
        }
      } else {
        console.log("No suitable examiners found, test will remain unassigned");
      }

      setLoading(false);
      return {
        data,
        assignedToExaminers: assignmentCount > 0, // Changed to reflect multiple assignments
        examinerCount: assignmentCount, // Added count of assigned examiners
        snapshotsSaved: snapshotUrls.length,
      };
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
      return { error: "Unexpected error occurred" };
    }
  };

  return {
    loading,
    Save, // Ensure the `Save` function is returned so it can be used externally
  };
};
