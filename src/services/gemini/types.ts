export interface ImportAnalysis {
  productOptions: {
    name: string;
    estimatedPriceRange: string;
    qualityNotes: string;
    source: string;
    supplierRating: string;
    companyDetails: string;
  }[];
  shippingDetails: {
    isAllowed: boolean;
    restrictions: string;
    estimatedCostRange: string;
    methods: string[];
    estimatedTime: string;
  };
  customsAndTaxes: {
    duties: string;
    taxes: string;
    regulations: string;
    officialLinks: {
      title: string;
      url: string;
    }[];
  };
  costBreakdown: {
    item: string;
    estimatedCost: string;
  }[];
  stepByStepGuide: {
    step: number;
    title: string;
    description: string;
  }[];
  summary: string;
}

export interface ShippingRates {
  country: string;
  fcl20ft: string;
  fcl40ft: string;
  lclPerCbm: string;
  estimatedTransitTime: string;
  majorPorts: string[];
  costBreakdown: { item: string, estimatedCost: string }[];
  lastUpdated: string;
  vatRate?: number;
  currency?: string;
  exchangeRate?: number;
  warRiskSurcharge?: string;
  bafPercentage?: number;
  congestionSurcharge?: string;
}

export interface ContainerTrackingInfo {
  containerNumber: string;
  carrier: string;
  shipName: string;
  voyageNumber: string;
  status: string;
  lastLocation: string;
  currentSpeed: string;
  currentHeading: string;
  estimatedArrival: string;
  totalDuration: string;
  totalDistance: string;
  routeNotes: string;
  costEstimates: string;
  alerts: string;
  events: { date: string, location: string, description: string }[];
  futureTimeline: { date: string, event: string, location: string }[];
  trackingUrl: string;
  coordinates?: { lat: number, lng: number };
}
