import { MapPin, Clock, Package, TrendingUp, Users } from 'lucide-react';
import Button from './Button';
import { formatDistance } from '../utils/distance';
import { cn } from '../utils/cn';

import { getFoodImage } from '../utils/foodImages';

export default function FoodCard({ food, onRequest, className }) {
  const {
    name,
    foodType,
    quantity,
    unit,
    distanceKm,
    area,
    city,
    availableUntil,
    matchScore,
    image,
    status = 'AVAILABLE',
  } = food;

  const resolvedImage = getFoodImage(food);

  return (
    <article className={cn('food-card', className)}>
      <div className="food-card__image-wrap">
        <img
          src={resolvedImage}
          alt={name}
          className="food-card__image"
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.includes('food-default')) {
              e.currentTarget.src = '/images/food-default.jpg';
            }
          }}
        />
        <span className="food-card__type-badge">{foodType}</span>
        {matchScore != null && (
          <span className="food-card__match-badge">
            <TrendingUp size={12} />
            {matchScore}% Match
          </span>
        )}
      </div>

      <div className="food-card__body">
        <h3 className="food-card__name">{name}</h3>

        <div className="food-card__meta">
          <span className="food-card__quantity">
            <Package size={14} />
            {quantity} {unit}
          </span>
          {distanceKm != null && (
            <span className="food-card__distance">
              <MapPin size={14} />
              {formatDistance(distanceKm)} away
            </span>
          )}
        </div>

        {(area || city) && (
          <div className="food-card__location">
            <MapPin size={13} />
            {area && city ? `${area}, ${city}` : area || city}
          </div>
        )}

        {availableUntil && (
          <div className="food-card__expiry">
            <Clock size={13} />
            Available until {availableUntil}
          </div>
        )}

        <div className="food-card__footer">
          <Button
            size="sm"
            variant="primary"
            fullWidth
            onClick={() => onRequest?.(food)}
          >
            Request Food
          </Button>
        </div>
      </div>
    </article>
  );
}
