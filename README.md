# Drink Logging

A modern web application for logging and rating your favorite drinks, including sake, whiskey, beer, and wine.

## Overview

Drink Logging allows users to record information about drinks they've tried, upload photos, rate their experiences, and share with others. The application uses AI (Gemini 2.5 Pro) to analyze and score drinks based on various characteristics.

## Features

- **Drink Logging**: Record details about sake, whiskey, beer, and wine including name, brewery, type, and rating
- **Photo Upload**: Add photos of your drinks with visibility control (public or private)
- **Rating System**: Rate drinks on a 1-5 star scale
- **AI Scoring**: Get AI-generated scores for aroma, sweetness, body, acidity, complexity, and finish displayed in a radar chart
- **Social Sharing**: View logs from other users (with privacy controls)

## Getting Started

To get started with development:

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the local development URL

For more details on the application structure, take a look at [src/app/page.tsx](src/app/page.tsx).

## Documentation

For more detailed information about the application design and features, see the [blueprint document](docs/blueprint.md).

## Technologies

- Next.js
- Firebase
- Tailwind CSS
- Radix UI
- Genkit AI (with Gemini 2.5 Pro integration)
