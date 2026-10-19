import Link from 'next/link';
import { StoryArt, StoryCredit } from '@/components/brand/StoryArt';

export function AuthFrame({
  title,
  text,
  art,
  children,
}: {
  title: string;
  text: string;
  art: 'login' | 'welcome';
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 px-4 py-8">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <StoryArt name={art} alt="" className="w-full max-w-sm mx-auto" />
          <StoryCredit className="text-center mt-2" />
        </div>
        <div className="w-full max-w-md mx-auto">
          <Link href="/" className="text-sm font-bold text-gray-900 dark:text-white">Invitia</Link>
          <h1 className="font-serif text-3xl text-gray-900 dark:text-white mt-4">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">{text}</p>
          <div className="md:hidden mb-4">
            <StoryArt name={art} alt="" className="w-40 mx-auto" />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            {children}
          </div>
          <StoryCredit className="md:hidden text-center mt-4" />
        </div>
      </div>
    </div>
  );
}
