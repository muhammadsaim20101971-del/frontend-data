
import React, { useEffect, useState } from "react";
import "./App.css";


const BASE_URL = (
    process.env.REACT_APP_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const STUDENTS_URL = `${BASE_URL}/students`;


const emptyForm = {
    name: "",
    age: "",
    course: "",
    email: ""
};

function App() {
    const [token, setToken] = useState(
        () => localStorage.getItem("teacherToken") || ""
    );
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("teacherUser")) || null;
        } catch {
            return null;
        }
    });

    const [authMode, setAuthMode] = useState("login");
    const [authForm, setAuthForm] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authMessage, setAuthMessage] = useState("");

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    function logout(message = "") {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherUser");
        setToken("");
        setUser(null);
        setStudents([]);
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setAuthError(message);
        setAuthMessage("");
    }

    function handleAuthChange(event) {
        const { name, value } = event.target;
        setAuthForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleAuthSubmit(event) {
        event.preventDefault();
        setAuthLoading(true);
        setAuthError("");
        setAuthMessage("");

        const isSignup = authMode === "signup";
        const endpoint = isSignup ? "/auth/signup" : "/auth/login";

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    isSignup
                        ? authForm
                        : {
                              email: authForm.email,
                              password: authForm.password
                          }
                )
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Request failed.");
            }

            if (isSignup) {
                setAuthMode("login");
                setAuthForm({
                    name: "",
                    email: authForm.email,
                    password: ""
                });
                setAuthMessage(
                    "Account created successfully! Ab apne account mein login karo."
                );
            } else {
                localStorage.setItem("teacherToken", result.token);
                localStorage.setItem(
                    "teacherUser",
                    JSON.stringify(result.user)
                );

                setToken(result.token);
                setUser(result.user);
                setAuthForm({
                    name: "",
                    email: "",
                    password: ""
                });
                setAuthError("");
                setAuthMessage("");
                setError("");
                setLoading(true);
            }
        } catch (err) {
            setAuthError(
                err.message || "Backend se connection nahi ho saka."
            );
        } finally {
            setAuthLoading(false);
        }
    }

    async function loadStudents(currentToken = token) {
        if (!currentToken) {
            setLoading(false);
            return;
        }

        try {
            setError("");

            const response = await fetch(STUDENTS_URL, {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            });

            const result = await response.json();

            if (response.status === 401) {
                logout("Your session expired. Please log in again.");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "Students load nahi ho sake."
                );
            }

            setStudents(result);
        } catch (err) {
            setError(
                err.message || "Backend se connection nahi ho saka."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) {
            loadStudents(token);
        } else {
            setLoading(false);
        }
        // Load students when the login token changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

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
        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        const isEditing = Boolean(editingId);
        const url = isEditing
            ? `${STUDENTS_URL}/${editingId}`
            : STUDENTS_URL;

        try {
            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    age: Number(form.age)
                })
            });

            const result = await response.json();

            if (response.status === 401) {
                logout("Your session expired. Please log in again.");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "Student save nahi ho saka."
                );
            }

            await loadStudents(token);
            closeForm();
        } catch (err) {
            setError(
                err.message || "Backend se connection nahi ho saka."
            );
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
            const response = await fetch(
                `${STUDENTS_URL}/${student._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (response.status === 401) {
                logout("Your session expired. Please log in again.");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "Delete nahi ho saka."
                );
            }

            setStudents((previous) =>
                previous.filter((item) => item._id !== student._id)
            );
        } catch (err) {
            setError(err.message || "Student delete nahi ho saka.");
        }
    }

    // Show the teacher login/signup page when logged out.
    if (!token) {
        return (
            <div className="auth-page">
                <section className="auth-card">
                    <div className="auth-brand">
                        <div className="auth-logo">S</div>
                        <span>Student Portal</span>
                    </div>

                    <div className="auth-heading">
                        <p className="auth-eyebrow">
                            TEACHER ACCESS
                        </p>
                        <h1>
                            {authMode === "login"
                                ? "Welcome back"
                                : "Create your account"}
                        </h1>
                        <p>
                            {authMode === "login"
                                ? "Login to manage your student records."
                                : "Sign up to start managing your students."}
                        </p>
                    </div>

                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={
                                authMode === "login" ? "active" : ""
                            }
                            onClick={() => {
                                setAuthMode("login");
                                setAuthError("");
                                setAuthMessage("");
                            }}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className={
                                authMode === "signup" ? "active" : ""
                            }
                            onClick={() => {
                                setAuthMode("signup");
                                setAuthError("");
                                setAuthMessage("");
                            }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {authError && (
                        <p className="message error" role="alert">
                            {authError}
                        </p>
                    )}

                    {authMessage && (
                        <p className="message success" role="status">
                            {authMessage}
                        </p>
                    )}

                    <form
                        className="auth-form"
                        onSubmit={handleAuthSubmit}
                    >
                        {authMode === "signup" && (
                            <label>
                                Full Name
                                <input
                                    name="name"
                                    value={authForm.name}
                                    onChange={handleAuthChange}
                                    placeholder="Enter your name"
                                    autoComplete="name"
                                    required
                                />
                            </label>
                        )}

                        <label>
                            Email Address
                            <input
                                name="email"
                                type="email"
                                value={authForm.email}
                                onChange={handleAuthChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </label>

                        <label>
                            Password
                            <input
                                name="password"
                                type="password"
                                value={authForm.password}
                                onChange={handleAuthChange}
                                placeholder="At least 8 characters"
                                autoComplete={
                                    authMode === "login"
                                        ? "current-password"
                                        : "new-password"
                                }
                                minLength={8}
                                required
                            />
                        </label>

                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={authLoading}
                        >
                            {authLoading
                                ? "Please wait..."
                                : authMode === "login"
                                  ? "Login to Dashboard →"
                                  : "Create Teacher Account →"}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Student Database · Secure Teacher Access
                    </p>
                </section>
            </div>
        );
    }

    // Existing student dashboard, now authenticated.
    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <div>
                        <h1>Student Database</h1>
                        <p>Students ka record — MongoDB se connected</p>
                    </div>

                    <div className="header-user">
                        <span>
                            {user?.name
                                ? `Hi, ${user.name}`
                                : user?.email || "Teacher"}
                        </span>
                        <button
                            className="logout-button"
                            onClick={() => logout()}
                        >
                            Logout
                        </button>
                    </div>
                </div>
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

                {error && (
                    <p className="message error" role="alert">
                        {error}
                    </p>
                )}

                {formOpen && (
                    <section className="student-form-panel">
                        <h2>
                            {editingId ? "Edit Student" : "Add New Student"}
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="student-form"
                        >
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
                            <div
                                className="student-card"
                                key={student._id}
                            >
                                <div className="student-avatar">
                                    {student.name?.charAt(0).toUpperCase() ||
                                        "S"}
                                </div>

                                <h3>{student.name}</h3>
                                <p>
                                    <strong>Age:</strong> {student.age}
                                </p>
                                <p>
                                    <strong>Course:</strong> {student.course}
                                </p>
                                <p className="email">{student.email}</p>

                                <div className="card-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() =>
                                            openEditForm(student)
                                        }
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
