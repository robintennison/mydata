import React, { useEffect, useState } from "react";
import type { HistoryTabProps, History } from "../../../types/banking.types";
import { tableStyles } from "../../../styles/components/tables";
import { formStyles } from "../../../styles/components/forms";
import { chartStyles } from "../../../styles/components/charts";

const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  chartData,
  editingHistory,
  setEditingHistory,
  onSaveHistory,
  onDeleteHistory,
  enableEditDelete,
  formatCurrency,
}) => {
  // Create initial form data with all required properties
  const [formData, setFormData] = useState<History>({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    totalDeposits: 0,
    savings: 0,
    // Optional properties can be omitted or set to undefined
  });

  useEffect(() => {
    if (editingHistory) {
      setFormData(editingHistory);
    } else {
      // Reset to initial state
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        totalDeposits: 0,
        savings: 0,
      });
    }
  }, [editingHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveHistory(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "month" ? value : parseFloat(value) || 0,
    }));
  };

  // Find max value for chart scaling
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Helper function to format month name
  const formatMonthName = (month: string): string => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div>
      <div style={formStyles.sectionHeader}>
        <h3>Monthly History & Trends</h3>
        <button
          onClick={() => setEditingHistory(null)}
          style={formStyles.addButton}
        >
          + Add Month
        </button>
      </div>

      {/* History Form */}
      {(editingHistory === null || editingHistory.month) && (
        <form onSubmit={handleSubmit} style={formStyles.form}>
          <div style={formStyles.formGrid}>
            <div style={formStyles.formGroup}>
              <label>Month (YYYY-MM) *</label>
              <input
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                required
                style={formStyles.input}
              />
            </div>
            <div style={formStyles.formGroup}>
              <label>Total Deposits (₹)</label>
              <input
                type="number"
                name="totalDeposits"
                value={formData.totalDeposits}
                onChange={handleChange}
                style={formStyles.input}
                placeholder="0"
              />
            </div>
            <div style={formStyles.formGroup}>
              <label>Savings (₹)</label>
              <input
                type="number"
                name="savings"
                value={formData.savings}
                onChange={handleChange}
                style={formStyles.input}
                placeholder="0"
              />
            </div>
          </div>
          <div style={formStyles.formActions}>
            <button type="submit" style={formStyles.saveButton}>
              {editingHistory ? "Update Month" : "Add Month"}
            </button>
            {editingHistory && (
              <button
                type="button"
                onClick={() => setEditingHistory(null)}
                style={formStyles.cancelButton}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Chart Visualization */}
      <div style={chartStyles.section}>
        <h4>Deposits Trend</h4>
        <div style={chartStyles.container}>
          <div style={chartStyles.bars}>
            {chartData.map((point, index) => (
              <div key={point.month} style={chartStyles.barContainer}>
                <div style={chartStyles.barLabel}>{point.month.slice(5)}</div>
                <div style={chartStyles.barWrapper}>
                  <div
                    style={{
                      ...chartStyles.bar,
                      height: `${(point.value / maxValue) * 100}%`,
                      backgroundColor: "#4285f4",
                    }}
                    title={`${point.month}: ${point.displayValue}`}
                  />
                </div>
                <div style={chartStyles.barValue}>
                  {formatCurrency(point.value).replace("₹", "₹")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div style={tableStyles.container}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Month</th>
              <th style={tableStyles.th}>Total Deposits</th>
              <th style={tableStyles.th}>Savings</th>
              <th style={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((record) => (
                <tr key={record.month} style={tableStyles.tr}>
                  <td style={tableStyles.td}>
                    {formatMonthName(record.month)}
                  </td>
                  <td style={tableStyles.td}>
                    {formatCurrency(record.totalDeposits)}
                  </td>
                  <td style={tableStyles.td}>
                    {formatCurrency(record.savings)}
                  </td>
                  <td style={tableStyles.td}>
                    {enableEditDelete && (
                      <>
                        <button
                          onClick={() => setEditingHistory(record)}
                          style={formStyles.smallButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteHistory(record.month)}
                          style={{
                            ...formStyles.smallButton,
                            ...formStyles.deleteButton,
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTab;
