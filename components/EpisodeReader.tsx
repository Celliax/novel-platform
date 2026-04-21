interface EpisodeReaderProps {
  title: string;
  contentHtml: string;
  image?: string;
}

export default function EpisodeReader({ title, contentHtml, image }: EpisodeReaderProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 pb-8 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
      </header>
      {image && (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-border">
          <img src={image} alt="에피소드 삽화" className="w-full h-auto" />
        </div>
      )}
      <div
        className="reader-content text-foreground/95 text-lg leading-[1.85] space-y-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  );
}
