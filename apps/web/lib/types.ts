export interface Developer {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface Project {
  id: string;
  developerId: string;
  developer: Developer;
  name: string;
  slug: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  startingPrice: number | string;
  baseCurrency: string;
  heroMediaId?: string | null;
  launchDate?: string | null;
  availableUnits?: number;
  buildings?: Array<Building & { _count?: { floors: number } }>;
  amenities?: Amenity[];
  pois?: LocationPOI[];
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  floorsCount: number;
  _count?: { floors: number };
}

export interface Floor {
  id: string;
  buildingId: string;
  number: number;
  _count?: { units: number };
}

export interface UnitType {
  id: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  baseArea: number | string;
}

export interface Unit {
  id: string;
  floorId: string;
  unitTypeId?: string | null;
  unitType?: UnitType | null;
  unitNumber: string;
  area: number | string;
  price: number | string;
  status: string;
  statusVersion: number;
  orientation?: string | null;
  view?: string | null;
  hasBalcony: boolean;
  hasTerrace: boolean;
  hasStorage: boolean;
  hasGarden: boolean;
  parkingSpots: number;
  floor?: Floor & { building?: Building & { project?: Project } };
  virtualTours?: VirtualTour[];
  paymentPlans?: PaymentPlan[];
}

export interface PaymentPlan {
  id: string;
  name: string;
  projectId?: string | null;
  unitId?: string | null;
  downPaymentPercent: number;
  numberOfInstallments: number;
  installmentFrequency?: string;
  deliveryLinkedPercent?: number | null;
  notes?: string | null;
}

export interface VirtualTour {
  id: string;
  unitId: string;
  name: string;
  scenes?: VirtualTourScene[];
}

export interface VirtualTourScene {
  id: string;
  virtualTourId: string;
  roomName: string;
  panoramaUrl: string;
  order: number;
  areaSqm?: number | null;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
}

export interface LocationPOI {
  id: string;
  name: string;
  category: string;
  distanceMinutes?: number | null;
}

export interface Favorite {
  id: string;
  unitId: string;
  unit: Unit;
}

export interface CalcResult {
  planId: string;
  totalPrice: number;
  downPaymentPercent: number;
  downPayment: number;
  financed: number;
  months: number;
  perInstallment: number;
  schedule: Array<{ number: number; dueAt: string; grossDue: number }>;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface Notification {
  id: string;
  type: string;
  channel: string;
  status: string;
  payload?: any;
  relatedEntity?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
}

export interface ListResponse<T> {
  units?: T[];
  projects?: T[];
  favorites?: T[];
  plans?: T[];
  scenes?: T[];
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}