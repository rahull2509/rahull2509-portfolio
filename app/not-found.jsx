import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <h1 style={{ fontSize: '120px', fontWeight: 900, lineHeight: 1, color: '#2563EB' }}>
        404
      </h1>
      <p style={{ fontSize: '20px', color: '#4b5563', marginBottom: '32px' }}>
        Page not found
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          fontSize: '15px',
          fontWeight: 600,
          borderRadius: '8px',
          backgroundColor: '#2563EB',
          color: '#fff',
          textDecoration: 'none',
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
