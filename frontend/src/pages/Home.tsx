import { useState, useEffect, ChangeEvent, SyntheticEvent } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getServerUrl } from "../utils/config";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

export function Home() {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadResponse, setUploadResponse] = useState<any>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showFormatErrorDialog, setShowFormatErrorDialog] = useState<boolean>(false);
    const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        const checkServer = async () => {
            try {
                await axios.get(`${getServerUrl()}/api/ping`, { timeout: 5000 });
            } catch (err) {
                console.error("Server ping failed:", err);
            }
        };

        checkServer();
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setUploadResponse(null);
            setUploadError(null);
        }
    };

    const handleUpload = async (e: SyntheticEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        if (!selectedFile) {
            setUploadError("Please select an image file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("image", selectedFile);

        setUploading(true);
        setUploadError(null);
        setUploadResponse(null);

        try {
            const res = await axios.post(`${getServerUrl()}/api/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                withCredentials: true
            });
            setUploadResponse(res.data);
            setSelectedFile(null);
            form.reset();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || "Failed to upload image.";
            setUploadError(errorMsg);
            if (err.response?.status === 400 && errorMsg.includes("Invalid file format")) {
                setShowFormatErrorDialog(true);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleAddEvent = async (ev: {title: string, days: Array<string> | string, start: string, end: string, location: string}) => {
        // console.log("Add button clicked for event:", ev);
        setActionMessage(null);
        try {
            const response = await axios.post(`${getServerUrl()}/api/addEvent`, ev, {
                withCredentials: true
            });
            if (response.status === 200) {
                // console.log("Server response:", response.data);
                setActionMessage({ type: 'success', text: `Successfully added "${ev.title}" to your calendar!` });
            }
            else {
                setActionMessage({ type: 'error', text: `Failed to add "${ev.title}" to your calendar.` });
            }
            
            // clear after 3 seconds
            setTimeout(() => setActionMessage(null), 3000);
        } catch (err) {
            console.error("Failed to add event:", err);
            setActionMessage({ type: 'error', text: `Failed to add "${ev.title}". Check console for details.` });
        }
    };

    if (uploadResponse && uploadResponse.result) {
        try {
            var parsedEvents = uploadResponse.result;
        } catch (err) {
            console.error("Failed to parse JSON response:", err);
        }
    }

    return (
        <div className="hero-section">
            <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "var(--surface)" }}>
                <h2>Upload Image</h2>
                <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={!user || uploading}
                    />
                    <button
                        type="submit"
                        disabled={!user || !selectedFile || uploading}
                        className="control-btn active"
                        style={{ width: "fit-content", cursor: (!user || !selectedFile || uploading) ? "not-allowed" : "pointer" }}
                    >
                        {uploading ? "Uploading..." : "Upload Image"}
                    </button>
            {!user && (
                        <p style={{ color: "#f87171", fontSize: "0.875rem", margin: 0 }}>
                            Please log in to upload an image.
                        </p>
                    )}
                </form>

                {uploadResponse && (
                    <div style={{ marginTop: "2rem" }}>
                        <h3 style={{ marginBottom: "1rem" }}>Extracted Schedule</h3>
                        
                        {actionMessage && (
                            <div style={{ 
                                padding: "1rem", 
                                marginBottom: "1rem", 
                                borderRadius: "6px",
                                backgroundColor: actionMessage.type === 'success' ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
                                border: `1px solid ${actionMessage.type === 'success' ? '#4ade80' : '#f87171'}`,
                                color: actionMessage.type === 'success' ? '#4ade80' : '#f87171'
                            }}>
                                {actionMessage.text}
                            </div>
                        )}

                        {parsedEvents.length ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                                {parsedEvents.map((ev : {title: string, days: Array<string>, start: string, end: string, location: string}, idx : number) => (
                                    <div key={idx} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.05)", textAlign: "center" }}>
                                        <h4 style={{ marginTop: 0, color: "var(--text)" }}>{ev.title || "Untitled"}</h4>
                                        <div style={{ fontSize: "0.9rem", color: "var(--text)", opacity: 0.8 }}>
                                            <p style={{ margin: "0.25rem 0" }}><strong>Days:</strong> {Array.isArray(ev.days) ? ev.days.join(", ") : ev.days}</p>
                                            <p style={{ margin: "0.25rem 0" }}><strong>Time:</strong> {ev.start} - {ev.end}</p>
                                            <p style={{ margin: "0.25rem 0" }}><strong>Location:</strong> {ev.location}</p>
                                        </div>
                                        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                                            <button className="card-action-btn" aria-label="Add" onClick={() => handleAddEvent(ev)}>
                                                <span className="btn-icon"><FaPlus /></span>
                                                <span className="btn-text">Add</span>
                                            </button>
                                            <button className="card-action-btn" aria-label="Edit">
                                                <span className="btn-icon"><FaEdit /></span>
                                                <span className="btn-text">Edit</span>
                                            </button>
                                            <button className="card-action-btn btn-remove" aria-label="Remove">
                                                <span className="btn-icon"><FaTrash /></span>
                                                <span className="btn-text">Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: "1rem", backgroundColor: "rgba(74, 222, 128, 0.1)", border: "1px solid #4ade80", borderRadius: "6px" }}>
                                <p style={{ margin: 0, color: "#4ade80", fontWeight: "bold" }}>Raw Response:</p>
                                <pre style={{ margin: "0.5rem 0 0 0", whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{JSON.stringify(uploadResponse, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                )}

                {uploadError && (
                    <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(248, 113, 113, 0.1)", border: "1px solid #f87171", borderRadius: "6px", color: "#f87171" }}>
                        {uploadError}
                    </div>
                )}
            </div>

            {showFormatErrorDialog && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", 
                    justifyContent: "center", alignItems: "center", zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "var(--surface)", padding: "2rem", 
                        borderRadius: "12px", border: "1px solid var(--border)", 
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        maxWidth: "400px", textAlign: "center"
                    }}>
                        <h3 style={{ color: "#f87171", marginTop: 0 }}>Invalid File Format</h3>
                        <p style={{ color: "var(--text)" }}>
                            The file you uploaded is not a valid image. Please select an image file (e.g., .png, .jpg) and try again.
                        </p>
                        <button 
                            onClick={() => setShowFormatErrorDialog(false)}
                            className="control-btn active"
                            style={{ marginTop: "1rem", backgroundColor: "#f87171", color: "white", border: "none" }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {uploading && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", 
                    justifyContent: "center", alignItems: "center", zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "var(--surface)", padding: "2rem", 
                        borderRadius: "12px", border: "1px solid var(--border)", 
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        maxWidth: "400px", textAlign: "center"
                    }}>
                        <h3 style={{ color: "var(--text)", marginTop: 0 }}>Processing Image</h3>
                        <p style={{ color: "var(--text)" }}>
                            The AI is currently processing your schedule. This may take a few moments...
                        </p>
                        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                border: "4px solid rgba(74, 222, 128, 0.2)",
                                borderTop: "4px solid #4ade80",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite"
                            }} />
                            <style>
                                {`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                                `}
                            </style>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

