
/**
 * @fileoverview This file provides a development server for Genkit flows
 */
import {devLocalFirebase} from '@genkit-ai/firebase/dev';
import {genkit} from 'genkit';

// Import flows
import {scoreDrinkDetails} from './flows/score-drink-details';

genkit.config({
  plugins: [
    devLocalFirebase(), // Provides Firebase Auth integration for dev server.
  ],
  enableTracingAndMetrics: false,
  logLevel: 'debug',
  flows: [
    scoreDrinkDetails,
  ],
});
