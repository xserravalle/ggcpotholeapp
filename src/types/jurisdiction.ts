export type JurisdictionId =
  | 'GGC'
  | 'GWINNETT_COUNTY'
  | 'GDOT'
  | 'LAWRENCEVILLE'
  | 'DULUTH'
  | 'SUWANEE'
  | 'PEACHTREE_CORNERS'
  | 'NORCROSS'
  | 'SNELLVILLE'
  | 'LILBURN'
  | 'BUFORD'
  | 'SUGAR_HILL'
  | 'DACULA'
  | 'GRAYSON'
  | 'LOGANVILLE'
  | 'BERKELEY_LAKE'
  | 'BRASELTON'
  | 'REST_HAVEN'
  | 'AUBURN';

export interface AuthorityContact {
  id: JurisdictionId;
  category: string;
  name: string;
  jurisdictionType: string;
  department: string;
  contactEmail: string;
  phone: string;
  website: string;
  badgeColor: string; // Tailwind color name like 'emerald', 'purple', etc.
  slaTurnaround: string;
  description: string;
  potholeHotline: string;
  portalUrl: string;
  activeWorkOrders: number;
  dispatchLeadTime: string;
}
