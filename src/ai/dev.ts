
/**
 * @fileoverview This file provides a development server for Genkit flows.
 */

import {devLocalFirebase} from '@genkit-ai/firebase/dev';
import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

// Import flows.
import {scoreDrinkDetails} from './flows/score-drink-details';

genkit.config({
  plugins: [
    devLocalFirebase(), // Provides Firebase Auth integration for dev server.
    googleAI({
      // Provide your Gemini API key via the GOOGLE_GENAI_API_KEY environment variable.
    }),
  ],
  enableTracingAndMetrics: true, // Provides OpenTelemetry tracing and metrics.
  logLevel: 'debug', // Provides detailed logging for debugging.
  flows: [
    // Add flows here.
    scoreDrinkDetails,
  ],
});
