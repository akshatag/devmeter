"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { GithubIcon, LogOutIcon } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return (
      <Button disabled variant="outline" size="sm">
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <Button 
        onClick={() => signOut()} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <LogOutIcon className="h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button 
      onClick={() => signIn("github")} 
      variant="default" 
      size="sm"
      className="flex items-center gap-2"
    >
      <GithubIcon className="h-4 w-4" />
      Sign in with GitHub
    </Button>
  );
}
