// Clearly labeled SAMPLE scenarios for Demo Mode. They are not observations.
export const scenarios = [
  { id: 'heavy', name_en: 'Sample: heavy storm, low-lying basin', name_ar: 'عينة: عاصفة شديدة في حوض منخفض', inputs: { rainfallIntensity: 25, totalRainfall: 80, durationHours: 6, soilMoisture: 0.4, elevation: 20, terrain: 'flat_basin' } },
  { id: 'moderate', name_en: 'Sample: moderate rain, urban area', name_ar: 'عينة: أمطار متوسطة في منطقة حضرية', inputs: { rainfallIntensity: 10, totalRainfall: 35, durationHours: 4, soilMoisture: 0.3, elevation: 80, terrain: 'urban' } },
  { id: 'light', name_en: 'Sample: light rain, elevated plateau', name_ar: 'عينة: أمطار خفيفة في هضبة مرتفعة', inputs: { rainfallIntensity: 2, totalRainfall: 6, durationHours: 3, soilMoisture: 0.15, elevation: 400, terrain: 'elevated_plateau' } },
  { id: 'partial', name_en: 'Sample: missing soil & terrain data', name_ar: 'عينة: بيانات التربة والتضاريس غير متوفرة', inputs: { rainfallIntensity: 18, totalRainfall: 60, durationHours: 5, elevation: 30 } },
].map((s) => ({ ...s, isDemo: true }));
