"use client";

import { useState } from "react";
import { migrateAllImagesAction } from "@/app/actions/admin";
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react";

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startMigration = async () => {
    if (!confirm("모든 이미지를 Cloudinary로 마이그레이션 하시겠습니까? (시간이 다소 걸릴 수 있습니다)")) return;

    setStatus('running');
    setError(null);

    try {
      const res = await migrateAllImagesAction();
      if (res.success) {
        setResult(res.result);
        setStatus('success');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "마이그레이션 실패");
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-20">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-purple-600 p-8 text-white text-center">
          <Database size={48} className="mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-extrabold">이미지 서버 통합 도구</h1>
          <p className="text-purple-100 mt-2 text-sm">기존 Base64 이미지를 Cloudinary로 일괄 이전합니다.</p>
        </div>

        <div className="p-8">
          {status === 'idle' && (
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                이 작업은 데이터베이스에 저장된 모든 작품의 표지와 본문 삽화를 검사하여 외부 이미지 서버로 옮깁니다.<br/>
                완료 후에는 사이트 로딩 속도가 비약적으로 향상됩니다.
              </p>
              <button
                onClick={startMigration}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
              >
                마이그레이션 시작하기
              </button>
            </div>
          )}

          {status === 'running' && (
            <div className="text-center py-10">
              <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-900 font-bold text-lg">마이그레이션 진행 중...</p>
              <p className="text-gray-500 text-sm mt-2">창을 닫지 말고 잠시만 기다려 주세요.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-6">마이그레이션 완료!</h2>
              
              <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">소설 표지 이전</span>
                  <span className="font-bold text-purple-600">{result?.novels}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">회차 메인 삽화 이전</span>
                  <span className="font-bold text-purple-600">{result?.episodes}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">본문 내 삽화 이전</span>
                  <span className="font-bold text-purple-600">{result?.contentImages}건</span>
                </div>
              </div>

              <button
                onClick={() => window.location.href = "/"}
                className="w-full py-4 bg-gray-900 text-white font-extrabold rounded-2xl"
              >
                홈으로 돌아가기
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
              <p className="text-red-600 text-sm mb-8">{error}</p>
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-gray-100 text-gray-600 font-extrabold rounded-2xl"
              >
                다시 시도하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
