"use client";

import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

export default function HcpDirectory() {
 
  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HCP Directory</h1>
        <p className="text-gray-600 mb-8">Browse all the healthcare providers</p>

       
      </div>
    </RoleProtection>
  );
}
