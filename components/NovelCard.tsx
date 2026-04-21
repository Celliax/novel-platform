import Link from "next/link";
import Image from "next/image";
import { Eye, Star } from "lucide-react";

interface NovelCardProps {
  id: number;
  title: string;
  author: string;
  genre: string;
  ageRating?: string;
  coverImage: string;
  views: number;
  rating: number;
}

export default function NovelCard({
  id,
  title,
  author,
  genre,
  ageRating,
  coverImage,
  views,
  rating,
}: NovelCardProps) {
  const src = coverImage || "/placeholder-cover.svg";

  return (
    <Link href={`/novel/${id}`} className="block group">
      <div className="bg-surface rounded-2xl shadow-card hover:shadow-card-hover ring-1 ring-border/60 hover:ring-brand-200 transition-all overflow-hidden">
        <div className="aspect-[2/3] bg-muted relative">
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-md font-medium">
              {genre}
            </span>
            {ageRating === "15세 이용가" && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] rounded font-bold">15</span>
            )}
            {ageRating === "19세 이용가" && (
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] rounded font-bold">19</span>
            )}
          </div>
          <h3 className="font-bold text-lg line-clamp-1 text-foreground">{title}</h3>
          <p className="text-sm text-muted">{author}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Eye size={14} aria-hidden /> {views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" aria-hidden />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
