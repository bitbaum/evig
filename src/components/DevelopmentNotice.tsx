import Link from 'next/link';

export default function DevelopmentNotice() {
  return (
    <div className="bg-yellow-500 text-black py-2 px-4 text-center font-medium">
      <p>
        🚧 Dies ist eine Entwicklungssite. Für die aktuelle Live-Site besuchen Sie bitte{' '}
        <Link href="https://revamp-it.ch" className="underline hover:text-black/80">
          revamp-it.ch
        </Link>
      </p>
    </div>
  );
} 