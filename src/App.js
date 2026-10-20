
import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/students";

const emptyForm = {
    name: "",
    age: "",
    course: "",
    email: ""
};

function App() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    async function loadStudents() {
        try {
            setError("");
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Students load nahi ho sake.");

            const data = await response.json();
            setStudents(data);
        } catch (err) {
            setError(err.message || "Server se connection nahi ho saka.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadStudents();
    }, []);

    function openAddForm() {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setFormOpen(true);
    }

    function openEditForm(student) {
        setEditingId(student._id);
        setForm({
            name: student.name || "",
            age: student.age ?? "",
            course: student.course || "",
            email: student.email || ""
        });
        setError("");
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        const isEditing = Boolean(editingId);
        const url = isEditing ? `${API_URL}/${editingId}` : API_URL;

        try {
            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    age: Number(form.age)
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Save nahi ho saka.");
            }

            await loadStudents();
            closeForm();
        } catch (err) {
            setError(err.message || "Server se connection nahi ho saka.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(student) {
        const confirmed = window.confirm(
            `Kya tum ${student.name} ka record delete karna chahte ho?`
        );

        if (!confirmed) return;

        setError("");

        try {
            const response = await fetch(`${API_URL}/${student._id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete nahi ho saka.");
            }

            setStudents((previous) =>
                previous.filter((item) => item._id !== student._id)
            );
        } catch (err) {
            setError(err.message || "Student delete nahi ho saka.");
        }
    }

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

                <div className="toolbar">
                    <button className="add-button" onClick={openAddForm}>
                        + Add Student
                    </button>
                </div>

                {error && <p className="message error">{error}</p>}

                {formOpen && (
                    <section className="student-form-panel">
                        <h2>{editingId ? "Edit Student" : "Add New Student"}</h2>

                        <form onSubmit={handleSubmit} className="student-form">
                            <label>
                                Name
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Student name"
                                    required
                                />
                            </label>

                            <label>
                                Age
                                <input
                                    name="age"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={form.age}
                                    onChange={handleChange}
                                    placeholder="Age"
                                    required
                                />
                            </label>

                            <label>
                                Course
                                <input
                                    name="course"
                                    value={form.course}
                                    onChange={handleChange}
                                    placeholder="Course"
                                    required
                                />
                            </label>

                            <label>
                                Email
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="student@example.com"
                                    required
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    className="save-button"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Add Student"}
                                </button>

                                <button
                                    className="cancel-button"
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {loading ? (
                    <p className="message">Loading students...</p>
                ) : students.length === 0 ? (
                    <p className="message">
                        Abhi koi student nahi hai. Naya student add karo!
                    </p>
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

                                <div className="card-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => openEditForm(student)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(student)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
