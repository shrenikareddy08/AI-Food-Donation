import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  Heart,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function NgoProfile() {
  const { user } = useAuth();

  const initials = (
    user?.orgName ||
    user?.name ||
    'N'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-9)',
      }}
    >
      <div className="page-header">
        <h1 className="page-header__title">
          Organization Profile
        </h1>

        <p className="page-header__subtitle">
          Manage your NGO account details
        </p>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          {initials}
        </div>

        <div className="profile-header__info">
          <span className="profile-header__role">
            NGO Account
          </span>

          <h1>
            {user?.orgName ||
              user?.name ||
              'Helping Hands NGO'}
          </h1>

          <span className="profile-header__verified">
            <ShieldCheck size={16} />
            Verified Organization
          </span>
        </div>
      </div>

      <div className="profile-details">

        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Mail
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Email
          </span>

          <span className="profile-detail-item__value">
            {user?.email ||
              'priya@helpinghands.in'}
          </span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Phone
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Phone
          </span>

          <span className="profile-detail-item__value">
            {user?.phone ||
              '+91 98123 45678'}
          </span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <MapPin
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Location
          </span>

          <span className="profile-detail-item__value">
            {user?.location ||
              'Jubilee Hills, Hyderabad, Telangana'}
          </span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Building2
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Address
          </span>

          <span className="profile-detail-item__value">
            {user?.address ||
              'Road No. 36, Jubilee Hills, Hyderabad'}
          </span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Package
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Capacity
          </span>

          <span className="profile-detail-item__value">
            {user?.capacity
              ? `${user.capacity} ${user.capacityUnit}`
              : '200 meals/day'}
          </span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Heart
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Food Requirements
          </span>

          <span className="profile-detail-item__value">
            {user?.foodRequirements ||
              'Cooked meals, Rice, Vegetables, Fruits'}
          </span>
        </div>

      </div>
    </div>
  );
}