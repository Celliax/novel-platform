"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { User, Tag, Novel } from "@/lib/generated/prisma/client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TagReadStats {
  tag: Tag;
  count: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [tagStats, setTagStats] = useState<TagReadStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = getSupabaseClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      router.push("/login");
      return;
    }

    // 사용자 정보와 통계 가져오기
    await loadUserData(supabaseUser.id);
  };

  const loadUserData = async (userId: string) => {
    try {
      // 사용자 정보 가져오기
      const userResponse = await fetch(`/api/user/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        setNovels(userData.novels);
        setTagStats(userData.tagStats);
      }
    } catch (error) {
      console.error("사용자 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="hero-gradient flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hero-gradient flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white text-xl">사용자를 찾을 수 없습니다.</p>
          <Link href="/" className="mt-4 inline-block text-blue-300 hover:text-blue-100">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 차트 데이터 준비
  const chartData = {
    labels: tagStats.slice(0, 5).map(stat => stat.tag.name),
    datasets: [
      {
        label: "읽은 회차 수",
        data: tagStats.slice(0, 5).map(stat => stat.count),
        backgroundColor: tagStats.slice(0, 5).map(stat => stat.tag.color),
        borderColor: tagStats.slice(0, 5).map(stat => stat.tag.color),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "가장 많이 읽은 태그 TOP 5",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name || "사용자"}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/novel/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 소설 쓰기
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 연재 작품 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">연재 작품</h2>
            {novels.length === 0 ? (
              <p className="text-gray-500">아직 연재 중인 작품이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {novels.map((novel) => (
                  <div key={novel.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                      📖
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{novel.title}</h3>
                      <p className="text-sm text-gray-600">{novel.genre}</p>
                      <p className="text-sm text-gray-500">조회수: {novel.views}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/novel/${novel.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        보기
                      </Link>
                      <Link
                        href={`/novel/${novel.id}/episode/create`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        연재하기
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 읽은 태그 통계 그래프 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">읽기 통계</h2>
            {tagStats.length === 0 ? (
              <p className="text-gray-500">아직 읽은 태그가 없습니다.</p>
            ) : (
              <div className="h-64">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}