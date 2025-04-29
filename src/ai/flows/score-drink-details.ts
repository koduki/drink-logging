// src/ai/flows/score-drink-details.ts
'use server';
/**
 * @fileOverview An AI agent that scores drink details based on aroma, sweetness, richness/body, acidity/freshness, complexity, and aftertaste/finish.
 *
 * - scoreDrinkDetails - A function that handles the drink scoring process.
 * - ScoreDrinkDetailsInput - The input type for the scoreDrinkDetails function.
 * - ScoreDrinkDetailsOutput - The return type for the scoreDrinkDetails function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ScoreDrinkDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the drink, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the drink, including name, brewery, type, and other relevant details.'),
  drinkType: z.enum(['sake', 'whiskey', 'beer', 'wine']).describe('The type of drink being scored.'),
});
export type ScoreDrinkDetailsInput = z.infer<typeof ScoreDrinkDetailsInputSchema>;

const ScoreDrinkDetailsOutputSchema = z.object({
  aroma: z.object({
    score: z.number().min(1).max(5).describe('Aroma score from 1 to 5.'),
    reason: z.string().describe('Reasoning for the aroma score.'),
  }),
  sweetness: z.object({
    score: z.number().min(1).max(5).describe('Sweetness score from 1 to 5.'),
    reason: z.string().describe('Reasoning for the sweetness score.'),
  }),
  richnessBody: z.object({
    score: z.number().min(1).max(5).describe('Richness/Body score from 1 to 5.'),
    reason: z.string().describe('Reasoning for the richness/body score.'),
  }),
  acidityFreshness: z.object({
    score: z.number().min(1).max(5).describe('Acidity/Freshness score from 1 to 5.'),
    reason: z.string().describe('Reasoning for the acidity/freshness score.'),
  }),
  complexity: z.object({
    score: z.number().min(1).max(5).describe('Complexity score from 1 to 5.'),
    reason: z.string().describe('Reasoning for the complexity score.'),
  }),
  aftertasteFinish: z.object({
    score: z.number().min(1).max(5).describe('Aftertaste/Finish score from 1 to 5.'),
    reason: z.string().describe('Reasoning for the aftertaste/finish score.'),
  }),
});
export type ScoreDrinkDetailsOutput = z.infer<typeof ScoreDrinkDetailsOutputSchema>;

export async function scoreDrinkDetails(input: ScoreDrinkDetailsInput): Promise<ScoreDrinkDetailsOutput> {
  return scoreDrinkDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreDrinkDetailsPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo of the drink, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      description: z.string().describe('The description of the drink, including name, brewery, type, and other relevant details.'),
      drinkType: z.string().describe('The type of drink being scored (sake, whiskey, beer, or wine).'),
    }),
  },
  output: {
    schema: z.object({
      aroma: z.object({
        score: z.number().min(1).max(5).describe('Aroma score from 1 to 5.'),
        reason: z.string().describe('Reasoning for the aroma score.'),
      }),
      sweetness: z.object({
        score: z.number().min(1).max(5).describe('Sweetness score from 1 to 5.'),
        reason: z.string().describe('Reasoning for the sweetness score.'),
      }),
      richnessBody: z.object({
        score: z.number().min(1).max(5).describe('Richness/Body score from 1 to 5.'),
        reason: z.string().describe('Reasoning for the richness/body score.'),
      }),
      acidityFreshness: z.object({
        score: z.number().min(1).max(5).describe('Acidity/Freshness score from 1 to 5.'),
        reason: z.string().describe('Reasoning for the acidity/freshness score.'),
      }),
      complexity: z.object({
        score: z.number().min(1).max(5).describe('Complexity score from 1 to 5.'),
        reason: z.string().describe('Reasoning for the complexity score.'),
      }),
      aftertasteFinish: z.object({
        score: z.number().min(1).max(5).describe('Aftertaste/Finish score from 1 to 5.'),
        reason: z.string().describe('Reasoning for the aftertaste/finish score.'),
      }),
    }),
  },
  prompt: `You are an expert sommelier. You will use the following information to score the drink based on aroma, sweetness, richness/body, acidity/freshness, complexity, and aftertaste/finish. Provide a score from 1 to 5 and a reason for each score.

Drink Type: {{{drinkType}}}
Description: {{{description}}}
Photo: {{media url=photoDataUri}}

Your scoring should be as objective as possible, considering the drink type.

Aroma:
- score:
- reason:
Sweetness:
- score:
- reason:
Richness/Body:
- score:
- reason:
Acidity/Freshness:
- score:
- reason:
Complexity:
- score:
- reason:
Aftertaste/Finish:
- score:
- reason:`,
});

const scoreDrinkDetailsFlow = ai.defineFlow<
  typeof ScoreDrinkDetailsInputSchema,
  typeof ScoreDrinkDetailsOutputSchema
>({
  name: 'scoreDrinkDetailsFlow',
  inputSchema: ScoreDrinkDetailsInputSchema,
  outputSchema: ScoreDrinkDetailsOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
