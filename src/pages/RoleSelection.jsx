import { useNavigate } from 'react-router-dom';
import {
  HandHeart,
  Building2,
  Bike,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import Logo from '../components/Logo';

const ROLES = [
  {
    id: 'DONOR',
    title: 'Donor',
    description: 'Share surplus food with people who need it.',
    icon: HandHeart,
  },
  {
    id: 'NGO',
    title: 'NGO',
    description: 'Receive food donations and manage your needs.',
    icon: Building2,
  },
  {
    id: 'VOLUNTEER',
    title: 'Volunteer',
    description: 'Help pick up and deliver food to the destination.',
    icon: Bike,
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    description: 'Manage and monitor the MealBridge platform.',
    icon: ShieldCheck,
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    sessionStorage.setItem(
      'mealbridge_selected_role',
      role.id
    );

    navigate('/login', {
      state: {
        role: role.id,
      },
    });
  };

  return (
    <main className="role-selection-page">
      <div className="role-selection-page__top">
        <button
          type="button"
          className="role-selection-page__back"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <Logo
          size="md"
          showText
          to="/"
        />
      </div>

      <div className="role-selection-page__content">
        <div className="role-selection-page__heading">
          <span className="role-selection-page__eyebrow">
            Welcome to MealBridge
          </span>

          <h1>How would you like to continue?</h1>

          <p>
            Select your role to continue to the secure login.
          </p>
        </div>

        <div className="role-selection-page__grid">
          {ROLES.map((role) => {
            const Icon = role.icon;

            return (
              <button
                key={role.id}
                type="button"
                className="role-card"
                onClick={() => handleRoleSelect(role)}
              >
                <div className="role-card__icon">
                  <Icon size={28} strokeWidth={2} />
                </div>

                <div className="role-card__content">
                  <h2>{role.title}</h2>
                  <p>{role.description}</p>
                </div>

                <div className="role-card__arrow">
                  <ArrowRight size={18} />
                </div>
              </button>
            );
          })}
        </div>

        <p className="role-selection-page__note">
          Your selected role will determine the features available
          after login.
        </p>
      </div>
    </main>
  );
}