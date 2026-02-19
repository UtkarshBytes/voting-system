import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Database, Camera } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span>SecureVote</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 md:px-12 flex flex-col items-center text-center gap-8 bg-gradient-to-b from-background to-secondary/20">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            The Future of Voting is Here
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Experience a secure, transparent, and biometric-enabled voting platform powered by custom blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-lg gap-2">
                Register as Voter <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                Admin Portal
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 md:px-12 grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 w-fit rounded-lg bg-primary/10 text-primary">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Blockchain Powered</h3>
            <p className="text-muted-foreground">
              Every vote is a transaction recorded on an immutable ledger, ensuring transparency and preventing tampering.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 w-fit rounded-lg bg-primary/10 text-primary">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Biometric Auth</h3>
            <p className="text-muted-foreground">
              Optional face recognition adds an extra layer of security, ensuring that only the registered voter can cast a ballot.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 w-fit rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Verifiable Results</h3>
            <p className="text-muted-foreground">
              Voters receive a cryptographic receipt to verify their vote on the blockchain. Results are public and audit-proof.
            </p>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>© 2024 SecureVote. Educational Project.</p>
      </footer>
    </div>
  );
}
