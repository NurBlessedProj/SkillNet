"use client";
import React from "react";

const Loader = () => {
  return (
    <div className=" h-[calc(100vh-64px)] grid place-content-center items-center justify-center">
      <img
        src="/loader/loader.svg"
        alt="Loading..."
        className="w-24 h-24 animate-spin-smooth"
        style={{
          transformOrigin: "center",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );
};

export default Loader;
