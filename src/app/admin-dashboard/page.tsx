"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setAdminData(result.data);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!adminData) return <div>No admin data available</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {/* Render admin settings and team management */}
      <pre>{JSON.stringify(adminData, null, 2)}</pre>
    </div>
  );
}
