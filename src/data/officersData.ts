export interface Officer {
  id: string;
  name: string;
  agencyId: string;
  title: string;
}

export interface AgencyGroup {
  id: string;
  name: string;
  officers: Officer[];
}

/**
 * Fictional demo officers per maintenance agency across Gwinnett County.
 * Used for crew dispatch simulation and role-based officer login.
 */
export const DEMO_OFFICERS: Officer[] = [
  // Georgia Gwinnett College (Internal Campus)
  {
    id: 'ggc-off-1',
    name: 'Marcus Sterling',
    agencyId: 'GGC',
    title: 'Campus Facilities Lead',
  },
  {
    id: 'ggc-off-2',
    name: 'Elena Rostova',
    agencyId: 'GGC',
    title: 'Grounds Maintenance Specialist',
  },
  {
    id: 'ggc-off-3',
    name: 'Devon Campbell',
    agencyId: 'GGC',
    title: 'Campus Safety Field Crew',
  },

  // Gwinnett County DOT
  {
    id: 'gcd-off-1',
    name: 'Carlos Mendez',
    agencyId: 'GWINNETT_COUNTY',
    title: 'County DOT Road Superintendent',
  },
  {
    id: 'gcd-off-2',
    name: 'Aaliyah Washington',
    agencyId: 'GWINNETT_COUNTY',
    title: 'Asphalt Repair Crew Leader',
  },
  {
    id: 'gcd-off-3',
    name: 'Trevor Vance',
    agencyId: 'GWINNETT_COUNTY',
    title: 'Infrastructure Inspector',
  },

  // GDOT District 1 (State Routes & Interstates)
  {
    id: 'gdot-off-1',
    name: 'Rachel Bennett',
    agencyId: 'GDOT',
    title: 'District 1 Highway Inspector',
  },
  {
    id: 'gdot-off-2',
    name: "Derrick O'Connor",
    agencyId: 'GDOT',
    title: 'State Route Pavement Supervisor',
  },

  // City of Lawrenceville
  {
    id: 'lville-off-1',
    name: 'Nathaniel Cross',
    agencyId: 'LAWRENCEVILLE',
    title: 'City Public Works Crew Chief',
  },
  {
    id: 'lville-off-2',
    name: 'Maya Patel',
    agencyId: 'LAWRENCEVILLE',
    title: 'Municipal Street Technician',
  },

  // City of Duluth
  {
    id: 'dul-off-1',
    name: 'Hannah Larson',
    agencyId: 'DULUTH',
    title: 'Streets Division Foreman',
  },
  {
    id: 'dul-off-2',
    name: 'Julian Morales',
    agencyId: 'DULUTH',
    title: 'Public Works Equipment Operator',
  },

  // City of Suwanee
  {
    id: 'suw-off-1',
    name: 'Kenneth Wright',
    agencyId: 'SUWANEE',
    title: 'Road Operations Specialist',
  },
  {
    id: 'suw-off-2',
    name: 'Chloe Dubois',
    agencyId: 'SUWANEE',
    title: 'Municipal Pavement Tech',
  },

  // City of Peachtree Corners
  {
    id: 'ptc-off-1',
    name: 'Brandon Thorne',
    agencyId: 'PEACHTREE_CORNERS',
    title: 'Smart City Infrastructure Tech',
  },
  {
    id: 'ptc-off-2',
    name: 'Leila Faris',
    agencyId: 'PEACHTREE_CORNERS',
    title: 'Field Maintenance Inspector',
  },

  // City of Norcross
  {
    id: 'nor-off-1',
    name: 'Dominic Russo',
    agencyId: 'NORCROSS',
    title: 'Historic District Street Supervisor',
  },
  {
    id: 'nor-off-2',
    name: 'Tanya Gomez',
    agencyId: 'NORCROSS',
    title: 'Public Works Crew Lead',
  },

  // City of Snellville
  {
    id: 'snell-off-1',
    name: 'Wyatt Keller',
    agencyId: 'SNELLVILLE',
    title: 'Street Maintenance Specialist',
  },
  {
    id: 'snell-off-2',
    name: 'Sonia Alvarez',
    agencyId: 'SNELLVILLE',
    title: 'Municipal Infrastructure Tech',
  },

  // City of Buford
  {
    id: 'buf-off-1',
    name: 'Franklin Pierce',
    agencyId: 'BUFORD',
    title: 'City Road Crew Lead',
  },
  {
    id: 'buf-off-2',
    name: 'Naomi Simmons',
    agencyId: 'BUFORD',
    title: 'Field Repair Technician',
  },

  // City of Lilburn
  {
    id: 'lil-off-1',
    name: 'Garrett Holt',
    agencyId: 'LILBURN',
    title: 'Public Works Specialist',
  },
  {
    id: 'lil-off-2',
    name: 'Priya Sharma',
    agencyId: 'LILBURN',
    title: 'Street Maintenance Tech',
  },

  // City of Sugar Hill
  {
    id: 'sug-off-1',
    name: 'Lucas Meyer',
    agencyId: 'SUGAR_HILL',
    title: 'Sugar Hill Road Superintendent',
  },
  {
    id: 'sug-off-2',
    name: 'Zoe Richardson',
    agencyId: 'SUGAR_HILL',
    title: 'Municipal Infrastructure Specialist',
  },

  // City of Dacula
  {
    id: 'dac-off-1',
    name: 'Cameron Hayes',
    agencyId: 'DACULA',
    title: 'City Public Works Field Tech',
  },
  {
    id: 'dac-off-2',
    name: 'Kelsey Mitchell',
    agencyId: 'DACULA',
    title: 'Maintenance Operator',
  },
];

export const AGENCY_LABELS: Record<string, string> = {
  GGC: '🎓 Georgia Gwinnett College (Campus Facilities)',
  GWINNETT_COUNTY: '🏛️ Gwinnett County DOT',
  GDOT: '🛣️ GDOT District 1 (State & Interstates)',
  LAWRENCEVILLE: '🏙️ City of Lawrenceville',
  DULUTH: '🏙️ City of Duluth',
  SUWANEE: '🏙️ City of Suwanee',
  PEACHTREE_CORNERS: '🏙️ City of Peachtree Corners',
  NORCROSS: '🏙️ City of Norcross',
  SNELLVILLE: '🏙️ City of Snellville',
  BUFORD: '🏙️ City of Buford',
  LILBURN: '🏙️ City of Lilburn',
  SUGAR_HILL: '🏙️ City of Sugar Hill',
  DACULA: '🏙️ City of Dacula',
};

/**
 * Returns all officers grouped by agency for grouped selection menus.
 */
export function getOfficersGroupedByAgency(): AgencyGroup[] {
  const groups = new Map<string, Officer[]>();

  for (const officer of DEMO_OFFICERS) {
    if (!groups.has(officer.agencyId)) {
      groups.set(officer.agencyId, []);
    }
    groups.get(officer.agencyId)!.push(officer);
  }

  return Array.from(groups.entries()).map(([agencyId, officers]) => ({
    id: agencyId,
    name: AGENCY_LABELS[agencyId] || agencyId,
    officers,
  }));
}

export function getOfficerById(id: string): Officer | undefined {
  return DEMO_OFFICERS.find((o) => o.id === id);
}

export function getOfficersByAgency(agencyId: string): Officer[] {
  const norm = agencyId.trim().toUpperCase();
  return DEMO_OFFICERS.filter((o) => o.agencyId.toUpperCase() === norm);
}
