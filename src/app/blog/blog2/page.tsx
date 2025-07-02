import Image from "next/image";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "5 Proven Study Techniques Backed by Science | NoteJewel Blog",
  description: "Explore evidence-based study methods that boost retention and performance. Learn what works, according to cognitive science.",
  openGraph: {
    title: "5 Proven Study Techniques Backed by Science | NoteJewel Blog",
    description: "Explore evidence-based study methods that boost retention and performance. Learn what works, according to cognitive science.",
    url: "https://notejewel.vercel.app/blog/blog2",
    images: [
      {
        url: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
        width: 800,
        height: 400,
        alt: "Student with books and notes"
      }
    ],
    type: "article"
  },
  twitter: {
    card: "summary_large_image",
    title: "5 Proven Study Techniques Backed by Science | NoteJewel Blog",
    description: "Explore evidence-based study methods that boost retention and performance. Learn what works, according to cognitive science.",
    images: ["https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80"]
  },
  robots: { index: true, follow: true }
};

export default function Blog2() {
  return (
    <article className="max-w-2xl mx-auto py-16 px-4">
      <Image
        src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80"
        alt="Student with books and notes"
        width={800}
        height={400}
        className="w-full h-64 object-cover rounded-xl mb-8"
        priority
      />
      <h1 className="text-3xl font-bold mb-4">5 Proven Study Techniques Backed by Science</h1>
      <p className="text-muted-foreground mb-8">Published July 4, 2024 • 7 min read</p>
      <section className="prose prose-neutral max-w-none mb-8">
        <p>
          Not all study methods are created equal. Here are five techniques supported by cognitive science and educational research:
        </p>
        <ol>
          <li><strong>Spaced Repetition</strong>: Review material over increasing intervals. <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4031794/" target="_blank" rel="noopener">Research</a> shows this boosts long-term retention.</li>
          <li><strong>Active Recall</strong>: Test yourself rather than just rereading. <a href="https://www.scientificamerican.com/article/a-learning-secret-don-t-take-notes-with-a-laptop/" target="_blank" rel="noopener">Studies</a> confirm this deepens learning.</li>
          <li><strong>Interleaving</strong>: Mix different topics or problem types in a single study session. <a href="https://www.psychologicalscience.org/observer/interleaving-theory-and-practice" target="_blank" rel="noopener">Evidence</a> suggests this improves transfer and mastery.</li>
          <li><strong>Elaboration</strong>: Explain concepts in your own words and connect them to what you know. <a href="https://www.cultofpedagogy.com/elaboration/" target="_blank" rel="noopener">Research</a> supports this for deeper understanding.</li>
          <li><strong>Dual Coding</strong>: Combine words and visuals (like diagrams or mind maps). <a href="https://www.learningscientists.org/blog/2016/6/23-1" target="_blank" rel="noopener">Studies</a> show this helps memory and comprehension.</li>
        </ol>
        <p>
          For more, see the <a href="https://www.learningscientists.org/" target="_blank" rel="noopener">Learning Scientists</a> and <a href="https://www.apa.org/ed/precollege/psn/2015/09/effective-learning" target="_blank" rel="noopener">APA's guide to effective learning</a>.
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
            "headline": "5 Proven Study Techniques Backed by Science",
            "image": "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
            "datePublished": "2024-07-04",
            "author": { "@type": "Organization", "name": "NoteJewel" },
            "publisher": { "@type": "Organization", "name": "NoteJewel" },
            "mainEntityOfPage": { "@type": "WebPage", "@id": "https://notejewel.vercel.app/blog/blog2" },
            "description": "Explore evidence-based study methods that boost retention and performance. Learn what works, according to cognitive science.",
            "url": "https://notejewel.vercel.app/blog/blog2"
          })
        }}
      />
    </article>
  );
} 