"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export default function LoginButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const buttonClass = "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md px-3 text-white border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50";
  if (session) {
    return (
      <div className="flex items-center gap-2">
        <button
          className={buttonClass + " w-9 h-9"}
          onClick={() => router.push("/profile")}
          title="프로필 설정"
        >
          <Settings />
        </button>
        <button className={buttonClass} onClick={() => signOut()}>로그아웃</button>
      </div>
    );
  }
  return <button className={buttonClass} onClick={() => signIn("google")}>로그인</button>;
} 