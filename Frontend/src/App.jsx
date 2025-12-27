import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router-dom';
import RoleSelect from './pages/RoleSelect.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import NameEntry from './pages/NameEntry.jsx';
import PollHistory from './pages/PollHistory.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/name" element={<NameEntry />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/history" element={<PollHistory />} />
      </Routes>
    </div>
  );
}
