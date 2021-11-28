import { useRouter } from 'next/router';

export default function Header(): JSX.Element {
  const router = useRouter();

  return (
    <header>
      {/* eslint-disable-next-line */}
      <img
        src="/logo.svg"
        alt="logo"
        onClick={() => router.push(`/`, '', { shallow: true })}
      />
    </header>
  );
}
