// src/routes/InstructorRoutes.tsx
import { Outlet } from 'react-router-dom';
import { InstructorLayout } from '../Layouts/InstructorLayout';

export const InstructorRoutes = () => (
  <InstructorLayout>
    <Outlet />
  </InstructorLayout>
);
