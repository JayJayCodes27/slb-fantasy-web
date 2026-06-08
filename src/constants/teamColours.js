// Team colour mappings for dynamic jersey rendering
export const teamColours = {
  'London Lions': { primary: '#C8102E', secondary: '#FFFFFF' },
  'Sheffield Sharks': { primary: '#0057A8', secondary: '#FFFFFF' },
  'Manchester Giants': { primary: '#6F2DA8', secondary: '#FFD700' },
  'Leicester Riders': { primary: '#003DA5', secondary: '#FF6B00' },
  'Bristol Flyers': { primary: '#00A651', secondary: '#FFFFFF' },
  'Newcastle Eagles': { primary: '#003087', secondary: '#FFD700' },
  'Surrey Scorchers': { primary: '#FF6B00', secondary: '#000000' },
  'Cheshire Phoenix': { primary: '#FF6B00', secondary: '#000000' },
  'Caledonian Gladiators': { primary: '#003DA5', secondary: '#FFFFFF' },
  'Worthing Thunder': { primary: '#1C1C1C', secondary: '#FF6B00' }
};

// Helper function to get team colours by team name
export const getTeamColours = (teamName) => {
  return teamColours[teamName] || { primary: '#333333', secondary: '#FFFFFF' };
};
