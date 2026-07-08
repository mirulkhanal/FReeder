import { useEffect, useState } from 'react';

import {
  getCoverEnrichmentProgress,
  subscribeCoverEnrichmentProgress,
  type CoverEnrichmentProgress,
} from '../services/coverEnrichmentQueue';

export function useCoverEnrichmentProgress(): CoverEnrichmentProgress {
  const [progress, setProgress] = useState(getCoverEnrichmentProgress);

  useEffect(() => subscribeCoverEnrichmentProgress(setProgress), []);

  return progress;
}
