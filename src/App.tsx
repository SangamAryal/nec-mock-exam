import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Exam from './pages/Exam'
import Home from './pages/Home'
import Notes from './pages/Notes'
import Result from './pages/Result'
import Review from './pages/Review'

export default function App() {
  return (
    <Routes>
      <Route path="/exam" element={<Exam />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/review/:id" element={<Review />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
