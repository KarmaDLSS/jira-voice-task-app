import React, { useEffect, useState } from "react";

export default function RecordScreen() {
  const [session, setSession] = useState<{
    domain: string;
    email: string;
  } | null>(null);

  // Mocking the SecureStore load for the web preview environment
  useEffect(() => {
    const loadSession = () => {
      // Simulating a successful login session payload
      setSession({
        domain: "your-domain.atlassian.net",
        email: "you@example.com",
      });
    };
    loadSession();
  }, []);

  const handleLogout = () => {
    // In the actual Expo app, this will clear SecureStore and use router.replace('/')
    alert("Logout triggered. This will return to the Login screen.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] font-sans">
      {/* Header */}
      <div className="flex flex-row justify-between items-center p-5 bg-white border-b border-[#DFE1E6]">
        <span className="text-xl font-bold text-[#172B4D]">Jira Voice</span>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-50 rounded transition-colors"
        >
          <span className="text-[#DE350B] font-semibold text-sm">Logout</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6 justify-center items-center">
        <h2 className="text-2xl font-bold text-[#00875A] mb-3">
          Authentication Successful.
        </h2>

        {session && (
          <p className="text-sm text-[#5E6C84] text-center mb-10 leading-relaxed">
            Connected as:{" "}
            <span className="font-medium text-[#172B4D]">{session.email}</span>
            <br />
            Workspace:{" "}
            <span className="font-medium text-[#172B4D]">{session.domain}</span>
          </p>
        )}

        {/* Recording Placeholder */}
        <div className="w-52 h-52 rounded-full bg-[#0052CC] flex justify-center items-center shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer">
          <span className="text-white text-center font-bold px-4">
            Voice Recording UI goes here
          </span>
        </div>
      </div>
    </div>
  );
}
