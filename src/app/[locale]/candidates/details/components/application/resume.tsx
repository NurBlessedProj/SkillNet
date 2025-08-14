import React from 'react';
import { useTranslations } from "next-intl";

const Resume = ({ data }: any) => {
    const t = useTranslations(); // Initialize translation hook
    const pdfUrl = encodeURIComponent(data?.resume_url); // URL-encode the PDF URL
    const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${pdfUrl}&embedded=true`;

    return (
        <div className='w-full flex justify-center mt-5'>
            <iframe
                src={googleDocsViewerUrl}
                width="100%"
                height="750px"
                style={{ border: 'none' }}
                title={t("application.resume.iframeTitle")}
            />
        </div>
    );
};

export default Resume;
