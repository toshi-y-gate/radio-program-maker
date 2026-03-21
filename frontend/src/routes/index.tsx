import { createBrowserRouter, Navigate } from "react-router-dom"
import { RootLayout } from "@/components/layout/root-layout"
import { LoginPage } from "@/pages/auth/login-page"
import { ProgramPage } from "@/pages/program/program-page"
import { VoiceClonePage } from "@/pages/voice-clone/voice-clone-page"
import { HistoryPage } from "@/pages/history/history-page"
import { GuidePage } from "@/pages/guide/guide-page"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/program" replace /> },
      { path: "program", element: <ProgramPage /> },
      { path: "voice-clone", element: <VoiceClonePage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "guide", element: <GuidePage /> },
    ],
  },
])
