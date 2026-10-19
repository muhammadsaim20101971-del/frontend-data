
import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://localhost:5000/students")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch students");
                }
                return response.json();
            })
            .then((data) => {
                setStudents(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Students load nahi ho sake.");
                setLoading(false);
            });
    }, []);

    return (
        <div className="app">
            <header className="header">
                <h1>Student Database</h1>
                <p>Students ka record — MongoDB se connected</p>
            </header>

            <main className="container">
                <div className="section-heading">
                    <h2>All Students</h2>
                    <span>{students.length} Students</span>
                </div>

                {loading ? (
                    <p className="message">Loading students...</p>
                ) : error ? (
                    <p className="message error">{error}</p>
                ) : students.length === 0 ? (
                    <p className="message">Abhi database mein koi student nahi hai.</p>
                ) : (
                    <div className="student-grid">
                        {students.map((student) => (
                            <div className="student-card" key={student._id}>
                                <div className="student-avatar">
                                    {student.name?.charAt(0).toUpperCase() || "S"}
                                </div>

                                <h3>{student.name}</h3>
                                <p><strong>Age:</strong> {student.age}</p>
                                <p><strong>Course:</strong> {student.course}</p>
                                <p className="email">{student.email}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
