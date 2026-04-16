interface EpisodeReaderProps {
  title: string;
  contentHtml: string;
}

export default function EpisodeReader({ title, contentHtml }: EpisodeReaderProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 pb-8 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
      </header>
      <div
        className="reader-content text-foreground/95 text-lg leading-[1.85] space-y-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  );
}
