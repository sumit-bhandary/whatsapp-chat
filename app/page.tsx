import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { MessageCircle, ArrowRight, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-b-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4 px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <MessageCircle className="h-8 w-8 text-green-600" />
            <span>trial</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content - Centered Sign In/Up */}
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center space-y-8 max-w-md">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">trial</h1>
            <p className="text-lg text-muted-foreground">
              Whatsapp Chat App
            </p>
          </div>

          <div className="space-y-3 pt-8">
            <Link 
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg shadow-green-600/30"
            >
              Sign In
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/auth/sign-up"
              className="flex items-center justify-center gap-2 w-full border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Sign Up
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
