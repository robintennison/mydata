import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bankingStyles } from "../styles";
import { useBankingData } from "../hooks/useBankingData";
//import { useBankingOperations } from "../hooks/useBankingOperations";

const EditHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { month } = useParams();
  const { loading, history } = useBankingData(); // You'll need to create or modify your hook

  const [formMonth, setFormMonth] = useState("");
  const [formTotalDeposits, setFormTotalDeposits] = useState("");
  const [formSavings, setFormSavings] = useState("");

  // Load record data when component mounts
  useEffect(() => {
    if (month && history.length > 0) {
      const record = history.find((h) => h.month === month);
      if (record) {
        setFormMonth(record.month);
        setFormTotalDeposits(record.totalDeposits.toString());
        setFormSavings(record.savings.toString());
      }
    }
  }, [month, history]);

  const handleSave = () => {
    if (formMonth && formTotalDeposits && formSavings) {
      const updatedRecord = {
        month: formMonth,
        totalDeposits: parseFloat(formTotalDeposits) || 0,
        savings: parseFloat(formSavings) || 0,
      };

      // TODO: Save to Firebase
      console.log("Updating history record:", updatedRecord);
      navigate("/banking/history");
    }
  };

  const canSave = formMonth && formTotalDeposits && formSavings;

  if (loading) {
    return (
      <div style={bankingStyles.container}>
        <div style={bankingStyles.loading}>
          <div style={bankingStyles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={bankingStyles.header}>
        <div style={bankingStyles.headerTopRow}>
          <div style={bankingStyles.headerLeft}>
            <button
              onClick={() => navigate(-1)}
              style={styles.backButton}
              title="Go Back"
            >
              ←
            </button>
            <h1 style={bankingStyles.headerTitle}>
              {month ? "Edit History" : "Add History"}
            </h1>
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                ...styles.saveButton,
                opacity: canSave ? 1 : 0.5,
              }}
              title="Save"
            >
              ✓
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={styles.formContainer}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Month (e.g. 2025-09)</label>
          <input
            type="text"
            value={formMonth}
            onChange={(e) => setFormMonth(e.target.value)}
            style={styles.input}
            disabled={!!month} // Lock month when editing
            placeholder="YYYY-MM"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Total Deposits</label>
          <input
            type="number"
            value={formTotalDeposits}
            onChange={(e) => setFormTotalDeposits(e.target.value)}
            style={styles.input}
            placeholder="0"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Savings</label>
          <input
            type="number"
            value={formSavings}
            onChange={(e) => setFormSavings(e.target.value)}
            style={styles.input}
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ height: "20px" }}></div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "white",
    cursor: "pointer",
    marginRight: "10px",
    padding: "5px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  saveButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    margin: "15px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e9ecef",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "8px",
    marginBottom: "20px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#666",
  },
  input: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box" as "border-box",
  },
};

export default EditHistoryPage;
