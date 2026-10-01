import { useNavigate } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Sparkles } from 'lucide-react';

import Logo from '../components/Logo';
import Button from '../components/Button';

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="welcome-page">
      <div className="welcome-page__glow welcome-page__glow--one" />
      <div className="welcome-page__glow welcome-page__glow--two" />

      <div className="welcome-page__content">
        <div className="welcome-page__brand animate-fade-in-down">
          <div className="welcome-page__icon">
            <HeartHandshake size={34} strokeWidth={2} />
          </div>

          <Logo
            size="lg"
            showText
            to="/"
          />

          <div className="welcome-page__tagline">
            Share Food. Bridge Needs. Create Impact.
          </div>
        </div>

        <div className="welcome-page__message animate-fade-in-up">
          <div className="welcome-page__eyebrow">
            <Sparkles size={15} />
            Together, we can reduce food waste
          </div>

          <h1>
            Good Food.
            <br />
            <span>Better Purpose.</span>
          </h1>

          <p>
            Connect surplus food with organizations and people who need it.
            One meal at a time, one connection at a time.
          </p>
        </div>

        <div className="welcome-page__action animate-fade-in-up">
          <Button
            size="lg"
            rightIcon={ArrowRight}
            onClick={() => navigate('/select-role')}
            className="welcome-page__login"
          >
            Login
          </Button>
        </div>

        <p className="welcome-page__footer animate-fade-in">
          A community-powered food sharing platform
        </p>
      </div>
    </main>
  );
}