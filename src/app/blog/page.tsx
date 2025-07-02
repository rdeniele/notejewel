import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NoteJewel Blog | Study Tips, AI Learning, and Productivity",
  description: "Read the latest on AI-powered study, productivity, and learning science. Curated by NoteJewel with real research and actionable advice.",
  keywords: [
    "study tips",
    "AI learning",
    "productivity",
    "note-taking",
    "learning science",
    "student success",
    "NoteJewel blog"
  ],
  openGraph: {
    title: "NoteJewel Blog | Study Tips, AI Learning, and Productivity",
    description: "Read the latest on AI-powered study, productivity, and learning science. Curated by NoteJewel with real research and actionable advice.",
    url: "https://notejewel.vercel.app/blog",
    siteName: "NoteJewel",
    images: [
      {
        url: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
        width: 800,
        height: 400,
        alt: "Student studying with laptop and notes"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NoteJewel Blog | Study Tips, AI Learning, and Productivity",
    description: "Read the latest on AI-powered study, productivity, and learning science.",
    images: ["https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"]
  },
  robots: {
    index: true,
    follow: true
  }
};

const blogs = [
  {
    slug: "blog1",
    title: "How AI is Revolutionizing Student Learning",
    excerpt: "Discover how artificial intelligence is transforming the way students learn, retain, and apply knowledge. Real-world examples and research included.",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
    date: "2024-07-05",
  },
  {
    slug: "blog2",
    title: "5 Proven Study Techniques Backed by Science",
    excerpt: "Explore evidence-based study methods that boost retention and performance. Learn what works, according to cognitive science.",
    image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
    date: "2024-07-04",
  },
  {
    slug: "blog3",
    title: "The Power of Spaced Repetition for Long-Term Memory",
    excerpt: "Why do top students use spaced repetition? See the research and practical tips for using it in your own studies.",
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80",
    date: "2024-07-03",
  },
];

export default function BlogPage() {
  return (
    <main className="max-w-4xl mx-auto py-16 px-4">
      {/* Back Button */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to NoteJewel
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">NoteJewel Blog</h1>
      <p className="text-lg text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
        Actionable insights, research, and tips for smarter studying and learning. Curated by the NoteJewel team.
      </p>
      <div className="grid md:grid-cols-3 gap-8">
        {blogs.map((blog) => (
          <div key={blog.slug} className="bg-muted/30 border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col">
            <Link href={`/blog/${blog.slug}`}>
              <Image
                src={blog.image}
                alt={blog.title}
                width={800}
                height={400}
                className="w-full h-48 object-cover"
                priority
              />
            </Link>
            <div className="p-6 flex-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
              </h2>
              <p className="text-muted-foreground mb-4 flex-1">{blog.excerpt}</p>
              <Link href={`/blog/${blog.slug}`} className="text-primary font-medium hover:underline mt-auto">Read More →</Link>
            </div>
          </div>
        ))}
      </div>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "NoteJewel Blog",
            "description": "Actionable insights, research, and tips for smarter studying and learning.",
            "url": "https://notejewel.vercel.app/blog",
            "blogPost": blogs.map(blog => ({
              "@type": "BlogPosting",
              "headline": blog.title,
              "image": blog.image,
              "datePublished": blog.date,
              "url": `https://notejewel.vercel.app/blog/${blog.slug}`
            }))
          })
        }}
      />
    </main>
  );
} 