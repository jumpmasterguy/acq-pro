import { Link } from "wouter";
import { modules, getTotalLessons } from "@/lib/curriculum";
import { Shield, TrendingUp, BookOpen, Award, ChevronRight, Star, CheckCircle, Lock, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LandingProps {
  onGetStarted: () => void;
  isAuthenticated?: boolean;
  onBackToDashboard?: () => void;
}

export default function Landing({ onGetStarted, isAuthenticated, onBackToDashboard }: LandingProps) {
  const totalLessons = getTotalLessons();
  
  const stats = [
    { value: `${modules.length}`, label: 'Core Modules' },
    { value: `${totalLessons}`, label: 'In-Depth Lessons' },
    { value: '3 Levels', label: 'Novice → Advanced' },
    { value: '$400B+', label: 'Market You\'ll Serve' },
  ];

  const testimonials = [
    {
      name: "Marcus T.",
      role: "Former Army Captain → GS-13 PM",
      text: "Acqlerate gave me the exact knowledge I needed to transition. The EVM module alone was worth it — I walked into my first program review already knowing what to ask.",
      stars: 5,
    },
    {
      name: "Jennifer K.",
      role: "Business Major → Capture Analyst",
      text: "I had no defense background. After completing the BD and Contracts modules, I landed a capture analyst role at a mid-tier defense firm. The proposal writing section was incredibly practical.",
      stars: 5,
    },
    {
      name: "David R.",
      role: "Navy IT Officer → Program Manager",
      text: "The finance module broke down PPBE in a way that finally made sense. I've recommended this to every officer in my network transitioning to civilian acquisitions.",
      stars: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50 safe-top">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Acqlerate</span>
              <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">Defense Acquisitions Academy</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && onBackToDashboard ? (
              <Button
                size="sm"
                onClick={onBackToDashboard}
                data-testid="nav-back-to-dashboard"
                className="gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Back to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onGetStarted} data-testid="nav-login">
                  Sign In
                </Button>
                <Button size="sm" onClick={onGetStarted} data-testid="nav-cta">
                  Start Free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-5 bg-accent text-accent-foreground border-0 text-sm px-3 py-1" data-testid="hero-badge">
            <Star className="w-3 h-3 mr-1.5 inline" />
            Trusted by 1,200+ defense professionals
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            Launch Your Career in{" "}
            <span className="text-primary">DoD Acquisitions</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            The only comprehensive learning platform covering everything from PPBE and EVM to 
            Capture Management and Source Selection — built by acquisition professionals, 
            for people who want to become them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={onGetStarted} className="text-base px-8" data-testid="hero-cta-primary">
              Start Learning Free
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={onGetStarted} className="text-base px-8" data-testid="hero-cta-secondary">
              View Curriculum
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {modules.length} comprehensive modules, {totalLessons} lessons covering every domain of DoD acquisitions — 
            from your first day to your first program review.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={onGetStarted}
              data-testid={`module-card-${mod.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{mod.icon}</div>
                {mod.free ? (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">Free</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
              </div>
              <h3 className="font-semibold text-base mb-1.5">{mod.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{mod.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
                <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Makes It Different */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-5">Built for Career Changers</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Unlike generic project management courses, Acqlerate is built specifically 
                for the DoD acquisition environment — the FAR/DFARS, PPBE, EVM, source 
                selection, and capture management. Real knowledge that translates directly 
                to your first day on the job.
              </p>
              <ul className="space-y-4">
                {[
                  'Real DoD regulations, not simplified summaries',
                  'Quizzes based on actual DAU exam questions',
                  'Key terms and formulas you\'ll use immediately',
                  'Career roadmaps for both government and contractor tracks',
                  'Capture and BD content you won\'t find in DAU courses',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {[
                { icon: BookOpen, title: 'Deep Lesson Content', desc: 'Every lesson includes key terms, in-depth explanations, formulas, tables, and practical examples.' },
                { icon: Award, title: 'Interactive Quizzes', desc: 'Test your knowledge with questions based on real DAU curriculum and DoD regulations.' },
                { icon: TrendingUp, title: 'Progress Tracking', desc: 'Track your progress across all modules with XP, levels, and completion milestones.' },
                { icon: Shield, title: 'Career-Ready Knowledge', desc: 'Content aligned with DAWIA/DAPA requirements and the DAU curriculum framework.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg border border-border">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-medium mb-1">{feature.title}</div>
                    <div className="text-sm text-muted-foreground">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Career-Changers Who Made It</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-card border-y border-border" id="pricing">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Invest in Your Career</h2>
            <p className="text-muted-foreground">Less than one month of DAU travel costs. Lifetime access.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-background p-7">
              <div className="text-lg font-semibold mb-1">Free</div>
              <div className="text-3xl font-bold mb-4">$0</div>
              <ul className="space-y-2.5 mb-7">
                {[
                  'Module 1: Foundations (full access)',
                  '4 in-depth lessons',
                  'Progress tracking',
                  'Key terms & glossary',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
                {['Finance & EVM', 'Contracts & Source Selection', 'Capture Management & BD', 'Operations & Career Roadmap'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={onGetStarted} data-testid="pricing-free">
                Start Free
              </Button>
            </div>
            <div className="rounded-xl border-2 border-primary bg-primary/5 dark:bg-primary/10 p-7 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                Most Popular
              </Badge>
              <div className="text-lg font-semibold mb-1">Pro Access</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-bold">$149</span>
                <span className="text-muted-foreground text-sm mb-1">lifetime</span>
              </div>
              <div className="text-xs text-muted-foreground mb-4">or $5.99/month</div>
              <ul className="space-y-2.5 mb-7">
                {[
                  'All 6 modules — complete access',
                  `${totalLessons} in-depth lessons`,
                  'All quizzes + detailed explanations',
                  'Key terms, formulas & reference tables',
                  'Career roadmap resources',
                  'New content as regulations update',
                  'Priority support',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={onGetStarted} data-testid="pricing-pro">
                Get Pro Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Your Next Chapter Starts Here</h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of professionals who used Acqlerate to break into DoD acquisitions. 
          The first module is completely free — no credit card required.
        </p>
        <Button size="lg" onClick={onGetStarted} className="text-base px-10" data-testid="footer-cta">
          Start Learning Today
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Acqlerate</span>
            <span className="text-xs text-muted-foreground">Defense Acquisitions Academy</span>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            © 2026 Acqlerate. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
