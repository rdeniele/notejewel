import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NoteJewel Blog | Study Tips, AI Learning, and Productivity",
  description: "Read the latest on AI-powered study, productivity, and learning science. Curated content with evidence-based insights and actionable advice.",
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
    description: "Read the latest on AI-powered study, productivity, and learning science. Curated content with evidence-based insights and actionable advice.",
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
    title: "How AI is Revolutionizing Student Learning: A Comprehensive Analysis",
    excerpt: "Discover how artificial intelligence is transforming education with significant improvements in learning outcomes. Evidence-based insights from published research, real-world case studies, and practical implementation strategies for students and educators.",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
    date: "2024-07-05",
    readTime: "12 min read",
    category: "AI & Education"
  },
  {
    slug: "blog2",
    title: "5 Proven Study Techniques Backed by Science: Transform Your Learning",
    excerpt: "Master evidence-based study methods that improve retention by 200-400%. Complete guide to spaced repetition, active recall, interleaving, elaboration, and dual coding with practical implementation strategies.",
    image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
    date: "2024-07-04",
    readTime: "15 min read",
    category: "Study Methods"
  },
  {
    slug: "blog3",
    title: "The Power of Spaced Repetition: Master Any Subject in Half the Time",
    excerpt: "Uncover the neuroscience behind spaced repetition and why it increases retention by 200-300%. Complete guide from beginner to expert with tools, algorithms, and real success stories from medical students to polyglots.",
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80",
    date: "2024-07-03",
    readTime: "18 min read",
    category: "Memory & Learning"
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
      <p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
        In-depth, evidence-based articles on learning science, study techniques, and educational technology. 
        Every article compiles information from published research, practical implementation guides, and real-world case studies.
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
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                  {blog.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {blog.readTime}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2 leading-tight">
                <Link href={`/blog/${blog.slug}`} className="hover:text-primary transition-colors">
                  {blog.title}
                </Link>
              </h2>
              <p className="text-muted-foreground mb-4 flex-1 text-sm leading-relaxed">
                {blog.excerpt}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {new Date(blog.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <Link 
                  href={`/blog/${blog.slug}`} 
                  className="text-primary font-medium hover:underline text-sm flex items-center gap-1"
                >
                  Read More 
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
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
            "description": "Actionable insights and tips for smarter studying and learning, compiled from educational research and evidence-based practices.",
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