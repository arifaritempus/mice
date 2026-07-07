"use client";

import React from "react";
import { usePermissions, Module, Permission } from "@/lib/permissions";

interface FieldsetGuardProps {
  module: Module;
  action?: Permission; // Varsayılan olarak EDIT yetkisini kontrol eder
  forceDisable?: boolean; // Ekstra devre dışı bırakma durumu (örneğin proje kilitli ise)
  children: React.ReactNode;
  className?: string;
}

export default function FieldsetGuard({
  module,
  action = Permission.EDIT,
  forceDisable = false,
  children,
  className = "group border-none m-0 p-0",
}: FieldsetGuardProps) {
  const { canView, canCreate, canEdit, canDelete, loading } = usePermissions();

  let hasPerm = false;
  if (!loading) {
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
  }

  // Yüklenirken veya yetki yoksa (veyahut zorla devre dışı bırakıldıysa) disable et
  const isDisabled = loading || forceDisable || !hasPerm;

  return (
    <fieldset disabled={isDisabled} className={className}>
      {children}
    </fieldset>
  );
}
