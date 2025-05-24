"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [genre, setGenre] = useState("");
  const [camera, setCamera] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setNickname(data.profile.nickname || "");
          setGenre(data.profile.favorite_genre || "");
          setCamera(data.profile.camera || "");
          setAbout(data.profile.about || "");
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify({ nickname, genre, camera, about }),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    setSaved(true);
    router.back();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 py-12 px-4">
      <Card className="w-full max-w-lg p-8 shadow-xl rounded-2xl bg-white/90">
        <div className="flex items-center gap-3 mb-8 justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-700 text-white rounded-full p-2"><Settings className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-gray-900">프로필 설정</h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-200 transition"
            title="닫기"
            type="button"
            onClick={() => router.back()}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">닉네임 <span className="text-red-500">*</span></label>
            <input placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">좋아하는 사진 장르</label>
            <input placeholder="예: 인물, 풍경, 스트리트" value={genre} onChange={e => setGenre(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 중인 카메라</label>
            <input placeholder="예: Sony A7M4, Canon R6 등" value={camera} onChange={e => setCamera(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">나에 대한 정보</label>
            <textarea placeholder="간단한 자기소개, 사진 스타일 등" value={about} onChange={e => setAbout(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <button type="submit" disabled={loading} className="mt-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white font-semibold rounded-lg px-6 py-2 hover:opacity-90 transition disabled:opacity-60">
            {loading ? "저장 중..." : "저장"}
          </button>
          {saved && <div className="text-green-600 text-center text-sm mt-2">저장되었습니다!</div>}
        </form>
      </Card>
    </div>
  );
}
