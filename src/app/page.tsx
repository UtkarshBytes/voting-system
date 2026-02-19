import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Database, Camera, Lock, CheckCircle2, ChevronRight, Fingerprint } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 selection:bg-blue-100">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-gray-100/50 backdrop-blur-md bg-white/70 sticky top-0 z-50">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">SecureVote</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Login
          </Link>
          <Link href="/admin/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Admin Portal
          </Link>
          <Link href="/register">
            <Button className="rounded-full px-6 bg-gray-900 hover:bg-gray-800 text-white transition-all shadow-md hover:shadow-lg">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-6 lg:px-12 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Next-Gen Election Security
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                The Future of <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Secure Voting
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                Experience a secure, transparent, and biometric-enabled voting platform powered by custom blockchain technology. Democracy, upgraded.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 gap-2">
                    Register as Voter <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/verify" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-14 px-8 text-lg rounded-2xl border-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-300 gap-2">
                    Verify Vote <ShieldCheck className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 pt-4">
                <div className="flex items-center gap-1">
                   <CheckCircle2 className="w-4 h-4 text-green-500" /> Government Grade
                </div>
                 <div className="flex items-center gap-1">
                   <CheckCircle2 className="w-4 h-4 text-green-500" /> E2E Encrypted
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:flex justify-center items-center animate-in fade-in zoom-in duration-1000 delay-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>

              {/* Mock UI Card */}
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Fingerprint className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900">Verification</h4>
                              <p className="text-xs text-gray-500">Identity Confirmed</p>
                          </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          VERIFIED
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="h-24 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-100 p-4 flex items-center gap-4">
                           <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex-shrink-0"></div>
                           <div className="space-y-2 w-full">
                               <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                               <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                           </div>
                      </div>
                      <div className="h-12 rounded-xl bg-blue-600 w-full flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-200">
                          Confirm Vote
                      </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -right-8 -top-8 p-4 bg-white rounded-2xl shadow-xl border border-gray-50 animate-bounce delay-700">
                      <Database className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="absolute -left-6 -bottom-6 p-4 bg-white rounded-2xl shadow-xl border border-gray-50 animate-bounce delay-1000">
                      <Lock className="w-6 h-6 text-green-500" />
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why SecureVote Section */}
        <section className="py-24 px-6 lg:px-12 bg-white relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why SecureVote?</h2>
              <p className="text-lg text-gray-600">
                Built on the principles of transparency, security, and accessibility. Our platform ensures every voice is counted accurately.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-100 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <Database className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Blockchain Powered</h3>
                <p className="text-gray-500 leading-relaxed">
                  Every vote is recorded as a transaction on an immutable ledger. This prevents tampering and ensures complete auditability of results.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:border-purple-100 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                  <Camera className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Biometric Auth</h3>
                <p className="text-gray-500 leading-relaxed">
                  Advanced face recognition technology ensures that only the registered voter can cast a ballot, eliminating identity fraud.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:border-green-100 hover:-translate-y-2 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
                  <ShieldCheck className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verifiable Results</h3>
                <p className="text-gray-500 leading-relaxed">
                  Voters receive a cryptographic receipt to instantly verify their vote on the blockchain network without exposing their choice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 px-6 lg:px-12">
            <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 p-12 text-center text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full -ml-16 -mb-16 blur-3xl"></div>

                <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to Secure Your Vote?</h2>
                <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto relative z-10">
                    Join thousands of citizens participating in the most secure democratic process ever built.
                </p>
                <div className="flex justify-center gap-4 relative z-10">
                    <Link href="/register">
                        <Button size="lg" className="h-14 px-8 text-blue-900 bg-white hover:bg-gray-100 font-bold rounded-2xl">
                            Register Now
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-200 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-bold text-lg text-gray-700">SecureVote</span>
            </div>
            <p className="text-sm text-gray-500">© 2024 SecureVote. Built for the Future of Democracy.</p>
        </div>
      </footer>
    </div>
  );
}
