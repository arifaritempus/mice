"use client";

import React from "react";
import { usePermissions, Module, Permission } from "@/lib/permissions";

interface PermissionBoundaryProps {
  module: Module;
  action: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  forceHide?: boolean;
}

export default function PermissionBoundary({
  module,
  action,
  children,
  fallback = null,
  forceHide = false,
}: PermissionBoundaryProps) {
  const { canView, canCreate, canEdit, canDelete, loading } = usePermissions();

  if (loading) return <>{fallback}</>;
  if (forceHide) return <>{fallback}</>;

  let hasPerm = false;
  switch (action) {
    case Permission.VIEW:
      hasPerm = canView(module);
      break;
    case Permission.CREATE:
      hasPerm = canCreate(module);
      break;
    case Permission.EDIT:
      hasPerm = canEdit(module);
      break;
    case Permission.DELETE:
      hasPerm = canDelete(module);
      break;
    default:
      hasPerm = false;
  }

  return hasPerm ? <>{children}</> : <>{fallback}</>;
}
