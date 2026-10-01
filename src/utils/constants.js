export const FOOD_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Utensils' },
  { id: 'meals', label: 'Meals', icon: 'UtensilsCrossed' },
  { id: 'rice', label: 'Rice', icon: 'Rice' },
  { id: 'fruits', label: 'Fruits', icon: 'Apple' },
  { id: 'vegetables', label: 'Vegetables', icon: 'Carrot' },
  { id: 'bakery', label: 'Bakery', icon: 'Wheat' },
  { id: 'packaged', label: 'Packaged Food', icon: 'Package' },
];

export const DONATION_STATUSES = [
  'POSTED',
  'MATCHED',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
];

export const STATUS_CONFIG = {
  POSTED: { label: 'Posted', color: 'neutral', icon: 'Clock' },
  MATCHED: { label: 'Matched', color: 'info', icon: 'Handshake' },
  ASSIGNED: { label: 'Assigned', color: 'info', icon: 'UserCheck' },
  PICKED_UP: { label: 'Picked Up', color: 'info', icon: 'PackageCheck' },
  IN_TRANSIT: { label: 'In Transit', color: 'info', icon: 'Truck' },
  DELIVERED: { label: 'Delivered', color: 'success', icon: 'CheckCircle2' },
};

export const USER_ROLES = {
  DONOR: 'Donor',
  NGO: 'NGO',
  VOLUNTEER: 'Volunteer',
  ADMIN: 'Admin',
};

export const SORT_OPTIONS = [
  { id: 'nearest', label: 'Nearest First', icon: 'MapPin' },
  { id: 'best-match', label: 'Best Match', icon: 'Sparkles' },
  { id: 'expiring', label: 'Expiring Soon', icon: 'Clock' },
];
