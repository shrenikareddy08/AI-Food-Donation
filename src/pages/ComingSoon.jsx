import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

export default function ComingSoon({ title = 'Coming Soon' }) {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-9)' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 'var(--space-5)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--color-primary-50)',
          color: 'var(--color-primary-500)',
        }}>
          <Construction size={36} />
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            {title}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', maxWidth: '28rem' }}>
            This page is part of an upcoming phase of MealBridge. We're building it with the same care and attention to detail as the rest of the app.
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" leftIcon={ArrowLeft}>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
