import Link from 'next/link';

export default function DevelopmentNotice() {
  return (
    <div className="bg-yellow-500 text-black py-2 px-4 text-center font-medium">
      <p>
        🚧 This is a development site. For the current live site, please visit{' '}
        <Link href="https://revamp-it.ch" className="underline hover:text-black/80">
          revamp-it.ch
        </Link>
      </p>
    </div>
  );
} 