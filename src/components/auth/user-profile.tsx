"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export function UserProfile() {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt={session.user.name || "User avatar"}
          width={32}
          height={32}
          className="rounded-full"
        />
      )}
      <div className="text-sm">
        <p className="font-medium">{session.user.name}</p>
        <p className="text-muted-foreground">{session.user.email}</p>
      </div>
    </div>
  );
}
