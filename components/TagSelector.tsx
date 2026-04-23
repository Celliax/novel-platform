"use client";

import { useState, useEffect, useMemo } from "react";
import { Tag } from "@/lib/types";
import { Search, Plus, X, Loader2, Hash } from "lucide-react";

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
}

export default function TagSelector({ selectedTags, onTagsChange, maxTags = 10 }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) {
      return isExpanded ? availableTags : availableTags.slice(0, 20);
    }
    return availableTags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableTags, searchTerm, isExpanded]);

  const isExactMatch = useMemo(() => {
    return availableTags.some(tag => tag.name.toLowerCase() === searchTerm.trim().toLowerCase());
  }, [availableTags, searchTerm]);

  const handleCreateTag = async () => {
    const tagName = searchTerm.trim();
    if (!tagName || isExactMatch || isCreating) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tagName,
          color: "#6B7280", // 기본 색상
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onTagsChange([...selectedTags, data.tag]);
        setSearchTerm("");
        loadTags(); // 전체 목록 갱신
      } else {
        alert(data.error || "태그 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("태그 추가 실패:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length >= maxTags) {
        alert(`최대 ${maxTags}개까지 선택할 수 있습니다.`);
        return;
      }
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isExactMatch && searchTerm.trim()) {
        handleCreateTag();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="태그 검색 또는 직접 입력 후 엔터"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all outline-none"
        />
        {searchTerm && !isExactMatch && (
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={isCreating}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {isCreating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            추가
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-1">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-black border border-purple-200 shadow-sm transition-all hover:bg-purple-200"
            >
              <Hash size={12} className="text-purple-400" />
              {tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="ml-1 text-purple-400 hover:text-purple-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions / Available Tags */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-2 ml-1">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">추천 태그</p>
          {!searchTerm && availableTags.length > 20 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              {isExpanded ? "접기 ▲" : `더보기 (${availableTags.length - 20}개+) ▼`}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => {
              const isSelected = selectedTags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                    ${isSelected 
                      ? "bg-purple-600 border-purple-600 text-white shadow-md scale-95" 
                      : "bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                    }
                  `}
                >
                  {tag.name}
                </button>
              );
            })
          ) : (
            searchTerm && !isCreating && (
              <p className="text-xs text-gray-400 ml-1 py-2 font-medium">검색 결과가 없습니다. 우측의 [+ 추가] 버튼을 눌러 새 태그를 만드세요.</p>
            )
          )}
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 ml-1">
        ※ 이미 있는 태그는 목록에서 선택하고, 없는 태그는 입력 후 엔터를 치면 새로 만들어집니다.
      </p>
    </div>
  );
}