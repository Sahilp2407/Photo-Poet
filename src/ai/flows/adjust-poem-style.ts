'use server';

/**
 * @fileOverview This file defines a Genkit flow for adjusting the style of a generated poem.
 *
 * adjustPoemStyle - A function that adjusts the style of a poem.
 * AdjustPoemStyleInput - The input type for the adjustPoemStyle function.
 * AdjustPoemStyleOutput - The return type for the adjustPoemStyle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustPoemStyleInputSchema = z.object({
  poem: z.string().describe('The poem to be adjusted.'),
  style: z.string().describe('The desired style of the poem (e.g., haiku, sonnet, free verse).'),
});
export type AdjustPoemStyleInput = z.infer<typeof AdjustPoemStyleInputSchema>;

const AdjustPoemStyleOutputSchema = z.object({
  adjustedPoem: z.string().describe('The poem adjusted to the specified style.'),
});
export type AdjustPoemStyleOutput = z.infer<typeof AdjustPoemStyleOutputSchema>;

export async function adjustPoemStyle(input: AdjustPoemStyleInput): Promise<AdjustPoemStyleOutput> {
  return adjustPoemStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustPoemStylePrompt',
  input: {schema: AdjustPoemStyleInputSchema},
  output: {schema: AdjustPoemStyleOutputSchema},
  prompt: `You are an expert poet, skilled in adapting poems to different styles.

  Please adjust the following poem to match the specified style.

  Poem:
  {{poem}}

  Style:
  {{style}}

  Adjusted Poem:`,
});

const adjustPoemStyleFlow = ai.defineFlow(
  {
    name: 'adjustPoemStyleFlow',
    inputSchema: AdjustPoemStyleInputSchema,
    outputSchema: AdjustPoemStyleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
