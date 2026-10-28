import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Toasts } from './components/ui'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'

import LiveClassroom from './pages/shared/LiveClassroom'
import Announcements from './pages/shared/Announcements'
import Timetable from './pages/shared/Timetable'

import StudentHome from './pages/student/StudentHome'
import StudentCourses from './pages/student/StudentCourses'
import StudentCourse from './pages/student/StudentCourse'
import StudentAssignments from './pages/student/StudentAssignments'
import StudentRecordings from './pages/student/StudentRecordings'
import StudentGrades from './pages/student/StudentGrades'
import StudyAssistant from './pages/student/StudyAssistant'

import LecturerHome from './pages/lecturer/LecturerHome'
import LecturerCourses from './pages/lecturer/LecturerCourses'
import LecturerCourse from './pages/lecturer/LecturerCourse'
import Attendance from './pages/lecturer/Attendance'
import Gradebook from './pages/lecturer/Gradebook'
import Insights from './pages/lecturer/Insights'
import TeachingAssistant from './pages/lecturer/TeachingAssistant'

import MgmtOverview from './pages/management/MgmtOverview'
import LiveOps from './pages/management/LiveOps'
import Rooms from './pages/management/Rooms'
import Maintenance from './pages/management/Maintenance'
import Reports from './pages/management/Reports'
import NetworkIncidents from './pages/management/NetworkIncidents'
import CampusSetup from './pages/management/CampusSetup'
import AuditLog from './pages/management/AuditLog'
import Observe from './pages/management/Observe'
import Doors from './pages/management/Doors'
import Automation from './pages/management/Automation'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/student/live/:sessionId" element={<LiveClassroom role="student" />} />
        <Route path="/lecturer/live/:sessionId" element={<LiveClassroom role="lecturer" />} />

        <Route path="/student" element={<Shell role="student" />}>
          <Route index element={<StudentHome />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:courseId" element={<StudentCourse />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="timetable" element={<Timetable role="student" />} />
          <Route path="recordings" element={<StudentRecordings />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="assistant" element={<StudyAssistant />} />
          <Route path="announcements" element={<Announcements role="student" />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/lecturer" element={<Shell role="lecturer" />}>
          <Route index element={<LecturerHome />} />
          <Route path="courses" element={<LecturerCourses />} />
          <Route path="courses/:courseId" element={<LecturerCourse />} />
          <Route path="timetable" element={<Timetable role="lecturer" />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="gradebook" element={<Gradebook />} />
          <Route path="insights" element={<Insights />} />
          <Route path="assistant" element={<TeachingAssistant />} />
          <Route path="announcements" element={<Announcements role="lecturer" />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/management" element={<Shell role="management" />}>
          <Route index element={<MgmtOverview />} />
          <Route path="live" element={<LiveOps />} />
          <Route path="live/:sessionId/observe" element={<Observe />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="announcements" element={<Announcements role="management" />} />
          <Route path="reports" element={<Reports />} />
          <Route path="network" element={<NetworkIncidents />} />
          <Route path="campus" element={<CampusSetup />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="doors" element={<Doors />} />
          <Route path="automation" element={<Automation />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toasts />
    </>
  )
}
