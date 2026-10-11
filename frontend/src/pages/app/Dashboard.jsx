// src/pages/app/Dashboard.jsx
import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import UploadModal from "../../components/upload/UploadModal";
import ChatPanel from "../../components/chat/ChatPanel";
import KnowledgeBase from "../../components/notes/KnowledgeBase";
import api from "../../services/api";
import { searchNotesDatabase } from "../../services/chatService";
import useDebounce from "../../hooks/useDebounce";
import { useNavigate } from "react-router-dom";


export default function Dashboard() {
  const navigate = useNavigate();
  const [notes,      setNotes]      = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [activeView, setActiveView] = useState("chat");
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState(""); 
  const [searchResults, setSearchResults] = useState(""); 
  const [isSearching, setIsSearching] = useState(false);
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    async function loadProfile() {
      try {
        await api.get("/profile/");
      } catch (err) {
        console.log(err);
      }
    }
    loadProfile();
  }, [navigate, token]);

  const handleSendMessage = async (textPayload) => {
    // 1. Instantly display what the user typed on the screen
    const userMessage = { 
      id: Date.now(), 
      sender: "user", 
      text: textPayload 
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // 2. Fire the rocket helper to tell Django to convert this text to a vector
      const realAnswerText = await searchNotesDatabase(textPayload);

      // 3. Put the real database answer on the screen
      const aiMessage = { 
        id: Date.now() + 1, 
        sender: "ai", 
        text: realAnswerText 
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (err) {
      console.error("Chat Vector search failed:", err);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Sorry, I ran into a problem searching through your notes context database."
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };
  const debouncedSearchTerm = useDebounce(searchQuery, 400);

  useEffect(() => {
    // If the input box is completely wiped empty, clear the old results and stop
    if (!debouncedSearchTerm.trim()) {
      setSearchResults("");
      return;
    }

    async function triggerDelayedSearch() {
      setIsSearching(true);
      try {
        // Fires only ONE time when the user stops typing
        const answer = await searchNotesDatabase(debouncedSearchTerm);
        setSearchResults(answer);
      } catch (err) {
        setSearchResults("Failed to retrieve matching context from your system library.");
      } finally {
        setIsSearching(false);
      }
    }

    triggerDelayedSearch();
  }, [debouncedSearchTerm]);

  // UploadModal calls onUpload(responseData) on success
  const handleUpload = (responseData) => {
    setNotes((prev) => [responseData, ...prev]);
    setRefreshKey((k) => k + 1);  // re-fetch KnowledgeBase
    setShowUpload(false);
    setActiveView("notes");
  };

  return (
    <div className="dashboard-app">
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar
          notes={notes}
          setActiveView={setActiveView}
          setShowUpload={setShowUpload}
        />

        <main className="workspace-panel">

          {activeView === "chat" && (
            <div className="view-wrapper chat-view">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}

          {activeView === "notes" && (
            <div className="view-wrapper content-view" style={{ padding: 0, height: "100%" }}>
              <KnowledgeBase
                refreshKey={refreshKey}
                onUploadClick={() => setShowUpload(true)}
              />
            </div>
          )}

        </main>
      </div>

      <UploadModal
      show={showUpload}
      onClose={() => setShowUpload(false)}
      onUploadFinished={handleUpload}
/>
    </div>
  );
}