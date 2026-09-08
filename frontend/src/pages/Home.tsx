import { useState, useEffect, ChangeEvent, SyntheticEvent } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getServerUrl } from "../utils/config";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { useTimeout } from "../hooks/useTimeout";

export function Home() {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [addingEvent, setAddingEvent] = useState<boolean>(false);
    const [uploadResponse, setUploadResponse] = useState<any>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showFormatErrorDialog, setShowFormatErrorDialog] = useState<boolean>(false);
    const [showTimeErrorDialog, setShowTimeErrorDialog] = useState<boolean>(false);
    const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<any>(null);
    
    const { set: setTimeoutHandler, clear: clearTimeoutHandler } = useTimeout();

    const clearMessage = () => {
        clearTimeoutHandler();
        setActionMessage(null);
    };

    const showMessage = (type: 'success' | 'error', text: string, duration: number = 3000) => {
        clearTimeoutHandler();
        setActionMessage({ type, text });
        setTimeoutHandler(() => {
            setActionMessage(null);
        }, duration);
    };

    const convertTo24Hour = (timeStr: string) => {
        if (!timeStr) return "";
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
        if (!match) return timeStr;
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3]?.toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const handleEditClick = (idx: number, ev: any) => {
        setEditingIndex(idx);
        const daysArray = Array.isArray(ev.days) ? ev.days : (ev.days ? [ev.days] : []);
        setEditFormData({ 
            ...ev, 
            days: daysArray,
            start: convertTo24Hour(ev.start),
            end: convertTo24Hour(ev.end)
        });
    };

    const handleEditChange = (field: string, value: any) => {
        setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleDayToggle = (day: string) => {
        setEditFormData((prev: any) => {
            const currentDays = prev.days || [];
            const dayLower = day.toLowerCase();
            const exists = currentDays.find((d: string) => d.toLowerCase() === dayLower);
            if (exists) {
                return { ...prev, days: currentDays.filter((d: string) => d.toLowerCase() !== dayLower) };
            } else {
                return { ...prev, days: [...currentDays, day] };
            }
        });
    };

    const handleSaveEdit = () => {
        if (!editFormData.days || editFormData.days.length === 0) {
            alert("Please select at least one day.");
            return;
        }

        if (editFormData.start && editFormData.end) {
            if (editFormData.start > editFormData.end) {
                setShowTimeErrorDialog(true);
                return;
            }
        }

        if (!uploadResponse || !uploadResponse.result) return;
        
        const newResult = [...uploadResponse.result];
        newResult[editingIndex as number] = editFormData;
        setUploadResponse({ ...uploadResponse, result: newResult });

        showMessage('success', `Successfully updated "${editFormData.title || 'Untitled'}"!`);

        setEditingIndex(null);
        setEditFormData(null);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditFormData(null);
    };

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
        clearMessage();
        setAddingEvent(true);
        try {
            const response = await axios.post(`${getServerUrl()}/api/addEvent`, ev, {
                withCredentials: true
            });
            if (response.status === 200) {
                // console.log("Server response:", response.data);
                showMessage('success', `Successfully added "${ev.title}" to your calendar!`);
            }
            else {
                showMessage('error', `Failed to add "${ev.title}" to your calendar.`);
            }
        } catch (err) {
            console.error("Failed to add event:", err);
            showMessage('error', `Failed to add "${ev.title}". Check console for details.`);
        } finally {
            setAddingEvent(false);
        }
    };

    const handleRemoveEvent = (idxToRemove: number) => {
        if (!uploadResponse || !uploadResponse.result) return;
        const eventToRemove = uploadResponse.result[idxToRemove];
        const newResult = uploadResponse.result.filter((_: any, idx: number) => idx !== idxToRemove);
        
        if (newResult.length === 0) {
            setUploadResponse(null);
        } else {
            setUploadResponse({ ...uploadResponse, result: newResult });
        }
        
        showMessage('success', `Successfully removed "${eventToRemove.title || 'Untitled'}"!`);
    };

    const handleAddAll = async () => {
        if (!uploadResponse || !uploadResponse.result || uploadResponse.result.length === 0) return;
        
        clearMessage();
        setAddingEvent(true);
        
        let successCount = 0;
        let failCount = 0;

        for (const ev of uploadResponse.result) {
            try {
                const response = await axios.post(`${getServerUrl()}/api/addEvent`, ev, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error("Failed to add event:", err);
                failCount++;
            }
        }
        
        setAddingEvent(false);
        
        if (failCount === 0) {
            showMessage('success', `Successfully added all ${successCount} events!`, 4000);
        } else if (successCount === 0) {
            showMessage('error', `Failed to add any of the ${failCount} events.`, 4000);
        } else {
            showMessage('error', `Added ${successCount} events, but failed to add ${failCount}.`, 4000);
        }
    };

    const handleDeleteAll = () => {
        if (!uploadResponse || !uploadResponse.result) return;
        setUploadResponse(null);
        showMessage('success', "Successfully removed all events!");
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

                {actionMessage && (
                    <div style={{ 
                        padding: "1rem", 
                        marginTop: "1.5rem",
                        marginBottom: "0.5rem", 
                        borderRadius: "6px",
                        backgroundColor: actionMessage.type === 'success' ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
                        border: `1px solid ${actionMessage.type === 'success' ? '#4ade80' : '#f87171'}`,
                        color: actionMessage.type === 'success' ? '#4ade80' : '#f87171'
                    }}>
                        {actionMessage.text}
                    </div>
                )}

                {uploadResponse && (
                    <div style={{ marginTop: "2rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>Extracted Schedule</h3>
                            {parsedEvents && parsedEvents.length > 0 && (
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <button 
                                        className="btn-bulk-add" 
                                        onClick={handleAddAll}
                                        disabled={addingEvent}
                                    >
                                        <FaPlus style={{ marginRight: "0.5rem" }} /> Add All
                                    </button>
                                    <button 
                                        className="btn-bulk-delete" 
                                        onClick={handleDeleteAll}
                                    >
                                        <FaTrash style={{ marginRight: "0.5rem" }} /> Delete All
                                    </button>
                                </div>
                            )}
                        </div>

                        {parsedEvents.length ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                                {parsedEvents.map((ev : {title: string, days: Array<string>, start: string, end: string, location: string}, idx : number) => (
                                    <div key={idx} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.05)", textAlign: "center" }}>
                                        {editingIndex === idx ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left" }}>
                                                <div>
                                                    <label style={{ fontSize: "0.85rem", color: "var(--text)" }}>Title</label>
                                                    <input 
                                                        type="text" 
                                                        value={editFormData.title || ""} 
                                                        onChange={(e) => handleEditChange("title", e.target.value)}
                                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: "0.85rem", color: "var(--text)" }}>Days</label>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                                                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                                            <label key={day} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", color: "var(--text)" }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={(editFormData.days || []).map((d: string) => d.toLowerCase()).includes(day.toLowerCase())}
                                                                    onChange={() => handleDayToggle(day)}
                                                                />
                                                                {day.substring(0, 3)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: "0.85rem", color: "var(--text)" }}>Start Time</label>
                                                        <input 
                                                            type="time" 
                                                            value={editFormData.start || ""} 
                                                            onChange={(e) => handleEditChange("start", e.target.value)}
                                                            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: "0.85rem", color: "var(--text)" }}>End Time</label>
                                                        <input 
                                                            type="time" 
                                                            value={editFormData.end || ""} 
                                                            onChange={(e) => handleEditChange("end", e.target.value)}
                                                            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: "0.85rem", color: "var(--text)" }}>Location</label>
                                                    <input 
                                                        type="text" 
                                                        value={editFormData.location || ""} 
                                                        onChange={(e) => handleEditChange("location", e.target.value)}
                                                        style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", backgroundColor: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
                                                    />
                                                </div>
                                                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                                                    <button className="card-action-btn" aria-label="Save" onClick={handleSaveEdit}>
                                                        <span className="btn-icon"><FaSave /></span>
                                                        <span className="btn-text">Save</span>
                                                    </button>
                                                    <button className="card-action-btn btn-remove" aria-label="Cancel" onClick={handleCancelEdit}>
                                                        <span className="btn-icon"><FaTimes /></span>
                                                        <span className="btn-text">Cancel</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
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
                                                    <button className="card-action-btn" aria-label="Edit" onClick={() => handleEditClick(idx, ev)}>
                                                        <span className="btn-icon"><FaEdit /></span>
                                                        <span className="btn-text">Edit</span>
                                                    </button>
                                                    <button className="card-action-btn btn-remove" aria-label="Remove" onClick={() => handleRemoveEvent(idx)}>
                                                        <span className="btn-icon"><FaTrash /></span>
                                                        <span className="btn-text">Remove</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
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

            {showTimeErrorDialog && (
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
                        <h3 style={{ color: "#f87171", marginTop: 0 }}>Invalid Times</h3>
                        <p style={{ color: "var(--text)" }}>
                            The start time cannot be after the end time. Please adjust the times and try again.
                        </p>
                        <button 
                            onClick={() => setShowTimeErrorDialog(false)}
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
                            The schedule image is currently being processed. This may take a few moments...
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
            {addingEvent && (
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
                        <h3 style={{ color: "var(--text)", marginTop: 0 }}>Adding to Calendar</h3>
                        <p style={{ color: "var(--text)" }}>
                            Adding the event to your Google Calendar. Please wait...
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

