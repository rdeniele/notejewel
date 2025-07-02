import Image from "next/image";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Power of Spaced Repetition for Long-Term Memory | NoteJewel Blog",
  description: "Why do top students use spaced repetition? See the research and practical tips for using it in your own studies.",
  openGraph: {
    title: "The Power of Spaced Repetition for Long-Term Memory | NoteJewel Blog",
    description: "Why do top students use spaced repetition? See the research and practical tips for using it in your own studies.",
    url: "https://notejewel.vercel.app/blog/blog3",
    images: [
      {
        url: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80",
        width: 800,
        height: 400,
        alt: "Student reviewing notes with spaced repetition"
      }
    ],
    type: "article"
  },
  twitter: {
    card: "summary_large_image",
    title: "The Power of Spaced Repetition for Long-Term Memory | NoteJewel Blog",
    description: "Why do top students use spaced repetition? See the research and practical tips for using it in your own studies.",
    images: ["https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80"]
  },
  robots: { index: true, follow: true }
};

export default function Blog3() {
  return (
    <article className="max-w-2xl mx-auto py-16 px-4">
      <Image
        src="https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80"
        alt="Student reviewing notes with spaced repetition"
        width={800}
        height={400}
        className="w-full h-64 object-cover rounded-xl mb-8"
        priority
      />
      <h1 className="text-3xl font-bold mb-4">The Power of Spaced Repetition for Long-Term Memory</h1>
      <p className="text-muted-foreground mb-8">Published July 3, 2024 • 5 min read</p>
      <section className="prose prose-neutral max-w-none mb-8">
        <p>
          Spaced repetition is a learning technique that involves reviewing information at increasing intervals. This method is proven to enhance long-term memory and is used by top students and professionals worldwide.
        </p>
        <h2>How It Works</h2>
        <p>
          Instead of cramming, spaced repetition schedules reviews just before you're likely to forget. This strengthens memory and makes recall easier over time. Apps like <a href="https://apps.ankiweb.net/" target="_blank" rel="noopener">Anki</a> and <a href="https://quizlet.com/" target="_blank" rel="noopener">Quizlet</a> use this principle.
        </p>
        <h2>The Science</h2>
        <p>
          Research by <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4031794/" target="_blank" rel="noopener">Cepeda et al. (2006)</a> and others shows that spaced repetition leads to better long-term retention than massed practice.
        </p>
        <h2>Practical Tips</h2>
        <ul>
          <li>Use digital flashcards that schedule reviews automatically.</li>
          <li>Start early and review material over days or weeks.</li>
          <li>Mix old and new content in each session.</li>
        </ul>
        <p>
          For more, see <a href="https://www.scientificamerican.com/article/the-secret-to-learning-a-foreign-language/" target="_blank" rel="noopener">Scientific American</a> and <a href="https://www.learningscientists.org/blog/2016/7/14-1" target="_blank" rel="noopener">The Learning Scientists</a>.
        </p>
      </section>
      <div className="flex gap-4">
        <Link href="/blog" className="text-primary hover:underline">← Back to Blog</Link>
      </div>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "The Power of Spaced Repetition for Long-Term Memory",
            "image": "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80",
            "datePublished": "2024-07-03",
            "author": { "@type": "Organization", "name": "NoteJewel" },
            "publisher": { "@type": "Organization", "name": "NoteJewel" },
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://notejewel.vercel.app/blog/blog3" },
            "description": "Why do top students use spaced repetition? See the research and practical tips for using it in your own studies.",
            "url": "https://notejewel.vercel.app/blog/blog3"
          })
        }}
      />
    </article>
  );
} 