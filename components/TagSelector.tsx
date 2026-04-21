"use client";

import { useState, useEffect } from "react";
import { Tag } from "@/lib/novel-service";

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
}

export default function TagSelector({ selectedTags, onTagsChange, maxTags = 10 }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags);
      }
    } catch (error) {
      console.error("태그 로드 실패:", error);
    }
  };

  const addTag = async () => {
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 새 태그를 선택된 태그에 추가
        onTagsChange([...selectedTags, data.tag]);
        setNewTagName("");
        setNewTagColor("#6B7280");
        setShowAddForm(false);
        // 태그 목록 새로고침
        loadTags();
      } else if (response.status === 409) {
        // 이미 존재하는 태그인 경우 기존 태그 선택
        if (!selectedTags.find(tag => tag.id === data.tag.id)) {
          onTagsChange([...selectedTags, data.tag]);
        }
        setNewTagName("");
        setShowAddForm(false);
      } else {
        alert(data.error || "태그 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("태그 추가 실패:", error);
      alert("태그 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.find(t => t.id === tag.id);
    if (isSelected) {
      // 태그 제거
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      // 태그 추가 (최대 개수 체크)
      if (selectedTags.length >= maxTags) {
        alert(`최대 ${maxTags}개까지 선택할 수 있습니다.`);
        return;
      }
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tagId: number) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <div className="space-y-4">
      {/* 선택된 태그들 */}
      {selectedTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            선택된 태그 ({selectedTags.length}/{maxTags})
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-purple-700 bg-white border border-purple-300 shadow-sm"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="ml-2 w-4 h-4 flex items-center justify-center rounded-full bg-purple-200 text-purple-700 hover:bg-purple-300 transition-colors"
                  aria-label={`${tag.name} 태그 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 사용 가능한 태그들 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          태그 선택
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.find(t => t.id === tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "text-purple-700 border-2 border-purple-500 bg-purple-50 shadow-sm"
                    : "text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                }`}
                disabled={!isSelected && selectedTags.length >= maxTags}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 새 태그 추가 */}
      <div>
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            disabled={selectedTags.length >= maxTags}
          >
            + 태그 추가
          </button>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  태그 이름
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="새 태그 이름"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  색상
                </label>
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTagName("");
                  setNewTagColor("#6B7280");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={addTag}
                disabled={loading || !newTagName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}