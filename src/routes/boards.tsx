import React from 'react';
import { Route } from 'react-router-dom';
import { MoodboardCanvas } from '../components/Moodboard/MoodboardCanvas';
import { StorytellingCanvas } from '../components/Storytelling/StorytellingCanvas';

export const boardRoutes = [
  <Route key="moodboard" path="/moodboard" element={<MoodboardCanvas />} />,
  <Route key="storytelling" path="/storytelling" element={<StorytellingCanvas />} />,
];
